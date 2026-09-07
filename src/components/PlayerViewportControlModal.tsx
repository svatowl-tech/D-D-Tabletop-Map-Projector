/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Модальное окно точного управления экраном игроков (Projector Viewport Controller).
 * Предоставляет Мастеру полный контроль над положением рамки, зумом, пошаговыми стрелками (Nudge),
 * привязкой к сетке, выбором разрешения экрана и фиксацией положения,
 * полностью независимо от перемещений и масштаба экрана Мастера.
 */

import React, { useState } from 'react';
import { ViewportTransform, GridConfig } from '../types';
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
  RotateCcw,
  Sliders,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Monitor,
  Grid,
  Sparkles,
  X,
  Compass,
  ArrowUpRight,
  Layers,
  Minimize2
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  playerViewport: ViewportTransform;
  dmViewport: ViewportTransform;
  playerScreenSize: { width: number; height: number };
  isLinkedCamera: boolean;
  isPositionLocked: boolean;
  isConnected: boolean;
  mapWidth: number;
  mapHeight: number;
  grid: GridConfig;
  onToggleLinkCamera: () => void;
  onToggleLockPosition: () => void;
  onSetPlayerViewport: (viewport: ViewportTransform) => void;
  onSetPlayerScreenSize: (size: { width: number; height: number }) => void;
  onCenterOnPlayerView: () => void;
  onCenterPlayerOnDmView: () => void;
  onFitMapForPlayers: () => void;
}

const RESOLUTION_PRESETS = [
  { label: '1920 × 1080 (16:9 Full HD)', width: 1920, height: 1080, aspect: '16:9' },
  { label: '2560 × 1440 (16:9 2K QHD)', width: 2560, height: 1440, aspect: '16:9' },
  { label: '3840 × 2160 (16:9 4K UHD)', width: 3840, height: 2160, aspect: '16:9' },
  { label: '1280 × 720 (16:9 HD Ready)', width: 1280, height: 720, aspect: '16:9' },
  { label: '1920 × 1200 (16:10 WUXGA)', width: 1920, height: 1200, aspect: '16:10' },
  { label: '1024 × 768 (4:3 XGA)', width: 1024, height: 768, aspect: '4:3' },
  { label: '2560 × 1080 (21:9 Ultrawide)', width: 2560, height: 1080, aspect: '21:9' }
];

const ZOOM_PRESETS = [0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 2.0, 3.0];

