/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Сервис локального персистентного кэширования и хранилища сцен (Map Vault)
 * на базе IndexedDB.
 */

import { Scene, MapLayer } from '../types';

const DB_NAME = 'vtt_zero_vault_db';
const DB_VERSION = 2;
const SESSION_STORE = 'session_store';
const SCENES_STORE = 'scenes_vault';

export class StorageService {
  private dbPromise: Promise<IDBDatabase | null> | null = null;

  constructor() {
    this.initDB();
  }

  private initDB(): Promise<IDBDatabase | null> {
    if (this.dbPromise) return this.dbPromise;
    if (typeof window === 'undefined' || !('indexedDB' in window)) {
      return Promise.resolve(null);
    }

    this.dbPromise = new Promise((resolve) => {
      try {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains(SESSION_STORE)) {
            db.createObjectStore(SESSION_STORE, { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains(SCENES_STORE)) {
            db.createObjectStore(SCENES_STORE, { keyPath: 'id' });
          }
        };
        request.onsuccess = () => {
          resolve(request.result);
        };
        request.onerror = () => {
          console.warn('[StorageService] IndexedDB open error');
          resolve(null);
        };
      } catch (err) {
        console.warn('[StorageService] IndexedDB not available:', err);
        resolve(null);
      }
    });

    return this.dbPromise;
  }

  /**
   * Сохранение активного состояния сессии
   */
  public async saveActiveSession(state: any): Promise<void> {
    const db = await this.initDB();
    if (!db) return;

    return new Promise((resolve) => {
      try {
        const tx = db.transaction(SESSION_STORE, 'readwrite');
        const store = tx.objectStore(SESSION_STORE);

        store.put({
          id: 'current_session',
          timestamp: Date.now(),
          ...state
        });

        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      } catch (err) {
        console.warn('[StorageService] Error saving session:', err);
        resolve();
      }
    });
  }

  /**
   * Загрузка активного состояния сессии
   */
  public async loadActiveSession(): Promise<any | null> {
    const db = await this.initDB();
    if (!db) return null;

    return new Promise((resolve) => {
      try {
        const tx = db.transaction(SESSION_STORE, 'readonly');
        const store = tx.objectStore(SESSION_STORE);
        const req = store.get('current_session');

        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      } catch (err) {
        console.warn('[StorageService] Error reading session:', err);
        resolve(null);
      }
    });
  }

  /**
   * Сохранение сцены в библиотеку карт (Map Vault)
   */
  public async saveSceneToVault(scene: Scene): Promise<void> {
    const db = await this.initDB();
    if (!db) return;

    return new Promise((resolve) => {
      try {
        const tx = db.transaction(SCENES_STORE, 'readwrite');
        const store = tx.objectStore(SCENES_STORE);

        const cleanLayers = (scene.layers || []).map((l) => ({
          ...l,
          url: l.dataUrl || l.url
        }));

        store.put({
          ...scene,
          layers: cleanLayers,
          updatedAt: Date.now()
        });

        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      } catch (err) {
        console.warn('[StorageService] Error saving scene to vault:', err);
        resolve();
      }
    });
  }

  /**
   * Получение всех сохраненных сцен из библиотеки
   */
  public async getAllScenesFromVault(): Promise<Scene[]> {
    const db = await this.initDB();
    if (!db) return [];

    return new Promise((resolve) => {
      try {
        const tx = db.transaction(SCENES_STORE, 'readonly');
        const store = tx.objectStore(SCENES_STORE);
        const req = store.getAll();

        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve([]);
      } catch (err) {
        console.warn('[StorageService] Error reading scenes vault:', err);
        resolve([]);
      }
    });
  }

  /**
   * Удаление сцены из хранилища
   */
  public async deleteSceneFromVault(sceneId: string): Promise<void> {
    const db = await this.initDB();
    if (!db) return;

    return new Promise((resolve) => {
      try {
        const tx = db.transaction(SCENES_STORE, 'readwrite');
        const store = tx.objectStore(SCENES_STORE);
        store.delete(sceneId);
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      } catch (err) {
        resolve();
      }
    });
  }
}

export const storageService = new StorageService();
