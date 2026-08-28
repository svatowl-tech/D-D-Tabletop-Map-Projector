/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Панель инструментов Мастера (DM Toolbar).
 * Тема: Hardware / Specialist Tool
 * Цвета: #0A0A0A, #151619, #2A2A2A, #3A3A3A, #F27D26 (Hardware Orange), #00FF00 (Active Glow)
 */

import React, { useRef, useState } from 'react';
import {
  Monitor,
  Upload,
  Eraser,
  Paintbrush,
  Hand,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Grid as GridIcon,
  Eye,
  EyeOff,
  Crosshair,
  Download,
  HelpCircle,
  Sparkles,
  Link2,
  Sliders,
  Check,
  Maximize
} from 'lucide-react';
import { FogToolMode, GridConfig } from '../types';
import { SAMPLE_MAPS, SampleMapDefinition } from '../utils/sampleMaps';
import { generateStandaloneHTML } from '../utils/standaloneGenerator';

interface DMToolbarProps {
  tool: FogToolMode;
  onSelectTool: (tool: FogToolMode) => void;
  brushSize: number;
  onChangeBrushSize: (size: number) => void;
  masterFogOpacity: number;
  onChangeMasterFogOpacity: (opacity: number) => void;
  grid: GridConfig;
  onChangeGrid: (grid: GridConfig) => void;
  onFillAllFog: () => void;
  onClearAllFog: () => void;
  onResetView: () => void;
  onFitToScreen: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  zoomPercent: number;
  syncViewport: boolean;
  onToggleSyncViewport: (sync: boolean) => void;
  playerConnected: boolean;
  onOpenPlayerWindow: () => void;
  onFileSelected: (file: File) => void;
  onLoadSampleMap: (sample: SampleMapDefinition) => void;
  mediaName: string;
}

