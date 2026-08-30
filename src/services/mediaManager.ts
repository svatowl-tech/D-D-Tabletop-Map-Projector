/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Модуль управления медиа-ресурсами и слоями: загрузка, валидация и обязательное
 * освобождение памяти (URL.revokeObjectURL) для предотвращения утечек
 * на системах с 2 GB RAM и 256 MB VRAM.
 */

import { MediaItem, MapLayer } from '../types';

export const SUPPORTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml'
];

export const SUPPORTED_VIDEO_TYPES = [
  'video/mp4',
  'video/webm',
  'video/ogg'
];

export const MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024; // 100 MB предел

export class MediaManager {
  private activeUrls: Set<string> = new Set();
  private currentMedia: MediaItem | null = null;

  /**
   * Проверка поддерживается ли тип файла
   */
  public isSupported(file: File): { supported: boolean; type: 'image' | 'video' | null; error?: string } {
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return {
        supported: false,
        type: null,
        error: `Файл слишком большой (${(file.size / 1024 / 1024).toFixed(1)} МБ). Рекомендуется до 100 МБ.`
      };
    }

    const mime = file.type.toLowerCase();
    if (SUPPORTED_IMAGE_TYPES.includes(mime)) {
      return { supported: true, type: 'image' };
    }
    if (SUPPORTED_VIDEO_TYPES.includes(mime)) {
      return { supported: true, type: 'video' };
    }

