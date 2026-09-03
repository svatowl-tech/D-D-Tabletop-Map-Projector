/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * musicPlayerService.ts — Полнофункциональный локальный музыкальный плеер
 * и саундборд с поддержкой сканирования папок, создания плейлистов по подпапкам,
 * бесконечного перемешивания (Shuffle Loop) и нулевых задержек переключения.
 */

import { AudioPlaylist, AudioTrackItem, CustomSfxItem, MusicPlayerState, PlaybackMode } from '../types/audio';
import { audioEngine } from './audioEngine';

class MusicPlayerService {
  private audioElement: HTMLAudioElement | null = null;
  private sfxAudioPool: HTMLAudioElement[] = [];
  private state: MusicPlayerState = {
    playlists: [],
    activePlaylistId: null,
    activeTrackId: null,
    activeTrackName: null,
    playQueue: [],
    queueIndex: -1,
    isPlaying: false,
    isPaused: false,
    currentTime: 0,
    duration: 0,
    playbackMode: 'shuffle_loop',
    isMuted: false,
    rootFolderName: null,
    totalTracksCount: 0,
    customSfx: []
  };

  private listeners: Set<(state: MusicPlayerState) => void> = new Set();
  private objectUrlsToRevoke: Set<string> = new Set();

  constructor() {
    this.initAudioElement();
    this.loadPersistedCustomSfx();
  }

  private initAudioElement(): void {
    if (typeof window === 'undefined') return;

    this.audioElement = new Audio();
    this.audioElement.preload = 'auto';

    // Слушатели событий воспроизведения
    this.audioElement.addEventListener('timeupdate', () => {
      if (!this.audioElement) return;
      this.state.currentTime = this.audioElement.currentTime;
      this.state.duration = this.audioElement.duration || 0;
      this.notify();
    });

    this.audioElement.addEventListener('ended', () => {
      this.handleTrackEnded();
    });

    this.audioElement.addEventListener('play', () => {
      this.state.isPlaying = true;
      this.state.isPaused = false;
      this.notify();
    });

    this.audioElement.addEventListener('pause', () => {
      this.state.isPlaying = false;
      this.state.isPaused = true;
      this.notify();
    });

    this.audioElement.addEventListener('error', (e) => {
      console.warn('[MusicPlayer] Ошибка воспроизведения трека:', e);
      // Автоматический переход к следующему при ошибке файла
      setTimeout(() => {
        if (this.state.isPlaying) {
          this.playNextTrack();
        }
      }, 500);
    });

    // Синхронизация громкости с AudioEngine
    audioEngine.subscribe((aeState) => {
      if (this.audioElement) {
        this.audioElement.volume = aeState.bgmVolume * aeState.masterVolume;
      }
    });
  }

  public getState(): MusicPlayerState {
    return { ...this.state };
  }

  public subscribe(listener: (state: MusicPlayerState) => void): () => void {
    this.listeners.add(listener);
    listener({ ...this.state });
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    const cloned = { ...this.state };
    this.listeners.forEach((l) => l(cloned));
  }

