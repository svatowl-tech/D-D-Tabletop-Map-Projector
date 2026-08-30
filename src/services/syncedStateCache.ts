/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Модуль синхронного кэширования полнотекстового состояния стола (FullSyncedState).
 * Оптимизирован для предотвращения пустых экранов у игроков при загрузке или перезагрузке.
 */

import { FullSyncedState } from '../types';

const SYNCED_STATE_KEY = 'vtt_zero_full_synced_state_v1';

export function saveSyncedStateToCache(state: FullSyncedState): void {
  if (typeof window === 'undefined') return;
  try {
    const json = JSON.stringify(state);
    localStorage.setItem(SYNCED_STATE_KEY, json);
  } catch (err) {
    // В случае превышения лимита localStorage для гигантских видео/картинок
    try {
      // Сохраняем состояние без массивных dataUrl если слишком большие
      const lightweightState: FullSyncedState = {
        ...state,
        layers: state.layers?.map((l) => ({
          ...l,
          // Оставляем url если dataUrl слишком большой
          dataUrl: l.dataUrl && l.dataUrl.length > 2000000 ? undefined : l.dataUrl
        }))
      };
      localStorage.setItem(SYNCED_STATE_KEY, JSON.stringify(lightweightState));
    } catch (e) {
      console.warn('[SyncedStateCache] Could not save to localStorage:', e);
    }
  }
}

export function loadSyncedStateFromCache(): FullSyncedState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(SYNCED_STATE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as FullSyncedState;
  } catch (err) {
    console.warn('[SyncedStateCache] Error loading cached state:', err);
    return null;
  }
}
