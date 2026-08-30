/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Определение типов данных и протоколов обмена сообщениями VTT-ZERO.
 * Охватывает двухэкранную архитектуру, слои, токены, туман войны,
 * боевой менеджер, аудио-синтезатор, генератор подземелий и SRD базу.
 */

export type AppMode = 'dm' | 'player';

export type DMTool =
  | 'select'
  | 'reveal'
  | 'hide'
  | 'pan'
  | 'laser'
  | 'ping'
  | 'ruler'
  | 'spell_template'
  | 'draw';

export type FogToolMode = DMTool;

export type FogBrushShape = 'circle' | 'rect' | 'polygon';

export type FogTextureStyle = 'classic_black' | 'mountain_mist' | 'toxic_vapor' | 'crypt_darkness';

export type BlackoutTheme = 'none' | 'pitch_black' | 'campfire' | 'mist' | 'stars';

export interface ViewportTransform {
  x: number;
  y: number;
  scale: number;
}

export type GridType = 'square' | 'hex_pointy' | 'hex_flat';

export interface GridConfig {
  enabled: boolean;
  type: GridType;
  size: number; // Размер ячейки в пикселях (20 - 200px)
  color: string;
  opacity: number;
  offsetX?: number;
  offsetY?: number;
  snapToGrid?: boolean;
}

export interface MediaItem {
  id: string;
  name: string;
  type: 'image' | 'video';
  mimeType: string;
  url: string;
  width: number;
  height: number;
  dataUrl?: string;
  blob?: Blob;
}

export type LayerCategory = 'map' | 'prop' | 'token' | 'roof' | 'gm_only';

/**
 * Слой на карте (тайл, декорация, персонаж, крыша или скрытый маркер GM)
 */
export interface MapLayer {
  id: string;
  name: string;
  category?: LayerCategory;
  type?: 'image' | 'video';
  mimeType?: string;
  url: string;
  dataUrl?: string;
  blob?: Blob;
  x: number;             // Координата X на холсте (px)
  y: number;             // Координата Y на холсте (px)
  width: number;         // Текущая ширина
  height: number;        // Текущая высота
  naturalWidth?: number;  // Исходная ширина
  naturalHeight?: number; // Исходная высота
  scale?: number;         // Масштаб (1.0 = 100%)
  rotation?: number;      // Поворот в градусах (0 - 360)
  opacity: number;       // Прозрачность (0.0 - 1.0)
  visible: boolean;      // Видимость для игроков
  locked: boolean;       // Блокировка от перемещения
  zIndex: number;        // Порядок наложения
  isBaseMap?: boolean;   // Является ли базовой картой
  
  // Дополнительные свойства для токенов
  tokenData?: {
    hpCurrent?: number;
    hpMax?: number;
    tempHp?: number;
    ac?: number;
    speed?: number;
    colorRing?: string;
    showHpBar?: boolean;
    conditions?: string[];
    isPlayerControlled?: boolean;
  };
}

export interface StrokePoint {
  x: number;
  y: number;
}

export interface DrawStrokePayload {
  mode: 'reveal' | 'hide';
  shape: FogBrushShape;
  radius: number;
  points: StrokePoint[];
  rect?: { x: number; y: number; width: number; height: number };
}

export interface MapPing {
  id: string;
  x: number;
  y: number;
  color?: string;
  createdAt?: number;
  timestamp?: number;
}

export interface LaserPoint {
  x: number;
  y: number;
  timestamp: number;
}

export type RulerMode = '5e_euclidean' | '5e_manhattan' | '5e_diagonal' | '5e' | 'euclidean' | 'manhattan';

export interface RulerMeasurement {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  distanceFeet: number;
  distanceMeters: number;
  distanceCells: number;
  mode: RulerMode;
  color?: string;
}

export type SpellShape = 'cone' | 'sphere' | 'line' | 'cube';

export interface SpellTemplate {
  id?: string;
  shape: SpellShape;
  sizeFeet: number; // 15, 30, 60 ft
  originX: number;
  originY: number;
  targetX?: number;
  targetY?: number;
  angleDeg: number;
  color?: string;
  element?: 'fire' | 'cold' | 'lightning' | 'acid' | 'radiant' | 'necrotic';
}

export interface TacticalDrawing {
  id: string;
  type: 'freehand' | 'arrow' | 'rect' | 'circle' | 'highlighter';
  points: StrokePoint[];
  color: string;
  width: number;
  opacity?: number;
}

export interface SubmapPortal {
  id: string;
  name: string;
  targetSceneId: string;
  x?: number;
  y?: number;
  icon?: string; // 'stairs_down' | 'door' | 'portal' | 'cave'
  color?: string;
}

export type MapPortal = SubmapPortal;

/**
 * Состояние боевого трекера (Combat Initiative Tracker)
 */
export interface Combatant {
  id: string;
  name: string;
  type: 'pc' | 'monster' | 'npc' | 'boss';
  initiative: number;
  dexModifier: number;
  hpCurrent: number;
  hpMax: number;
  tempHp: number;
  ac: number;
  speed: number;
  passivePerception: number;
  conditions: Array<{
    name: string;
    roundsRemaining?: number;
    color?: string;
  }>;
  avatarUrl?: string;
  notes?: string;
}