  /**
   * Сканирование выбранной пользователем папки с музыкой (через File System Access API)
   * Автоматически разбивает подпапки ('Битва', 'Босс', 'Таверна' и т.д.) на отдельные плейлисты.
   */
  public async importMusicFolderViaPicker(): Promise<{ playlistsCount: number; tracksCount: number }> {
    if (typeof window === 'undefined' || !('showDirectoryPicker' in window)) {
      throw new Error('Ваш браузер не поддерживает прямое открытие папок через File System Access API. Используйте кнопку Drag-and-Drop или выбор файлов.');
    }

    try {
      const dirHandle = await (window as any).showDirectoryPicker({
        mode: 'read',
        id: 'dnd_music_library_root'
      });

      const rootName = dirHandle.name || 'Музыкальная библиотека';
      const scannedTracks: AudioTrackItem[] = [];

      await this.scanDirectoryRecursive(dirHandle, '', scannedTracks);

      if (scannedTracks.length === 0) {
        throw new Error(`В папке «${rootName}» не найдено поддерживаемых аудиофайлов (MP3, WAV, OGG, FLAC, M4A, AAC, WEBM).`);
      }

      this.processScannedTracksIntoPlaylists(scannedTracks, rootName);

      return {
        playlistsCount: this.state.playlists.length,
        tracksCount: scannedTracks.length
      };
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return { playlistsCount: this.state.playlists.length, tracksCount: this.state.totalTracksCount };
      }
      throw err;
    }
  }

  /**
   * Рекурсивный обход директорий для нахождения всех подпапок и аудиофайлов
   */
  private async scanDirectoryRecursive(
    dirHandle: any,
    currentPath: string,
    resultTracks: AudioTrackItem[]
  ): Promise<void> {
    const audioExtensions = new Set(['mp3', 'wav', 'ogg', 'flac', 'm4a', 'aac', 'webm', 'opus']);

    for await (const entry of dirHandle.values()) {
      const relativeEntryPath = currentPath ? `${currentPath}/${entry.name}` : entry.name;

      if (entry.kind === 'directory') {
        await this.scanDirectoryRecursive(entry, relativeEntryPath, resultTracks);
      } else if (entry.kind === 'file') {
        const ext = entry.name.split('.').pop()?.toLowerCase() || '';
        if (audioExtensions.has(ext)) {
          try {
            const file: File = await entry.getFile();
            const blobUrl = URL.createObjectURL(file);
            this.objectUrlsToRevoke.add(blobUrl);

            // Определяем категорию (подпапку)
            let category = 'Общая музыка';
            if (currentPath) {
              const pathParts = currentPath.split('/');
              category = pathParts[pathParts.length - 1]; // Имя непосредственной подпапки
            }

            const cleanName = entry.name.replace(/\.[^/.]+$/, '');

            resultTracks.push({
              id: `track_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
              name: cleanName,
              filename: entry.name,
              category,
              relativePath: relativeEntryPath,
              blob: file,
              url: blobUrl,
              size: file.size
            });
          } catch (fileErr) {
            console.warn(`[MusicPlayer] Не удалось прочитать файл ${entry.name}:`, fileErr);
          }
        }
      }
    }
  }

  /**
   * Импорт через обычный drag-and-drop или input type="file" webkitdirectory
   */
  public importFromFileList(files: FileList | File[]): { playlistsCount: number; tracksCount: number } {
    const audioExtensions = new Set(['mp3', 'wav', 'ogg', 'flac', 'm4a', 'aac', 'webm', 'opus']);
    const scannedTracks: AudioTrackItem[] = [];
    const fileArray = Array.from(files);

    let detectedRootName = 'Импортированная музыка';

    for (const file of fileArray) {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      if (!audioExtensions.has(ext)) continue;

      const blobUrl = URL.createObjectURL(file);
      this.objectUrlsToRevoke.add(blobUrl);

      // Извлекаем путь из webkitRelativePath
      const relPath = file.webkitRelativePath || file.name;
      const pathParts = relPath.split('/');

      let category = 'Общая музыка';
      if (pathParts.length > 2) {
        detectedRootName = pathParts[0];
        category = pathParts[pathParts.length - 2]; // Папка, в которой лежит файл
      } else if (pathParts.length === 2) {
        detectedRootName = pathParts[0];
        category = pathParts[0];
      }

      const cleanName = file.name.replace(/\.[^/.]+$/, '');

      scannedTracks.push({
        id: `track_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        name: cleanName,
        filename: file.name,
        category,
        relativePath: relPath,
        blob: file,
        url: blobUrl,
        size: file.size
      });
    }

    if (scannedTracks.length === 0) {
      throw new Error('Среди перетащенных файлов не найдено аудиофайлов.');
    }

    this.processScannedTracksIntoPlaylists(scannedTracks, detectedRootName);

    return {
      playlistsCount: this.state.playlists.length,
      tracksCount: scannedTracks.length
    };
  }

  /**
   * Группировка списка треков по подпапкам в плейлисты
   */
  private processScannedTracksIntoPlaylists(tracks: AudioTrackItem[], rootName: string): void {
    const playlistMap: Map<string, AudioTrackItem[]> = new Map();

    for (const track of tracks) {
      const cat = track.category || 'Основное';
      if (!playlistMap.has(cat)) {
        playlistMap.set(cat, []);
      }
      playlistMap.get(cat)!.push(track);
    }

    const playlists: AudioPlaylist[] = [];
    const categoryColors = [
      '#EF4444', // Red (Бой)
      '#DC2626', // Deep Red (Босс)
      '#F59E0B', // Amber (Таверна)
      '#10B981', // Emerald (Природа / Лес)
      '#3B82F6', // Blue (Город / Исследования)
      '#8B5CF6', // Purple (Мистика / Магия)
      '#6B7280', // Gray (Подземелье / Склеп)
      '#EC4899', // Pink (Драма)
      '#14B8A6'  // Teal (Спокойствие)
    ];

    let colorIdx = 0;
    playlistMap.forEach((trackList, categoryName) => {
      playlists.push({
        id: `pl_${categoryName.toLowerCase().replace(/[^a-z0-9а-яё]/gi, '_')}_${Date.now()}`,
        name: categoryName,
        tracks: trackList,
        color: categoryColors[colorIdx % categoryColors.length]
      });
      colorIdx++;
    });

    // Сортируем: сначала популярные папки (Бой, Босс, Таверна), затем по алфавиту
    playlists.sort((a, b) => a.name.localeCompare(b.name, 'ru'));

    this.state.playlists = playlists;
    this.state.rootFolderName = rootName;
    this.state.totalTracksCount = tracks.length;

    this.notify();
  }

  /**
   * Воспроизведение выбранного плейлиста.
   * Начинает с рандомного трека, формирует зацикленную перемешанную очередь (Shuffle Loop).
   */
  public playPlaylist(playlistId: string, specificTrackId?: string): void {
    const playlist = this.state.playlists.find((p) => p.id === playlistId);
    if (!playlist || playlist.tracks.length === 0) return;

    this.state.activePlaylistId = playlistId;

    // Генерируем перемешанную очередь треков
    const trackIds = playlist.tracks.map((t) => t.id);

    if (this.state.playbackMode === 'shuffle_loop') {
      const shuffled = this.shuffleArray([...trackIds]);
      
      // Если указан конкретный трек, ставим его первым
      if (specificTrackId && shuffled.includes(specificTrackId)) {
        const idx = shuffled.indexOf(specificTrackId);
        shuffled.splice(idx, 1);
        shuffled.unshift(specificTrackId);
      }

      this.state.playQueue = shuffled;
      this.state.queueIndex = 0;
    } else {
      this.state.playQueue = trackIds;
      this.state.queueIndex = specificTrackId ? Math.max(0, trackIds.indexOf(specificTrackId)) : 0;
    }

    const startTrackId = this.state.playQueue[this.state.queueIndex] || trackIds[0];
    this.loadAndPlayTrack(startTrackId);
  }

  /**
   * Загрузка и старт трека по ID
   */
  private loadAndPlayTrack(trackId: string): void {
    const activePl = this.state.playlists.find((p) => p.id === this.state.activePlaylistId);
    const track = activePl?.tracks.find((t) => t.id === trackId);

    if (!track || !this.audioElement) return;

    this.state.activeTrackId = track.id;
    this.state.activeTrackName = track.name;

    const aeState = audioEngine.getState();
    this.audioElement.volume = aeState.bgmVolume * aeState.masterVolume;
    this.audioElement.src = track.url;
    this.audioElement.currentTime = 0;

    this.audioElement
      .play()
      .then(() => {
        this.state.isPlaying = true;
        this.state.isPaused = false;
        this.notify();
      })
      .catch((err) => {
        console.warn('[MusicPlayer] Автоплей заблокирован или ошибка:', err);
      });
  }

  /**
   * Обработка завершения трека (переход к следующему в зацикленной очереди)
   */
  private handleTrackEnded(): void {
    if (this.state.playbackMode === 'single_repeat') {
      if (this.audioElement) {
        this.audioElement.currentTime = 0;
        this.audioElement.play().catch(() => {});
      }
      return;
    }

    this.playNextTrack();
  }

  /**
   * Следующий трек (с бесконечным зацикливанием плейлиста)
   */
  public playNextTrack(): void {
    if (this.state.playQueue.length === 0) return;

    let nextIndex = this.state.queueIndex + 1;

    // Если дошли до конца плейлиста — зацикливаемся и перетасовываем заново
    if (nextIndex >= this.state.playQueue.length) {
      nextIndex = 0;
      if (this.state.playbackMode === 'shuffle_loop') {
        this.state.playQueue = this.shuffleArray([...this.state.playQueue]);
      }
    }

    this.state.queueIndex = nextIndex;
    const nextTrackId = this.state.playQueue[nextIndex];
    this.loadAndPlayTrack(nextTrackId);
  }

  /**
   * Предыдущий трек
   */
  public playPreviousTrack(): void {
    if (this.state.playQueue.length === 0) return;

    let prevIndex = this.state.queueIndex - 1;
    if (prevIndex < 0) {
      prevIndex = this.state.playQueue.length - 1;
    }

    this.state.queueIndex = prevIndex;
    const prevTrackId = this.state.playQueue[prevIndex];
    this.loadAndPlayTrack(prevTrackId);
  }

  public togglePlayPause(): void {
    if (!this.audioElement) return;

    if (this.state.isPlaying) {
      this.audioElement.pause();
    } else {
      if (this.audioElement.src) {
        this.audioElement.play().catch(() => {});
      } else if (this.state.playlists.length > 0) {
        const firstPl = this.state.playlists[0];
        this.playPlaylist(firstPl.id);
      }
    }
  }

  public stop(): void {
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.currentTime = 0;
    }
    this.state.isPlaying = false;
    this.state.isPaused = false;
    this.notify();
  }

  public seek(seconds: number): void {
    if (this.audioElement && this.state.duration > 0) {
      this.audioElement.currentTime = Math.max(0, Math.min(this.state.duration, seconds));
    }
  }

  public setPlaybackMode(mode: PlaybackMode): void {
    this.state.playbackMode = mode;
    this.notify();
  }

  // ==========================================
  // КАСТОМНЫЙ САУНДБОРД (CUSTOM SOUNDBOARD)
  // ==========================================

  public addCustomSfx(files: File[] | FileList): void {
    const newItems: CustomSfxItem[] = [];

    Array.from(files).forEach((file, idx) => {
      const url = URL.createObjectURL(file);
      this.objectUrlsToRevoke.add(url);
      const cleanName = file.name.replace(/\.[^/.]+$/, '');

      newItems.push({
        id: `sfx_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
        name: cleanName,
        filename: file.name,
        url,
        blob: file,
        category: 'Пользовательские'
      });
    });

    this.state.customSfx = [...this.state.customSfx, ...newItems];
    this.notify();
  }

  public removeCustomSfx(sfxId: string): void {
    this.state.customSfx = this.state.customSfx.filter((s) => s.id !== sfxId);
    this.notify();
  }

  public playCustomSfx(sfxId: string): void {
    const item = this.state.customSfx.find((s) => s.id === sfxId);
    if (!item) return;

    try {
      const audio = new Audio(item.url);
      const aeState = audioEngine.getState();
      audio.volume = aeState.sfxVolume * aeState.masterVolume;
      audio.play().catch((err) => console.warn('Ошибка воспроизведения кастомного SFX:', err));
    } catch (err) {
      console.warn('SFX playback error:', err);
    }
  }

  private loadPersistedCustomSfx(): void {
    // Начальные пресеты могут быть дополнены
  }

  private shuffleArray<T>(array: T[]): T[] {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  public dispose(): void {
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.src = '';
    }
    this.objectUrlsToRevoke.forEach((url) => {
      try {
        URL.revokeObjectURL(url);
      } catch {}
    });
    this.objectUrlsToRevoke.clear();
  }
}

export const musicPlayer = new MusicPlayerService();
