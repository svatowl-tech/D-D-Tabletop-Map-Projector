/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * fileSystemService.ts — Автосинхронизация локальной папки данных AetherMap_Data на диске.
 * 
 * Особенности:
 * 1. Иерархия папок на диске:
 *    📁 AetherMap_Data/
 *    ├── 📁 maps/               # Карты (JPG, PNG, WebP, SVG, с поддержкой вложенных папок)
 *    ├── 📁 animated_maps/      # Видеокарты (MP4, WebM)
 *    ├── 📁 audio/              # Аудио
 *    │   ├── 📁 bgm/            # Фоновая музыка
 *    │   ├── 📁 ambience/       # Звуковые ландшафты
 *    │   └── 📁 sfx/            # Эффекты
 *    ├── 📁 tokens/             # Круглые аватары персонажей
 *    ├── 📁 vault_presets/      # Пресеты сцен (.json)
 *    └── 📁 blackout_videos/    # Заставки затемнения
 * 
 * 2. Автосинхронизация (Polling / File Watcher):
 *    - Сканирование дерева файлов и автоматический учет изменений (добавление, переименование, удаление).
 *    - Path Traversal Protection (защита от выхода за пределы рабочей папки).
 *    - Определение категорий, MIME-типов и автоматическое присвоение тегов (#dungeon, #night, #bossfight и др.).
 */

export type AssetCategory =
  | 'maps'
  | 'animated_maps'
  | 'audio_bgm'
  | 'audio_ambience'
  | 'audio_sfx'
  | 'tokens'
  | 'vault_presets'
  | 'blackout_videos';

export interface AssetItem {
  id: string;                  // Уникальный стабильный ID
  name: string;                // Имя файла без расширения
  filename: string;            // Полное имя файла с расширением
  category: AssetCategory;     // Категория ресурса
  type?: 'image' | 'video' | 'audio' | 'preset' | 'unknown'; // Тип медиа
  subfolder: string;           // Вложенная папка (например, /Dungeons, /Cities)
  relativePath: string;        // Относительный путь от корня (maps/Dungeons/cave.jpg)
  mimeType: string;            // MIME-тип
  size: number;                // Размер в байтах
  lastModified: number;        // Дата модификации
  tags: string[];              // Теги (#dungeon, #night, #bossfight)
  url: string;                 // http://, blob:http://, idb://asset_... или файл
  blob?: Blob;                 // Двоичные данные
  handle?: any;                // FileSystemFileHandle из File System Access API
  dimensions?: { width: number; height: number }; // Пиксельные размеры для карт
}

export class FileSystemService {
  private dirHandle: any = null;
  private folderName: string = 'AetherMap_Data';
  private scannedAssets: AssetItem[] = [];
  private pollInterval: any = null;
  private listeners: Set<(assets: AssetItem[], folderName: string) => void> = new Set();

  /**
   * Поддерживается ли File System Access API в данном браузере
   */
  public isFileSystemAccessSupported(): boolean {
    return typeof window !== 'undefined' && 'showDirectoryPicker' in window;
  }

  /**
   * Выбор и инициализация рабочей папки на компьютере (например, ~/DndCampaign/ или AetherMap_Data)
   */
  public async selectWorkingDirectory(): Promise<AssetItem[]> {
    if (!this.isFileSystemAccessSupported()) {
      throw new Error('File System Access API не поддерживается вашим браузером. Используйте функцию импорта через браузерное хранилище IndexedDB.');
    }

    try {
      this.dirHandle = await (window as any).showDirectoryPicker({
        mode: 'readwrite',
        id: 'aethermap_data_root'
      });

      this.folderName = this.dirHandle.name || 'AetherMap_Data';

      // Автоматическое создание недостающих поддиректорий
      await this.ensureRequiredSubdirectories(this.dirHandle);

      // Запуск сканирования и фонового мониторинга
      const assets = await this.scanDirectoryTree();
      this.startPollingWatcher();

      return assets;
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return this.scannedAssets;
      }
      console.error('[FileSystemService] Error picking working directory:', err);
      throw err;
    }
  }

  /**
   * Автоматическое формирование или проверка структуры поддиректорий
   */
  private async ensureRequiredSubdirectories(rootHandle: any): Promise<void> {
    const requiredFolderTree = [
      'maps',
      'animated_maps',
      'audio',
      'tokens',
      'vault_presets',
      'blackout_videos'
    ];

    for (const folderName of requiredFolderTree) {
      try {
        const subHandle = await rootHandle.getDirectoryHandle(folderName, { create: true });
        
        // Внутри audio создаем bgm, ambience, sfx
        if (folderName === 'audio') {
          await subHandle.getDirectoryHandle('bgm', { create: true });
          await subHandle.getDirectoryHandle('ambience', { create: true });
          await subHandle.getDirectoryHandle('sfx', { create: true });
        }
      } catch (err) {
        console.warn(`[FileSystemService] Error ensuring subfolder ${folderName}:`, err);
      }
    }
  }

  /**
   * Сканирование дерева файлов рабочей папки
   */
  public async scanDirectoryTree(): Promise<AssetItem[]> {
    if (!this.dirHandle) return this.scannedAssets;

    const newAssets: AssetItem[] = [];
    await this.traverseDirectory(this.dirHandle, '', newAssets);

    this.scannedAssets = newAssets;
    this.notify();
    return newAssets;
  }

  /**
   * Рекурсивный обход директории с поддержкой вложенных папок и защиты от Path Traversal
   */
  private async traverseDirectory(dirHandle: any, currentPath: string, result: AssetItem[]): Promise<void> {
    // Path Traversal Protection
    if (currentPath.includes('..') || currentPath.includes('\\..') || currentPath.includes('/..')) {
      console.warn('[FileSystemService] Path Traversal attempt blocked:', currentPath);
      return;
    }

    try {
      for await (const entry of dirHandle.values()) {
        const relativeEntryPath = currentPath ? `${currentPath}/${entry.name}` : entry.name;

        if (entry.kind === 'directory') {
          await this.traverseDirectory(entry, relativeEntryPath, result);
        } else if (entry.kind === 'file') {
          const file = await entry.getFile();
          const asset = await this.processFileToAsset(file, relativeEntryPath, entry);
          if (asset) {
            result.push(asset);
          }
        }
      }
    } catch (err) {
      console.warn(`[FileSystemService] Error traversing path ${currentPath}:`, err);
    }
  }

  /**
   * Определение типа контента, метаданных и автогенерация тегов
   */
  private async processFileToAsset(file: File, relativePath: string, fileHandle?: any): Promise<AssetItem | null> {
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const pathLower = relativePath.toLowerCase();

    let category: AssetCategory | null = null;

    // Определение категории по папке и расширению
    if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(ext)) {
      if (pathLower.includes('tokens/')) {
        category = 'tokens';
      } else {
        category = 'maps';
      }
    } else if (['mp4', 'webm', 'ogv', 'mkv'].includes(ext)) {
      if (pathLower.includes('blackout_videos/')) {
        category = 'blackout_videos';
      } else {
        category = 'animated_maps';
      }
    } else if (['mp3', 'wav', 'ogg', 'flac', 'm4a'].includes(ext)) {
      if (pathLower.includes('audio/bgm/')) {
        category = 'audio_bgm';
      } else if (pathLower.includes('audio/ambience/')) {
        category = 'audio_ambience';
      } else {
        category = 'audio_sfx';
      }
    } else if (ext === 'json') {
      category = 'vault_presets';
    }

    if (!category) return null;

    // Вычисление вложенной подпапки (например, /Dungeons, /Cities)
    const pathParts = relativePath.split('/');
    pathParts.pop(); // удаляем имя файла
    pathParts.shift(); // удаляем корневую категорию (e.g. maps)
    const subfolder = pathParts.length > 0 ? '/' + pathParts.join('/') : '/';

    // Автоматическая генерация тегов по имени файла и папкам
    const tags = this.extractTagsFromPathAndName(relativePath, file.name);

    // Уникальный стабильный ID (хэш пути и даты модификации)
    const assetId = `asset_${this.simpleStringHash(relativePath)}_${file.lastModified}`;

    // Создание Object URL из файла
    const objectUrl = URL.createObjectURL(file);

    return {
      id: assetId,
      name: file.name.replace(/\.[^/.]+$/, ''),
      filename: file.name,
      category,
      subfolder,
      relativePath,
      mimeType: file.type || this.getFallbackMime(ext),
      size: file.size,
      lastModified: file.lastModified,
      tags,
      url: objectUrl,
      blob: file,
      handle: fileHandle
    };
  }

  /**
   * Извлечение ключевых тегов (#dungeon, #night, #bossfight и т.д.)
   */
  private extractTagsFromPathAndName(path: string, fileName: string): string[] {
    const combined = `${path} ${fileName}`.toLowerCase();
    const tagsSet = new Set<string>();

    const tagRules: Record<string, string[]> = {
      '#dungeon': ['dungeon', 'подземелье', 'cave', 'пещера', 'crypt', 'склеп'],
      '#city': ['city', 'город', 'street', 'улица', 'town', 'market', 'рынок'],
      '#tavern': ['tavern', 'таверна', 'inn', 'bar', 'пивная'],
      '#forest': ['forest', 'лес', 'jungle', 'джунгли', 'woods', 'nature'],
      '#bossfight': ['boss', 'босс', 'dragon', 'дракон', 'throne', 'трон'],
      '#night': ['night', 'ночь', 'dark', 'темнота', 'moon'],
      '#rain': ['rain', 'дождь', 'storm', 'шторм'],
      '#fire': ['fire', 'огонь', 'lava', 'лава', 'volcano'],
      '#hero': ['pc', 'hero', 'герой', 'player', 'игрок'],
      '#monster': ['monster', 'монстр', 'goblin', 'orc', 'beast']
    };

    Object.entries(tagRules).forEach(([tag, keywords]) => {
      if (keywords.some((kw) => combined.includes(kw))) {
        tagsSet.add(tag);
      }
    });

    return Array.from(tagsSet);
  }

  private simpleStringHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash).toString(36);
  }

  private getFallbackMime(ext: string): string {
    const mimeMap: Record<string, string> = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      webp: 'image/webp',
      svg: 'image/svg+xml',
      mp4: 'video/mp4',
      webm: 'video/webm',
      mp3: 'audio/mpeg',
      wav: 'audio/wav',
      ogg: 'audio/ogg',
      json: 'application/json'
    };
    return mimeMap[ext] || 'application/octet-stream';
  }

  /**
   * Фоновый мониторинг автосинхронизации (Polling каждые 10 секунд)
   */
  private startPollingWatcher(): void {
    if (this.pollInterval) clearInterval(this.pollInterval);
    this.pollInterval = setInterval(async () => {
      if (this.dirHandle) {
        await this.scanDirectoryTree();
      }
    }, 10000);
  }

  /**
   * Сохранение нового файла прямо в локальную папку на диске
   */
  public async saveFileToDiskFolder(file: File, category: AssetCategory, subfolder: string = '/'): Promise<AssetItem | null> {
    if (!this.dirHandle) return null;

    try {
      let targetDir = await this.dirHandle.getDirectoryHandle(this.categoryToFolderName(category), { create: true });

      // Если указана вложенная папка (например /Dungeons)
      const cleanSub = subfolder.replace(/^\//, '').trim();
      if (cleanSub) {
        const subParts = cleanSub.split('/');
        for (const part of subParts) {
          if (part) {
            targetDir = await targetDir.getDirectoryHandle(part, { create: true });
          }
        }
      }

      const fileHandle = await targetDir.getFileHandle(file.name, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(file);
      await writable.close();

      // Обновляем индекс
      await this.scanDirectoryTree();

      const relativePath = `${this.categoryToFolderName(category)}${subfolder === '/' ? '' : subfolder}/${file.name}`;
      return await this.processFileToAsset(file, relativePath, fileHandle);
    } catch (err) {
      console.error('[FileSystemService] Error saving file to disk folder:', err);
      return null;
    }
  }

  private categoryToFolderName(cat: AssetCategory): string {
    switch (cat) {
      case 'maps': return 'maps';
      case 'animated_maps': return 'animated_maps';
      case 'audio_bgm': return 'audio/bgm';
      case 'audio_ambience': return 'audio/ambience';
      case 'audio_sfx': return 'audio/sfx';
      case 'tokens': return 'tokens';
      case 'vault_presets': return 'vault_presets';
      case 'blackout_videos': return 'blackout_videos';
    }
  }

  public getWorkingDirectoryName(): string {
    return this.folderName;
  }

  public getScannedAssets(): AssetItem[] {
    return [...this.scannedAssets];
  }

  public subscribe(listener: (assets: AssetItem[], folderName: string) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach((l) => l([...this.scannedAssets], this.folderName));
  }

  public destroy(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    this.listeners.clear();
  }
}

export const fileSystemService = new FileSystemService();
