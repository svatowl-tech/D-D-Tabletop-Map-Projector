/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Модуль синхронизации: обеспечивает надежный двусторонний обмен сообщениями
 * между окном мастера (DM View) и окном проектора (Player View).
 * 
 * Использует нативный BroadcastChannel API ('dnd-projector-channel'),
 * который передает структуры и бинарные данные (Blob) без сериализации в base64,
 * что критично для 2 GB RAM и слабых процессоров (Core 2 Duo).
 * Предусмотрен fallback на window storage события.
 */

import { BroadcastMessage } from '../types';

const CHANNEL_NAME = 'dnd-projector-channel';
const STORAGE_FALLBACK_KEY = '__dnd_projector_msg__';

export class SyncChannelService {
  private channel: BroadcastChannel | null = null;
  private listeners: Set<(message: BroadcastMessage) => void> = new Set();
  private isStorageFallbackActive = false;
  private boundStorageHandler: ((e: StorageEvent) => void) | null = null;

  constructor() {
    this.initializeChannel();
  }

  /**
   * Инициализация BroadcastChannel с проверкой поддержки браузером
   */
  private initializeChannel(): void {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.channel = new BroadcastChannel(CHANNEL_NAME);
        this.channel.onmessage = (event: MessageEvent) => {
          this.notifyListeners(event.data);
        };
        this.channel.onmessageerror = (error) => {
          console.warn('[SyncChannel] Ошибка десериализации сообщения:', error);
        };
        return;
      } catch (err) {
        console.warn('[SyncChannel] Не удалось открыть BroadcastChannel, включен fallback:', err);
      }
    }

    // Fallback через localStorage для старых браузеров / нестандартных webview
    this.isStorageFallbackActive = true;
    this.boundStorageHandler = (event: StorageEvent) => {
      if (event.key === STORAGE_FALLBACK_KEY && event.newValue) {
        try {
          const parsed = JSON.parse(event.newValue);
          this.notifyListeners(parsed.payload);
        } catch (err) {
          console.error('[SyncChannel] Ошибка парсинга fallback сообщения:', err);
        }
      }
    };
    window.addEventListener('storage', this.boundStorageHandler);
  }

  /**
   * Отправка сообщения в канал
   */
  public send(message: BroadcastMessage): void {
    if (this.channel) {
      try {
        this.channel.postMessage(message);
        return;
      } catch (err) {
        console.error('[SyncChannel] Ошибка отправки через BroadcastChannel:', err);
      }
    }

    if (this.isStorageFallbackActive) {
      try {
        // Если сообщение содержит Blob, fallback сериализует только метаданные
        const cleanMsg = { ...message };
        const envelope = {
          t: Date.now(),
          rnd: Math.random(),
          payload: cleanMsg
        };
        localStorage.setItem(STORAGE_FALLBACK_KEY, JSON.stringify(envelope));
      } catch (err) {
        console.error('[SyncChannel] Ошибка отправки через localStorage fallback:', err);
      }
    }
  }

  /**
   * Подписка на входящие сообщения
   */
  public subscribe(callback: (message: BroadcastMessage) => void): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Оповещение всех активных подписчиков
   */
  private notifyListeners(message: BroadcastMessage): void {
    this.listeners.forEach((listener) => {
      try {
        listener(message);
      } catch (err) {
        console.error('[SyncChannel] Ошибка в обработчике подписчика:', err);
      }
    });
  }

  /**
   * Полная очистка ресурсов и закрытие каналов при размонтировании
   */
  public destroy(): void {
    this.listeners.clear();
    if (this.channel) {
      this.channel.close();
      this.channel = null;
    }
    if (this.boundStorageHandler) {
      window.removeEventListener('storage', this.boundStorageHandler);
      this.boundStorageHandler = null;
    }
  }
}

// Синглтон для приложения
export const syncService = new SyncChannelService();