export const PlayerViewportControlModal: React.FC<Props> = ({
  isOpen,
  onClose,
  playerViewport,
  dmViewport,
  playerScreenSize,
  isLinkedCamera,
  isPositionLocked,
  isConnected,
  mapWidth,
  mapHeight,
  grid,
  onToggleLinkCamera,
  onToggleLockPosition,
  onSetPlayerViewport,
  onSetPlayerScreenSize,
  onCenterOnPlayerView,
  onCenterPlayerOnDmView,
  onFitMapForPlayers
}) => {
  const [nudgeStepType, setNudgeStepType] = useState<'grid' | '10px' | '50px' | '100px'>('grid');
  const [customWidth, setCustomWidth] = useState<string>(String(playerScreenSize.width || 1920));
  const [customHeight, setCustomHeight] = useState<string>(String(playerScreenSize.height || 1080));

  if (!isOpen) return null;

  const sp = playerViewport?.scale || 1;
  const xp = playerViewport?.x || 0;
  const yp = playerViewport?.y || 0;
  const Wp = playerScreenSize?.width || 1920;
  const Hp = playerScreenSize?.height || 1080;

  const mapLeft = Math.round(-xp / sp);
  const mapTop = Math.round(-yp / sp);
  const mapWidthVisible = Math.round(Wp / sp);
  const mapHeightVisible = Math.round(Hp / sp);
  const mapCenterX = Math.round(mapLeft + mapWidthVisible / 2);
  const mapCenterY = Math.round(mapTop + mapHeightVisible / 2);

  const gridSize = grid.enabled && grid.size > 0 ? grid.size : 50;
  const gridCellX = Math.floor(mapLeft / gridSize);
  const gridCellY = Math.floor(mapTop / gridSize);

  // Вычисление величины шага в пикселях карты
  const getNudgeDeltaPx = (): number => {
    switch (nudgeStepType) {
      case 'grid':
        return gridSize;
      case '10px':
        return 10;
      case '50px':
        return 50;
      case '100px':
        return 100;
      default:
        return 50;
    }
  };

  // Пошаговый сдвиг рамки
  const handleNudge = (dxMap: number, dyMap: number) => {
    if (isPositionLocked) return;
    const newMapLeft = mapLeft + dxMap;
    const newMapTop = mapTop + dyMap;
    onSetPlayerViewport({
      x: -newMapLeft * sp,
      y: -newMapTop * sp,
      scale: sp
    });
  };

  // Изменение зума с сохранением центра
  const handleSetZoom = (newScale: number) => {
    const clampedScale = Math.min(Math.max(newScale, 0.1), 5.0);
    const newWp = Wp / clampedScale;
    const newHp = Hp / clampedScale;
    const newMapLeft = mapCenterX - newWp / 2;
    const newMapTop = mapCenterY - newHp / 2;

    onSetPlayerViewport({
      x: -newMapLeft * clampedScale,
      y: -newMapTop * clampedScale,
      scale: clampedScale
    });
  };

  // Привязка к сетке
  const handleSnapToGrid = () => {
    if (isPositionLocked) return;
    const snappedLeft = Math.round(mapLeft / gridSize) * gridSize;
    const snappedTop = Math.round(mapTop / gridSize) * gridSize;
    onSetPlayerViewport({
      x: -snappedLeft * sp,
      y: -snappedTop * sp,
      scale: sp
    });
  };

  // Центрировать на всю карту
  const handleCenterOnMap = () => {
    if (isPositionLocked) return;
    const newMapLeft = (mapWidth - mapWidthVisible) / 2;
    const newMapTop = (mapHeight - mapHeightVisible) / 2;
    onSetPlayerViewport({
      x: -newMapLeft * sp,
      y: -newMapTop * sp,
      scale: sp
    });
  };

  // Вписать по ширине карты
  const handleFitWidth = () => {
    const newScale = Wp / (mapWidth || 1920);
    const newHp = Hp / newScale;
    const newMapTop = (mapHeight - newHp) / 2;
    onSetPlayerViewport({
      x: 0,
      y: -newMapTop * newScale,
      scale: newScale
    });
  };

  // Вписать по высоте карты
  const handleFitHeight = () => {
    const newScale = Hp / (mapHeight || 1080);
    const newWp = Wp / newScale;
    const newMapLeft = (mapWidth - newWp) / 2;
    onSetPlayerViewport({
      x: -newMapLeft * newScale,
      y: 0,
      scale: newScale
    });
  };

  // Применение кастомного разрешения
  const handleApplyCustomResolution = () => {
    const w = parseInt(customWidth, 10);
    const h = parseInt(customHeight, 10);
    if (!isNaN(w) && !isNaN(h) && w >= 320 && h >= 240) {
      onSetPlayerScreenSize({ width: w, height: h });
    }
  };

  const currentZoomPercent = Math.round(sp * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-[#111215] border border-[#2A2B30] rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-white font-sans">
        {/* ШАПКА МОДАЛЬНОГО ОКНА */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#22242A] bg-[#16171B]/90">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl border ${
              isPositionLocked
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                : isLinkedCamera
                ? 'bg-[#F27D26]/10 border-[#F27D26]/30 text-[#F27D26]'
                : 'bg-[#00E5FF]/10 border-[#00E5FF]/30 text-[#00E5FF]'
            }`}>
              <Tv size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-wide">
                  УПРАВЛЕНИЕ ЭКРАНОМ ИГРОКОВ
                </h3>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono tracking-wider border ${
                  isConnected
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                    : 'bg-amber-500/20 text-amber-400 border-amber-500/40 animate-pulse'
                }`}>
                  {isConnected ? 'В ЭФИРЕ' : 'ОЖИДАНИЕ'}
                </span>
              </div>
              <p className="text-xs text-[#8E9299]">
                Точное позиционирование, зум и фиксация области показа на 2-м экране
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#8E9299] hover:text-white hover:bg-white/10 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* ОСНОВНОЕ ТЕЛО С НАСТРОЙКАМИ */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-sm">
          {/* 1. РЕЖИМ СВЯЗИ И ФИКСАЦИИ (3 КНОПКИ-СТАТУСА) */}
          <div className="bg-[#18191E] border border-[#26282E] rounded-xl p-3.5 space-y-2.5">
            <label className="text-xs font-bold text-[#A0A5B1] uppercase tracking-wider flex items-center gap-1.5">
              <Compass size={14} className="text-[#F27D26]" />
              РЕЖИМ ПОВЕДЕНИЯ КАМЕРЫ ИГРОКОВ
            </label>

            <div className="grid grid-cols-3 gap-2">
              {/* Режим: Связана */}
              <button
                onClick={() => {
                  if (!isLinkedCamera) onToggleLinkCamera();
                  if (isPositionLocked) onToggleLockPosition();
                }}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition ${
                  isLinkedCamera && !isPositionLocked
                    ? 'bg-[#F27D26]/15 border-[#F27D26] text-white shadow-lg'
                    : 'bg-[#111215] border-[#2A2B30] text-[#8E9299] hover:text-white hover:border-[#3A3B42]'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs mb-1">
                  <Lock size={14} className={isLinkedCamera && !isPositionLocked ? 'text-[#F27D26]' : ''} />
                  <span>СВЯЗАНА</span>
                </div>
                <span className="text-[10px] text-[#A0A5B1] leading-tight">
                  Повторяет вид Мастера в реальном времени
                </span>
              </button>

              {/* Режим: Автономна */}
              <button
                onClick={() => {
                  if (isLinkedCamera) onToggleLinkCamera();
                  if (isPositionLocked) onToggleLockPosition();
                }}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition ${
                  !isLinkedCamera && !isPositionLocked
                    ? 'bg-[#00E5FF]/15 border-[#00E5FF] text-white shadow-lg'
                    : 'bg-[#111215] border-[#2A2B30] text-[#8E9299] hover:text-white hover:border-[#3A3B42]'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs mb-1">
                  <Unlock size={14} className={!isLinkedCamera && !isPositionLocked ? 'text-[#00E5FF]' : ''} />
                  <span>АВТОНОМНА</span>
                </div>
                <span className="text-[10px] text-[#A0A5B1] leading-tight">
                  Свободный показ, Мастер зумит/двигает карту отдельно
                </span>
              </button>

              {/* Режим: Зафиксирована */}
              <button
                onClick={onToggleLockPosition}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition ${
                  isPositionLocked
                    ? 'bg-amber-500/20 border-amber-400 text-amber-200 shadow-lg'
                    : 'bg-[#111215] border-[#2A2B30] text-[#8E9299] hover:text-white hover:border-[#3A3B42]'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs mb-1">
                  <Lock size={14} className={isPositionLocked ? 'text-amber-400' : ''} />
                  <span>ЗАФИКСИРОВАТЬ</span>
                </div>
                <span className="text-[10px] text-[#A0A5B1] leading-tight">
                  Защита от случайного сдвига рамки мышью на холсте
                </span>
              </button>
            </div>
          </div>

          {/* 2. ТОЧНОЕ ПОЗИЦИОНИРОВАНИЕ И МИНИ-ДЖОЙСТИК (NUDGE CONTROLS) */}
          <div className="bg-[#18191E] border border-[#26282E] rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#A0A5B1] uppercase tracking-wider flex items-center gap-1.5">
                <Move size={14} className="text-[#38BDF8]" />
                ТОЧНОЕ ПЕРЕМЕЩЕНИЕ ПО КАРТЕ (NUDGE)
              </label>

              {/* Выбор шага сдвига */}
              <div className="flex items-center gap-1 bg-[#111215] p-1 rounded-lg border border-[#2A2B30] text-[11px] font-mono">
                <span className="text-[#6C707A] px-1.5">Шаг:</span>
                {(['grid', '10px', '50px', '100px'] as const).map((step) => (
                  <button
                    key={step}
                    onClick={() => setNudgeStepType(step)}
                    className={`px-2 py-0.5 rounded transition ${
                      nudgeStepType === step
                        ? 'bg-[#F27D26] text-white font-bold'
                        : 'text-[#8E9299] hover:text-white'
                    }`}
                  >
                    {step === 'grid' ? `Клетка (${gridSize}px)` : step}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
              {/* Джойстик стрелок */}
              <div className="flex flex-col items-center justify-center p-2 bg-[#111215] border border-[#22242A] rounded-xl">
                <div className="flex justify-center mb-1">
                  <button
                    disabled={isPositionLocked}
                    onClick={() => handleNudge(0, -getNudgeDeltaPx())}
                    className="p-2.5 rounded-lg bg-[#1F2024] hover:bg-[#2A2B30] text-white transition active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
                    title="Сдвинуть вверх"
                  >
                    <ChevronUp size={18} />
                  </button>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    disabled={isPositionLocked}
                    onClick={() => handleNudge(-getNudgeDeltaPx(), 0)}
                    className="p-2.5 rounded-lg bg-[#1F2024] hover:bg-[#2A2B30] text-white transition active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
                    title="Сдвинуть влево"
                  >
                    <ChevronLeft size={18} />
                  </button>

                  <button
                    disabled={isPositionLocked}
                    onClick={handleSnapToGrid}
                    className="px-3 py-2 rounded-lg bg-[#26282E] hover:bg-[#32353D] text-[#38BDF8] font-mono text-[11px] font-bold transition active:scale-95 disabled:opacity-40"
                    title="Привязать к ближайшей клетке сетки"
                  >
                    СЕТКА
                  </button>

                  <button
                    disabled={isPositionLocked}
                    onClick={() => handleNudge(getNudgeDeltaPx(), 0)}
                    className="p-2.5 rounded-lg bg-[#1F2024] hover:bg-[#2A2B30] text-white transition active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
                    title="Сдвинуть вправо"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
                <div className="flex justify-center mt-1">
                  <button
                    disabled={isPositionLocked}
                    onClick={() => handleNudge(0, getNudgeDeltaPx())}
                    className="p-2.5 rounded-lg bg-[#1F2024] hover:bg-[#2A2B30] text-white transition active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
                    title="Сдвинуть вниз"
                  >
                    <ChevronDown size={18} />
                  </button>
                </div>
              </div>

              {/* Числовые координаты и инфо */}
              <div className="space-y-2 text-xs font-mono">
                <div className="flex items-center justify-between p-2 rounded-lg bg-[#111215] border border-[#22242A]">
                  <span className="text-[#8E9299]">Позиция на карте (X, Y):</span>
                  <span className="font-bold text-white">{mapLeft}px, {mapTop}px</span>
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg bg-[#111215] border border-[#22242A]">
                  <span className="text-[#8E9299]">Центр рамки (X, Y):</span>
                  <span className="font-bold text-white">{mapCenterX}px, {mapCenterY}px</span>
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg bg-[#111215] border border-[#22242A]">
                  <span className="text-[#8E9299]">Ячейка сетки (Кол, Ряд):</span>
                  <span className="font-bold text-[#38BDF8]">[{gridCellX}, {gridCellY}]</span>
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg bg-[#111215] border border-[#22242A]">
                  <span className="text-[#8E9299]">Размер охвата карты:</span>
                  <span className="font-bold text-emerald-400">{mapWidthVisible} × {mapHeightVisible} px</span>
                </div>
              </div>
            </div>
          </div>

          {/* 3. ЗУМ И МАСШТАБИРОВАНИЕ РАМКИ */}
          <div className="bg-[#18191E] border border-[#26282E] rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#A0A5B1] uppercase tracking-wider flex items-center gap-1.5">
                <ZoomIn size={14} className="text-emerald-400" />
                МАСШТАБ И ЗУМ ИГРОКОВ
              </label>

              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  {currentZoomPercent}% ({sp.toFixed(2)}x)
                </span>
              </div>
            </div>

            {/* Ползунок масштаба */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleSetZoom(sp - 0.1)}
                className="p-1.5 rounded-lg bg-[#111215] hover:bg-[#22242A] text-[#8E9299] hover:text-white transition"
              >
                <ZoomOut size={16} />
              </button>

              <input
                type="range"
                min="0.15"
                max="3.0"
                step="0.05"
                value={sp}
                onChange={(e) => handleSetZoom(parseFloat(e.target.value))}
                className="flex-1 accent-[#F27D26] h-1.5 bg-[#2A2B30] rounded-lg cursor-pointer"
              />

              <button
                onClick={() => handleSetZoom(sp + 0.1)}
                className="p-1.5 rounded-lg bg-[#111215] hover:bg-[#22242A] text-[#8E9299] hover:text-white transition"
              >
                <ZoomIn size={16} />
              </button>
            </div>

            {/* Быстрые кнопки зума и выравнивания */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {ZOOM_PRESETS.map((z) => (
                <button
                  key={z}
                  onClick={() => handleSetZoom(z)}
                  className={`px-2 py-1 rounded-lg text-xs font-mono transition ${
                    Math.abs(sp - z) < 0.02
                      ? 'bg-[#F27D26] text-white font-bold'
                      : 'bg-[#111215] text-[#8E9299] hover:text-white hover:bg-[#22242A]'
                  }`}
                >
                  {Math.round(z * 100)}%
                </button>
              ))}

              <div className="w-[1px] h-6 bg-[#2A2B30] mx-1" />

              <button
                onClick={onFitMapForPlayers}
                className="px-2.5 py-1 rounded-lg bg-[#1F2024] hover:bg-[#2A2B30] text-emerald-400 font-bold text-xs flex items-center gap-1 transition"
                title="Вписать всю карту в экран игроков"
              >
                <Maximize2 size={12} />
                <span>Вся карта</span>
              </button>

              <button
                onClick={handleFitWidth}
                className="px-2.5 py-1 rounded-lg bg-[#1F2024] hover:bg-[#2A2B30] text-[#38BDF8] font-bold text-xs transition"
                title="Вписать по ширине"
              >
                По ширине
              </button>

              <button
                onClick={handleFitHeight}
                className="px-2.5 py-1 rounded-lg bg-[#1F2024] hover:bg-[#2A2B30] text-[#38BDF8] font-bold text-xs transition"
                title="Вписать по высоте"
              >
                По высоте
              </button>
            </div>
          </div>

          {/* 4. ПРОФИЛЬ И РАЗРЕШЕНИЕ ЭКРАНА ИГРОКОВ (ПРОЕКТОР / ТВ) */}
          <div className="bg-[#18191E] border border-[#26282E] rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#A0A5B1] uppercase tracking-wider flex items-center gap-1.5">
                <Monitor size={14} className="text-purple-400" />
                РАЗРЕШЕНИЕ И СООТНОШЕНИЕ СТОРОН ПРОЕКТОРА
              </label>
              <span className="text-xs font-mono text-[#8E9299]">
                Текущее: <strong className="text-white">{Wp} × {Hp}</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {RESOLUTION_PRESETS.map((res) => {
                const isSelected = Wp === res.width && Hp === res.height;
                return (
                  <button
                    key={res.label}
                    onClick={() => onSetPlayerScreenSize({ width: res.width, height: res.height })}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-mono text-left transition ${
                      isSelected
                        ? 'bg-purple-600/20 border border-purple-500 text-purple-200 font-bold'
                        : 'bg-[#111215] border border-[#22242A] text-[#8E9299] hover:text-white hover:border-[#3A3B42]'
                    }`}
                  >
                    <span>{res.label}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/40 text-[#6C707A]">
                      {res.aspect}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Кастомный ввод разрешения */}
            <div className="flex items-center gap-2 pt-2 border-t border-[#22242A] text-xs">
              <span className="text-[#8E9299]">Свое:</span>
              <input
                type="number"
                value={customWidth}
                onChange={(e) => setCustomWidth(e.target.value)}
                placeholder="Ширина"
                className="w-24 px-2.5 py-1.5 rounded-lg bg-[#111215] border border-[#2A2B30] text-white font-mono text-xs focus:outline-none focus:border-[#F27D26]"
              />
              <span className="text-[#6C707A]">×</span>
              <input
                type="number"
                value={customHeight}
                onChange={(e) => setCustomHeight(e.target.value)}
                placeholder="Высота"
                className="w-24 px-2.5 py-1.5 rounded-lg bg-[#111215] border border-[#2A2B30] text-white font-mono text-xs focus:outline-none focus:border-[#F27D26]"
              />
              <button
                onClick={handleApplyCustomResolution}
                className="px-3 py-1.5 rounded-lg bg-[#26282E] hover:bg-[#32353D] text-white font-bold transition active:scale-95"
              >
                Применить
              </button>
            </div>
          </div>
        </div>

        {/* НИЖНЯЯ ПАНЕЛЬ С БЫСТРЫМИ ДЕЙСТВИЯМИ */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-[#22242A] bg-[#16171B]/95">
          <div className="flex items-center gap-2">
            <button
              onClick={onCenterPlayerOnDmView}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1F2024] hover:bg-[#2A2B30] text-[#D0D4DC] hover:text-white transition active:scale-95 text-xs font-bold"
              title="Отправить текущий вид Мастера игрокам"
            >
              <Crosshair size={14} className="text-[#F27D26]" />
              <span>Мой вид -&gt; Игрокам</span>
            </button>

            <button
              onClick={onCenterOnPlayerView}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1F2024] hover:bg-[#2A2B30] text-[#D0D4DC] hover:text-white transition active:scale-95 text-xs font-bold"
              title="Переместить экран Мастера к рамке игроков"
            >
              <Eye size={14} className="text-[#38BDF8]" />
              <span>Найти рамку</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#F27D26] hover:bg-[#e06c19] text-white font-bold text-xs transition active:scale-95 shadow-lg shadow-[#F27D26]/20"
          >
            Готово
          </button>
        </div>
      </div>
    </div>
  );
};
