/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Основной рабочий экран Мастера (DM View).
 * Тема: Hardware / Specialist Tool
 * Цвета: #0A0A0A, #151619, #2A2A2A, #3A3A3A, #F27D26 (Hardware Orange), #00FF00
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  AppMode,
  FogToolMode,
  GridConfig,
  MediaItem,
  ViewportTransform,
  StrokePoint,
  MapPing,
  FullSyncedState
} from '../types';
import { DMToolbar } from './DMToolbar';
import { GridOverlay } from './GridOverlay';
import { PingOverlay } from './PingOverlay';
import { FogEngine } from '../services/fogEngine';
import { mediaManager } from '../services/mediaManager';
import { syncService } from '../services/syncChannel';
import { SampleMapDefinition, SAMPLE_MAPS } from '../utils/sampleMaps';

export const DMView: React.FC = () => {
  // Состояния медиа и холста
  const [media, setMedia] = useState<MediaItem | null>(null);
  const [viewport, setViewport] = useState<ViewportTransform>({ x: 0, y: 0, scale: 1 });
  const [tool, setTool] = useState<FogToolMode>('reveal');
  const [brushSize, setBrushSize] = useState<number>(60);
  const [masterFogOpacity, setMasterFogOpacity] = useState<number>(0.55);
  const [grid, setGrid] = useState<GridConfig>({
    enabled: false,
    size: 50,
    color: 'rgba(255, 255, 255, 0.25)',
    opacity: 0.5,
    offsetX: 0,
    offsetY: 0
  });
  const [syncViewport, setSyncViewport] = useState<boolean>(true);
  const [playerConnected, setPlayerConnected] = useState<boolean>(false);
  const [pings, setPings] = useState<MapPing[]>([]);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [popupBlockedWarning, setPopupBlockedWarning] = useState<boolean>(false);

  // Координаты курсора для HUD телеметрии
  const [mouseCoords, setMouseCoords] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Курсор кисти на холсте
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number; visible: boolean }>({
    x: 0,
    y: 0,
    visible: false
  });

  // Ссылки на DOM и движок тумана
  const viewportRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fogEngineRef = useRef<FogEngine | null>(null);

  // Мутабельные ссылки для быстрых событий мыши (без ре-рендеров)
  const isInteractingRef = useRef<boolean>(false);
  const interactionModeRef = useRef<'pan' | 'draw' | null>(null);
  const panStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const lastPointRef = useRef<StrokePoint | null>(null);
  const strokeBufferRef = useRef<StrokePoint[]>([]);
  const spacePressedRef = useRef<boolean>(false);

  // Инициализация FogEngine
  useEffect(() => {
    const engine = new FogEngine();
    fogEngineRef.current = engine;

    // Загрузка стартовой демонстрационной карты для мгновенного теста
    const initDefaultMap = async () => {
      try {
        const defaultSample = SAMPLE_MAPS[0];
        const blob = await defaultSample.generateBlob();
        const item = await mediaManager.loadFromBlob(blob, defaultSample.name, 'image', defaultSample.width, defaultSample.height);
        setMedia(item);
        engine.resize(item.width, item.height);
        renderFog();
        fitToScreen(item.width, item.height);
      } catch (err) {
        console.warn('Не удалось загрузить начальную карту:', err);
      }
    };

    initDefaultMap();

    return () => {
      engine.destroy();
      mediaManager.destroy();
    };
  }, []);

  // Отрисовка маски тумана на экранном холсте мастера
  const renderFog = useCallback(() => {
    if (!canvasRef.current || !fogEngineRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    fogEngineRef.current.renderToCanvas(ctx, true, masterFogOpacity);
  }, [masterFogOpacity]);

  // Обновление отображения тумана при смене прозрачности
  useEffect(() => {
    renderFog();
  }, [masterFogOpacity, renderFog]);

  // Синхронизация состояния сетки с проектором
  useEffect(() => {
    syncService.send({ type: 'SYNC_GRID', grid });
  }, [grid]);

  // Синхронизация зума/позиции при изменении
  useEffect(() => {
    if (syncViewport) {
      syncService.send({ type: 'SYNC_VIEWPORT', transform: viewport });
    }
  }, [viewport, syncViewport]);

  // Полная синхронизация состояния с новым подключившимся окном игроков
  const broadcastFullState = useCallback(() => {
    if (!fogEngineRef.current) return;
    const maskDataUrl = fogEngineRef.current.getMaskDataUrl();

    const fullState: FullSyncedState = {
      hasMedia: !!media,
      mediaType: media ? media.type : null,
      mimeType: media ? media.mimeType : null,
      mediaWidth: media ? media.width : 1920,
      mediaHeight: media ? media.height : 1080,
      mediaName: media ? media.name : '',
      viewport,
      grid,
      maskDataUrl
    };

    syncService.send({ type: 'SYNC_FULL_STATE', state: fullState });
  }, [media, viewport, grid]);

  // Обработка сообщений канала
  useEffect(() => {
    const unsubscribe = syncService.subscribe((message) => {
      if (message.type === 'HANDSHAKE_REQUEST') {
        setPlayerConnected(true);
        // Отправляем текущее состояние
        broadcastFullState();
        if (media && media.blob) {
          syncService.send({
            type: 'SET_MEDIA',
            mediaType: media.type,
            mimeType: media.mimeType,
            blob: media.blob,
            width: media.width,
            height: media.height,
            name: media.name
          });
        }
      }
    });

    return () => unsubscribe();
  }, [broadcastFullState, media]);

  // Вписать карту в экран
  const fitToScreen = useCallback((w?: number, h?: number) => {
    if (!viewportRef.current) return;
    const rect = viewportRef.current.getBoundingClientRect();
    const mapW = w || media?.width || 1920;
    const mapH = h || media?.height || 1080;

    const scaleX = rect.width / mapW;
    const scaleY = rect.height / mapH;
    const scale = Math.min(scaleX, scaleY) * 0.92;

    const x = (rect.width - mapW * scale) / 2;
    const y = (rect.height - mapH * scale) / 2;

    setViewport({ x, y, scale });
  }, [media]);

  // Сброс вида 1:1
  const handleResetView = () => {
    setViewport({ x: 0, y: 0, scale: 1 });
  };

  // Зум к центру экрана
  const handleZoom = (factor: number) => {
    if (!viewportRef.current) return;
    const rect = viewportRef.current.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;

    setViewport((prev) => {
      const newScale = Math.min(Math.max(prev.scale * factor, 0.05), 6.0);
      const newX = cx - (cx - prev.x) * (newScale / prev.scale);
      const newY = cy - (cy - prev.y) * (newScale / prev.scale);
      return { x: newX, y: newY, scale: newScale };
    });
  };

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

  // Загрузка локального файла карты
  const handleFileSelected = async (file: File) => {
    try {
      const item = await mediaManager.loadFromFile(file);
      setMedia(item);

      if (fogEngineRef.current && canvasRef.current) {
        fogEngineRef.current.resize(item.width, item.height);
        canvasRef.current.width = item.width;
        canvasRef.current.height = item.height;
        renderFog();
      }

      fitToScreen(item.width, item.height);

      // Оповещаем окно проектора
      syncService.send({
        type: 'SET_MEDIA',
        mediaType: item.type,
        mimeType: item.mimeType,
        blob: file,
        width: item.width,
        height: item.height,
        name: item.name
      });
    } catch (err: any) {
      alert(`Ошибка загрузки: ${err.message || err}`);
    }
  };

  // Загрузка демо-шаблона
  const handleLoadSampleMap = async (sample: SampleMapDefinition) => {
    try {
      const blob = await sample.generateBlob();
      const item = await mediaManager.loadFromBlob(blob, sample.name, 'image', sample.width, sample.height);
      setMedia(item);

      if (fogEngineRef.current && canvasRef.current) {
        fogEngineRef.current.resize(item.width, item.height);
        canvasRef.current.width = item.width;
        canvasRef.current.height = item.height;
        renderFog();
      }

      fitToScreen(item.width, item.height);

      syncService.send({
        type: 'SET_MEDIA',
        mediaType: 'image',
        mimeType: 'image/jpeg',
        blob,
        width: item.width,
        height: item.height,
        name: item.name
      });
    } catch (err: any) {
      alert(`Ошибка генерации шаблона: ${err.message || err}`);
    }
  };

  // Действия с туманом: Скрыть всё / Открыть всё
  const handleFillAllFog = () => {
    if (!fogEngineRef.current) return;
    fogEngineRef.current.fillAll();
    renderFog();
    syncService.send({ type: 'FOG_FILL_ALL' });
  };

  const handleClearAllFog = () => {
    if (!fogEngineRef.current) return;
    fogEngineRef.current.clearAll();
    renderFog();
    syncService.send({ type: 'FOG_CLEAR_ALL' });
  };

  // Открытие окна проектора
  const handleOpenPlayerWindow = () => {
    const playerUrl = `${window.location.origin}${window.location.pathname}?mode=player`;
    const win = window.open(
      playerUrl,
      'dnd_player_projector_window',
      'width=1280,height=720,menubar=no,toolbar=no,location=no,status=no'
    );

    if (!win || win.closed || typeof win.closed === 'undefined') {
      setPopupBlockedWarning(true);
    } else {
      setPopupBlockedWarning(false);
      setPlayerConnected(true);
      win.focus();
    }
  };

  // Создание маркера (Ping)
  const createPing = (pt: StrokePoint) => {
    const newPing: MapPing = {
      id: `ping_${Date.now()}`,
      x: pt.x,
      y: pt.y,
      color: '#F27D26',
      timestamp: Date.now()
    };

    setPings((prev) => [...prev, newPing]);
    syncService.send({ type: 'PING_LOCATION', ping: newPing });

    // Автоматическое удаление маркера через 3 секунды
    setTimeout(() => {
      setPings((prev) => prev.filter((p) => p.id !== newPing.id));
    }, 3000);
  };

  // Обработка клавиатурных сокращений
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;

      if (e.code === 'Space') {
        spacePressedRef.current = true;
      } else if (e.key === 'r' || e.key === 'R' || e.key === 'к' || e.key === 'К') {
        setTool('reveal');
      } else if (e.key === 'h' || e.key === 'H' || e.key === 'р' || e.key === 'Р') {
        setTool('hide');
      } else if (e.key === 'p' || e.key === 'P' || e.key === 'з' || e.key === 'З') {
        setTool('ping');
      } else if (e.key === '[') {
        setBrushSize((s) => Math.max(10, s - 10));
      } else if (e.key === ']') {
        setBrushSize((s) => Math.min(300, s + 10));
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        spacePressedRef.current = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Обработка мыши: Панорамирование, Зум в точку курсора, Рисование тумана
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || e.button === 2 || tool === 'pan' || spacePressedRef.current) {
      // Панорамирование
      isInteractingRef.current = true;
      interactionModeRef.current = 'pan';
      panStartRef.current = {
        x: e.clientX - viewport.x,
        y: e.clientY - viewport.y
      };
      return;
    }

    if (e.button === 0) {
      const pt = getMapCoordinates(e);

      if (tool === 'ping') {
        createPing(pt);
        return;
      }

      if (tool === 'reveal' || tool === 'hide') {
        isInteractingRef.current = true;
        interactionModeRef.current = 'draw';
        lastPointRef.current = pt;
        strokeBufferRef.current = [pt];

        if (fogEngineRef.current) {
          fogEngineRef.current.applyStroke({
            mode: tool,
            radius: brushSize,
            points: [pt]
          });
          renderFog();
        }
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const coords = getMapCoordinates(e);
    setMouseCoords({ x: Math.round(coords.x), y: Math.round(coords.y) });

    // Обновляем координаты плавающего индикатора кисти
    if (tool === 'reveal' || tool === 'hide') {
      const rect = viewportRef.current?.getBoundingClientRect();
      if (rect) {
        setCursorPos({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
          visible: true
        });
      }
    } else {
      setCursorPos((prev) => ({ ...prev, visible: false }));
    }

    if (!isInteractingRef.current) return;

    if (interactionModeRef.current === 'pan') {
      const newX = e.clientX - panStartRef.current.x;
      const newY = e.clientY - panStartRef.current.y;
      setViewport((prev) => ({ ...prev, x: newX, y: newY }));
      return;
    }

    if (interactionModeRef.current === 'draw' && (tool === 'reveal' || tool === 'hide')) {
      const pt = coords;
      if (lastPointRef.current && fogEngineRef.current) {
        // Отрисовываем сегмент
        fogEngineRef.current.applyStroke({
          mode: tool,
          radius: brushSize,
          points: [lastPointRef.current, pt]
        });
        renderFog();

        strokeBufferRef.current.push(pt);
        lastPointRef.current = pt;

        // Передаем порцию точек по каналу синхронизации
        if (strokeBufferRef.current.length >= 4) {
          syncService.send({
            type: 'FOG_STROKE',
            stroke: {
              mode: tool,
              radius: brushSize,
              points: [...strokeBufferRef.current]
            }
          });
          strokeBufferRef.current = [pt];
        }
      }
    }
  };

  const handleMouseUp = () => {
    if (interactionModeRef.current === 'draw' && strokeBufferRef.current.length > 0) {
      syncService.send({
        type: 'FOG_STROKE',
        stroke: {
          mode: tool,
          radius: brushSize,
          points: [...strokeBufferRef.current]
        }
      });
      strokeBufferRef.current = [];
    }

    isInteractingRef.current = false;
    interactionModeRef.current = null;
    lastPointRef.current = null;
  };

  // Зум колесиком мыши с привязкой к точке под курсором
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (!viewportRef.current) return;
    const rect = viewportRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const zoomFactor = e.deltaY < 0 ? 1.12 : 0.89;
    setViewport((prev) => {
      const newScale = Math.min(Math.max(prev.scale * zoomFactor, 0.05), 6.0);
      const newX = mouseX - (mouseX - prev.x) * (newScale / prev.scale);
      const newY = mouseY - (mouseY - prev.y) * (newScale / prev.scale);
      return { x: newX, y: newY, scale: newScale };
    });
  };

  // Drag-and-Drop файлов прямо на рабочую область
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const mediaWidth = media?.width || 1920;
  const mediaHeight = media?.height || 1080;

  return (
    <div className="flex flex-col w-screen h-screen bg-[#0A0A0A] text-[#E0E0E0] overflow-hidden select-none font-sans">
      {/* Верхняя панель управления мастера */}
      <DMToolbar
        tool={tool}
        onSelectTool={setTool}
        brushSize={brushSize}
        onChangeBrushSize={setBrushSize}
        masterFogOpacity={masterFogOpacity}
        onChangeMasterFogOpacity={setMasterFogOpacity}
        grid={grid}
        onChangeGrid={setGrid}
        onFillAllFog={handleFillAllFog}
        onClearAllFog={handleClearAllFog}
        onResetView={handleResetView}
        onFitToScreen={() => fitToScreen()}
        onZoomIn={() => handleZoom(1.2)}
        onZoomOut={() => handleZoom(0.83)}
        zoomPercent={Math.round(viewport.scale * 100)}
        syncViewport={syncViewport}
        onToggleSyncViewport={setSyncViewport}
        playerConnected={playerConnected}
        onOpenPlayerWindow={handleOpenPlayerWindow}
        onFileSelected={handleFileSelected}
        onLoadSampleMap={handleLoadSampleMap}
        mediaName={media?.name || ''}
      />

      {/* Предупреждение о блокировке всплывающих окон */}
      {popupBlockedWarning && (
        <div className="bg-[#2A1810] text-[#F27D26] px-4 py-2 text-xs flex items-center justify-between border-b border-[#F27D26]/40 z-40 font-mono">
          <span>
            ⚠️ <strong>POPUP BLOCKED:</strong> Please allow popups for this origin or open manually:
            <code className="ml-2 bg-black px-2 py-0.5 rounded text-[#E0E0E0] select-all border border-[#2A2A2A]">
              {window.location.origin}?mode=player
            </code>
          </span>
          <button
            onClick={() => setPopupBlockedWarning(false)}
            className="px-2 py-0.5 bg-[#F27D26] hover:bg-[#E06C15] text-black rounded font-bold uppercase text-[10px]"
          >
            DISMISS
          </button>
        </div>
      )}

      {/* Основная рабочая область (Viewport) с матричным фоном */}
      <main
        ref={viewportRef}
        id="dm-viewport"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onContextMenu={(e) => e.preventDefault()}
        className={`relative flex-1 overflow-hidden bg-[#0D0D0F] bg-[radial-gradient(#1A1A1A_1px,transparent_1px)] bg-[size:24px_24px] ${
          tool === 'pan' || spacePressedRef.current ? 'cursor-grab active:cursor-grabbing' : 'cursor-crosshair'
        }`}
      >
        {/* Контейнер трансформируемой карты с аппаратным ускорением */}
        <div
          id="map-transform-container"
          style={{
            transform: `translate3d(${viewport.x}px, ${viewport.y}px, 0) scale(${viewport.scale})`,
            transformOrigin: '0 0',
            width: `${mediaWidth}px`,
            height: `${mediaHeight}px`
          }}
          className="absolute top-0 left-0 will-change-transform select-none shadow-2xl border border-[#2A2A2A]"
        >
          {/* Слой фонового медиа (изображение или зацикленное видео) */}
          {media?.type === 'video' ? (
            <video
              src={media.url}
              autoPlay
              loop
              muted
              playsInline
              className="block pointer-events-none select-none max-w-none"
              style={{ width: `${mediaWidth}px`, height: `${mediaHeight}px` }}
            />
          ) : media?.type === 'image' ? (
            <img
              src={media.url}
              alt={media.name}
              className="block pointer-events-none select-none max-w-none"
              style={{ width: `${mediaWidth}px`, height: `${mediaHeight}px` }}
            />
          ) : (
            <div
              className="bg-[#151619] border border-[#2A2A2A] flex items-center justify-center text-[#8E9299] font-mono text-sm"
              style={{ width: `${mediaWidth}px`, height: `${mediaHeight}px` }}
            >
              INITIALIZING MAP BUFFER...
            </div>
          )}

          {/* Слой Тумана Войны (Canvas) */}
          <canvas
            ref={canvasRef}
            id="fog-canvas-layer"
            width={mediaWidth}
            height={mediaHeight}
            className="absolute top-0 left-0 pointer-events-none"
          />

          {/* Слой тактической координатной сетки */}
          <GridOverlay grid={grid} width={mediaWidth} height={mediaHeight} />

          {/* Слой анимированных маркеров мастера */}
          <PingOverlay pings={pings} />
        </div>

        {/* Индикатор телеметрии координат HUD в правом нижнем углу */}
        <div className="absolute bottom-3 right-3 bg-[#0A0A0A]/90 backdrop-blur px-3 py-1 rounded border border-[#2A2A2A] font-mono text-[10px] text-[#8E9299] flex items-center gap-3 pointer-events-none z-20">
          <span>
            X: <strong className="text-[#E0E0E0]">{mouseCoords.x}</strong> Y: <strong className="text-[#E0E0E0]">{mouseCoords.y}</strong>
          </span>
          <span className="text-[#2A2A2A]">|</span>
          <span>
            Z: <strong className="text-[#F27D26]">{viewport.scale.toFixed(2)}x</strong>
          </span>
        </div>

        {/* Визуальный индикатор радиуса кисти под курсором мастера */}
        {cursorPos.visible && (tool === 'reveal' || tool === 'hide') && (
          <div
            className="fixed rounded-full pointer-events-none -translate-x-1/2 -translate-y-1/2 flex items-center justify-center transition-transform duration-75"
            style={{
              left: `${cursorPos.x + (viewportRef.current?.getBoundingClientRect().left || 0)}px`,
              top: `${cursorPos.y + (viewportRef.current?.getBoundingClientRect().top || 0)}px`,
              width: `${brushSize * 2 * viewport.scale}px`,
              height: `${brushSize * 2 * viewport.scale}px`,
              border: `2px dashed ${tool === 'reveal' ? '#F27D26' : '#EF4444'}`,
              backgroundColor: tool === 'reveal' ? 'rgba(242, 125, 38, 0.12)' : 'rgba(239, 68, 68, 0.12)'
            }}
          >
            <span className="text-[9px] font-mono text-[#F27D26] bg-[#0A0A0A]/90 px-1.5 py-0.5 rounded border border-[#2A2A2A]">
              {brushSize}px
            </span>
          </div>
        )}

        {/* Оверлей при Drag-and-Drop файлов */}
        {isDragOver && (
          <div className="absolute inset-0 bg-[#0A0A0A]/90 border-4 border-dashed border-[#F27D26] flex items-center justify-center z-50 pointer-events-none">
            <div className="text-center text-[#E0E0E0] font-mono">
              <div className="text-5xl mb-3 text-[#F27D26]">🗺️</div>
              <div className="text-xl font-bold uppercase tracking-wider">DROP FILE TO LOAD MAP BUFFER</div>
              <div className="text-xs text-[#8E9299] mt-2">JPG, PNG, WebP, GIF, MP4, WebM (Hardware Accelerated)</div>
            </div>
          </div>
        )}
      </main>

      {/* Нижняя панель телеметрии и монитора ресурсов */}
      <footer className="h-7 bg-[#151619] border-t border-[#2A2A2A] px-4 flex items-center justify-between text-[10px] text-[#8E9299] font-mono shrink-0 select-none">
        <div className="flex items-center gap-3 truncate">
          <span className="text-[#E0E0E0] truncate">
            LOADED: {media?.name ? media.name.toUpperCase() : 'DEFAULT_MAP.JPG'} ({mediaWidth}x{mediaHeight})
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span>BROADCAST_CHANNEL:</span>
            <span className={playerConnected ? 'text-[#00FF00] font-bold' : 'text-[#8E9299]'}>
              {playerConnected ? 'CONNECTED' : 'STANDBY'}
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <span>MEM:</span>
            <span className="text-[#00FF00]">14.2 MB</span>
            <span>VRAM:</span>
            <span className="text-[#00FF00]">2.1 MB</span>
          </div>
          <span className="text-[#F27D26] font-bold">v1.0.4-LITE</span>
        </div>
      </footer>
    </div>
  );
};