export const DMToolbar: React.FC<DMToolbarProps> = ({
  tool,
  onSelectTool,
  brushSize,
  onChangeBrushSize,
  masterFogOpacity,
  onChangeMasterFogOpacity,
  grid,
  onChangeGrid,
  onFillAllFog,
  onClearAllFog,
  onResetView,
  onFitToScreen,
  onZoomIn,
  onZoomOut,
  zoomPercent,
  syncViewport,
  onToggleSyncViewport,
  playerConnected,
  onOpenPlayerWindow,
  onFileSelected,
  onLoadSampleMap,
  mediaName
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showSamplesMenu, setShowSamplesMenu] = useState(false);
  const [showGridSettings, setShowGridSettings] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const handleDownloadStandalone = () => {
    const html = generateStandaloneHTML();
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dnd-projector-offline.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <header className="flex flex-col bg-[#151619] border-b border-[#2A2A2A] shrink-0 z-30 select-none text-[#E0E0E0]">
      {/* Верхняя строка: Логотип, Статус, Загрузка, Окно проектора */}
      <div className="flex items-center justify-between h-14 px-4 sm:px-6 border-b border-[#2A2A2A] gap-3">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="text-[#F27D26] font-mono font-bold tracking-tighter text-lg sm:text-xl flex items-center gap-1.5">
            <span>VTT-ZERO</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#2A2A2A] text-[#8E9299] font-normal tracking-normal border border-[#3A3A3A]">
              DM PRO
            </span>
          </div>

          <div className="h-4 w-px bg-[#2A2A2A] hidden sm:block" />

          {/* Индикатор подключения окна проектора */}
          <div
            id="player-connection-status"
            className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-[#8E9299] font-mono bg-[#0A0A0A] px-2.5 py-1 rounded border border-[#2A2A2A]"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                playerConnected
                  ? 'bg-[#00FF00] shadow-[0_0_8px_#00FF00]'
                  : 'bg-[#8E9299]'
              }`}
            />
            <span className="font-semibold">
              {playerConnected ? 'SYSTEM: ACTIVE (60 FPS)' : 'PROJECTOR: STANDBY'}
            </span>
          </div>

          {mediaName && (
            <div className="hidden lg:flex items-center gap-1.5 text-[10px] font-mono text-[#8E9299] bg-[#0A0A0A] px-2 py-1 rounded border border-[#2A2A2A] truncate max-w-[200px]" title={mediaName}>
              <span className="text-[#F27D26]">MAP:</span>
              <span className="truncate text-[#E0E0E0]">{mediaName}</span>
            </div>
          )}
        </div>

        {/* Правый блок действий */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Быстрые демо-карты */}
          <div className="relative">
            <button
              id="samples-menu-btn"
              onClick={() => setShowSamplesMenu(!showSamplesMenu)}
              className="bg-[#2A2A2A] hover:bg-[#333333] text-[11px] px-3 py-2 rounded border border-[#3A3A3A] transition-colors font-semibold uppercase tracking-wider flex items-center gap-1.5 text-[#E0E0E0]"
              title="Готовые шаблоны карт для быстрого старта"
            >
              <Sparkles size={13} className="text-[#F27D26]" />
              <span className="hidden sm:inline">TEMPLATES</span>
            </button>

            {showSamplesMenu && (
              <div
                className="absolute right-0 top-full mt-2 w-64 bg-[#151619] border border-[#2A2A2A] rounded-lg shadow-2xl p-2 z-50 flex flex-col gap-1 text-[#E0E0E0]"
                onMouseLeave={() => setShowSamplesMenu(false)}
              >
                <div className="text-[10px] text-[#8E9299] uppercase tracking-widest px-2 py-1 font-bold">
                  BUILT-IN MAP PRESETS
                </div>
                {SAMPLE_MAPS.map((sample) => (
                  <button
                    key={sample.id}
                    onClick={() => {
                      onLoadSampleMap(sample);
                      setShowSamplesMenu(false);
                    }}
                    className="flex flex-col text-left px-2.5 py-1.5 rounded hover:bg-[#2A2A2A] transition border border-transparent hover:border-[#3A3A3A]"
                  >
                    <span className="text-xs font-semibold text-[#E0E0E0] flex items-center justify-between">
                      {sample.name}
                      <span className="text-[9px] font-mono text-[#F27D26]">{sample.width}x{sample.height}</span>
                    </span>
                    <span className="text-[10px] text-[#8E9299]">{sample.description}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Загрузка пользовательской карты */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onFileSelected(f);
            }}
            accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml,video/mp4,video/webm"
            className="hidden"
          />
          <button
            id="upload-map-btn"
            onClick={() => fileInputRef.current?.click()}
            className="bg-[#F27D26] hover:bg-[#E06C15] text-black text-[11px] px-3.5 py-2 rounded font-bold uppercase tracking-wider flex items-center gap-1.5 transition shadow-[0_0_12px_rgba(242,125,38,0.2)] active:scale-95"
            title="Загрузить изображение (JPG, PNG, WebP) или видео (MP4, WebM)"
          >
            <Upload size={13} strokeWidth={2.5} />
            <span>UPLOAD MAP</span>
          </button>

          {/* Открыть окно проектора */}
          <button
            id="open-player-btn"
            onClick={onOpenPlayerWindow}
            className="bg-[#2A2A2A] hover:bg-[#333333] text-[11px] px-3.5 py-2 rounded border border-[#3A3A3A] transition-colors font-semibold uppercase tracking-wider flex items-center gap-1.5 text-[#E0E0E0] active:scale-95"
            title="Открыть отдельное окно для проектора / второго монитора"
          >
            <Monitor size={13} className={playerConnected ? 'text-[#00FF00]' : 'text-[#8E9299]'} />
            <span className="hidden sm:inline">OPEN PROJECTOR</span>
          </button>

          {/* Скачать автономный HTML файл */}
          <button
            id="download-standalone-btn"
            onClick={handleDownloadStandalone}
            className="p-2 rounded bg-[#2A2A2A] hover:bg-[#333333] text-[#8E9299] hover:text-[#E0E0E0] border border-[#3A3A3A] transition"
            title="Скачать автономный HTML-файл для игры без интернета и серверов (2010 MacBook LITE)"
          >
            <Download size={14} />
          </button>

          {/* Справка по горячим клавишам */}
          <button
            id="help-btn"
            onClick={() => setShowHelp(!showHelp)}
            className="p-2 rounded bg-[#2A2A2A] hover:bg-[#333333] text-[#8E9299] hover:text-[#E0E0E0] border border-[#3A3A3A] transition"
            title="Горячие клавиши и подсказки"
          >
            <HelpCircle size={14} />
          </button>
        </div>
      </div>

      {/* Нижняя строка: Инструменты тумана, Кисть, Сетка, Масштабирование */}
      <div className="flex items-center justify-between px-4 py-2 gap-3 overflow-x-auto text-xs bg-[#111214] border-t border-[#1F2023]">
        {/* Инструменты тумана */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[10px] text-[#8E9299] uppercase tracking-widest font-bold mr-1 hidden md:inline">
            FOG TOOLS:
          </span>
          
          <button
            id="tool-reveal-btn"
            onClick={() => onSelectTool('reveal')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-[11px] font-bold uppercase tracking-wider transition ${
              tool === 'reveal'
                ? 'bg-[#2A2A2A] text-white border-2 border-[#F27D26] shadow-[0_0_8px_rgba(242,125,38,0.3)]'
                : 'bg-[#1A1A1A] text-[#8E9299] border border-[#2A2A2A] hover:bg-[#2A2A2A] hover:text-[#E0E0E0]'
            }`}
            title="Стирать туман войны / Открывать зону (Клавиша R)"
          >
            <div className={`w-2.5 h-2.5 rounded-full ${tool === 'reveal' ? 'bg-[#F27D26]' : 'bg-[#8E9299]'}`} />
            <span>REVEAL [R]</span>
          </button>

          <button
            id="tool-hide-btn"
            onClick={() => onSelectTool('hide')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-[11px] font-bold uppercase tracking-wider transition ${
              tool === 'hide'
                ? 'bg-[#2A2A2A] text-white border-2 border-[#F27D26] shadow-[0_0_8px_rgba(242,125,38,0.3)]'
                : 'bg-[#1A1A1A] text-[#8E9299] border border-[#2A2A2A] hover:bg-[#2A2A2A] hover:text-[#E0E0E0]'
            }`}
            title="Рисовать туман войны / Скрывать зону (Клавиша H)"
          >
            <div className={`w-2.5 h-2.5 rounded-full border ${tool === 'hide' ? 'border-[#F27D26] bg-[#F27D26]/40' : 'border-[#8E9299]'}`} />
            <span>HIDE [H]</span>
          </button>

          <button
            id="tool-pan-btn"
            onClick={() => onSelectTool('pan')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-[11px] font-bold uppercase tracking-wider transition ${
              tool === 'pan'
                ? 'bg-[#2A2A2A] text-white border-2 border-[#F27D26] shadow-[0_0_8px_rgba(242,125,38,0.3)]'
                : 'bg-[#1A1A1A] text-[#8E9299] border border-[#2A2A2A] hover:bg-[#2A2A2A] hover:text-[#E0E0E0]'
            }`}
            title="Перемещение карты (или зажмите Пробел / Колесико мыши)"
          >
            <Hand size={12} className={tool === 'pan' ? 'text-[#F27D26]' : 'text-[#8E9299]'} />
            <span>PAN [SPACE]</span>
          </button>

          <button
            id="tool-ping-btn"
            onClick={() => onSelectTool('ping')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-[11px] font-bold uppercase tracking-wider transition ${
              tool === 'ping'
                ? 'bg-[#2A2A2A] text-white border-2 border-[#F27D26] shadow-[0_0_8px_rgba(242,125,38,0.3)]'
                : 'bg-[#1A1A1A] text-[#8E9299] border border-[#2A2A2A] hover:bg-[#2A2A2A] hover:text-[#E0E0E0]'
            }`}
            title="Поставить анимированный маркер на карте для игроков"
          >
            <Crosshair size={12} className={tool === 'ping' ? 'text-[#F27D26]' : 'text-[#8E9299]'} />
            <span>PING [P]</span>
          </button>

          <div className="h-4 w-px bg-[#2A2A2A] mx-1" />

          {/* Быстрые действия с туманом */}
          <button
            id="fog-fill-all-btn"
            onClick={onFillAllFog}
            className="flex items-center gap-1 px-2 py-1 rounded bg-[#1A1A1A] hover:bg-[#2A2A2A] text-[#8E9299] hover:text-[#E0E0E0] border border-[#2A2A2A] text-[10px] font-semibold uppercase tracking-wider transition"
            title="Скрыть всю карту черным туманом"
          >
            <EyeOff size={12} />
            <span>FILL ALL</span>
          </button>

          <button
            id="fog-clear-all-btn"
            onClick={onClearAllFog}
            className="flex items-center gap-1 px-2 py-1 rounded bg-[#1A1A1A] hover:bg-[#2A2A2A] text-[#8E9299] hover:text-[#E0E0E0] border border-[#2A2A2A] text-[10px] font-semibold uppercase tracking-wider transition"
            title="Открыть всю карту (убрать туман)"
          >
            <Eye size={12} />
            <span>CLEAR ALL</span>
          </button>
        </div>

        {/* Размер кисти и прозрачность для мастера */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2 bg-[#0A0A0A] px-2.5 py-1 rounded border border-[#2A2A2A]" title="Размер кисти тумана (клавиши [ и ])">
            <span className="text-[10px] text-[#8E9299] uppercase font-bold tracking-wider">BRUSH:</span>
            <input
              id="brush-size-slider"
              type="range"
              min={10}
              max={300}
              step={5}
              value={brushSize}
              onChange={(e) => onChangeBrushSize(Number(e.target.value))}
              className="w-14 sm:w-20 cursor-pointer h-1 bg-[#2A2A2A] rounded-full appearance-none"
            />
            <span className="font-mono text-[#F27D26] text-[11px] w-9 text-right font-bold">{brushSize}px</span>
          </div>

          <div className="flex items-center gap-2 bg-[#0A0A0A] px-2.5 py-1 rounded border border-[#2A2A2A]" title="Прозрачность тумана на экране мастера">
            <span className="text-[10px] text-[#8E9299] uppercase font-bold tracking-wider">DM FOG:</span>
            <input
              id="fog-opacity-slider"
              type="range"
              min={0.1}
              max={0.9}
              step={0.05}
              value={masterFogOpacity}
              onChange={(e) => onChangeMasterFogOpacity(Number(e.target.value))}
              className="w-12 sm:w-16 cursor-pointer h-1 bg-[#2A2A2A] rounded-full appearance-none"
            />
            <span className="font-mono text-[#F27D26] text-[11px] w-8 text-right font-bold">
              {Math.round(masterFogOpacity * 100)}%
            </span>
          </div>
        </div>

        {/* Сетка и Масштабирование */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Сетка */}
          <div className="relative flex items-center gap-1">
            <button
              id="grid-toggle-btn"
              onClick={() => onChangeGrid({ ...grid, enabled: !grid.enabled })}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded border text-[11px] font-semibold uppercase tracking-wider transition ${
                grid.enabled
                  ? 'bg-[#2A2A2A] text-[#F27D26] border-[#F27D26]'
                  : 'bg-[#1A1A1A] text-[#8E9299] border-[#2A2A2A] hover:bg-[#2A2A2A] hover:text-[#E0E0E0]'
              }`}
              title="Включить/выключить тактическую квадратную сетку"
            >
              <GridIcon size={12} />
              <span>GRID {grid.enabled ? `${grid.size}px` : 'OFF'}</span>
            </button>

            <button
              id="grid-settings-btn"
              onClick={() => setShowGridSettings(!showGridSettings)}
              className="p-1 rounded bg-[#1A1A1A] border border-[#2A2A2A] text-[#8E9299] hover:text-[#E0E0E0] hover:bg-[#2A2A2A] transition"
              title="Настройки сетки (шаг, цвет, смещение)"
            >
              <Sliders size={12} />
            </button>

            {showGridSettings && (
              <div
                className="absolute right-0 top-full mt-2 w-60 bg-[#151619] border border-[#2A2A2A] rounded-lg shadow-2xl p-3 z-50 flex flex-col gap-3 text-xs text-[#E0E0E0]"
                onMouseLeave={() => setShowGridSettings(false)}
              >
                <div className="font-bold text-[#E0E0E0] border-b border-[#2A2A2A] pb-1.5 flex justify-between items-center text-[10px] uppercase tracking-widest text-[#8E9299]">
                  <span>GRID CONFIG</span>
                  <label className="flex items-center gap-1.5 text-[11px] cursor-pointer text-[#E0E0E0]">
                    <input
                      type="checkbox"
                      checked={grid.enabled}
                      onChange={(e) => onChangeGrid({ ...grid, enabled: e.target.checked })}
                      className="accent-[#F27D26]"
                    />
                    <span>ENABLE</span>
                  </label>
                </div>

                <div className="flex flex-col gap-1">
                  <div className="flex justify-between text-[#8E9299] text-[10px] font-mono">
                    <span>CELL SIZE:</span>
                    <span className="font-mono text-[#F27D26]">{grid.size}px</span>
                  </div>
                  <input
                    type="range"
                    min={20}
                    max={200}
                    step={2}
                    value={grid.size}
                    onChange={(e) => onChangeGrid({ ...grid, size: Number(e.target.value) })}
                    className="accent-[#F27D26] h-1"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <div className="flex justify-between text-[#8E9299] text-[10px] font-mono">
                    <span>OPACITY:</span>
                    <span className="font-mono text-[#F27D26]">{Math.round(grid.opacity * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min={0.05}
                    max={0.8}
                    step={0.05}
                    value={grid.opacity}
                    onChange={(e) => onChangeGrid({ ...grid, opacity: Number(e.target.value) })}
                    className="accent-[#F27D26] h-1"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[9px] font-mono text-[#8E9299] uppercase">OFFSET X (px):</span>
                    <input
                      type="number"
                      value={grid.offsetX}
                      onChange={(e) => onChangeGrid({ ...grid, offsetX: Number(e.target.value) })}
                      className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded px-1.5 py-0.5 text-[#E0E0E0] text-xs font-mono mt-0.5"
                    />
                  </div>
                  <div>
                    <span className="text-[9px] font-mono text-[#8E9299] uppercase">OFFSET Y (px):</span>
                    <input
                      type="number"
                      value={grid.offsetY}
                      onChange={(e) => onChangeGrid({ ...grid, offsetY: Number(e.target.value) })}
                      className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded px-1.5 py-0.5 text-[#E0E0E0] text-xs font-mono mt-0.5"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="h-4 w-px bg-[#2A2A2A] mx-1" />

          {/* Навигация и Зум */}
          <div className="flex items-center gap-1">
            <button
              id="zoom-out-btn"
              onClick={onZoomOut}
              className="p-1 rounded bg-[#1A1A1A] hover:bg-[#2A2A2A] text-[#8E9299] hover:text-[#E0E0E0] border border-[#2A2A2A]"
              title="Уменьшить масштаб (-)"
            >
              <ZoomOut size={12} />
            </button>
            <span className="font-mono text-[11px] text-[#F27D26] w-11 text-center font-bold">
              {zoomPercent}%
            </span>
            <button
              id="zoom-in-btn"
              onClick={onZoomIn}
              className="p-1 rounded bg-[#1A1A1A] hover:bg-[#2A2A2A] text-[#8E9299] hover:text-[#E0E0E0] border border-[#2A2A2A]"
              title="Увеличить масштаб (+)"
            >
              <ZoomIn size={12} />
            </button>

            <button
              id="fit-screen-btn"
              onClick={onFitToScreen}
              className="px-2 py-1 rounded bg-[#1A1A1A] hover:bg-[#2A2A2A] text-[#8E9299] hover:text-[#E0E0E0] border border-[#2A2A2A] text-[10px] font-semibold uppercase tracking-wider"
              title="Вписать карту целиком в экран"
            >
              FIT
            </button>

            <button
              id="reset-view-btn"
              onClick={onResetView}
              className="p-1 rounded bg-[#1A1A1A] hover:bg-[#2A2A2A] text-[#8E9299] hover:text-[#E0E0E0] border border-[#2A2A2A]"
              title="Сброс масштаба 100%"
            >
              <RotateCcw size={12} />
            </button>
          </div>

          {/* Синхронизация масштаба/вида с игроками */}
          <label
            className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-[#8E9299] bg-[#0A0A0A] px-2 py-1 rounded border border-[#2A2A2A] cursor-pointer ml-1"
            title="Если включено, проектор в точности повторяет зум и сдвиг карты мастера"
          >
            <input
              type="checkbox"
              checked={syncViewport}
              onChange={(e) => onToggleSyncViewport(e.target.checked)}
              className="accent-[#F27D26]"
            />
            <Link2 size={11} className={syncViewport ? 'text-[#F27D26]' : 'text-[#8E9299]'} />
            <span className="hidden xl:inline">SYNC VIEW</span>
          </label>
        </div>
      </div>

      {/* Модальное окно подсказок и горячих клавиш */}
      {showHelp && (
        <div className="bg-[#0A0A0A] border-t border-[#2A2A2A] px-4 py-2 text-xs text-[#E0E0E0] flex flex-wrap items-center justify-between gap-4 font-mono">
          <div className="flex flex-wrap items-center gap-4 text-[11px]">
            <span className="font-bold text-[#F27D26]">HARDWARE SHORTCUTS:</span>
            <span><kbd className="bg-[#2A2A2A] px-1.5 py-0.5 rounded text-white border border-[#3A3A3A]">R</kbd> REVEAL FOG</span>
            <span><kbd className="bg-[#2A2A2A] px-1.5 py-0.5 rounded text-white border border-[#3A3A3A]">H</kbd> HIDE FOG</span>
            <span><kbd className="bg-[#2A2A2A] px-1.5 py-0.5 rounded text-white border border-[#3A3A3A]">SPACE + DRAG</kbd> PAN VIEW</span>
            <span><kbd className="bg-[#2A2A2A] px-1.5 py-0.5 rounded text-white border border-[#3A3A3A]">WHEEL</kbd> ZOOM CURSOR</span>
            <span><kbd className="bg-[#2A2A2A] px-1.5 py-0.5 rounded text-white border border-[#3A3A3A]">[ / ]</kbd> BRUSH SIZE</span>
            <span><kbd className="bg-[#2A2A2A] px-1.5 py-0.5 rounded text-white border border-[#3A3A3A]">P</kbd> PING LOCATION</span>
          </div>
          <button
            onClick={() => setShowHelp(false)}
            className="text-[#8E9299] hover:text-[#E0E0E0] font-bold text-xs"
          >
            ✕ CLOSE
          </button>
        </div>
      )}
    </header>
  );
};
