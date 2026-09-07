/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Компонент визуальной рамки вьюпорта игроков (Player Viewport Frame Overlay).
 * Отображает на карте Мастера точный прямоугольник того, что видят игроки на 2-м экране (проекторе),
 * с поддержкой 8-точечного масштабирования, свободного перетаскивания, фиксации положения (Lock),
 * пошаговой подстройки и быстрых действий, полностью независимо от перемещений экрана Мастера.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ViewportTransform } from '../types';
import {
  Tv,
  Lock,
  Unlock,
  Maximize2,
  Crosshair,
  Radio,
  Eye,
  ZoomIn,
  ZoomOut,
  Move,
  Sliders,
  Sparkles,
  RotateCcw
} from 'lucide-react';

interface Props {
  playerViewport?: ViewportTransform;
  playerScreenSize?: { width: number; height: number };
  dmViewport?: ViewportTransform;
  isLinkedCamera?: boolean;
  isPositionLocked?: boolean;
  isConnected?: boolean;
  mapWidth?: number;
  mapHeight?: number;
  gridSize?: number;
  snapToGrid?: boolean;
  onToggleLinkCamera?: () => void;
  onToggleLockPosition?: () => void;
  onSetPlayerViewport?: (viewport: ViewportTransform) => void;
  onCenterOnPlayerView?: () => void;
  onCenterPlayerOnDmView?: () => void;
  onFitMapForPlayers?: () => void;
  onOpenPrecisionPanel?: () => void;
}

type ResizeHandleType = 'nw' | 'ne' | 'se' | 'sw' | 'n' | 's' | 'e' | 'w';

