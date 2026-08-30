/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Главный экран Мастера Подземелий (DM View).
 * 
 * Особенности:
 * - Многослойная тактическая карта с сеткой и перетаскиванием слоев.
 * - Движок Тумана Войны: кисти, прямоугольники, круги, инверсия, текстурные стили.
 * - Линейка-дальномер (D&D 5e 5-10-5, метры, клетки).
 * - Шаблоны заклинаний (Конус, Сфера, Линия, Куб).
 * - Тактическое рисование и лазерная указка с затухающим следом.
 * - Интерактивный Combat Tracker с инициативой и SRD бестиарием.
 * - Web Audio эмбиент и звуковая панель (SFX / BGM).
 * - Хранилище кампании (Map Vault) и BSP процедурный генератор подземелий.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  DMTool,
  GridConfig,
  MapLayer,
  ViewportTransform,
  StrokePoint,
  MapPing,
  LaserPoint,
  TacticalDrawing,
  SpellTemplate,
  RulerMeasurement,
  BlackoutTheme,
  CombatTrackerState,
  Combatant,
  DiceRollResult,
  Scene,
  FogTextureStyle,
  AudioEngineState
} from '../types';
import { DMHeader } from './DMHeader';
import { DMToolbar } from './DMToolbar';
import { GridOverlay } from './GridOverlay';
import { PingOverlay } from './PingOverlay';
import { TacticalDrawingOverlay } from './TacticalDrawingOverlay';
import { CombatTrackerDrawer } from './CombatTrackerDrawer';
import { AudioSoundboardDrawer } from './AudioSoundboardDrawer';
import { SRDReferenceDrawer } from './SRDReferenceDrawer';
import { SceneNotesDrawer } from './SceneNotesDrawer';
import { MapVaultModal } from './MapVaultModal';
import { DiceRollerModal } from './DiceRollerModal';
import { RandomGeneratorStudioModal } from './RandomGeneratorStudioModal';
import { PlayerViewportFrameOverlay } from './PlayerViewportFrameOverlay';
import { HandoutCardPayload } from '../types/generator';
import { FogEngine } from '../services/fogEngine';
import { syncService } from '../services/syncChannel';
import { storageService } from '../services/storageService';
import { saveSyncedStateToCache } from '../services/syncedStateCache';
import { audioEngine } from '../services/audioEngine';
import { SAMPLE_MAPS } from '../utils/sampleMaps';
import { SRDMonster, SRDSpell } from '../services/srdDatabase';
import { Eye, EyeOff, Lock, Unlock, Move, Trash2, Tv, Crosshair, Radio, Maximize2, ZoomIn, ZoomOut } from 'lucide-react';

