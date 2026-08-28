/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Экран проектора / экран игроков (Player View).
 * Тема: Hardware / Specialist Tool
 * Особенности:
 * - 100% черный непроницаемый туман войны (pitch-black fog).
 * - Нулевые отвлекающие элементы для максимального погружения.
 * - Прием данных через BroadcastChannel без накладных расходов.
 * - Кнопка перехода в полноэкранный режим в стиле Hardware Tool.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  MediaItem,
  ViewportTransform,
  GridConfig,
  MapPing,
  BroadcastMessage
} from '../types';
import { GridOverlay } from './GridOverlay';
import { PingOverlay } from './PingOverlay';
import { mediaManager } from '../services/mediaManager';
import { syncService } from '../services/syncChannel';
import { Maximize2, Minimize2 } from 'lucide-react';

export const PlayerView: React.FC = () => {
  const [media, setMedia] = useState<MediaItem | null>(null);
  const [viewport, setViewport] = useState<ViewportTransform>({ x: 0, y: 0, scale: 1 });
  const [grid, setGrid] = useState<GridConfig>({
    enabled: false,
    size: 50,
    color: 'rgba(255, 255, 255, 0.25)',
    opacity: 0.5,
    offsetX: 0,
    offsetY: 0
  });
  const [pings, setPings] = useState<MapPing[]>([]);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showControls, setShowControls] = useState<boolean>(false);

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

    // Изначально всё залито непроницаемым 100% черным цветом
    ctx.globalAlpha = 1.0;
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);
  };

  // Слушатель сообщений от мастера
  useEffect(() => {
    // Начальная инициализация
    initFogCanvas(1920, 1080);

    const unsubscribe = syncService.subscribe((message: BroadcastMessage) => {
      if (message.type === 'SET_MEDIA') {
        const load = async () => {
          if (message.blob) {
            const item = await mediaManager.loadFromBlob(
              message.blob,
              message.name,
              message.mediaType,
              message.width,
              message.height
            );
            setMedia(item);
            initFogCanvas(item.width, item.height);
          }
        };
        load();
      } else if (message.type === 'SYNC_VIEWPORT') {
        setViewport(message.transform);
      } else if (message.type === 'SYNC_GRID') {
        setGrid(message.grid);
      } else if (message.type === 'FOG_STROKE') {
        const { mode, radius, points } = message.stroke;
        const ctx = fogCtxRef.current;
        if (!ctx || !points || points.length === 0) return;

        ctx.save();
        ctx.globalAlpha = 1.0;

        if (mode === 'reveal') {
          // Открытие тумана: стирание черного слоя
          ctx.globalCompositeOperation = 'destination-out';
          ctx.strokeStyle = 'rgba(0, 0, 0, 1)';
          ctx.fillStyle = 'rgba(0, 0, 0, 1)';
        } else {
          // Сокрытие туманом: наложение черного
          ctx.globalCompositeOperation = 'source-over';
          ctx.strokeStyle = '#000000';
          ctx.fillStyle = '#000000';
        }

        ctx.lineWidth = radius * 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        if (points.length === 1) {
          ctx.beginPath();
          ctx.arc(points[0].x, points[0].y, radius, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.moveTo(points[0].x, points[0].y);
          for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y);
          }
          ctx.stroke();
        }

        ctx.restore();
      } else if (message.type === 'FOG_FILL_ALL') {
        const ctx = fogCtxRef.current;
        if (ctx && canvasRef.current) {
          ctx.save();
          ctx.globalAlpha = 1.0;
          ctx.globalCompositeOperation = 'source-over';
          ctx.fillStyle = '#000000';
          ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
          ctx.restore();
        }
      } else if (message.type === 'FOG_CLEAR_ALL') {
        const ctx = fogCtxRef.current;
        if (ctx && canvasRef.current) {
          ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        }
      } else if (message.type === 'PING_LOCATION') {
        setPings((prev) => [...prev, message.ping]);
        setTimeout(() => {
          setPings((prev) => prev.filter((p) => p.id !== message.ping.id));
        }, 3000);
      } else if (message.type === 'SYNC_FULL_STATE') {
        const s = message.state;
        if (s.viewport) setViewport(s.viewport);
        if (s.grid) setGrid(s.grid);

        if (s.maskDataUrl && canvasRef.current && fogCtxRef.current) {
          const img = new Image();
          img.onload = () => {
            if (canvasRef.current && fogCtxRef.current) {
              fogCtxRef.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
              fogCtxRef.current.globalAlpha = 1.0;
              fogCtxRef.current.globalCompositeOperation = 'source-over';
              fogCtxRef.current.drawImage(img, 0, 0);
            }
          };
          img.src = s.maskDataUrl;
        }
      }
    });

    // Отправляем запрос мастеру на синхронизацию текущего состояния
    syncService.send({ type: 'HANDSHAKE_REQUEST' });

    return () => {
      unsubscribe();
      mediaManager.destroy();
    };
  }, []);

  // Управление полноэкранным режимом
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // Авто-скрытие кнопки полноэкранного режима при отсутствии движения мыши
  const handleMouseMove = () => {
    setShowControls(true);
    if (hideControlsTimerRef.current) clearTimeout(hideControlsTimerRef.current);
    hideControlsTimerRef.current = setTimeout(() => {
      setShowControls(false);
    }, 2500);
  };

  const mediaWidth = media?.width || 1920;
  const mediaHeight = media?.height || 1080;

  return (
    <div
      id="player-view-root"
      onMouseMove={handleMouseMove}
      onDoubleClick={toggleFullscreen}
      className="relative w-screen h-screen bg-black overflow-hidden select-none cursor-none font-sans"
    >
      {/* Контейнер трансформируемой карты */}
      <div
        id="player-map-container"
        style={{
          transform: `translate3d(${viewport.x}px, ${viewport.y}px, 0) scale(${viewport.scale})`,
          transformOrigin: '0 0',
          width: `${mediaWidth}px`,
          height: `${mediaHeight}px`
        }}
        className="absolute top-0 left-0 will-change-transform"
      >
        {/* Отображение медиа */}
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
            alt="Battlemap"
            className="block pointer-events-none select-none max-w-none"
            style={{ width: `${mediaWidth}px`, height: `${mediaHeight}px` }}
          />
        ) : (
          <div
            className="bg-black flex items-center justify-center text-[#8E9299] text-xs font-mono"
            style={{ width: `${mediaWidth}px`, height: `${mediaHeight}px` }}
          >
            <span>WAITING FOR DM TRANSMISSION (VTT-ZERO)...</span>
          </div>
        )}

        {/* 100% Черный туман войны */}
        <canvas
          ref={canvasRef}
          id="player-fog-canvas"
          width={mediaWidth}
          height={mediaHeight}
          className="absolute top-0 left-0 pointer-events-none"
        />

        {/* Сетка */}
        <GridOverlay grid={grid} width={mediaWidth} height={mediaHeight} />

        {/* Маркеры мастера */}
        <PingOverlay pings={pings} />
      </div>

      {/* Кнопка полноэкранного режима с автоскрытием в стиле Hardware */}
      <div
        className={`fixed bottom-4 right-4 z-50 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <button
          onClick={toggleFullscreen}
          className="flex items-center gap-2 bg-[#151619]/90 hover:bg-[#2A2A2A] text-[#E0E0E0] hover:text-white px-3.5 py-2 rounded border border-[#2A2A2A] hover:border-[#F27D26] shadow-2xl backdrop-blur font-mono text-[10px] uppercase tracking-wider cursor-pointer transition"
          title="Развернуть на полный экран (F11 или двойной клик)"
        >
          {isFullscreen ? <Minimize2 size={13} className="text-[#F27D26]" /> : <Maximize2 size={13} className="text-[#F27D26]" />}
          <span>{isFullscreen ? 'WINDOWED' : 'FULLSCREEN (F11)'}</span>
        </button>
      </div>
    </div>
  );
};