export const PlayerViewportFrameOverlay: React.FC<Props> = React.memo(({
  playerViewport = { x: 0, y: 0, scale: 1 },
  playerScreenSize = { width: 1920, height: 1080 },
  dmViewport = { x: 0, y: 0, scale: 1 },
  isLinkedCamera = true,
  isPositionLocked = false,
  isConnected = false,
  mapWidth = 1920,
  mapHeight = 1080,
  gridSize = 50,
  snapToGrid = false,
  onToggleLinkCamera,
  onToggleLockPosition,
  onSetPlayerViewport,
  onCenterOnPlayerView,
  onCenterPlayerOnDmView,
  onFitMapForPlayers,
  onOpenPrecisionPanel
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [activeResizeHandle, setActiveResizeHandle] = useState<ResizeHandleType | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  const dragStartRef = useRef<{
    mouseX: number;
    mouseY: number;
    initialMapLeft: number;
    initialMapTop: number;
  }>({
    mouseX: 0,
    mouseY: 0,
    initialMapLeft: 0,
    initialMapTop: 0
  });

  const resizeStartRef = useRef<{
    mouseX: number;
    mouseY: number;
    initialScale: number;
    initialCenterX: number;
    initialCenterY: number;
    initialMapWidth: number;
    initialMapHeight: number;
  }>({
    mouseX: 0,
    mouseY: 0,
    initialScale: 1,
    initialCenterX: 0,
    initialCenterY: 0,
    initialMapWidth: 1920,
    initialMapHeight: 1080
  });

  const Wp = playerScreenSize?.width || 1920;
  const Hp = playerScreenSize?.height || 1080;
  const sp = playerViewport?.scale || 1;
  const xp = playerViewport?.x || 0;
  const yp = playerViewport?.y || 0;

  // Координаты видимой области игроков на карте (в пикселях карты)
  const mapLeft = -xp / sp;
  const mapTop = -yp / sp;
  const mapWidthVisible = Wp / sp;
  const mapHeightVisible = Hp / sp;
  const mapCenterX = mapLeft + mapWidthVisible / 2;
  const mapCenterY = mapTop + mapHeightVisible / 2;

  // Начало перетаскивания рамки по холсту
  const handleDragStart = useCallback((e: React.MouseEvent) => {
    if (isPositionLocked) return;
    e.stopPropagation();
    e.preventDefault();
    setIsDragging(true);

    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      initialMapLeft: mapLeft,
      initialMapTop: mapTop
    };
  }, [isPositionLocked, mapLeft, mapTop]);

  // Начало масштабирования рамки через одну из 8 ручек
  const handleResizeStart = useCallback((handle: ResizeHandleType, e: React.MouseEvent) => {
    if (isPositionLocked) return;
    e.stopPropagation();
    e.preventDefault();
    setActiveResizeHandle(handle);

    resizeStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      initialScale: sp,
      initialCenterX: mapCenterX,
      initialCenterY: mapCenterY,
      initialMapWidth: mapWidthVisible,
      initialMapHeight: mapHeightVisible
    };
  }, [isPositionLocked, sp, mapCenterX, mapCenterY, mapWidthVisible, mapHeightVisible]);

  // Быстрое изменение зума (кнопками + / -)
  const handleQuickZoom = useCallback((delta: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPositionLocked) return;
    const newScale = Math.min(Math.max(sp + delta, 0.15), 4.0);
    const newWp = Wp / newScale;
    const newHp = Hp / newScale;
    const newMapLeft = mapCenterX - newWp / 2;
    const newMapTop = mapCenterY - newHp / 2;

    onSetPlayerViewport?.({
      x: -newMapLeft * newScale,
      y: -newMapTop * newScale,
      scale: newScale
    });
  }, [isPositionLocked, sp, Wp, Hp, mapCenterX, mapCenterY, onSetPlayerViewport]);

  // Установка зума 100% (1:1)
  const handleResetZoom100 = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPositionLocked) return;
    const newScale = 1.0;
    const newWp = Wp / newScale;
    const newHp = Hp / newScale;
    const newMapLeft = mapCenterX - newWp / 2;
    const newMapTop = mapCenterY - newHp / 2;

    onSetPlayerViewport?.({
      x: -newMapLeft * newScale,
      y: -newMapTop * newScale,
      scale: newScale
    });
  }, [isPositionLocked, Wp, Hp, mapCenterX, mapCenterY, onSetPlayerViewport]);

  // Обработка перемещения мыши по всему экрану во время перетаскивания / изменения размера
  useEffect(() => {
    if (!isDragging && !activeResizeHandle) return;

    const handleMouseMove = (e: MouseEvent) => {
      const dmScale = dmViewport?.scale || 1;

      if (isDragging) {
        const dxScreen = e.clientX - dragStartRef.current.mouseX;
        const dyScreen = e.clientY - dragStartRef.current.mouseY;

        const dxMap = dxScreen / dmScale;
        const dyMap = dyScreen / dmScale;

        let targetMapLeft = dragStartRef.current.initialMapLeft + dxMap;
        let targetMapTop = dragStartRef.current.initialMapTop + dyMap;

        if (snapToGrid && gridSize > 0) {
          targetMapLeft = Math.round(targetMapLeft / gridSize) * gridSize;
          targetMapTop = Math.round(targetMapTop / gridSize) * gridSize;
        }

        onSetPlayerViewport?.({
          x: -targetMapLeft * sp,
          y: -targetMapTop * sp,
          scale: sp
        });
      } else if (activeResizeHandle) {
        const dxScreen = e.clientX - resizeStartRef.current.mouseX;
        const dyScreen = e.clientY - resizeStartRef.current.mouseY;

        const dxMap = dxScreen / dmScale;
        const dyMap = dyScreen / dmScale;

        let scaleMultiplier = 1;
        const initialW = resizeStartRef.current.initialMapWidth;
        const initialH = resizeStartRef.current.initialMapHeight;

        // В зависимости от направления ручки определяем изменение размера
        if (activeResizeHandle === 'se') {
          const factorX = 1 + (dxMap * 2) / initialW;
          const factorY = 1 + (dyMap * 2) / initialH;
          scaleMultiplier = 1 / ((factorX + factorY) / 2);
        } else if (activeResizeHandle === 'nw') {
          const factorX = 1 - (dxMap * 2) / initialW;
          const factorY = 1 - (dyMap * 2) / initialH;
          scaleMultiplier = 1 / ((factorX + factorY) / 2);
        } else if (activeResizeHandle === 'ne') {
          const factorX = 1 + (dxMap * 2) / initialW;
          const factorY = 1 - (dyMap * 2) / initialH;
          scaleMultiplier = 1 / ((factorX + factorY) / 2);
        } else if (activeResizeHandle === 'sw') {
          const factorX = 1 - (dxMap * 2) / initialW;
          const factorY = 1 + (dyMap * 2) / initialH;
          scaleMultiplier = 1 / ((factorX + factorY) / 2);
        } else if (activeResizeHandle === 'e') {
          scaleMultiplier = 1 / (1 + (dxMap * 2) / initialW);
        } else if (activeResizeHandle === 'w') {
          scaleMultiplier = 1 / (1 - (dxMap * 2) / initialW);
        } else if (activeResizeHandle === 's') {
          scaleMultiplier = 1 / (1 + (dyMap * 2) / initialH);
        } else if (activeResizeHandle === 'n') {
          scaleMultiplier = 1 / (1 - (dyMap * 2) / initialH);
        }

        const newScale = Math.min(
          Math.max(resizeStartRef.current.initialScale * scaleMultiplier, 0.12),
          4.5
        );

        const newWp = Wp / newScale;
        const newHp = Hp / newScale;

        const newMapLeft = resizeStartRef.current.initialCenterX - newWp / 2;
        const newMapTop = resizeStartRef.current.initialCenterY - newHp / 2;

        onSetPlayerViewport?.({
          x: -newMapLeft * newScale,
          y: -newMapTop * newScale,
          scale: newScale
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setActiveResizeHandle(null);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: false });
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [
    isDragging,
    activeResizeHandle,
    dmViewport,
    sp,
    Wp,
    Hp,
    snapToGrid,
    gridSize,
    onSetPlayerViewport
  ]);

  const zoomPercent = Math.round(sp * 100);

  // Цветовая схема рамки в зависимости от режима
  const getThemeClasses = () => {
    if (isPositionLocked) {
      return {
        border: 'border-amber-400',
        glow: 'shadow-[0_0_30px_rgba(245,158,11,0.5)]',
        bg: 'bg-amber-500/[0.03]',
        headerBg: 'bg-[#18150D]/95 border-amber-500/40 text-amber-200',
        badge: 'text-amber-400 bg-amber-500/20 border-amber-500/40',
        accentText: 'text-amber-400',
        handleBg: 'bg-amber-400 border-amber-200'
      };
    }
    if (isLinkedCamera) {
      return {
        border: 'border-[#F27D26]',
        glow: 'shadow-[0_0_30px_rgba(242,125,38,0.5)]',
        bg: 'bg-[#F27D26]/[0.03]',
        headerBg: 'bg-[#15120E]/95 border-[#F27D26]/40 text-white',
        badge: 'text-[#F27D26] bg-[#F27D26]/20 border-[#F27D26]/40',
        accentText: 'text-[#F27D26]',
        handleBg: 'bg-[#F27D26] border-white'
      };
    }
    return {
      border: 'border-[#00E5FF]',
      glow: 'shadow-[0_0_30px_rgba(0,229,255,0.5)]',
      bg: 'bg-[#00E5FF]/[0.03]',
      headerBg: 'bg-[#0B1519]/95 border-[#00E5FF]/40 text-white',
      badge: 'text-[#00E5FF] bg-[#00E5FF]/20 border-[#00E5FF]/40',
      accentText: 'text-[#00E5FF]',
      handleBg: 'bg-[#00E5FF] border-white'
    };
  };

  const theme = getThemeClasses();

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="absolute pointer-events-none transition-shadow will-change-transform"
      style={{
        left: `${mapLeft}px`,
        top: `${mapTop}px`,
        width: `${mapWidthVisible}px`,
        height: `${mapHeightVisible}px`,
        zIndex: 35
      }}
    >
      {/* РАМКА ВИДИМОЙ ОБЛАСТИ ИГРОКОВ */}
      <div
        className={`w-full h-full border-2 rounded-lg relative flex flex-col justify-between pointer-events-none transition-colors ${theme.border} ${theme.glow} ${theme.bg}`}
      >
        {/* ВЕРХНЯЯ ПАНЕЛЬ РАМКИ С ИНФОРМАЦИЕЙ И БЫСТРЫМИ ЭЛЕМЕНТАМИ УПРАВЛЕНИЯ */}
        <div
          onMouseDown={handleDragStart}
          className={`absolute -top-12 left-0 right-0 flex items-center justify-between gap-2 px-3 py-1.5 rounded-t-lg border-t border-x backdrop-blur shadow-2xl select-none pointer-events-auto transition-all ${
            theme.headerBg
          } ${isPositionLocked ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'}`}
        >
          {/* Левый блок: заголовок, разрешение и статус */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs font-bold font-mono tracking-wider">
              <Tv size={15} className={theme.accentText} />
              <span className="text-white uppercase tracking-wider font-sans font-extrabold text-[11px]">
                ВИД ИГРОКОВ
              </span>
              <span className="text-[10px] text-[#A0A5B1] font-normal">
                ({Wp}×{Hp} | <strong className="text-white font-bold">{zoomPercent}%</strong>)
              </span>
            </div>

            <div
              className={`flex items-center gap-1 text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                isConnected
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                  : 'bg-amber-500/20 text-amber-400 border-amber-500/40 animate-pulse'
              }`}
            >
              <Radio size={10} className={isConnected ? 'animate-pulse' : ''} />
              <span>{isConnected ? 'В ЭФИРЕ' : 'ОЖИДАНИЕ'}</span>
            </div>
          </div>

          {/* Правый блок: Кнопки быстрого управления режимом и зумом */}
          <div className="flex items-center gap-1">
            {/* Кнопка блокировки связи (Связана / Автономна) */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleLinkCamera?.();
              }}
              className={`px-2 py-1 rounded text-[10px] font-bold font-mono flex items-center gap-1 transition ${
                isLinkedCamera
                  ? 'bg-[#F27D26]/20 text-[#F27D26] border border-[#F27D26]/40 hover:bg-[#F27D26]/30'
                  : 'bg-[#00E5FF]/20 text-[#00E5FF] border border-[#00E5FF]/40 hover:bg-[#00E5FF]/30'
              }`}
              title={
                isLinkedCamera
                  ? 'Камера игроков синхронизирована с видом Мастера. Нажмите, чтобы отвязать (Автономно).'
                  : 'Камера игроков автономна. Нажмите, чтобы связать с видом Мастера.'
              }
            >
              {isLinkedCamera ? <Lock size={12} /> : <Unlock size={12} />}
              <span>{isLinkedCamera ? 'СВЯЗЬ' : 'АВТОНОМНО'}</span>
            </button>

            {/* Кнопка фиксации положения на холсте (Lock Position) */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleLockPosition?.();
              }}
              className={`p-1.5 rounded transition ${
                isPositionLocked
                  ? 'bg-amber-500 text-black font-bold shadow-md'
                  : 'text-[#8E9299] hover:text-white hover:bg-white/10'
              }`}
              title={
                isPositionLocked
                  ? 'Положение рамки зафиксировано на карте. Нажмите для разблокировки.'
                  : 'Зафиксировать рамку на карте от случайного сдвига мышью.'
              }
            >
              <Lock size={13} />
            </button>

            <div className="w-[1px] h-3.5 bg-[#333640] mx-0.5" />

            {/* Быстрые кнопки зума: Zoom Out, 100%, Zoom In */}
            <button
              disabled={isPositionLocked}
              onClick={(e) => handleQuickZoom(-0.1, e)}
              className="p-1 rounded text-[#8E9299] hover:text-white hover:bg-white/10 transition disabled:opacity-40"
              title="Уменьшить зум игроков (-10%)"
            >
              <ZoomOut size={13} />
            </button>

            <button
              disabled={isPositionLocked}
              onClick={handleResetZoom100}
              className="px-1.5 py-0.5 rounded text-[10px] font-mono text-[#8E9299] hover:text-white hover:bg-white/10 transition disabled:opacity-40"
              title="Сбросить масштаб на 100% (1:1)"
            >
              1:1
            </button>

            <button
              disabled={isPositionLocked}
              onClick={(e) => handleQuickZoom(0.1, e)}
              className="p-1 rounded text-[#8E9299] hover:text-white hover:bg-white/10 transition disabled:opacity-40"
              title="Увеличить зум игроков (+10%)"
            >
              <ZoomIn size={13} />
            </button>

            <div className="w-[1px] h-3.5 bg-[#333640] mx-0.5" />

            {/* Совместить с видом Мастера */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCenterPlayerOnDmView?.();
              }}
              className="p-1.5 rounded text-[#8E9299] hover:text-white hover:bg-white/10 transition"
              title="Отправить текущий вид Мастера игрокам"
            >
              <Crosshair size={13} />
            </button>

            {/* Переместить камеру Мастера к рамке */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCenterOnPlayerView?.();
              }}
              className="p-1.5 rounded text-[#8E9299] hover:text-white hover:bg-white/10 transition"
              title="Переместить экран Мастера к рамке игроков"
            >
              <Eye size={13} />
            </button>

            {/* Вписать всю карту */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onFitMapForPlayers?.();
              }}
              className="p-1.5 rounded text-[#8E9299] hover:text-white hover:bg-white/10 transition"
              title="Вписать всю карту в экран игроков"
            >
              <Maximize2 size={13} />
            </button>

            {/* Открыть панель точного управления (Inspector) */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenPrecisionPanel?.();
              }}
              className="p-1.5 rounded bg-[#26282E] hover:bg-[#363842] text-[#38BDF8] hover:text-white transition shadow"
              title="Открыть панель точной настройки (координаты, Nudge, разрешение)"
            >
              <Sliders size={13} />
            </button>
          </div>
        </div>

        {/* УГЛОВЫЕ МАРКЕРЫ ВИДОИСКАТЕЛЯ (BRACKETS) */}
        <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-white pointer-events-none" />
        <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-white pointer-events-none" />
        <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-white pointer-events-none" />
        <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-white pointer-events-none" />

        {/* ЦЕНТРАЛЬНЫЙ МАРКЕР / КНОПКА ПЕРЕТАСКИВАНИЯ */}
        <div className="m-auto pointer-events-auto">
          {isPositionLocked ? (
            <div className="px-3.5 py-1.5 rounded-full bg-black/85 border border-amber-500/50 text-amber-300 text-xs font-bold tracking-wider flex items-center gap-1.5 shadow-2xl backdrop-blur select-none">
              <Lock size={13} className="text-amber-400" />
              <span>ПОЛОЖЕНИЕ ЗАФИКСИРОВАНО</span>
            </div>
          ) : (
            <div
              onMouseDown={handleDragStart}
              className={`px-3.5 py-1.5 rounded-full bg-black/85 border text-white text-xs font-bold tracking-wider flex items-center gap-1.5 shadow-2xl backdrop-blur select-none cursor-grab active:cursor-grabbing hover:scale-105 transition-transform ${
                isLinkedCamera ? 'border-[#F27D26]/60 text-white' : 'border-[#00E5FF]/60 text-white'
              }`}
            >
              <Move size={14} className={theme.accentText} />
              <span>ПЕРЕТАЩИТЬ ВИД ИГРОКОВ</span>
            </div>
          )}
        </div>

        {/* 8 ТОЧЕК МАСШТАБИРОВАНИЯ (RESIZE HANDLES) - скрыты при блокировке */}
        {!isPositionLocked && (
          <>
            {/* 1. Северо-запад (Top-Left) */}
            <div
              onMouseDown={(e) => handleResizeStart('nw', e)}
              className={`absolute -top-2.5 -left-2.5 w-5 h-5 rounded-full border-2 cursor-nwse-resize hover:scale-125 transition-transform shadow-lg pointer-events-auto ${theme.handleBg}`}
              title="Масштабировать вид игроков (NW)"
            />

            {/* 2. Северо-восток (Top-Right) */}
            <div
              onMouseDown={(e) => handleResizeStart('ne', e)}
              className={`absolute -top-2.5 -right-2.5 w-5 h-5 rounded-full border-2 cursor-nesw-resize hover:scale-125 transition-transform shadow-lg pointer-events-auto ${theme.handleBg}`}
              title="Масштабировать вид игроков (NE)"
            />

            {/* 3. Юго-восток (Bottom-Right) */}
            <div
              onMouseDown={(e) => handleResizeStart('se', e)}
              className={`absolute -bottom-2.5 -right-2.5 w-5 h-5 rounded-full border-2 cursor-nwse-resize hover:scale-125 transition-transform shadow-lg pointer-events-auto ${theme.handleBg}`}
              title="Масштабировать вид игроков (SE)"
            />

            {/* 4. Юго-запад (Bottom-Left) */}
            <div
              onMouseDown={(e) => handleResizeStart('sw', e)}
              className={`absolute -bottom-2.5 -left-2.5 w-5 h-5 rounded-full border-2 cursor-nesw-resize hover:scale-125 transition-transform shadow-lg pointer-events-auto ${theme.handleBg}`}
              title="Масштабировать вид игроков (SW)"
            />

            {/* 5. Верхняя грань (North) */}
            <div
              onMouseDown={(e) => handleResizeStart('n', e)}
              className={`absolute -top-1.5 left-1/2 -translate-x-1/2 w-8 h-3 rounded-full border cursor-ns-resize hover:scale-110 transition-transform shadow-md pointer-events-auto ${theme.handleBg}`}
              title="Масштабировать вид игроков по вертикали"
            />

            {/* 6. Нижняя грань (South) */}
            <div
              onMouseDown={(e) => handleResizeStart('s', e)}
              className={`absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-8 h-3 rounded-full border cursor-ns-resize hover:scale-110 transition-transform shadow-md pointer-events-auto ${theme.handleBg}`}
              title="Масштабировать вид игроков по вертикали"
            />

            {/* 7. Левая грань (West) */}
            <div
              onMouseDown={(e) => handleResizeStart('w', e)}
              className={`absolute top-1/2 -left-1.5 -translate-y-1/2 w-3 h-8 rounded-full border cursor-ew-resize hover:scale-110 transition-transform shadow-md pointer-events-auto ${theme.handleBg}`}
              title="Масштабировать вид игроков по горизонтали"
            />

            {/* 8. Правая грань (East) */}
            <div
              onMouseDown={(e) => handleResizeStart('e', e)}
              className={`absolute top-1/2 -right-1.5 -translate-y-1/2 w-3 h-8 rounded-full border cursor-ew-resize hover:scale-110 transition-transform shadow-md pointer-events-auto ${theme.handleBg}`}
              title="Масштабировать вид игроков по горизонтали"
            />
          </>
        )}

        {/* ПЛАВАЮЩИЙ ТУЛТИП С ТОЧНЫМИ КООРДИНАТАМИ ВО ВРЕМЯ ДЕЙСТВИЯ */}
        {(isDragging || activeResizeHandle) && (
          <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 px-3 py-1 bg-black/90 border border-white/30 rounded-lg text-[11px] font-mono text-white shadow-2xl pointer-events-none flex items-center gap-2 whitespace-nowrap z-50">
            <span>Зум: <strong className="text-emerald-400">{zoomPercent}%</strong></span>
            <span className="text-[#6C707A]">|</span>
            <span>Карта: <strong>{Math.round(mapWidthVisible)}×{Math.round(mapHeightVisible)}px</strong></span>
            <span className="text-[#6C707A]">|</span>
            <span>X: <strong>{Math.round(mapLeft)}</strong>, Y: <strong>{Math.round(mapTop)}</strong></span>
          </div>
        )}
      </div>
    </div>
  );
});
