/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * assetCatalog.ts — Единый централизованный каталог медиаресурсов AetherMap_Data.
 * 
 * Объединяет:
 * 1. Локальные файлы с диска (fileSystemService).
 * 2. Браузерные медиафайлы из IndexedDB (idb://<asset_id>).
 * 3. Встроенные демонстрационные локации (sampleMaps, sampleOverlays).
 */

import { AssetItem, AssetCategory, fileSystemService } from './fileSystemService';
import { storageService } from './storageService';
import { SAMPLE_MAPS } from '../utils/sampleMaps';
import { Scene } from '../types';

export class AssetCatalogService {
  private assets: Map<string, AssetItem> = new Map();
  private listeners: Set<() => void> = new Set();
  private isInitialized = false;

  constructor() {
    this.init();
  }

  /**
   * Инициализация и объединение реестров
   */
  public async init(): Promise<void> {
    if (this.isInitialized) return;

    // 1. Подписка на обновление локальной папки на диске
    fileSystemService.subscribe((diskAssets) => {
      diskAssets.forEach((asset) => {
        this.assets.set(asset.id, asset);
      });
      this.notify();
    });

    // 2. Загрузка пользовательских ресурсов из IndexedDB
    const dbAssets = await storageService.getAllAssetsFromDb();
    dbAssets.forEach((raw) => {
      if (raw && raw.id) {
        this.assets.set(raw.id, {
          ...raw,
          url: raw.url || `idb://${raw.id}`
        });
      }
    });

    // 3. Загрузка встроенных демонстрационных локаций
    SAMPLE_MAPS.forEach((map) => {
      const id = `sample_${map.id}`;
      if (!this.assets.has(id)) {
        this.assets.set(id, {
          id,
          name: map.name,
          filename: `${map.id}.jpg`,
          category: 'maps',
          subfolder: '/Demo',
          relativePath: `maps/Demo/${map.name}`,
          mimeType: 'image/jpeg',
          size: 1024 * 512,
          lastModified: Date.now(),
          tags: ['#demo'],
          url: '',
          dimensions: { width: map.width || 1920, height: map.height || 1080 }
        });
      }
    });

    this.isInitialized = true;
    this.notify();
  }

  /**
   * Разрешение медиа URL (создание blob URL из IndexedDB или диска)
   */
  public async resolveMediaUrl(asset: AssetItem): Promise<string> {
    if (asset.blob) {
      return storageService.getMediaUrl(asset.id, asset.blob);
    }
    if (asset.url && !asset.url.startsWith('idb://')) {
      return asset.url;
    }
    const blob = await storageService.getAssetBlobFromDb(asset.id);
    if (blob) {
      return storageService.getMediaUrl(asset.id, blob);
    }
    if (asset.id.startsWith('sample_')) {
      const mapId = asset.id.replace('sample_', '');
      const sample = SAMPLE_MAPS.find((m) => m.id === mapId);
      if (sample) {
        const generatedBlob = await sample.generateBlob();
        return storageService.getMediaUrl(asset.id, generatedBlob);
      }
    }
    return asset.url || '';
  }

  /**
   * Получение всех зарегистрированных ресурсов
   */
  public getAllAssets(): AssetItem[] {
    return Array.from(this.assets.values());
  }

  /**
   * Фильтрация ресурсов по категории, тегам, поисковой строке и вложенной папке
   */
  public getFilteredAssets(filter: {
    category?: AssetCategory | 'all';
    search?: string;
    tag?: string;
    subfolder?: string;
  }): AssetItem[] {
    let result = Array.from(this.assets.values());

    if (filter.category && filter.category !== 'all') {
      result = result.filter((a) => a.category === filter.category);
    }

    if (filter.subfolder && filter.subfolder !== 'all') {
      result = result.filter((a) => a.subfolder === filter.subfolder || a.subfolder.startsWith(filter.subfolder));
    }

    if (filter.tag) {
      const cleanTag = filter.tag.startsWith('#') ? filter.tag : `#${filter.tag}`;
      result = result.filter((a) => a.tags.some((t) => t.toLowerCase() === cleanTag.toLowerCase()));
    }

    if (filter.search && filter.search.trim()) {
      const query = filter.search.toLowerCase().trim();
      result = result.filter(
        (a) =>
          a.name.toLowerCase().includes(query) ||
          a.filename.toLowerCase().includes(query) ||
          a.relativePath.toLowerCase().includes(query) ||
          a.tags.some((t) => t.toLowerCase().includes(query))
      );
    }

    return result;
  }

  /**
   * Список всех уникальных тегов (#dungeon, #night, #bossfight)
   */
  public getAllTags(): string[] {
    const tagsSet = new Set<string>();
    this.assets.forEach((a) => {
      a.tags.forEach((t) => tagsSet.add(t));
    });
    return Array.from(tagsSet).sort();
  }

  /**
   * Список всех уникальных вложенных папок (/Dungeons, /Cities и др.)
   */
  public getAllSubfolders(category?: AssetCategory | 'all'): string[] {
    const subfolderSet = new Set<string>();
    this.assets.forEach((a) => {
      if (!category || category === 'all' || a.category === category) {
        if (a.subfolder) {
          subfolderSet.add(a.subfolder);
        }
      }
    });
    return Array.from(subfolderSet).sort();
  }

  /**
   * Импорт файлов через Drag-and-Drop или традиционную кнопку загрузки (сохранение в IndexedDB)
   */
  public async importBrowserFiles(
    files: FileList | File[],
    defaultCategory: AssetCategory = 'maps',
    subfolder: string = '/'
  ): Promise<AssetItem[]> {
    const fileArray = Array.from(files);
    const createdAssets: AssetItem[] = [];

    for (const file of fileArray) {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      let category = defaultCategory;

      if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(ext)) {
        category = defaultCategory === 'tokens' ? 'tokens' : 'maps';
      } else if (['mp4', 'webm', 'ogv'].includes(ext)) {
        category = defaultCategory === 'blackout_videos' ? 'blackout_videos' : 'animated_maps';
      } else if (['mp3', 'wav', 'ogg', 'flac'].includes(ext)) {
        category = defaultCategory.startsWith('audio_') ? defaultCategory : 'audio_sfx';
      } else if (ext === 'json') {
        category = 'vault_presets';
      }

      const id = `asset_idb_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const virtualUri = `idb://${id}`;

      const asset: AssetItem = {
        id,
        name: file.name.replace(/\.[^/.]+$/, ''),
        filename: file.name,
        category,
        subfolder,
        relativePath: `${category}${subfolder === '/' ? '' : subfolder}/${file.name}`,
        mimeType: file.type || 'application/octet-stream',
        size: file.size,
        lastModified: file.lastModified,
        tags: [`#${category}`, '#user_upload'],
        url: virtualUri,
        blob: file
      };

      // Сохраняем в IndexedDB
      await storageService.saveAssetToDb(asset);

      this.assets.set(id, asset);
      createdAssets.push(asset);
    }

    this.notify();
    return createdAssets;
  }

  /**
   * Удаление ресурса
   */
  public async deleteAsset(id: string): Promise<void> {
    if (this.assets.has(id)) {
      this.assets.delete(id);
      await storageService.deleteAssetFromDb(id);
      this.notify();
    }
  }

  /**
   * Экспорт пресета сцены (.json)
   */
  public async exportPreset(scene: Scene): Promise<Blob> {
    const presetData = {
      version: '1.0.0',
      exportedAt: Date.now(),
      type: 'aethermap_scene_preset',
      scene
    };

    const jsonStr = JSON.stringify(presetData, null, 2);
    return new Blob([jsonStr], { type: 'application/json' });
  }

  /**
   * Импорт пресета сцены (.json)
   */
  public async importPreset(fileOrJson: File | string): Promise<Scene> {
    let jsonStr = '';
    if (typeof fileOrJson === 'string') {
      jsonStr = fileOrJson;
    } else {
      jsonStr = await fileOrJson.text();
    }

    const parsed = JSON.parse(jsonStr);
    if (!parsed || (!parsed.scene && !parsed.id)) {
      throw new Error('Некорректный формат файла пресета сцены AetherMap');
    }

    const scene: Scene = parsed.scene || parsed;
    scene.id = `imported_scene_${Date.now()}`;
    return scene;
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach((l) => l());
  }
}

export const assetCatalog = new AssetCatalogService();
