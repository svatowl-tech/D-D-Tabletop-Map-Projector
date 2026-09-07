/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Окно отображения для игроков / проектора (Player / Projector View).
 * 
 * Особенности:
 * - 100% чистый полноэкранный вьюпорт без интерфейсных элементов мастера.
 * - Непроницаемый туман войны с поддержкой стилей (Classic Black, Mist, Toxic, Crypt).
 * - Оверлеи: тактическая сетка, тактическое рисование, шаблоны заклинаний, линейка.
 * - Лазерная указка и пинги внимания мастера в реальном времени.
 * - Индикатор очереди ходов (Player Initiative HUD).
 * - Режимы затемнения стола (Blackout: Campfire, Mist, Stars, Darkness).
 * - Всплывающие броски кубиков и художественный текст (Read-Aloud).
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  MapLayer,
  ViewportTransform,
  GridConfig,
  MapPing,
  LaserPoint,
  TacticalDrawing,
  SpellTemplate,
  RulerMeasurement,
  BlackoutTheme,
  CombatTrackerState,
  DiceRollResult,
  FogTextureStyle,
  BroadcastMessage,
  ElementalHazardZone
} from '../types';
import { GridOverlay } from './GridOverlay';
import { PingOverlay } from './PingOverlay';
import { TacticalDrawingOverlay } from './TacticalDrawingOverlay';
import { ElementalHazardOverlay } from './ElementalHazardOverlay';
import { PlayerInitiativeHUD } from './PlayerInitiativeHUD';
import { PlayerBlackoutOverlay } from './PlayerBlackoutOverlay';
import { PlayerDiceOverlay } from './PlayerDiceOverlay';
import { PlayerHandoutCardOverlay } from './PlayerHandoutCardOverlay';
import { HandoutCardPayload } from '../types/generator';
import { syncService } from '../services/syncChannel';
import { loadSyncedStateFromCache } from '../services/syncedStateCache';
import { Maximize2, Minimize2, Radio, RefreshCw } from 'lucide-react';
import {
  toggleAppFullscreen,
  isElementFullscreen,
  addFullscreenChangeListener
} from '../utils/macOSCompatibility';

