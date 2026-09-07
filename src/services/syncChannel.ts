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
import { safeStorage } from '../utils/macOSCompatibility';

const CHANNEL_NAME = 'dnd-projector-channel';
const STORAGE_FALLBACK_KEY = '__dnd_projector_msg__';

export class SyncChannelService {
  private channel: BroadcastChannel | null = null;
  private listeners: Set<(message: BroadcastMessage) => void> = new Set();
  private isStorageFallbackActive = false;
  private boundStorageHandler: ((e: StorageEvent) => void) | null = null;
  private boundMessageHandler: ((e: MessageEvent) => void) | null = null;
  private targetWindows: Set<Window> = new Set();

  constructor() {
    this.initializeChannel();
    this.initializeCrossWindowListener();
  }

  /**
   * Регистрация дочернего или родительского окна для прямой синхронизации через postMessage
   * (критично для Safari 11-13 на macOS 10.13, где нет BroadcastChannel)
   */
  public registerTargetWindow(win: Window | null): void {
    if (win && !win.closed) {
      this.targetWindows.add(win);
    }
  }

  /**
   * Слушатель прямых cross-window сообщений
   */
  private initializeCrossWindowListener(): void {
    if (typeof window === 'undefined') return;

    this.boundMessageHandler = (event: MessageEvent) => {
      try {
        if (event.data && typeof event.data === 'object' && event.data.__vtt_zero_sync__ && event.data.payload) {
          this.notifyListeners(event.data.payload as BroadcastMessage);
        }
      } catch (err) {
        console.warn('[SyncChannel] Ошибка обработки cross-window сообщения:', err);
      }
    };

    window.addEventListener('message', this.boundMessageHandler);
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

    // Fallback через localStorage и storage события для старых браузеров (Safari 11-13 на macOS 10.13)
    this.isStorageFallbackActive = true;
    this.boundStorageHandler = (event: StorageEvent) => {
      if (event.key === STORAGE_FALLBACK_KEY && event.newValue) {
        try {
          const parsed = JSON.parse(event.newValue);
          if (parsed && parsed.payload) {
            this.notifyListeners(parsed.payload);
          }
        } catch (err) {
          console.error('[SyncChannel] Ошибка парсинга fallback сообщения:', err);
        }
      }
    };
    window.addEventListener('storage', this.boundStorageHandler);
  }

  /**
   * Отправка сообщения в канал (через BroadcastChannel + прямой postMessage + safeStorage)
   */
  public send(message: BroadcastMessage): void {
    // 1. Попытка отправки через нативный BroadcastChannel (если поддерживается)
    if (this.channel) {
      try {
        this.channel.postMessage(message);
      } catch (err) {
        console.error('[SyncChannel] Ошибка отправки через BroadcastChannel:', err);
      }
    }

    // 2. Прямая отправка во все зарегистрированные связанные окна (Safari 11-13 fallback)
    this.targetWindows.forEach((win) => {
      try {
        if (!win.closed) {
          win.postMessage({ __vtt_zero_sync__: true, payload: message }, '*');
        } else {
          this.targetWindows.delete(win);
        }
      } catch (e) {
        // Окно могло закрыться или смениться
      }
    });

    // 3. Отправка в родительское окно opener (если открыто как окно проектора)
    if (typeof window !== 'undefined' && window.opener && !window.opener.closed) {
      try {
        window.opener.postMessage({ __vtt_zero_sync__: true, payload: message }, '*');
      } catch (e) {
        // Игнорируем кросс-доменные ограничения при наличии
      }
    }

    // 4. Fallback через safeStorage (для окон, открытых отдельно без opener)
    if (this.isStorageFallbackActive || !this.channel) {
      try {
        const cleanMsg = { ...message };
        const envelope = {
          t: Date.now(),
          rnd: Math.random(),
          payload: cleanMsg
        };
        safeStorage.setItem(STORAGE_FALLBACK_KEY, JSON.stringify(envelope));
      } catch (err) {
        console.error('[SyncChannel] Ошибка отправки через storage fallback:', err);
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
    this.targetWindows.clear();
    if (this.channel) {
      this.channel.close();
      this.channel = null;
    }
    if (this.boundStorageHandler) {
      window.removeEventListener('storage', this.boundStorageHandler);
      this.boundStorageHandler = null;
    }
    if (this.boundMessageHandler) {
      window.removeEventListener('message', this.boundMessageHandler);
      this.boundMessageHandler = null;
    }
  }
}

// Синглтон для приложения
export const syncService = new SyncChannelService();

