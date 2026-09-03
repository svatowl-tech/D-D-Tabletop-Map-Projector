/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * types/audio.ts — Типы данных для музыкального плеера с поддержкой локальных папок,
 * плейлистов с непрерывным shuffle-looping воспроизведением и кастомного саундборда.
 */

export interface AudioTrackItem {
  id: string;
  name: string;               // Название трека без расширения
  filename: string;           // Полное имя файла
  category: string;           // Имя подпапки / плейлиста (например, 'Битва', 'Босс', 'Таверна')
  relativePath: string;       // Относительный путь
  blob?: Blob;                // Двоичный блоб
  url: string;                // Blob URL или Data URL для мгновенного воспроизведения
  duration?: number;          // Длительность в секундах
  size: number;               // Размер в байтах
}

export interface AudioPlaylist {
  id: string;
  name: string;               // Имя плейлиста (соответствует имени подпапки)
  tracks: AudioTrackItem[];
  color?: string;             // Цветная маркировка категории
  icon?: string;              // Иконка категории
}

export interface CustomSfxItem {
  id: string;
  name: string;               // Имя эффекта
  filename: string;
  url: string;
  blob?: Blob;
  category?: string;          // e.g. 'Бой', 'Магия', 'Монстры', 'Окружение'
  color?: string;
  hotkey?: string;            // Клавиша быстрого вызова (1-9, Q, W, E и т.д.)
}

export type PlaybackMode = 'shuffle_loop' | 'sequential_loop' | 'single_repeat';

export interface MusicPlayerState {
  // Плейлисты
  playlists: AudioPlaylist[];
  activePlaylistId: string | null;
  activeTrackId: string | null;
  activeTrackName: string | null;
  
  // Очередь воспроизведения (перемешанная или последовательная)
  playQueue: string[];        // Массив trackId
  queueIndex: number;
  
  // Состояние воспроизведения
  isPlaying: boolean;
  isPaused: boolean;
  currentTime: number;
  duration: number;
  playbackMode: PlaybackMode;
  isMuted: boolean;
  
  // Папка-источник
  rootFolderName: string | null;
  totalTracksCount: number;

  // Кастомные эффекты саундборда
  customSfx: CustomSfxItem[];
}