    // Проверка по расширению, если mime-тип пустой (характерно для некоторых старых ОС)
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(ext || '')) {
      return { supported: true, type: 'image' };
    }
    if (['mp4', 'webm', 'ogv'].includes(ext || '')) {
      return { supported: true, type: 'video' };
    }

    return {
      supported: false,
      type: null,
      error: 'Неподдерживаемый формат. Используйте JPG, PNG, WebP, GIF, SVG или MP4, WebM видео.'
    };
  }

  /**
   * Загрузка файла и создание MediaItem
   */
  public async loadFromFile(file: File): Promise<MediaItem> {
    const check = this.isSupported(file);
    if (!check.supported || !check.type) {
      throw new Error(check.error || 'Ошибка формата файла');
    }

    this.releaseCurrentMedia();

    const objectUrl = URL.createObjectURL(file);
    this.activeUrls.add(objectUrl);

    // Читаем dataUrl для надежного трансфера/IndexedDB
    const dataUrl = await this.fileToDataUrl(file).catch(() => undefined);

    if (check.type === 'image') {
      const dimensions = await this.getImageDimensions(objectUrl);
      const item: MediaItem = {
        id: `media_${Date.now()}`,
        name: file.name,
        type: 'image',
        mimeType: file.type || 'image/jpeg',
        url: objectUrl,
        dataUrl,
        width: dimensions.width,
        height: dimensions.height,
        blob: file
      };
      this.currentMedia = item;
      return item;
    } else {
      const dimensions = await this.getVideoDimensions(objectUrl);
      const item: MediaItem = {
        id: `media_${Date.now()}`,
        name: file.name,
        type: 'video',
        mimeType: file.type || 'video/mp4',
        url: objectUrl,
        dataUrl,
        width: dimensions.width,
        height: dimensions.height,
        blob: file
      };
      this.currentMedia = item;
      return item;
    }
  }

  /**
   * Загрузка слоя (накладываемого изображения) из файла
   */
  public async loadLayerFromFile(file: File, x: number = 0, y: number = 0, zIndex: number = 1): Promise<MapLayer> {
    const check = this.isSupported(file);
    if (!check.supported || !check.type) {
      throw new Error(check.error || 'Ошибка формата файла слоя');
    }

    const objectUrl = URL.createObjectURL(file);
    this.activeUrls.add(objectUrl);

    const dataUrl = await this.fileToDataUrl(file).catch(() => undefined);
    const dimensions = check.type === 'image' 
      ? await this.getImageDimensions(objectUrl)
      : await this.getVideoDimensions(objectUrl);

    const layer: MapLayer = {
      id: `layer_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      name: file.name.replace(/\.[^/.]+$/, ''),
      type: check.type,
      mimeType: file.type || (check.type === 'image' ? 'image/png' : 'video/mp4'),
      url: objectUrl,
      dataUrl,
      blob: file,
      x,
      y,
      width: dimensions.width,
      height: dimensions.height,
      naturalWidth: dimensions.width,
      naturalHeight: dimensions.height,
      scale: 1.0,
      rotation: 0,
      opacity: 1.0,
      visible: true,
      locked: false,
      zIndex
    };

    return layer;
  }

  /**
   * Создание слоя из Blob
   */
  public async createLayerFromBlob(
    blob: Blob,
    name: string,
    type: 'image' | 'video',
    x: number = 0,
    y: number = 0,
    zIndex: number = 1
  ): Promise<MapLayer> {
    const objectUrl = URL.createObjectURL(blob);
    this.activeUrls.add(objectUrl);

    const dataUrl = await this.blobToDataUrl(blob).catch(() => undefined);
    const dimensions = type === 'image'
      ? await this.getImageDimensions(objectUrl)
      : await this.getVideoDimensions(objectUrl);

    const layer: MapLayer = {
      id: `layer_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      name,
      type,
      mimeType: blob.type || (type === 'image' ? 'image/png' : 'video/mp4'),
      url: objectUrl,
      dataUrl,
      blob,
      x,
      y,
      width: dimensions.width,
      height: dimensions.height,
      naturalWidth: dimensions.width,
      naturalHeight: dimensions.height,
      scale: 1.0,
      rotation: 0,
      opacity: 1.0,
      visible: true,
      locked: false,
      zIndex
    };

    return layer;
  }

  /**
   * Создание MediaItem из Blob
   */
  public async loadFromBlob(blob: Blob, name: string, type: 'image' | 'video', width?: number, height?: number): Promise<MediaItem> {
    this.releaseCurrentMedia();

    const objectUrl = URL.createObjectURL(blob);
    this.activeUrls.add(objectUrl);

    let finalWidth = width || 1920;
    let finalHeight = height || 1080;

    if (!width || !height) {
      if (type === 'image') {
        const dim = await this.getImageDimensions(objectUrl);
        finalWidth = dim.width;
        finalHeight = dim.height;
      } else {
        const dim = await this.getVideoDimensions(objectUrl);
        finalWidth = dim.width;
        finalHeight = dim.height;
      }
    }

    const dataUrl = await this.blobToDataUrl(blob).catch(() => undefined);

    const item: MediaItem = {
      id: `media_${Date.now()}`,
      name,
      type,
      mimeType: blob.type,
      url: objectUrl,
      dataUrl,
      width: finalWidth,
      height: finalHeight,
      blob
    };
    this.currentMedia = item;
    return item;
  }

  /**
   * Преобразование File в Data URL
   */
  public fileToDataUrl(file: File | Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  public blobToDataUrl(blob: Blob): Promise<string> {
    return this.fileToDataUrl(blob);
  }

  /**
   * Определение реальных пиксельных размеров изображения
   */
  private getImageDimensions(url: string): Promise<{ width: number; height: number }> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        resolve({
          width: img.naturalWidth || 1920,
          height: img.naturalHeight || 1080
        });
      };
      img.onerror = () => {
        resolve({ width: 1920, height: 1080 });
      };
      img.src = url;
    });
  }

  /**
   * Определение реальных пиксельных размеров видео
   */
  private getVideoDimensions(url: string): Promise<{ width: number; height: number }> {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.muted = true;
      video.onloadedmetadata = () => {
        resolve({
          width: video.videoWidth || 1920,
          height: video.videoHeight || 1080
        });
        video.src = '';
        video.load();
      };
      video.onerror = () => {
        resolve({ width: 1920, height: 1080 });
        video.src = '';
      };
      video.src = url;
    });
  }

  /**
   * Освобождение памяти для отдельного URL слоя
   */
  public revokeUrl(url?: string): void {
    if (url && url.startsWith('blob:')) {
      URL.revokeObjectURL(url);
      this.activeUrls.delete(url);
    }
  }

  /**
   * Освобождение памяти для текущего активного медиа-файла
   */
  public releaseCurrentMedia(): void {
    if (this.currentMedia) {
      if (this.currentMedia.url.startsWith('blob:')) {
        URL.revokeObjectURL(this.currentMedia.url);
        this.activeUrls.delete(this.currentMedia.url);
      }
      this.currentMedia = null;
    }
  }

  /**
   * Полное освобождение всех созданных Object URL при выходе
   */
  public destroy(): void {
    this.activeUrls.forEach((url) => {
      if (url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
    });
    this.activeUrls.clear();
    this.currentMedia = null;
  }
}

export const mediaManager = new MediaManager();