export interface CombatTrackerState {
  isActive: boolean;
  round: number;
  currentTurnIndex: number;
  combatants: Combatant[];
}

/**
 * Результат броска дайсов
 */
export interface DiceRollResult {
  id: string;
  formula: string; // e.g. "1d20+5", "2d6+3", "8d6"
  diceType: 'd4' | 'd6' | 'd8' | 'd10' | 'd12' | 'd20' | 'd100' | 'custom';
  rolls: number[];
  modifier: number;
  total: number;
  isCritSuccess: boolean;
  isCritFail: boolean;
  advantageMode?: 'normal' | 'advantage' | 'disadvantage';
  rollerName: string;
  timestamp: number;
}

/**
 * Описание локации / Сцены
 */
export interface Scene {
  id: string;
  name: string;
  description?: string;
  notes?: string;
  gmNotes?: string;
  readAloudText?: string;
  baseMedia?: MediaItem | null;
  layers: MapLayer[];
  grid: GridConfig;
  viewport?: ViewportTransform;
  maskDataUrl?: string;
  drawings?: TacticalDrawing[];
  portals?: SubmapPortal[];
  bgmPreset?: string;
  ambiencePreset?: string;
  createdAt?: number;
  updatedAt?: number;
}

/**
 * Состояние звукового микшера
 */
export interface AmbienceChannelState {
  rain: number;       // 0.0 - 1.0
  wind: number;       // 0.0 - 1.0
  fire: number;       // 0.0 - 1.0
  dungeon: number;    // 0.0 - 1.0
  tavern: number;     // 0.0 - 1.0
}

export interface AudioEngineState {
  masterVolume: number;
  bgmVolume: number;
  ambienceVolume: number;
  sfxVolume: number;
  activeBgm: string | null;
  ambienceChannels: AmbienceChannelState;
  isPlaying: boolean;
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
  | { type: 'DRAW_STROKE'; payload: DrawStrokePayload }
  | { type: 'FOG_FILL_ALL' }
  | { type: 'FILL_FOG' }
  | { type: 'FOG_CLEAR_ALL' }
  | { type: 'CLEAR_FOG' }
  | { type: 'INVERT_FOG' }
  | { type: 'FOG_SYNC_MASK'; maskDataUrl: string; width: number; height: number }
  | { type: 'FOG_STYLE'; style: FogTextureStyle }
  | { type: 'PING_LOCATION'; ping: MapPing }
  | { type: 'ADD_PING'; ping: MapPing }
  | { type: 'LASER_TRAIL'; points: LaserPoint[] }
  | { type: 'LASER_STREAM'; point: LaserPoint }
  | { type: 'SYNC_LAYERS'; layers: MapLayer[] }
  | { type: 'UPDATE_LAYER_TRANSFORM'; layerId: string; transform: Partial<MapLayer> }
  | { type: 'REMOVE_LAYER'; layerId: string }
  | { type: 'SYNC_DRAWINGS'; drawings: TacticalDrawing[] }
  | { type: 'SYNC_SPELL_TEMPLATE'; template: SpellTemplate | null }
  | { type: 'SYNC_RULER'; ruler: RulerMeasurement | null }
  | { type: 'SET_BLACKOUT'; theme: BlackoutTheme }
  | { type: 'SYNC_COMBAT'; combat: CombatTrackerState }
  | { type: 'BROADCAST_DICE_ROLL'; roll: DiceRollResult }
  | { type: 'DICE_ROLL'; roll: DiceRollResult }
  | { type: 'BROADCAST_READ_ALOUD'; title: string; text: string }
  | { type: 'READ_ALOUD'; title: string; text: string }
  | { type: 'SHOW_HANDOUT_CARD'; card: import('./generator').HandoutCardPayload }
  | { type: 'HIDE_HANDOUT_CARD' }
  | { type: 'SWITCH_SCENE_CINEMATIC'; sceneName: string }
  | { type: 'PLAYER_WINDOW_RESIZED'; width: number; height: number }
  | { type: 'SET_PLAYER_VIEWPORT'; transform: ViewportTransform }
  | { type: 'REQUEST_FULL_STATE' }
  | { type: 'SYNC_FULL_STATE'; state: FullSyncedState };

export * from './generator';

export interface FullSyncedState {
  sceneId?: string;
  sceneName?: string;
  hasMedia: boolean;
  mediaType: 'image' | 'video' | null;
  mimeType: string | null;
  dataUrl?: string;
  mediaWidth: number;
  mediaHeight: number;
  mediaName: string;
  viewport: ViewportTransform;
  playerViewport?: ViewportTransform;
  playerScreenSize?: { width: number; height: number };
  grid: GridConfig;
  maskDataUrl?: string;
  fogStyle?: FogTextureStyle;
  blackout?: BlackoutTheme;
  blackoutTheme?: BlackoutTheme;
  layers?: MapLayer[];
  drawings?: TacticalDrawing[];
  spellTemplate?: SpellTemplate | null;
  combat?: CombatTrackerState;
}
