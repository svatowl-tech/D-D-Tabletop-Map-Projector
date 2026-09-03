/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Компонент визуальной рамки вьюпорта игроков (Player Viewport Frame).
 * Отображает на карте мастера точный прямоугольник того, что видят игроки на 2-м экране,
 * с поддержкой перетаскивания рамки, масштабирования и мгновенной синхронизации.
 */

import React, { useState, useRef, useEffect } from 'react';
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
  Move
} from 'lucide-react';

interface Props {
  playerViewport?: ViewportTransform;
  playerScreenSize?: { width: number; height: number };
  dmViewport?: ViewportTransform;
  isLinkedCamera?: boolean;
  isConnected?: boolean;
  mapWidth?: number;
  mapHeight?: number;
  onToggleLinkCamera?: () => void;
  onSetPlayerViewport?: (viewport: ViewportTransform) => void;
  onCenterOnPlayerView?: () => void;
  onCenterPlayerOnDmView?: () => void;
  onFitMapForPlayers?: () => void;
}

export const PlayerViewportFrameOverlay: React.FC<Props> = ({
  playerViewport = { x: 0, y: 0, scale: 1 },
  playerScreenSize = { width: 1920, height: 1080 },
  dmViewport = { x: 0, y: 0, scale: 1 },
  isLinkedCamera = true,
  isConnected = false,
  mapWidth = 1920,
  mapHeight = 1080,
  onToggleLinkCamera,
  onSetPlayerViewport,
  onCenterOnPlayerView,
  onCenterPlayerOnDmView,
  onFitMapForPlayers
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; initialVx: number; initialVy: number }>({
    mouseX: 0,
    mouseY: 0,
    initialVx: 0,
    initialVy: 0
  });

  const resizeStartRef = useRef<{ mouseX: number; mouseY: number; initialScale: number }>({
    mouseX: 0,
    mouseY: 0,
    initialScale: 1
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

  // Начало перетаскивания рамки по карте
  const handleDragStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDragging(true);
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      initialVx: xp,
      initialVy: yp
    };
  };

  // Начало масштабирования рамки (изменение зума игроков)
  const handleResizeStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsResizing(true);
    resizeStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      initialScale: sp
    };
  };

  useEffect(() => {
    if (!isDragging && !isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const dxScreen = e.clientX - dragStartRef.current.mouseX;
        const dyScreen = e.clientY - dragStartRef.current.mouseY;

        // Перевод пикселей экрана Мастера в пиксели карты с учетом зума Мастера
        const dmScale = dmViewport?.scale || 1;
        const dxMap = dxScreen / dmScale;
        const dyMap = dyScreen / dmScale;

        // Новые координаты вьюпорта игроков
        const newXp = dragStartRef.current.initialVx - dxMap * sp;
        const newYp = dragStartRef.current.initialVy - dyMap * sp;

        onSetPlayerViewport?.({
          x: newXp,
          y: newYp,
          scale: sp
        });
      } else if (isResizing) {
        const dxScreen = e.clientX - resizeStartRef.current.mouseX;
        const dmScale = dmViewport?.scale || 1;
        const dxMap = dxScreen / dmScale;

        // Изменение размера рамки изменяет масштаб игроков
        const scaleChangeFactor = 1 - dxMap / mapWidthVisible;
        const newScale = Math.min(Math.max(resizeStartRef.current.initialScale * scaleChangeFactor, 0.15), 4.0);

        // Пересчет позиции для сохранения центра
        const centerX = mapLeft + mapWidthVisible / 2;
        const centerY = mapTop + mapHeightVisible / 2;

        const newWp = Wp / newScale;
        const newHp = Hp / newScale;

        const newMapLeft = centerX - newWp / 2;
        const newMapTop = centerY - newHp / 2;

        onSetPlayerViewport?.({
          x: -newMapLeft * newScale,
          y: -newMapTop * newScale,
          scale: newScale
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, dmViewport, sp, xp, yp, mapLeft, mapTop, mapWidthVisible, mapHeightVisible, Wp, Hp, onSetPlayerViewport]);

  const zoomPercent = Math.round(sp * 100);

  return (
    <div
      className="absolute pointer-events-none transition-shadow"
      style={{
        left: `${mapLeft}px`,
        top: `${mapTop}px`,
        width: `${mapWidthVisible}px`,
        height: `${mapHeightVisible}px`,
        zIndex: 35
      }}
    >
      {/* Рамка видимой области игроков */}
      <div
        className={`w-full h-full border-2 rounded-lg relative flex flex-col justify-between pointer-events-none transition-colors ${
          isLinkedCamera
            ? 'border-[#F27D26] shadow-[0_0_25px_rgba(242,125,38,0.45)] bg-[#F27D26]/[0.02]'
            : 'border-[#00E5FF] shadow-[0_0_25px_rgba(0,229,255,0.45)] bg-[#00E5FF]/[0.02]'
        }`}
      >
        {/* ВЕРХНЯЯ ПАНЕЛЬ РАМКИ С ИНФОРМАЦИЕЙ И КНОПКАМИ БЫСТРОГО УПРАВЛЕНИЯ */}
        <div
          onMouseDown={handleDragStart}
          className="absolute -top-11 left-0 right-0 flex items-center justify-between gap-2 px-3 py-1.5 rounded-t-md bg-[#111215]/95 border-t border-x border-[#2A2B30] text-white backdrop-blur shadow-xl select-none pointer-events-auto cursor-grab active:cursor-grabbing"
        >
          {/* Левый блок: статус подключения и разрешение */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs font-bold font-mono tracking-wider">
              <Tv size={14} className={isLinkedCamera ? 'text-[#F27D26]' : 'text-[#00E5FF]'} />
              <span className="text-white uppercase tracking-wider">ВИД ИГРОКОВ</span>
              <span className="text-[10px] text-[#8E9299] font-normal">
                ({Wp}×{Hp} | {zoomPercent}%)
              </span>
            </div>

            <div
              className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                isConnected
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/40 animate-pulse'
              }`}
            >
              <Radio size={10} className={isConnected ? 'animate-pulse' : ''} />
              <span>{isConnected ? 'В ЭФИРЕ' : 'ОЖИДАНИЕ'}</span>
            </div>
          </div>

          {/* Правый блок: Быстрые действия с камерой */}
          <div className="flex items-center gap-1">
            {/* Кнопка блокировки/связи камеры */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleLinkCamera?.();
              }}
              className={`p-1.5 rounded hover:bg-white/10 transition flex items-center gap-1 text-[11px] font-bold ${
                isLinkedCamera ? 'text-[#F27D26]' : 'text-[#00E5FF]'
              }`}
              title={
                isLinkedCamera
                  ? 'Камера игроков привязана к камере Мастера. Нажмите, чтобы отвязать.'
                  : 'Камера игроков зафиксирована. Нажмите, чтобы привязать к Мастеру.'
              }
            >
              {isLinkedCamera ? <Lock size={13} /> : <Unlock size={13} />}
              <span>{isLinkedCamera ? 'СВЯЗАНА' : 'АВТОНОМНА'}</span>
            </button>

            <div className="w-[1px] h-3 bg-[#2A2B30]" />

            {/* Совместить с видом мастера */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCenterPlayerOnDmView?.();
              }}
              className="p-1.5 rounded hover:bg-white/10 text-[#8E9299] hover:text-white transition"
              title="Привязать вид игроков к текущему виду Мастера"
            >
              <Crosshair size={13} />
            </button>

            {/* Переместить камеру мастера к игрокам */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCenterOnPlayerView?.();
              }}
              className="p-1.5 rounded hover:bg-white/10 text-[#8E9299] hover:text-white transition"
              title="Переместить камеру Мастера к центру рамки игроков"
            >
              <Eye size={13} />
            </button>

            {/* Вписать карту полностью */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onFitMapForPlayers?.();
              }}
              className="p-1.5 rounded hover:bg-white/10 text-[#8E9299] hover:text-white transition"
              title="Вписать всю карту на экран игроков"
            >
              <Maximize2 size={13} />
            </button>
          </div>
        </div>

        {/* Угловые маркеры видоискателя */}
        <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-white pointer-events-none" />
        <div className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-white pointer-events-none" />
        <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-white pointer-events-none" />
        <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-white pointer-events-none" />

        {/* Индикатор перетаскивания в центре */}
        <div
          onMouseDown={handleDragStart}
          className="m-auto px-3 py-1.5 rounded-full bg-black/80 border border-white/20 text-white/80 hover:text-white hover:bg-black text-xs font-bold tracking-wider flex items-center gap-1.5 shadow-lg backdrop-blur select-none cursor-grab active:cursor-grabbing"
        >
          <Move size={14} className="text-[#F27D26]" />
          <span>ПЕРЕТАЩИТЬ ВИД ИГРОКОВ</span>
        </div>

        {/* Ручка масштабирования в правом нижнем углу */}
        <div
          onMouseDown={handleResizeStart}
          className="absolute -bottom-3 -right-3 w-6 h-6 bg-[#111215] border-2 border-[#F27D26] rounded-full flex items-center justify-center cursor-nwse-resize hover:scale-125 transition-transform shadow-lg pointer-events-auto"
          title="Потяните для изменения зума игроков"
        >
          <ZoomIn size={12} className="text-[#F27D26]" />
        </div>
      </div>
    </div>
  );
};