export const PlayerView: React.FC = () => {
  const [layers, setLayers] = useState<MapLayer[]>([]);
  const [viewport, setViewport] = useState<ViewportTransform>({ x: 0, y: 0, scale: 1 });
  const [grid, setGrid] = useState<GridConfig>({
    enabled: false,
    size: 50,
    color: 'rgba(255, 255, 255, 0.25)',
    opacity: 0.5,
    type: 'square',
    offsetX: 0,
    offsetY: 0
  });

  const [pings, setPings] = useState<MapPing[]>([]);
  const [laserPoints, setLaserPoints] = useState<LaserPoint[]>([]);
  const [drawings, setDrawings] = useState<TacticalDrawing[]>([]);
  const [hazards, setHazards] = useState<ElementalHazardZone[]>([]);
  const [spellTemplate, setSpellTemplate] = useState<SpellTemplate | null>(null);
  const [ruler, setRuler] = useState<RulerMeasurement | null>(null);
  const [blackoutTheme, setBlackoutTheme] = useState<BlackoutTheme>('none');
  const [fogStyle, setFogStyle] = useState<FogTextureStyle>('classic_black');

  const [combat, setCombat] = useState<CombatTrackerState>({
    isActive: false,
    round: 1,
    currentTurnIndex: 0,
    combatants: []
  });

  const [lastDiceRoll, setLastDiceRoll] = useState<DiceRollResult | null>(null);
  const [readAloud, setReadAloud] = useState<{ title: string; text: string } | null>(null);
  const [handoutCard, setHandoutCard] = useState<HandoutCardPayload | null>(null);

  const [isConnectedToDm, setIsConnectedToDm] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showControls, setShowControls] = useState<boolean>(false);

  const [sceneTransition, setSceneTransition] = useState<string | null>(null);
  const [hudPosition, setHudPosition] = useState<'top' | 'bottom' | 'left' | 'right'>('top');

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fogCtxRef = useRef<CanvasRenderingContext2D | null>(null);
  const hideControlsTimerRef = useRef<any>(null);

  // Инициализация холста тумана для игроков
  const initFogCanvas = (width: number, height: number) => {
    if (!canvasRef.current) return;
    canvasRef.current.width = width;
    canvasRef.current.height = height;

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    fogCtxRef.current = ctx;

    // Изначально туман выключен (карта открыта)
    ctx.clearRect(0, 0, width, height);
  };

  // Приседание маски тумана
  const applyMaskFromDataUrl = (maskDataUrl: string) => {
    if (!maskDataUrl || !canvasRef.current || !fogCtxRef.current) return;
    const img = new Image();
    img.onload = () => {
      if (canvasRef.current && fogCtxRef.current) {
        fogCtxRef.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        fogCtxRef.current.globalAlpha = 1.0;
        fogCtxRef.current.globalCompositeOperation = 'source-over';
        fogCtxRef.current.drawImage(img, 0, 0);
      }
    };
    img.src = maskDataUrl;
  };

  // 1. Отправка размеров экрана Игроков Мастеру
  const reportScreenSizeToDm = () => {
    syncService.send({
      type: 'PLAYER_WINDOW_RESIZED',
      width: window.innerWidth,
      height: window.innerHeight
    });
  };

  // 2. Восстановление состояния из кэша при первом рендере
  useEffect(() => {
    initFogCanvas(1920, 1080);

    const cached = loadSyncedStateFromCache();
    if (cached) {
      if (cached.layers && cached.layers.length > 0) setLayers(cached.layers);
      if (cached.playerViewport) setViewport(cached.playerViewport);
      else if (cached.viewport) setViewport(cached.viewport);
      if (cached.grid) setGrid(cached.grid);
      if (cached.blackoutTheme) setBlackoutTheme(cached.blackoutTheme);
      if (cached.combat) setCombat(cached.combat);
      if (cached.fogStyle) setFogStyle(cached.fogStyle);

      if (cached.layers && cached.layers[0]) {
        initFogCanvas(cached.layers[0].width, cached.layers[0].height);
      }
      if (cached.maskDataUrl) {
        setTimeout(() => applyMaskFromDataUrl(cached.maskDataUrl!), 50);
      }
    }

    reportScreenSizeToDm();
    if (typeof window !== 'undefined' && window.opener && !window.opener.closed) {
      syncService.registerTargetWindow(window.opener);
    }
    window.addEventListener('resize', reportScreenSizeToDm);
    return () => window.removeEventListener('resize', reportScreenSizeToDm);
  }, []);

  // 3. Подписка на сообщения канала синхронизации
  useEffect(() => {
    const unsubscribe = syncService.subscribe((message: BroadcastMessage) => {
      setIsConnectedToDm(true);

      switch (message.type) {
        case 'HANDSHAKE_RESPONSE':
          setIsConnectedToDm(true);
          reportScreenSizeToDm();
          break;

        case 'SWITCH_SCENE_CINEMATIC':
          if (message.sceneName) {
            setSceneTransition(message.sceneName);
            setTimeout(() => setSceneTransition(null), 3200);
          }
          break;

        case 'SYNC_FULL_STATE':
          if (message.state) {
            const s = message.state;
            if (s.layers && s.layers.length > 0) setLayers(s.layers);
            if (s.playerViewport) setViewport(s.playerViewport);
            else if (s.viewport) setViewport(s.viewport);
            if (s.grid) setGrid(s.grid);
            if (s.blackoutTheme) setBlackoutTheme(s.blackoutTheme);
            if (s.combat) setCombat(s.combat);
            if (s.fogStyle) setFogStyle(s.fogStyle);
            if (s.drawings) setDrawings(s.drawings);
            if (s.hazards) setHazards(s.hazards);
            if (s.spellTemplate !== undefined) setSpellTemplate(s.spellTemplate);

            if (s.layers && s.layers[0]) {
              initFogCanvas(s.layers[0].width, s.layers[0].height);
            }
            if (s.maskDataUrl) {
              setTimeout(() => applyMaskFromDataUrl(s.maskDataUrl!), 50);
            }
          }
          break;

        case 'SYNC_LAYERS':
          if (message.layers && message.layers.length > 0) {
            setLayers(message.layers);
            if (message.layers[0]) {
              initFogCanvas(message.layers[0].width, message.layers[0].height);
            }
          }
          break;

        case 'SET_PLAYER_VIEWPORT':
          if (message.transform) {
            setViewport(message.transform);
          }
          break;

        case 'SYNC_VIEWPORT':
          // Личный вьюпорт Мастера не влияет на экран игроков (автономность камеры игроков)
          break;

        case 'SYNC_GRID':
          setGrid(message.grid);
          break;

        case 'DRAW_STROKE':
          if (fogCtxRef.current && canvasRef.current) {
            const { mode, shape, radius, points, rect } = message.payload;
            fogCtxRef.current.save();

            if (mode === 'reveal') {
              fogCtxRef.current.globalCompositeOperation = 'destination-out';
              fogCtxRef.current.fillStyle = 'rgba(0,0,0,1)';
              fogCtxRef.current.strokeStyle = 'rgba(0,0,0,1)';
            } else {
              fogCtxRef.current.globalCompositeOperation = 'source-over';
              fogCtxRef.current.fillStyle = '#000000';
              fogCtxRef.current.strokeStyle = '#000000';
            }

            if (shape === 'rect' && rect) {
              fogCtxRef.current.fillRect(rect.x, rect.y, rect.width, rect.height);
            } else if (shape === 'circle' && points && points[0]) {
              fogCtxRef.current.beginPath();
              fogCtxRef.current.arc(points[0].x, points[0].y, radius, 0, Math.PI * 2);
              fogCtxRef.current.fill();
            } else if (points && points.length > 0) {
              fogCtxRef.current.lineWidth = radius * 2;
              fogCtxRef.current.lineCap = 'round';
              fogCtxRef.current.lineJoin = 'round';

              if (points.length === 1) {
                fogCtxRef.current.beginPath();
                fogCtxRef.current.arc(points[0].x, points[0].y, radius, 0, Math.PI * 2);
                fogCtxRef.current.fill();
              } else {
                fogCtxRef.current.beginPath();
                fogCtxRef.current.moveTo(points[0].x, points[0].y);
                for (let i = 1; i < points.length; i++) {
                  fogCtxRef.current.lineTo(points[i].x, points[i].y);
                }
                fogCtxRef.current.stroke();
              }
            }

            fogCtxRef.current.restore();
          }
          break;

        case 'CLEAR_FOG':
          if (fogCtxRef.current && canvasRef.current) {
            fogCtxRef.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
          }
          break;

        case 'FILL_FOG':
          if (fogCtxRef.current && canvasRef.current) {
            fogCtxRef.current.globalCompositeOperation = 'source-over';
            fogCtxRef.current.fillStyle = '#000000';
            fogCtxRef.current.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
          }
          break;

        case 'INVERT_FOG':
          if (fogCtxRef.current && canvasRef.current) {
            const temp = document.createElement('canvas');
            temp.width = canvasRef.current.width;
            temp.height = canvasRef.current.height;
            const tCtx = temp.getContext('2d');
            if (tCtx) {
              tCtx.drawImage(canvasRef.current, 0, 0);
              fogCtxRef.current.globalCompositeOperation = 'source-over';
              fogCtxRef.current.fillStyle = '#000000';
              fogCtxRef.current.fillRect(0, 0, temp.width, temp.height);
              fogCtxRef.current.globalCompositeOperation = 'destination-out';
              fogCtxRef.current.drawImage(temp, 0, 0);
            }
          }
          break;

        case 'SET_BLACKOUT':
          setBlackoutTheme(message.theme);
          break;

        case 'SYNC_COMBAT':
          setCombat(message.combat);
          break;

        case 'SYNC_DRAWINGS':
          setDrawings(message.drawings || []);
          break;

        case 'SYNC_HAZARDS':
          setHazards(message.hazards || []);
          break;

        case 'SYNC_SPELL_TEMPLATE':
          setSpellTemplate(message.template || null);
          break;

        case 'SYNC_RULER':
          setRuler(message.ruler || null);
          break;

        case 'LASER_STREAM':
          if (message.point) {
            setLaserPoints((prev) => [...prev.slice(-35), message.point!]);
          }
          break;

        case 'ADD_PING':
          if (message.ping) {
            const p = message.ping;
            setPings((prev) => [...prev, p]);
            setTimeout(() => {
              setPings((prev) => prev.filter((item) => item.id !== p.id));
            }, 4000);
          }
          break;

        case 'DICE_ROLL':
          if (message.roll) {
            setLastDiceRoll(message.roll);
            setTimeout(() => setLastDiceRoll(null), 5500);
          }
          break;

        case 'READ_ALOUD':
          setReadAloud({ title: message.title, text: message.text });
          break;

        case 'SHOW_HANDOUT_CARD':
          if (message.card) {
            setHandoutCard(message.card);
          }
          break;

        case 'HIDE_HANDOUT_CARD':
          setHandoutCard(null);
          break;

        default:
          break;
      }
    });

    // Отправляем handshake запрос мастеру
    syncService.send({ type: 'HANDSHAKE_REQUEST' });
    const handshakeTimer = setInterval(() => {
      syncService.send({ type: 'HANDSHAKE_REQUEST' });
    }, 2000);

    // Слушатель смены полноэкранного режима для WebKit / macOS Safari
    const removeFsListener = addFullscreenChangeListener((isFull) => {
      setIsFullscreen(isFull);
    });

    return () => {
      unsubscribe();
      clearInterval(handshakeTimer);
      removeFsListener();
    };
  }, []);

  // Полноэкранный режим с поддержкой macOS Safari (webkit prefix)
  const toggleFullscreen = () => {
    toggleAppFullscreen().then((success) => {
      setIsFullscreen(isElementFullscreen());
    });
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (hideControlsTimerRef.current) clearTimeout(hideControlsTimerRef.current);
    hideControlsTimerRef.current = setTimeout(() => setShowControls(false), 2500);
  };

  const firstLayer = layers[0];
  const mapWidth = firstLayer?.width || 1920;
  const mapHeight = firstLayer?.height || 1080;

  return (
    <div
      onMouseMove={handleMouseMove}
      className="w-screen h-screen bg-black overflow-hidden flex flex-col select-none relative font-mono text-[#E0E0E0]"
    >
      {/* 1. КИНЕМАТОГРАФИЧНЫЙ ПЕРЕХОД МЕЖДУ СЦЕНАМИ (CINEMATIC TRANSITION) */}
      {sceneTransition && (
        <div className="fixed inset-0 z-[9700] pointer-events-none flex flex-col items-center justify-center bg-black/90 backdrop-blur-md animate-in fade-in duration-500">
          <div className="flex flex-col items-center gap-3 text-center px-6">
            <span className="text-xs tracking-[0.35em] text-[#F27D26] uppercase font-bold animate-pulse">
              TRAVELING TO LOCATION
            </span>
            <h1 className="text-3xl sm:text-5xl font-serif font-extrabold tracking-wider text-white drop-shadow-[0_0_25px_rgba(242,125,38,0.6)]">
              {sceneTransition}
            </h1>
            <div className="w-48 h-0.5 bg-gradient-to-r from-transparent via-[#F27D26] to-transparent mt-2" />
          </div>
        </div>
      )}

      {/* 2. HUD ИНИЦИАТИВЫ И БОЯ С ПОДДЕРЖКОЙ 4-СТОРОННЕГО СТОЛА */}
      <PlayerInitiativeHUD combat={combat} position={hudPosition} />

      {/* 3. РЕЖИМ ЗАТЕМНЕНИЯ СТОЛА (BLACKOUT) */}
      <PlayerBlackoutOverlay theme={blackoutTheme} />

      {/* 4. ВСКОЧИВШИЙ РЕЗУЛЬТАТ КУБИКА ИЛИ РАССКАЗ МАСТЕРА */}
      <PlayerDiceOverlay
        lastRoll={lastDiceRoll}
        readAloud={readAloud}
        onDismissRoll={() => setLastDiceRoll(null)}
        onDismissReadAloud={() => setReadAloud(null)}
      />

      {/* 4.1 КАРТОЧКА РАЗДАТОЧНОГО МАТЕРИАЛА / СГЕНЕРИРОВАННОГО МОНСТРА/NPC/ЛУТА */}
      <PlayerHandoutCardOverlay
        card={handoutCard}
        onClose={() => setHandoutCard(null)}
      />

      {/* 5. ОСНОВНОЙ ВЬЮПОРТ КАРТЫ */}
      <main className="flex-1 relative overflow-hidden bg-black">
        {layers.length === 0 && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center text-[#8E9299] gap-4 bg-[#0B0C0E] px-6 text-center select-none">
            <div className="p-4 rounded-full bg-[#151619] border border-[#2A2B30] shadow-2xl animate-pulse">
              <Radio size={40} className="text-[#F27D26]" />
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="text-xs font-mono font-bold tracking-[0.25em] text-[#F27D26] uppercase">
                VTT-ZERO PROJECTOR DISPLAY
              </span>
              <h2 className="text-xl font-serif font-bold text-white">
                Ожидание трансляции от Мастера...
              </h2>
              <p className="text-xs text-[#555A65] max-w-md mt-1">
                Экран готов к приему тактической карты, тумана войны и карточек. Перетащите окно на устройство отображения (второй монитор или проектор).
              </p>
            </div>

            <div className="flex items-center gap-3 mt-2">
              <button
                onClick={() => {
                  syncService.send({ type: 'HANDSHAKE_REQUEST' });
                  syncService.send({ type: 'REQUEST_FULL_STATE' });
                  reportScreenSizeToDm();
                }}
                className="px-4 py-2 rounded-lg bg-[#F27D26] hover:bg-[#E06C15] text-white text-xs font-bold font-mono tracking-wider flex items-center gap-2 shadow-lg transition active:scale-95"
              >
                <RefreshCw size={14} className="animate-spin" />
                <span>ЗАПРОСИТЬ КАРТУ</span>
              </button>
            </div>
          </div>
        )}

        {/* Контейнер синхронизированной трансформации */}
        <div
          className="absolute top-0 left-0 origin-top-left will-change-transform pointer-events-none"
          style={{
            transform: `translate3d(${viewport.x}px, ${viewport.y}px, 0px) scale(${viewport.scale})`,
            width: `${mapWidth}px`,
            height: `${mapHeight}px`
          }}
        >
          {/* А. Слои карты (с аппаратным видео и фильтрацией GM-Only) */}
          {layers.map((layer) => {
            if (!layer.visible) return null;
            if (layer.category === 'gm_only') return null; // GM Only слои никогда не показываются игрокам

            const isVideo =
              layer.type === 'video' ||
              layer.url?.startsWith('data:video') ||
              layer.url?.endsWith('.mp4') ||
              layer.url?.endsWith('.webm');

            return (
              <div
                key={layer.id}
                className="absolute pointer-events-none"
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
                    disablePictureInPicture
                    className="w-full h-full object-fill pointer-events-none"
                  />
                ) : (
                  <img
                    src={layer.dataUrl || layer.url}
                    alt={layer.name}
                    className="w-full h-full object-fill pointer-events-none"
                    draggable={false}
                    decoding="async"
                  />
                )}
              </div>
            );
          })}

          {/* Б. Тактическая сетка */}
          <GridOverlay grid={grid} width={mapWidth} height={mapHeight} />

          {/* В. Стихийные эффекты (Огонь, Вода, Кислота, Лава, Газ, Туман) */}
          <ElementalHazardOverlay
            width={mapWidth}
            height={mapHeight}
            hazards={hazards}
          />

          {/* Г. Холст Тумана Войны */}
          <canvas
            ref={canvasRef}
            width={mapWidth}
            height={mapHeight}
            className="absolute top-0 left-0 pointer-events-none z-20"
          />

          {/* Д. Тактическое рисование, заклинания и линейка */}
          <TacticalDrawingOverlay
            width={mapWidth}
            height={mapHeight}
            drawings={drawings}
            spellTemplate={spellTemplate}
            ruler={ruler}
            gridSize={grid.size}
          />

          {/* Е. Маркеры внимания и лазерная указка */}
          <PingOverlay pings={pings} laserPoints={laserPoints} width={mapWidth} height={mapHeight} />
        </div>
      </main>

      {/* 6. ПЛАВАЮЩИЕ КНОПКИ УПРАВЛЕНИЯ ПРИ ДВИЖЕНИИ МЫШИ */}
      <div
        className={`fixed bottom-4 right-4 z-50 flex items-center gap-2 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Кнопка поворота HUD для 4-стороннего стола */}
        <button
          onClick={() => {
            const positions: Array<'top' | 'bottom' | 'left' | 'right'> = ['top', 'bottom', 'left', 'right'];
            const nextIdx = (positions.indexOf(hudPosition) + 1) % positions.length;
            setHudPosition(positions[nextIdx]);
          }}
          className="px-3 py-2 rounded-full bg-[#151619]/90 border border-[#2A2A2A] text-[#8E9299] hover:text-white shadow-2xl backdrop-blur text-xs font-bold"
          title="Повернуть HUD инициативы по сторонам стола (Top/Bottom/Left/Right)"
        >
          HUD: {hudPosition.toUpperCase()}
        </button>

        <button
          onClick={toggleFullscreen}
          className="p-3 rounded-full bg-[#151619]/90 border border-[#2A2A2A] text-[#8E9299] hover:text-white shadow-2xl backdrop-blur flex items-center justify-center"
          title="Полноэкранный режим (F11)"
        >
          {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
        </button>
      </div>
    </div>
  );
};
