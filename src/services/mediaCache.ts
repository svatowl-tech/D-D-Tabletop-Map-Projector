/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * mediaCache.ts — Прозрачный шлюз разрешения медиа-ссылок и LRU-кэш.
 * 
 * Особенности:
 * 1. Прозрачное разрешение ссылок (resolveMediaUrl):
 *    - http:// / https:// / data: / blob: -> возвращается напрямую.
 *    - idb://<asset_id> -> извлекает бинарный Blob из IndexedDB и создает временный blob: URL.
 * 2. Ограниченный LRU-кэш (Least Recently Used):
 *    - Держит максимум 40 активных ссылок blob: в оперативной памяти.
 *    - При запросе 41-го объекта самый старый неиспользуемый blob: URL немедленно
 *      освобождается через URL.revokeObjectURL().
 *    - Предотвращает утечки памяти (Out-Of-Memory) на системах с 2 GB RAM.
 */

import { storageService } from './storageService';

const MAX_ACTIVE_BLOB_URLS = 20;

interface CachedObjectUrl {
  assetId: string;
  url: string;
  lastAccess: number;
}

export class MediaCacheService {
  private activeBlobUrls: Map<string, CachedObjectUrl> = new Map();

  /**
   * Прозрачное разрешение путей и генерация blob: URL с LRU-кэшированием
   */
  public async resolveMediaUrl(pathOrUrl: string | undefined | null): Promise<string> {
    if (!pathOrUrl) return '';

    // 1. Прямые браузерные протоколы и Data URL
    if (
      pathOrUrl.startsWith('http://') ||
      pathOrUrl.startsWith('https://') ||
      pathOrUrl.startsWith('data:') ||
      pathOrUrl.startsWith('blob:')
    ) {
      return pathOrUrl;
    }

    // 2. Виртуальный протокол IndexedDB (idb://<asset_id>)
    if (pathOrUrl.startsWith('idb://')) {
      const assetId = pathOrUrl.replace('idb://', '');
      
      // Проверка наличия в активном LRU-кэше
      const existing = this.activeBlobUrls.get(assetId);
      if (existing) {
        existing.lastAccess = Date.now();
        return existing.url;
      }

      // Извлечение Blob из IndexedDB
      const asset = await storageService.getAssetFromDb(assetId);
      if (!asset || !asset.blob) {
        console.warn(`[mediaCache] Asset ${assetId} not found in IndexedDB`);
        return '';
      }

      // Выполнение LRU-очистки если превышен лимит в 40 объектов
      this.evictLruIfNeeded();

      // Создание нового Object URL
      const objectUrl = URL.createObjectURL(asset.blob);
      this.activeBlobUrls.set(assetId, {
        assetId,
        url: objectUrl,
        lastAccess: Date.now()
      });

      return objectUrl;
    }

    // 3. Относительные локальные пути (например, /assets/..., assets/..., AetherMap_Data/...)
    return pathOrUrl;
  }

  /**
   * Вытеснение наименее недавно использованных blob: URL при достижении лимита
   */
  private evictLruIfNeeded(): void {
    if (this.activeBlobUrls.size < MAX_ACTIVE_BLOB_URLS) return;

    let oldestKey: string | null = null;
    let oldestAccess = Infinity;

    this.activeBlobUrls.forEach((item, key) => {
      if (item.lastAccess < oldestAccess) {
        oldestAccess = item.lastAccess;
        oldestKey = key;
      }
    });

    if (oldestKey) {
      const oldestItem = this.activeBlobUrls.get(oldestKey);
      if (oldestItem) {
        console.log(`[mediaCache] LRU Eviction (Max 40 reached): Revoking ${oldestItem.assetId}`);
        URL.revokeObjectURL(oldestItem.url);
        this.activeBlobUrls.delete(oldestKey);
      }
    }
  }

  /**
   * Явное высвобождение конкретного URL
   */
  public releaseMediaUrl(url: string | undefined | null): void {
    if (!url) return;

    if (url.startsWith('blob:')) {
      // Ищем по выданному URL
      let foundKey: string | null = null;
      this.activeBlobUrls.forEach((item, key) => {
        if (item.url === url) {
          foundKey = key;
        }
      });

      if (foundKey) {
        const item = this.activeBlobUrls.get(foundKey);
        if (item) {
          URL.revokeObjectURL(item.url);
          this.activeBlobUrls.delete(foundKey);
        }
      } else {
        URL.revokeObjectURL(url);
      }
    }
  }

  /**
   * Очистка всех кэшированных URL при смене сессии или очистке ресурсов
   */
  public purgeUnusedBlobUrls(): void {
    console.log(`[mediaCache] Purging ${this.activeBlobUrls.size} active blob URLs`);
    this.activeBlobUrls.forEach((item) => {
      URL.revokeObjectURL(item.url);
    });
    this.activeBlobUrls.clear();
  }

  /**
   * Количество находящихся в памяти активных URL
   */
  public getActiveCount(): number {
    return this.activeBlobUrls.size;
  }
}

export const mediaCache = new MediaCacheService();