export const DMView: React.FC = () => {
  // 1. Базовые сцены кампании
  const [allScenes, setAllScenes] = useState<Scene[]>([
    {
      id: 'scene_default',
      name: 'Crypt of the Sunken King',
      grid: {
        enabled: true,
        size: 60,
        color: 'rgba(255, 255, 255, 0.25)',
        opacity: 0.5,
        type: 'square',
        offsetX: 0,
        offsetY: 0
      },
      layers: [],
      drawings: [],
      portals: [],
      notes: 'Ancient underground tomb guarded by restless skeletal sentinels.'
    }
  ]);

  const [currentScene, setCurrentScene] = useState<Scene>(allScenes[0]);

  // Слои активной сцены
  const [layers, setLayers] = useState<MapLayer[]>([]);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);

  // Камера и зум Мастера
  const [viewport, setViewport] = useState<ViewportTransform>({ x: 0, y: 0, scale: 1 });

  // Камера и трансляция Игроков
  const [playerViewport, setPlayerViewport] = useState<ViewportTransform>({ x: 0, y: 0, scale: 1 });
  const [playerScreenSize, setPlayerScreenSize] = useState<{ width: number; height: number }>({
    width: 1920,
    height: 1080
  });
  const [isLinkedCamera, setIsLinkedCamera] = useState<boolean>(true);
  const [isConnectedToPlayer, setIsConnectedToPlayer] = useState<boolean>(false);

  const [tool, setTool] = useState<DMTool>('reveal');
  const [brushRadius, setBrushRadius] = useState<number>(50);
  const [brushShape, setBrushShape] = useState<'circle' | 'rect'>('circle');
  const [fogStyle, setFogStyle] = useState<FogTextureStyle>('classic_black');
  const [masterFogOpacity, setMasterFogOpacity] = useState<number>(0.55);

  // Сетка
  const [grid, setGrid] = useState<GridConfig>(currentScene.grid);

  // Тактические оверлеи
  const [pings, setPings] = useState<MapPing[]>([]);
  const [laserPoints, setLaserPoints] = useState<LaserPoint[]>([]);
  const [drawings, setDrawings] = useState<TacticalDrawing[]>([]);
  const [activeDrawing, setActiveDrawing] = useState<TacticalDrawing | null>(null);
  const [spellTemplate, setSpellTemplate] = useState<SpellTemplate | null>(null);
  const [ruler, setRuler] = useState<RulerMeasurement | null>(null);

  // Режим затемнения экрана игроков
  const [blackoutTheme, setBlackoutTheme] = useState<BlackoutTheme>('none');

  // Боевой менеджер
  const [combat, setCombat] = useState<CombatTrackerState>({
    isActive: false,
    round: 1,
    currentTurnIndex: 0,
    combatants: []
  });

  // Аудио состояние
  const [audioState, setAudioState] = useState<AudioEngineState>(audioEngine.getState());

  // Состояния открытия панелей и модальных окон
  const [isCombatOpen, setIsCombatOpen] = useState(false);
  const [isAudioOpen, setIsAudioOpen] = useState(false);
  const [isSRDOpen, setIsSRDOpen] = useState(false);
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [isVaultModalOpen, setIsVaultModalOpen] = useState(false);
  const [isDiceModalOpen, setIsDiceModalOpen] = useState(false);
  const [isGeneratorStudioOpen, setIsGeneratorStudioOpen] = useState(false);

  // Ссылки на DOM и движок тумана
  const viewportRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fogEngineRef = useRef<FogEngine | null>(null);

  // Мутабельные ссылки для быстрых событий мыши
  const isInteractingRef = useRef(false);
  const panStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const strokeBufferRef = useRef<StrokePoint[]>([]);
  const lastLaserTimeRef = useRef<number>(0);
  const isDraggingLayerRef = useRef(false);
  const layerDragStartRef = useRef<{ x: number; y: number; layerX: number; layerY: number }>({
    x: 0,
    y: 0,
    layerX: 0,
    layerY: 0
  });

  // 1. Инициализация FogEngine и начальной карты
  useEffect(() => {
    const engine = new FogEngine();
    fogEngineRef.current = engine;

    const initMap = async () => {
      try {
        const sample = SAMPLE_MAPS[0];
        const blob = await sample.generateBlob();
        const dataUrl = await new Promise<string>((res) => {
          const r = new FileReader();
          r.onload = () => res(r.result as string);
          r.readAsDataURL(blob);
        });

        const initialLayer: MapLayer = {
          id: `layer_${Date.now()}`,
          name: sample.name,
          url: dataUrl,
          dataUrl,
          x: 0,
          y: 0,
          width: sample.width,
          height: sample.height,
          opacity: 1,
          visible: true,
          zIndex: 1,
          locked: true
        };

        setLayers([initialLayer]);
        setSelectedLayerId(initialLayer.id);

        engine.resize(sample.width, sample.height);
        renderFog();
        fitToScreen(sample.width, sample.height);

        // Сразу отправляем активную карту и маску игрокам
        setTimeout(() => broadcastFullState(), 100);
      } catch (err) {
        console.warn('Ошибка загрузки начальной карты:', err);
      }
    };

    initMap();

    const unsubAudio = audioEngine.subscribe((s) => setAudioState(s));

    return () => {
      engine.destroy();
      unsubAudio();
    };
  }, []);

  // Отрисовка маски тумана на экранном Canvas
  const renderFog = useCallback(() => {
    if (!canvasRef.current || !fogEngineRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    fogEngineRef.current.renderToCanvas(ctx, true, masterFogOpacity, fogStyle);
  }, [masterFogOpacity, fogStyle]);

  useEffect(() => {
    renderFog();
  }, [masterFogOpacity, fogStyle, renderFog]);

  // Синхронизация сетки
  useEffect(() => {
    syncService.send({ type: 'SYNC_GRID', grid });
  }, [grid]);

  // Синхронизация позиции камеры и привязки
  useEffect(() => {
    syncService.send({ type: 'SYNC_VIEWPORT', transform: viewport });
    if (isLinkedCamera) {
      setPlayerViewport(viewport);
      syncService.send({ type: 'SET_PLAYER_VIEWPORT', transform: viewport });
    }
  }, [viewport, isLinkedCamera]);

  // Синхронизация слоев карты
  useEffect(() => {
    syncService.send({ type: 'SYNC_LAYERS', layers });
  }, [layers]);

  // Синхронизация Blackout
  useEffect(() => {
    syncService.send({ type: 'SET_BLACKOUT', theme: blackoutTheme });
  }, [blackoutTheme]);

  // Синхронизация боя
  useEffect(() => {
    syncService.send({ type: 'SYNC_COMBAT', combat });
  }, [combat]);

  // Синхронизация тактических рисунков
  useEffect(() => {
    syncService.send({ type: 'SYNC_DRAWINGS', drawings });
  }, [drawings]);

  // Синхронизация шаблона заклинания
  useEffect(() => {
    syncService.send({ type: 'SYNC_SPELL_TEMPLATE', template: spellTemplate });
  }, [spellTemplate]);

  // Синхронизация линейки
  useEffect(() => {
    syncService.send({ type: 'SYNC_RULER', ruler });
  }, [ruler]);

  // Полная синхронизация при подключении окна проектора и обновление кэша
  const broadcastFullState = useCallback(() => {
    if (!fogEngineRef.current) return;
    const maskDataUrl = fogEngineRef.current.getMaskDataUrl();

    const fullState = {
      hasMedia: layers.length > 0,
      mediaType: 'image' as const,
      mimeType: 'image/png',
      dataUrl: layers[0]?.dataUrl,
      mediaWidth: layers[0]?.width || 1920,
      mediaHeight: layers[0]?.height || 1080,
      mediaName: currentScene.name,
      viewport,
      playerViewport,
      playerScreenSize,
      grid,
      maskDataUrl,
      layers,
      blackoutTheme,
      combat,
      fogStyle
    };

    saveSyncedStateToCache(fullState);

    syncService.send({ type: 'HANDSHAKE_RESPONSE', connected: true });
    syncService.send({
      type: 'SYNC_FULL_STATE',
      state: fullState
    });
  }, [layers, currentScene, viewport, playerViewport, playerScreenSize, grid, blackoutTheme, combat, fogStyle]);

  useEffect(() => {
    const unsub = syncService.subscribe((msg) => {
      if (msg.type === 'HANDSHAKE_REQUEST' || msg.type === 'REQUEST_FULL_STATE') {
        setIsConnectedToPlayer(true);
        broadcastFullState();
      } else if (msg.type === 'PLAYER_WINDOW_RESIZED') {
        setIsConnectedToPlayer(true);
        setPlayerScreenSize({ width: msg.width, height: msg.height });
      }
    });
    return () => unsub();
  }, [broadcastFullState]);

  // Изменение позиции вьюпорта игроков вручную или с рамки
  const handleSetPlayerViewport = useCallback((newVp: ViewportTransform) => {
    setPlayerViewport(newVp);
    syncService.send({ type: 'SET_PLAYER_VIEWPORT', transform: newVp });
  }, []);

  // Вписать всю карту на экран игроков
  const handleFitMapForPlayers = useCallback(() => {
    const mapW = layers[0]?.width || 1920;
    const mapH = layers[0]?.height || 1080;
    const Wp = playerScreenSize.width || 1920;
    const Hp = playerScreenSize.height || 1080;

    const scaleX = Wp / mapW;
    const scaleY = Hp / mapH;
    const scale = Math.min(scaleX, scaleY);

    const x = (Wp - mapW * scale) / 2;
    const y = (Hp - mapH * scale) / 2;

    const newVp = { x, y, scale };
    setPlayerViewport(newVp);
    syncService.send({ type: 'SET_PLAYER_VIEWPORT', transform: newVp });
  }, [layers, playerScreenSize]);

  // Переместить камеру Мастера к центру видимой рамки игроков
  const handleCenterOnPlayerView = useCallback(() => {
    if (!viewportRef.current) return;
    const rect = viewportRef.current.getBoundingClientRect();
    const Wp = playerScreenSize.width || 1920;
    const Hp = playerScreenSize.height || 1080;
    const sp = playerViewport.scale || 1;

    const mapCenterX = -playerViewport.x / sp + (Wp / sp) / 2;
    const mapCenterY = -playerViewport.y / sp + (Hp / sp) / 2;

    const dmScale = viewport.scale || 1;
    const newDmX = rect.width / 2 - mapCenterX * dmScale;
    const newDmY = rect.height / 2 - mapCenterY * dmScale;

    setViewport({ x: newDmX, y: newDmY, scale: dmScale });
  }, [playerScreenSize, playerViewport, viewport]);

  // Привязать вид игроков к текущему виду Мастера
  const handleCenterPlayerOnDmView = useCallback(() => {
    if (!viewportRef.current) return;
    const rect = viewportRef.current.getBoundingClientRect();
    const Wp = playerScreenSize.width || 1920;
    const Hp = playerScreenSize.height || 1080;
    const dmScale = viewport.scale || 1;

    const mapCenterX = -viewport.x / dmScale + (rect.width / dmScale) / 2;
    const mapCenterY = -viewport.y / dmScale + (rect.height / dmScale) / 2;

    const sp = playerViewport.scale || dmScale;
    const newPx = Wp / 2 - mapCenterX * sp;
    const newPy = Hp / 2 - mapCenterY * sp;

    const newVp = { x: newPx, y: newPy, scale: sp };
    setPlayerViewport(newVp);
    syncService.send({ type: 'SET_PLAYER_VIEWPORT', transform: newVp });
  }, [viewport, playerScreenSize, playerViewport]);

  // Вписать карту в экран
  const fitToScreen = useCallback((w?: number, h?: number) => {
    if (!viewportRef.current) return;
    const rect = viewportRef.current.getBoundingClientRect();
    const mapW = w || layers[0]?.width || 1920;
    const mapH = h || layers[0]?.height || 1080;

    const scaleX = rect.width / mapW;
    const scaleY = rect.height / mapH;
    const scale = Math.min(scaleX, scaleY) * 0.9;

    const x = (rect.width - mapW * scale) / 2;
    const y = (rect.height - mapH * scale) / 2;

    setViewport({ x, y, scale });
  }, [layers]);

  // Преобразование координат мыши в пиксельные координаты карты
  const getMapCoordinates = (e: React.MouseEvent | MouseEvent): StrokePoint => {
    if (!viewportRef.current) return { x: 0, y: 0 };
    const rect = viewportRef.current.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;

    return {
      x: (screenX - viewport.x) / viewport.scale,
      y: (screenY - viewport.y) / viewport.scale
    };
  };

  // 2. ОБРАБОТЧИКИ СОБЫТИЙ МЫШИ НА ХОЛСТЕ
  const handleMouseDown = (e: React.MouseEvent) => {
    // Средняя кнопка мыши или пробел — всегда панорамирование
    if (e.button === 1 || e.spaceKey || tool === 'pan') {
      isInteractingRef.current = true;
      panStartRef.current = { x: e.clientX - viewport.x, y: e.clientY - viewport.y };
      return;
    }

    if (e.button !== 0) return;

    const pt = getMapCoordinates(e);

    // 1. Выделение и перемещение слоев
    if (tool === 'select') {
      if (selectedLayerId) {
        const layer = layers.find((l) => l.id === selectedLayerId);
        if (layer && !layer.locked) {
          isDraggingLayerRef.current = true;
          layerDragStartRef.current = {
            x: pt.x,
            y: pt.y,
            layerX: layer.x,
            layerY: layer.y
          };
        }
      }
      return;
    }

    // 2. Пинг внимания
    if (tool === 'ping') {
      const newPing: MapPing = {
        id: `ping_${Date.now()}`,
        x: pt.x,
        y: pt.y,
        color: '#F27D26',
        createdAt: Date.now()
      };
      setPings((prev) => [...prev, newPing]);
      syncService.send({ type: 'ADD_PING', ping: newPing });
      audioEngine.playSFX('dice');

      setTimeout(() => {
        setPings((prev) => prev.filter((p) => p.id !== newPing.id));
      }, 4000);
      return;
    }

    // 3. Линейка-дальномер
    if (tool === 'ruler') {
      isInteractingRef.current = true;
      setRuler({
        startX: pt.x,
        startY: pt.y,
        currentX: pt.x,
        currentY: pt.y,
        distanceFeet: 0,
        distanceMeters: 0,
        distanceCells: 0,
        mode: '5e_euclidean'
      });
      return;
    }

    // 4. Шаблоны заклинаний (Spell AoE)
    if (tool === 'spell_template') {
      if (!spellTemplate) {
        setSpellTemplate({
          shape: 'sphere',
          sizeFeet: 20,
          originX: pt.x,
          originY: pt.y,
          angleDeg: 0,
          color: 'rgba(242, 125, 38, 0.4)'
        });
      } else {
        setSpellTemplate({
          ...spellTemplate,
          originX: pt.x,
          originY: pt.y
        });
      }
      return;
    }

    // 5. Тактическое рисование
    if (tool === 'draw') {
      isInteractingRef.current = true;
      const newDrawing: TacticalDrawing = {
        id: `draw_${Date.now()}`,
        type: 'freehand',
        color: '#F27D26',
        width: 4,
        points: [pt],
        opacity: 0.9
      };
      setActiveDrawing(newDrawing);
      return;
    }

    // 6. Туман войны (Reveal / Hide)
    if (tool === 'reveal' || tool === 'hide') {
      isInteractingRef.current = true;
      strokeBufferRef.current = [pt];

      if (fogEngineRef.current) {
        fogEngineRef.current.applyStroke({
          mode: tool,
          shape: brushShape,
          radius: brushRadius,
          points: [pt]
        });
        renderFog();
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const pt = getMapCoordinates(e);

    // Панорамирование
    if (isInteractingRef.current && (tool === 'pan' || e.buttons === 4)) {
      setViewport((prev) => ({
        ...prev,
        x: e.clientX - panStartRef.current.x,
        y: e.clientY - panStartRef.current.y
      }));
      return;
    }

    // Перемещение слоя
    if (isDraggingLayerRef.current && selectedLayerId) {
      let nextX = layerDragStartRef.current.layerX + (pt.x - layerDragStartRef.current.x);
      let nextY = layerDragStartRef.current.layerY + (pt.y - layerDragStartRef.current.y);

      // Snap-to-Grid при включенной сетке
      if (grid.enabled && grid.snapToGrid && grid.size > 0) {
        const offX = grid.offsetX || 0;
        const offY = grid.offsetY || 0;
        nextX = Math.round((nextX - offX) / grid.size) * grid.size + offX;
        nextY = Math.round((nextY - offY) / grid.size) * grid.size + offY;
      }

      setLayers((prev) =>
        prev.map((l) =>
          l.id === selectedLayerId
            ? { ...l, x: nextX, y: nextY }
            : l
        )
      );
      return;
    }

    // Лазерная указка
    if (tool === 'laser') {
      const now = Date.now();
      if (now - lastLaserTimeRef.current > 20) {
        lastLaserTimeRef.current = now;
        const newPoint: LaserPoint = { x: pt.x, y: pt.y, timestamp: now };
        setLaserPoints((prev) => [...prev.slice(-35), newPoint]);
        syncService.send({ type: 'LASER_STREAM', point: newPoint });
      }
      return;
    }

    // Линейка
    if (isInteractingRef.current && tool === 'ruler' && ruler) {
      const dx = pt.x - ruler.startX;
      const dy = pt.y - ruler.startY;
      const distPx = Math.sqrt(dx * dx + dy * dy);
      const cells = distPx / (grid.size || 50);
      const feet = cells * 5;

      setRuler({
        ...ruler,
        currentX: pt.x,
        currentY: pt.y,
        distanceFeet: feet,
        distanceMeters: feet * 0.3,
        distanceCells: cells
      });
      return;
    }

    // Вращение / перемещение шаблона заклинания
    if (tool === 'spell_template' && spellTemplate) {
      const dx = pt.x - spellTemplate.originX;
      const dy = pt.y - spellTemplate.originY;
      const angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI;

      setSpellTemplate({
        ...spellTemplate,
        angleDeg
      });
      return;
    }

    // Рисование
    if (isInteractingRef.current && tool === 'draw' && activeDrawing) {
      setActiveDrawing({
        ...activeDrawing,
        points: [...activeDrawing.points, pt]
      });
      return;
    }

    // Туман войны
    if (isInteractingRef.current && (tool === 'reveal' || tool === 'hide') && fogEngineRef.current) {
      strokeBufferRef.current.push(pt);
      fogEngineRef.current.applyStroke({
        mode: tool,
        shape: brushShape,
        radius: brushRadius,
        points: [pt]
      });
      renderFog();
    }
  };

  const handleMouseUp = () => {
    if (isDraggingLayerRef.current) {
      isDraggingLayerRef.current = false;
    }

    if (isInteractingRef.current) {
      isInteractingRef.current = false;

      // Завершение штриха тумана войны -> синхронизация с проектором
      if ((tool === 'reveal' || tool === 'hide') && strokeBufferRef.current.length > 0) {
        syncService.send({
          type: 'DRAW_STROKE',
          payload: {
            mode: tool,
            shape: brushShape,
            radius: brushRadius,
            points: strokeBufferRef.current
          }
        });
        strokeBufferRef.current = [];
      }

      // Сохранение рисунка
      if (tool === 'draw' && activeDrawing) {
        setDrawings((prev) => [...prev, activeDrawing]);
        setActiveDrawing(null);
      }
    }
  };

  // Зум колесиком мыши к курсору
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (!viewportRef.current) return;

    const rect = viewportRef.current.getBoundingClientRect();
    const cursorX = e.clientX - rect.left;
    const cursorY = e.clientY - rect.top;

    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;
    const newScale = Math.min(Math.max(viewport.scale * zoomFactor, 0.05), 6.0);

    const newX = cursorX - (cursorX - viewport.x) * (newScale / viewport.scale);
    const newY = cursorY - (cursorY - viewport.y) * (newScale / viewport.scale);

    setViewport({ x: newX, y: newY, scale: newScale });
  };

  // 3. ДЕЙСТВИЯ С ТУМАНОМ ВОЙНЫ
  const handleRevealAllFog = () => {
    if (!fogEngineRef.current) return;
    fogEngineRef.current.clearAll();
    renderFog();
    syncService.send({ type: 'CLEAR_FOG' });
  };

  const handleHideAllFog = () => {
    if (!fogEngineRef.current) return;
    fogEngineRef.current.fillAll();
    renderFog();
    syncService.send({ type: 'FILL_FOG' });
  };

  const handleInvertFog = () => {
    if (!fogEngineRef.current) return;
    fogEngineRef.current.invert();
    renderFog();
    syncService.send({ type: 'INVERT_FOG' });
  };

  // 4. СЛОИ КАРТЫ
  const handleAddImageLayer = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const newLayer: MapLayer = {
          id: `layer_${Date.now()}`,
          name: file.name.replace(/\.[^/.]+$/, ''),
          url: dataUrl,
          dataUrl,
          x: 0,
          y: 0,
          width: img.naturalWidth,
          height: img.naturalHeight,
          opacity: 1,
          visible: true,
          zIndex: layers.length + 1,
          locked: false
        };

        setLayers((prev) => [...prev, newLayer]);
        setSelectedLayerId(newLayer.id);

        if (layers.length === 0 && fogEngineRef.current && canvasRef.current) {
          fogEngineRef.current.resize(img.naturalWidth, img.naturalHeight);
          canvasRef.current.width = img.naturalWidth;
          canvasRef.current.height = img.naturalHeight;
          renderFog();
          fitToScreen(img.naturalWidth, img.naturalHeight);
        }
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLayer = (id: string) => {
    setLayers((prev) => prev.filter((l) => l.id !== id));
    if (selectedLayerId === id) setSelectedLayerId(null);
  };

  const handleToggleLayerLock = (id: string) => {
    setLayers((prev) =>
      prev.map((l) => (l.id === id ? { ...l, locked: !l.locked } : l))
    );
  };

  const handleToggleLayerVisibility = (id: string) => {
    setLayers((prev) =>
      prev.map((l) => (l.id === id ? { ...l, visible: !l.visible } : l))
    );
  };

  // 5. УПРАВЛЕНИЕ СЦЕНАМИ КАМПАНИИ
  const handleSwitchScene = (scene: Scene) => {
    setCurrentScene(scene);
    setLayers(scene.layers || []);
    setGrid(scene.grid || { enabled: false, size: 50, color: 'rgba(255,255,255,0.3)', opacity: 0.5, type: 'square' });
    setDrawings(scene.drawings || []);

    // Кинематографичный переход для игроков
    syncService.send({ type: 'SWITCH_SCENE_CINEMATIC', sceneName: scene.name });

    if (scene.layers && scene.layers.length > 0 && fogEngineRef.current && canvasRef.current) {
      const baseL = scene.layers[0];
      fogEngineRef.current.resize(baseL.width, baseL.height);
      if (scene.maskDataUrl) {
        fogEngineRef.current.loadFromDataUrl(scene.maskDataUrl).then(() => {
          renderFog();
        });
      } else {
        fogEngineRef.current.clearAll();
        renderFog();
      }
      canvasRef.current.width = baseL.width;
      canvasRef.current.height = baseL.height;
      fitToScreen(baseL.width, baseL.height);
    }
  };

  const handleAddNewScene = (newScene?: Scene) => {
    const sceneToUse =
      newScene ||
      {
        id: `scene_${Date.now()}`,
        name: `Scene #${allScenes.length + 1}`,
        grid: {
          enabled: true,
          size: 60,
          color: 'rgba(255, 255, 255, 0.25)',
          opacity: 0.5,
          type: 'square',
          offsetX: 0,
          offsetY: 0
        },
        layers: [],
        drawings: [],
        portals: []
      };

    setAllScenes((prev) => [...prev, sceneToUse]);
    handleSwitchScene(sceneToUse);
  };

  // 6. ОТКРЫТИЕ ОКНА ПРОЕКТОРА
  const handleOpenPlayerWindow = () => {
    const url = `${window.location.origin}${window.location.pathname}?mode=player`;
    const newWin = window.open(url, '_blank');
    if (!newWin) {
      alert('Всплывающее окно заблокировано браузером. Разрешите всплывающие окна для работы со вторым экраном.');
    }
  };

  // 7. СВЯЗКА СРД С БОЕВЫМ ТРЕКЕРОМ И ШАБЛОНАМИ
  const handleAddMonsterFromSRD = (monster: SRDMonster) => {
    const dexMod = Math.floor((monster.stats.dex - 10) / 2);
    const initRoll = Math.floor(Math.random() * 20) + 1 + dexMod;

    const newCombatant = {
      id: `comb_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      name: monster.name,
      type: 'monster' as const,
      initiative: initRoll,
      dexModifier: dexMod,
      hpCurrent: monster.hp,
      hpMax: monster.hp,
      tempHp: 0,
      ac: monster.ac,
      speed: parseInt(monster.speed, 10) || 30,
      passivePerception: 10 + Math.floor((monster.stats.wis - 10) / 2),
      conditions: []
    };

    setCombat((prev) => ({
      ...prev,
      combatants: [...prev.combatants, newCombatant]
    }));

    setIsCombatOpen(true);
    audioEngine.playSFX('roar');
  };

  const handleApplySpellTemplateFromSRD = (spell: SRDSpell) => {
    setTool('spell_template');
    const shape = spell.aoe?.includes('cone')
      ? 'cone'
      : spell.aoe?.includes('line')
      ? 'line'
      : spell.aoe?.includes('cube')
      ? 'cube'
      : 'sphere';

    setSpellTemplate({
      shape,
      sizeFeet: 20,
      originX: layers[0]?.width ? layers[0].width / 2 : 500,
      originY: layers[0]?.height ? layers[0].height / 2 : 500,
      angleDeg: 0,
      color: 'rgba(242, 125, 38, 0.4)'
    });
    audioEngine.playSFX('fireball');
  };

  const handleBroadcastReadAloud = (title: string, text: string) => {
    syncService.send({ type: 'READ_ALOUD', title, text });
    audioEngine.playSFX('victory');
  };

  const handleBroadcastDiceRoll = (roll: DiceRollResult) => {
    syncService.send({ type: 'DICE_ROLL', roll });
  };

  const handleBroadcastHandoutCard = (card: HandoutCardPayload) => {
    syncService.send({ type: 'SHOW_HANDOUT_CARD', card });
    audioEngine.playSFX('lightning');
  };

  const handleAddGeneratedMonsterToCombat = (monster: Partial<Combatant>) => {
    const newCombatant: Combatant = {
      id: `combat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: monster.name || 'Сгенерированный Монстр',
      type: monster.type || 'monster',
      initiative: Math.floor(Math.random() * 20) + 1,
      dexModifier: monster.dexModifier || 0,
      hpCurrent: monster.hpCurrent || 30,
      hpMax: monster.hpMax || monster.hpCurrent || 30,
      tempHp: 0,
      ac: monster.ac || 14,
      speed: monster.speed || 30,
      passivePerception: monster.passivePerception || 12,
      conditions: []
    };

    setCombat((prev) => ({
      ...prev,
      combatants: [...prev.combatants, newCombatant]
    }));

    setIsCombatOpen(true);
    audioEngine.playSFX('roar');
  };

  const firstLayer = layers[0];
  const mapWidth = firstLayer?.width || 1920;
  const mapHeight = firstLayer?.height || 1080;

  return (
    <div className="w-screen h-screen bg-[#0A0A0A] overflow-hidden flex flex-col select-none relative font-mono text-[#E0E0E0]">
      {/* 1. ВЕРХНЯЯ ПАНЕЛЬ МАСТЕРА */}
      <DMHeader
        currentScene={currentScene}
        allScenes={allScenes}
        onSwitchScene={handleSwitchScene}
        onAddNewScene={() => handleAddNewScene()}
        blackoutTheme={blackoutTheme}
        onSetBlackout={setBlackoutTheme}
        onOpenPlayerWindow={handleOpenPlayerWindow}
        combat={combat}
        onToggleCombat={() => setIsCombatOpen(!isCombatOpen)}
        isCombatOpen={isCombatOpen}
        onToggleAudio={() => setIsAudioOpen(!isAudioOpen)}
        isAudioOpen={isAudioOpen}
        onToggleSRD={() => setIsSRDOpen(!isSRDOpen)}
        isSRDOpen={isSRDOpen}
        onToggleNotes={() => setIsNotesOpen(!isNotesOpen)}
        isNotesOpen={isNotesOpen}
        onOpenVaultModal={() => setIsVaultModalOpen(true)}
        onOpenDiceModal={() => setIsDiceModalOpen(true)}
        onOpenGeneratorStudio={() => setIsGeneratorStudioOpen(true)}
        audioState={audioState}
      />

      {/* 2. БОКОВАЯ ПАНЕЛЬ ИНСТРУМЕНТОВ (PHOTOSHOP-STYLE TOOLBAR) */}
      <DMToolbar
        currentTool={tool}
        onSelectTool={setTool}
        brushRadius={brushRadius}
        onBrushRadiusChange={setBrushRadius}
        brushShape={brushShape}
        onBrushShapeChange={setBrushShape}
        fogStyle={fogStyle}
        onFogStyleChange={setFogStyle}
        onRevealAllFog={handleRevealAllFog}
        onHideAllFog={handleHideAllFog}
        onInvertFog={handleInvertFog}
        grid={grid}
        onUpdateGrid={(g) => setGrid({ ...grid, ...g })}
        layers={layers}
        selectedLayerId={selectedLayerId}
        onSelectLayer={setSelectedLayerId}
        onAddLayer={handleAddImageLayer}
        onRemoveLayer={handleRemoveLayer}
        onToggleLayerLock={handleToggleLayerLock}
        onToggleLayerVisibility={handleToggleLayerVisibility}
        spellTemplate={spellTemplate}
        onUpdateSpellTemplate={(t) => setSpellTemplate(spellTemplate ? { ...spellTemplate, ...t } : null)}
        onClearDrawings={() => setDrawings([])}
      />

      {/* 3. ОСНОВНОЙ ВЬЮПОРТ ХОЛСТА (CANVAS STAGE) */}
      <main
        ref={viewportRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        className={`flex-1 relative overflow-hidden bg-[#0A0A0A] ${
          tool === 'pan' ? 'cursor-grab active:cursor-grabbing' : 'cursor-crosshair'
        }`}
      >
        {/* Контейнер трансформации (Панорамирование & Зум с GPU-ускорением) */}
        <div
          className="absolute top-0 left-0 origin-top-left will-change-transform"
          style={{
            transform: `translate3d(${viewport.x}px, ${viewport.y}px, 0px) scale(${viewport.scale})`,
            width: `${mapWidth}px`,
            height: `${mapHeight}px`
          }}
        >
          {/* А. Слои карты */}
          {layers.map((layer) => {
            if (!layer.visible) return null;
            const isSelected = selectedLayerId === layer.id;
            const isVideo =
              layer.type === 'video' ||
              layer.url?.startsWith('data:video') ||
              layer.url?.endsWith('.mp4') ||
              layer.url?.endsWith('.webm');

            return (
              <div
                key={layer.id}
                className={`absolute ${isSelected ? 'ring-2 ring-[#F27D26]' : ''}`}
                style={{
                  left: `${layer.x}px`,
                  top: `${layer.y}px`,
                  width: `${layer.width}px`,
                  height: `${layer.height}px`,
                  opacity: layer.opacity,
                  zIndex: layer.zIndex
                }}
              >
                {isVideo ? (
                  <video
                    src={layer.dataUrl || layer.url}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-fill pointer-events-none"
                  />
                ) : (
                  <img
                    src={layer.dataUrl || layer.url}
                    alt={layer.name}
                    className="w-full h-full object-fill pointer-events-none"
                    draggable={false}
                  />
                )}

                {layer.category === 'gm_only' && (
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-red-950/80 border border-red-500 text-[10px] text-red-200 font-mono font-bold tracking-wider pointer-events-none z-30">
                    GM ONLY (HIDDEN FROM PLAYERS)
                  </div>
                )}
              </div>
            );
          })}

          {/* Б. Тактическая сетка (Square / Hex) */}
          <GridOverlay grid={grid} width={mapWidth} height={mapHeight} />

          {/* В. Интерактивные порталы перехода локаций (Submap Portals) */}
          {currentScene.portals &&
            currentScene.portals.map((portal) => {
              const px = portal.x ?? 100;
              const py = portal.y ?? 100;
              const targetScene = allScenes.find((s) => s.id === portal.targetSceneId);

              return (
                <div
                  key={portal.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (targetScene) handleSwitchScene(targetScene);
                  }}
                  className="absolute z-30 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#151619]/95 border border-[#F27D26] text-white shadow-xl cursor-pointer hover:scale-110 active:scale-95 transition-transform"
                  style={{ left: `${px}px`, top: `${py}px` }}
                  title={`Перейти на сцену: ${targetScene ? targetScene.name : 'Не указана'}`}
                >
                  <span className="text-sm">🚪</span>
                  <span className="text-xs font-bold text-[#F27D26]">{portal.name}</span>
                </div>
              );
            })}

          {/* Г. Холст Тумана Войны */}
          <canvas
            ref={canvasRef}
            width={mapWidth}
            height={mapHeight}
            className="absolute top-0 left-0 pointer-events-none z-20"
          />

          {/* Д. Оверлей тактического рисования, заклинаний и линейки */}
          <TacticalDrawingOverlay
            width={mapWidth}
            height={mapHeight}
            drawings={drawings}
            activeDrawing={activeDrawing}
            spellTemplate={spellTemplate}
            ruler={ruler}
            gridSize={grid.size}
          />

          {/* Е. Маркеры внимания и лазерная указка */}
          <PingOverlay pings={pings} laserPoints={laserPoints} />

          {/* Ж. РАМКА ВЬЮПОРТА ИГРОКОВ (PLAYER VIEWPORT FRAME OVERLAY) */}
          <PlayerViewportFrameOverlay
            playerViewport={playerViewport}
            dmViewport={viewport}
            playerScreenSize={playerScreenSize}
            isLinkedCamera={isLinkedCamera}
            isConnected={isConnectedToPlayer}
            mapWidth={mapWidth}
            mapHeight={mapHeight}
            onToggleLinkCamera={() => setIsLinkedCamera(!isLinkedCamera)}
            onSetPlayerViewport={handleSetPlayerViewport}
            onCenterOnPlayerView={handleCenterOnPlayerView}
            onCenterPlayerOnDmView={handleCenterPlayerOnDmView}
            onFitMapForPlayers={handleFitMapForPlayers}
          />
        </div>

        {/* ПАНЕЛЬ БЫСТРОГО УПРАВЛЕНИЯ ЭКРАНОМ ИГРОКОВ (PLAYER VIEWPORT QUICK BAR) */}
        <div className="absolute top-4 right-4 z-40 flex items-center gap-2 bg-[#151619]/90 backdrop-blur-md border border-[#2A2B30] p-1.5 rounded-xl shadow-2xl font-mono text-xs">
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-[#0B0C0E] border border-[#22242A]">
            <span className={`w-2 h-2 rounded-full ${isConnectedToPlayer ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            <Tv size={14} className="text-[#F27D26]" />
            <span className="font-bold text-white text-[11px]">
              {isConnectedToPlayer ? `ИГРОКИ [${playerScreenSize.width}x${playerScreenSize.height}]` : 'ЭКРАН ИГРОКОВ'}
            </span>
          </div>

          <button
            onClick={() => setIsLinkedCamera(!isLinkedCamera)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold transition active:scale-95 ${
              isLinkedCamera
                ? 'bg-[#F27D26] text-white shadow-md'
                : 'bg-[#1F2024] text-[#A0A5B1] hover:text-white hover:bg-[#2A2B30]'
            }`}
            title={isLinkedCamera ? 'Камера игроков привязана к виду Мастера' : 'Камера игроков автономна'}
          >
            {isLinkedCamera ? <Lock size={13} /> : <Unlock size={13} />}
            <span>{isLinkedCamera ? 'СВЯЗЬ ВКЛ' : 'АВТОНОМНО'}</span>
          </button>

          <button
            onClick={handleCenterPlayerOnDmView}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#1F2024] hover:bg-[#2A2B30] text-[#D0D4DC] hover:text-white transition active:scale-95"
            title="Отправить текущий вид Мастера Игрокам"
          >
            <Crosshair size={13} className="text-[#F27D26]" />
            <span>Мой вид -&gt; Игрокам</span>
          </button>

          <button
            onClick={handleCenterOnPlayerView}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#1F2024] hover:bg-[#2A2B30] text-[#D0D4DC] hover:text-white transition active:scale-95"
            title="Переместить камеру Мастера к рамке Игроков"
          >
            <Tv size={13} className="text-[#38BDF8]" />
            <span>Найти рамку</span>
          </button>

          <button
            onClick={handleFitMapForPlayers}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#1F2024] hover:bg-[#2A2B30] text-[#D0D4DC] hover:text-white transition active:scale-95"
            title="Масштабировать карту ровно под весь экран игроков"
          >
            <Maximize2 size={13} className="text-emerald-400" />
            <span>Вписать карту</span>
          </button>
        </div>
      </main>

      {/* 4. ВЫДВИЖНЫЕ ПАНЕЛИ МАСТЕРА */}
      <CombatTrackerDrawer
        combat={combat}
        onChangeCombat={setCombat}
        isOpen={isCombatOpen}
        onClose={() => setIsCombatOpen(false)}
      />

      <AudioSoundboardDrawer
        isOpen={isAudioOpen}
        onClose={() => setIsAudioOpen(false)}
      />

      <SRDReferenceDrawer
        isOpen={isSRDOpen}
        onClose={() => setIsSRDOpen(false)}
        onAddMonsterToCombat={handleAddMonsterFromSRD}
        onApplySpellTemplate={handleApplySpellTemplateFromSRD}
      />

      <SceneNotesDrawer
        scene={currentScene}
        isOpen={isNotesOpen}
        onClose={() => setIsNotesOpen(false)}
        onUpdateScene={(up) => {
          const updated = { ...currentScene, ...up };
          setCurrentScene(updated);
          setAllScenes((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
        }}
        onBroadcastReadAloud={handleBroadcastReadAloud}
        allScenes={allScenes}
        onNavigateToPortalScene={(targetId) => {
          const target = allScenes.find((s) => s.id === targetId);
          if (target) handleSwitchScene(target);
        }}
      />

      {/* 5. МОДАЛЬНЫЕ ОКНА */}
      <MapVaultModal
        isOpen={isVaultModalOpen}
        onClose={() => setIsVaultModalOpen(false)}
        currentScene={currentScene}
        onSwitchScene={handleSwitchScene}
        onAddNewScene={handleAddNewScene}
        onAddLayerToCurrentScene={(layer) => {
          setLayers((prev) => [...prev, layer]);
          setSelectedLayerId(layer.id);
        }}
        allScenes={allScenes}
        onImportCampaign={(imported) => {
          setAllScenes(imported);
          if (imported.length > 0) handleSwitchScene(imported[0]);
        }}
      />

      <DiceRollerModal
        isOpen={isDiceModalOpen}
        onClose={() => setIsDiceModalOpen(false)}
        onBroadcastRoll={handleBroadcastDiceRoll}
      />

      <RandomGeneratorStudioModal
        isOpen={isGeneratorStudioOpen}
        onClose={() => setIsGeneratorStudioOpen(false)}
        onBroadcastCard={handleBroadcastHandoutCard}
        onAddMonsterToCombat={handleAddGeneratedMonsterToCombat}
        onAppendSceneNotes={(text) => {
          const updated = {
            ...currentScene,
            notes: (currentScene.notes || '') + text
          };
          setCurrentScene(updated);
          setAllScenes((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
          setIsNotesOpen(true);
        }}
        onApplySpellTemplate={(template) => {
          setTool('spell_template');
          setSpellTemplate({
            shape: template.type as any,
            sizeFeet: template.radiusFt || template.lengthFt || 20,
            originX: layers[0]?.width ? layers[0].width / 2 : 500,
            originY: layers[0]?.height ? layers[0].height / 2 : 500,
            angleDeg: template.angleDeg || 0,
            color: template.color || 'rgba(242, 125, 38, 0.4)'
          });
          setIsGeneratorStudioOpen(false);
          audioEngine.playSFX('fireball');
        }}
      />
    </div>
  );
};
