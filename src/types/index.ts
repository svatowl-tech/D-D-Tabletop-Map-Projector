/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Определение типов и протоколов обмена сообщениями между окном мастера (DM)
 * и окном проектора (Player/Projector) через BroadcastChannel API.
 */

export type AppMode = 'dm' | 'player';

export type FogToolMode = 'reveal' | 'hide' | 'pan' | 'ping';

export interface ViewportTransform {
  x: number;
  y: number;
  scale: number;
}

export interface GridConfig {
  enabled: boolean;
  size: number; // Размер ячейки в пикселях (например, 50px)
  color: string;
  opacity: number;
  offsetX: number;
  offsetY: number;
}

export interface MediaItem {
  id: string;
  name: string;
  type: 'image' | 'video';
  mimeType: string;
  url: string;
  width: number;
  height: number;
  blob?: Blob;
}

export interface StrokePoint {
  x: number;
  y: number;
}

export interface DrawStrokePayload {
  mode: 'reveal' | 'hide';
  radius: number;
  points: StrokePoint[];
}

export interface MapPing {
  id: string;
  x: number;
  y: number;
  color: string;
  timestamp: number;
}

/**
 * Протокол сообщений для BroadcastChannel 'dnd-projector-channel'
 */
export type BroadcastMessage =
  | { type: 'HANDSHAKE_REQUEST' }
  | { type: 'HANDSHAKE_RESPONSE'; connected: boolean }
  | { type: 'SET_MEDIA'; mediaType: 'image' | 'video'; mimeType: string; blob?: Blob; dataUrl?: string; width: number; height: number; name: string }
  | { type: 'CLEAR_MEDIA' }
  | { type: 'SYNC_VIEWPORT'; transform: ViewportTransform }
  | { type: 'SYNC_GRID'; grid: GridConfig }
  | { type: 'FOG_STROKE'; stroke: DrawStrokePayload }
  | { type: 'FOG_FILL_ALL' }
  | { type: 'FOG_CLEAR_ALL' }
  | { type: 'FOG_SYNC_MASK'; maskDataUrl: string; width: number; height: number }
  | { type: 'PING_LOCATION'; ping: MapPing }
  | { type: 'SYNC_FULL_STATE'; state: FullSyncedState };

export interface FullSyncedState {
  hasMedia: boolean;
  mediaType: 'image' | 'video' | null;
  mimeType: string | null;
  dataUrl?: string;
  mediaWidth: number;
  mediaHeight: number;
  mediaName: string;
  viewport: ViewportTransform;
  grid: GridConfig;
  maskDataUrl?: string;
}
