/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Компактная плавающая боковая панель инструментов Мастера (Photoshop-style DM Toolbar).
 * Включает инструменты тактики, тумана войны, измерений, шаблонов заклинаний
 * и студию стихийных эффектов (Огонь, Вода, Газ) с расширенной палитрой и пресетами.
 */

import React, { useState } from 'react';
import {
  DMTool,
  GridConfig,
  FogTextureStyle,
  MapLayer,
  SpellTemplate,
  ElementalBrushConfig,
  ElementalHazardType
} from '../types';
import {
  MousePointer,
  Eye,
  EyeOff,
  Move,
  MapPin,
  Sparkles,
  Ruler,
  Compass,
  Pencil,
  Grid,
  Layers,
  Palette,
  Flame,
  Droplets,
  Cloud,
  Plus,
  Trash2,
  Lock,
  Unlock,
  Eraser,
  Sliders,
  Wind,
  Focus
} from 'lucide-react';
import {
  FIRE_PRESETS,
  WATER_PRESETS,
  GAS_PRESETS,
  ElementalPreset
} from '../utils/elementalPresets';

interface DMToolbarProps {
  currentTool: DMTool;
  onSelectTool: (tool: DMTool) => void;
  // Параметры кисти и тумана
  brushRadius: number;
  onBrushRadiusChange: (r: number) => void;
  brushShape: 'circle' | 'rect';
  onBrushShapeChange: (shape: 'circle' | 'rect') => void;
  fogStyle: FogTextureStyle;
  onFogStyleChange: (style: FogTextureStyle) => void;
  onRevealAllFog: () => void;
  onHideAllFog: () => void;
  onInvertFog: () => void;
  // Параметры сетки
  grid: GridConfig;
  onUpdateGrid: (grid: Partial<GridConfig>) => void;
  onStartGridCalibration?: () => void;
  // Слои карты
  layers: MapLayer[];
  selectedLayerId: string | null;
  onSelectLayer: (id: string | null) => void;
  onAddLayer: (file: File) => void;
  onRemoveLayer: (id: string) => void;
  onToggleLayerLock: (id: string) => void;
  onToggleLayerVisibility: (id: string) => void;
  // Шаблоны заклинаний
  spellTemplate: SpellTemplate | null;
  onUpdateSpellTemplate: (template: Partial<SpellTemplate>) => void;
  // Тактическое рисование
  drawColor?: string;
  onDrawColorChange?: (color: string) => void;
  drawWidth?: number;
  onDrawWidthChange?: (w: number) => void;
  drawType?: 'freehand' | 'arrow' | 'highlighter';
  onDrawTypeChange?: (t: 'freehand' | 'arrow' | 'highlighter') => void;
  onClearDrawings: () => void;
  // Ластик
  eraserRadius?: number;
  onEraserRadiusChange?: (r: number) => void;
  onClearSpellTemplate?: () => void;
  onClearRuler?: () => void;
  // Стихийные эффекты (Огонь, Вода, Газ)
  hazardConfig?: ElementalBrushConfig;
  onUpdateHazardConfig?: (config: Partial<ElementalBrushConfig>) => void;
  onClearHazards?: (element?: ElementalHazardType) => void;
}

export const DMToolbar: React.FC<DMToolbarProps> = ({
  currentTool,
  onSelectTool,
  brushRadius,
  onBrushRadiusChange,
  brushShape,
  onBrushShapeChange,
  fogStyle,
  onFogStyleChange,
  onRevealAllFog,
  onHideAllFog,
  onInvertFog,
  grid,
  onUpdateGrid,
  onStartGridCalibration,
  layers,
  selectedLayerId,
  onSelectLayer,
  onAddLayer,
  onRemoveLayer,
  onToggleLayerLock,
  onToggleLayerVisibility,
  spellTemplate,
  onUpdateSpellTemplate,
  drawColor = '#EF4444',
  onDrawColorChange,
  drawWidth = 4,
  onDrawWidthChange,
  drawType = 'freehand',
  onDrawTypeChange,
  onClearDrawings,
  eraserRadius = 30,
  onEraserRadiusChange,
  onClearSpellTemplate,
  onClearRuler,
  hazardConfig,
  onUpdateHazardConfig,
  onClearHazards
}) => {
  const [activeFlyout, setActiveFlyout] = useState<
    'brush' | 'fog' | 'grid' | 'layers' | 'spell' | 'draw' | 'eraser' | 'hazard_fire' | 'hazard_water' | 'hazard_gas' | null
  >(null);

  const toggleFlyout = (
    name: 'brush' | 'fog' | 'grid' | 'layers' | 'spell' | 'draw' | 'eraser' | 'hazard_fire' | 'hazard_water' | 'hazard_gas'
  ) => {
    setActiveFlyout(activeFlyout === name ? null : name);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onAddLayer(file);
      e.target.value = '';
    }
  };

  const DRAW_COLORS = [
    '#FFFFFF',
    '#EF4444',
    '#F97316',
    '#EAB308',
    '#22C55E',
    '#06B6D4',
    '#3B82F6',
    '#A855F7',
    '#1E1E1E'
  ];

  return (
    <div className="absolute top-18 left-4 z-40 flex items-start gap-2 select-none font-mono text-[#E0E0E0]">
      {/* Главная вертикальная колонка инструментов */}
      <div className="bg-[#151619]/95 border border-[#2A2A2A] rounded-xl shadow-2xl p-1.5 flex flex-col gap-1 backdrop-blur">
        {/* 1. ВЫБОР И ПЕРЕМЕЩЕНИЕ СЛОЕВ */}
        <button
          onClick={() => {
            onSelectTool('select');
            setActiveFlyout(null);
          }}
          className={`p-2.5 rounded-lg transition flex items-center justify-center ${
            currentTool === 'select'
              ? 'bg-[#2A1F18] text-[#F27D26] border border-[#F27D26]/70 shadow-[0_0_10px_rgba(242,125,38,0.3)]'
              : 'text-[#8E9299] hover:bg-[#252830] hover:text-white'
          }`}
          title="Выделение и перемещение слоев карты (V)"
        >
          <MousePointer size={16} />
        </button>

        {/* 2. РАСКРЫТИЕ ТУМАНА (REVEAL FOG) */}
        <button
          onClick={() => {
            onSelectTool('reveal');
            toggleFlyout('brush');
          }}
          className={`p-2.5 rounded-lg transition flex items-center justify-center ${
            currentTool === 'reveal'
              ? 'bg-[#2A1F18] text-[#F27D26] border border-[#F27D26]/70 shadow-[0_0_10px_rgba(242,125,38,0.3)]'
              : 'text-[#8E9299] hover:bg-[#252830] hover:text-white'
          }`}
          title="Открыть туман войны (R)"
        >
          <Eye size={16} />
        </button>

        {/* 3. СОКРЫТИЕ ТУМАНА (HIDE FOG) */}
        <button
          onClick={() => {
            onSelectTool('hide');
            toggleFlyout('brush');
          }}
          className={`p-2.5 rounded-lg transition flex items-center justify-center ${
            currentTool === 'hide'
              ? 'bg-[#2A1F18] text-[#F27D26] border border-[#F27D26]/70 shadow-[0_0_10px_rgba(242,125,38,0.3)]'
              : 'text-[#8E9299] hover:bg-[#252830] hover:text-white'
          }`}
          title="Скрыть туманом войны (H)"
        >
          <EyeOff size={16} />
        </button>

        {/* 4. ПАНОРАМИРОВАНИЕ (PAN & ZOOM) */}
        <button
          onClick={() => {
            onSelectTool('pan');
            setActiveFlyout(null);
          }}
          className={`p-2.5 rounded-lg transition flex items-center justify-center ${
            currentTool === 'pan'
              ? 'bg-[#2A1F18] text-[#F27D26] border border-[#F27D26]/70 shadow-[0_0_10px_rgba(242,125,38,0.3)]'
              : 'text-[#8E9299] hover:bg-[#252830] hover:text-white'
          }`}
          title="Панорамирование и зум (Space / Drag)"
        >
          <Move size={16} />
        </button>

        <div className="w-full h-px bg-[#2A2A2A] my-0.5" />

        {/* 5. ЛАЗЕРНАЯ УКАЗКА (LASER POINTER) */}
        <button
          onClick={() => {
            onSelectTool('laser');
            setActiveFlyout(null);
          }}
          className={`p-2.5 rounded-lg transition flex items-center justify-center ${
            currentTool === 'laser'
              ? 'bg-red-950/80 text-red-400 border border-red-800 shadow-[0_0_12px_rgba(239,68,68,0.6)]'
              : 'text-[#8E9299] hover:bg-[#252830] hover:text-white'
          }`}
          title="Лазерная указка с затухающим следом (L)"
        >
          <Sparkles size={16} />
        </button>

        {/* 6. ПИНГ ВНИМАНИЯ (PING) */}
        <button
          onClick={() => {
            onSelectTool('ping');
            setActiveFlyout(null);
          }}
          className={`p-2.5 rounded-lg transition flex items-center justify-center ${
            currentTool === 'ping'
              ? 'bg-[#2A1F18] text-[#F27D26] border border-[#F27D26]/70 shadow-[0_0_10px_rgba(242,125,38,0.3)]'
              : 'text-[#8E9299] hover:bg-[#252830] hover:text-white'
          }`}
          title="Пульсирующий пинг внимания (P)"
        >
          <MapPin size={16} />
        </button>

        {/* 7. ЛИНЕЙКА-ДАЛЬНОМЕР (RULER) */}
        <button
          onClick={() => {
            onSelectTool('ruler');
            setActiveFlyout(null);
          }}
          className={`p-2.5 rounded-lg transition flex items-center justify-center ${
            currentTool === 'ruler'
              ? 'bg-[#2A1F18] text-[#F27D26] border border-[#F27D26]/70 shadow-[0_0_10px_rgba(242,125,38,0.3)]'
              : 'text-[#8E9299] hover:bg-[#252830] hover:text-white'
          }`}
          title="Линейка дистанции (D&D 5e / Метры / Клетки) (M)"
        >
          <Ruler size={16} />
        </button>

        {/* 8. ШАБЛОНЫ ЗАКЛИНАНИЙ (SPELL AOE) */}
        <button
          onClick={() => {
            onSelectTool('spell_template');
            toggleFlyout('spell');
          }}
          className={`p-2.5 rounded-lg transition flex items-center justify-center ${
            currentTool === 'spell_template'
              ? 'bg-[#2A1F18] text-[#F27D26] border border-[#F27D26]/70 shadow-[0_0_10px_rgba(242,125,38,0.3)]'
              : 'text-[#8E9299] hover:bg-[#252830] hover:text-white'
          }`}
          title="Шаблоны областей заклинаний (Cone, Sphere, Line, Cube)"
        >
          <Compass size={16} />
        </button>

        {/* 9. ТАКТИЧЕСКОЕ РИСОВАНИЕ */}
        <button
          onClick={() => {
            onSelectTool('draw');
            toggleFlyout('draw');
          }}
          className={`p-2.5 rounded-lg transition flex items-center justify-center ${
            currentTool === 'draw'
              ? 'bg-[#2A1F18] text-[#F27D26] border border-[#F27D26]/70 shadow-[0_0_10px_rgba(242,125,38,0.3)]'
              : 'text-[#8E9299] hover:bg-[#252830] hover:text-white'
          }`}
          title="Тактическое рисование маркером и стрелки (D)"
        >
          <Pencil size={16} />
        </button>

        {/* 9.5 ЛАСТИК (ERASER) */}
        <button
          onClick={() => {
            onSelectTool('eraser');
            toggleFlyout('eraser');
          }}
          className={`p-2.5 rounded-lg transition flex items-center justify-center ${
            currentTool === 'eraser'
              ? 'bg-[#2A1F18] text-[#F27D26] border border-[#F27D26]/70 shadow-[0_0_10px_rgba(242,125,38,0.3)]'
              : 'text-[#8E9299] hover:bg-[#252830] hover:text-white'
          }`}
          title="Ластик для стирания рисунков, огня, воды, газа и заклинаний (E)"
        >
          <Eraser size={16} />
        </button>

        <div className="w-full h-px bg-[#2A2A2A] my-0.5" />

        {/* === РАЗДЕЛ СТИХИЙНЫХ ЭФФЕКТОВ (ELEMENTAL HAZARDS) === */}

        {/* 10. ПОЖАР / ОГОНЬ (FIRE HAZARD) */}
        <button
          onClick={() => {
            onSelectTool('hazard_fire');
            if (onUpdateHazardConfig) {
              onUpdateHazardConfig({ element: 'fire', subType: hazardConfig?.subType || 'fire_raging' });
            }
            toggleFlyout('hazard_fire');
          }}
          className={`p-2.5 rounded-lg transition flex items-center justify-center ${
            currentTool === 'hazard_fire'
              ? 'bg-orange-950/90 text-orange-400 border border-orange-600 shadow-[0_0_14px_rgba(249,115,22,0.6)]'
              : 'text-orange-500/70 hover:bg-[#252830] hover:text-orange-400'
          }`}
          title="Пожар / Огонь / Инферно / Угли (Рисование пламенем)"
        >
          <Flame size={16} />
        </button>

        {/* 11. ЗАТОПЛЕНИЕ / ВОДА / КИСЛОТА (WATER & LIQUID HAZARD) */}
        <button
          onClick={() => {
            onSelectTool('hazard_water');
            if (onUpdateHazardConfig) {
              onUpdateHazardConfig({ element: 'water', subType: hazardConfig?.subType || 'water_clean' });
            }
            toggleFlyout('hazard_water');
          }}
          className={`p-2.5 rounded-lg transition flex items-center justify-center ${
            currentTool === 'hazard_water'
              ? 'bg-cyan-950/90 text-cyan-400 border border-cyan-500 shadow-[0_0_14px_rgba(6,182,212,0.6)]'
              : 'text-cyan-500/70 hover:bg-[#252830] hover:text-cyan-400'
          }`}
          title="Затопление / Вода / Кислота / Магма / Слизь"
        >
          <Droplets size={16} />
        </button>

        {/* 12. ЗАДЫМЛЕНИЕ / ГАЗ / ТУМАН (GAS & SMOKE HAZARD) */}
        <button
          onClick={() => {
            onSelectTool('hazard_gas');
            if (onUpdateHazardConfig) {
              onUpdateHazardConfig({ element: 'gas', subType: hazardConfig?.subType || 'gas_smoke' });
            }
            toggleFlyout('hazard_gas');
          }}
          className={`p-2.5 rounded-lg transition flex items-center justify-center ${
            currentTool === 'hazard_gas'
              ? 'bg-emerald-950/90 text-emerald-400 border border-emerald-500 shadow-[0_0_14px_rgba(16,185,129,0.6)]'
              : 'text-emerald-500/70 hover:bg-[#252830] hover:text-emerald-400'
          }`}
          title="Задымление / Отравляющий газ / Магический туман / Миазма"
        >
          <Cloud size={16} />
        </button>

        <div className="w-full h-px bg-[#2A2A2A] my-0.5" />

        {/* 13. УПРАВЛЕНИЕ ТУМАНОМ (FOG CONTROLS) */}
        <button
          onClick={() => toggleFlyout('fog')}
          className={`p-2.5 rounded-lg transition flex items-center justify-center ${
            activeFlyout === 'fog' ? 'bg-[#2A2A2A] text-[#F27D26]' : 'text-[#8E9299] hover:bg-[#252830] hover:text-white'
          }`}
          title="Управление туманом войны (Стили, Инверсия, Заливка)"
        >
          <Palette size={16} />
        </button>

        {/* 14. НАСТРОЙКИ СЕТКИ (GRID) */}
        <button
          onClick={() => toggleFlyout('grid')}
          className={`p-2.5 rounded-lg transition flex items-center justify-center ${
            activeFlyout === 'grid' ? 'bg-[#2A2A2A] text-[#F27D26]' : 'text-[#8E9299] hover:bg-[#252830] hover:text-white'
          }`}
          title="Настройки тактической сетки (Квадраты, Гексы, Шаг)"
        >
          <Grid size={16} />
        </button>

        {/* 15. МЕНЕДЖЕР СЛОЕВ КАРТЫ (LAYERS) */}
        <button
          onClick={() => toggleFlyout('layers')}
          className={`p-2.5 rounded-lg transition flex items-center justify-center ${
            activeFlyout === 'layers' ? 'bg-[#2A2A2A] text-[#F27D26]' : 'text-[#8E9299] hover:bg-[#252830] hover:text-white'
          }`}
          title="Слои карты (Добавить изображение, Наложение, Блокировка)"
        >
          <Layers size={16} />
        </button>
      </div>

      {/* ============================================================ */}
      {/* ВСПЛЫВАЮЩИЕ ПАНЕЛИ НАСТРОЕК (FLYOUTS) */}
      {/* ============================================================ */}

      {/* А. Панель параметров кисти тумана */}
      {activeFlyout === 'brush' && (currentTool === 'reveal' || currentTool === 'hide') && (
        <div className="bg-[#151619] border border-[#2A2A2A] rounded-xl shadow-2xl p-3 w-56 flex flex-col gap-2.5">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-[#F27D26]">РАЗМЕР КИСТИ:</span>
            <span className="font-bold">{brushRadius * 2}px</span>
          </div>

          <input
            type="range"
            min={10}
            max={250}
            step={5}
            value={brushRadius}
            onChange={(e) => onBrushRadiusChange(Number(e.target.value))}
            className="accent-[#F27D26] h-1.5"
          />

          <div className="flex gap-2 pt-1 border-t border-[#2A2A2A] text-xs">
            <button
              onClick={() => onBrushShapeChange('circle')}
              className={`flex-1 py-1 rounded font-bold transition ${
                brushShape === 'circle' ? 'bg-[#F27D26] text-black' : 'bg-[#2A2A2A] text-[#8E9299]'
              }`}
            >
              КРУГ
            </button>
            <button
              onClick={() => onBrushShapeChange('rect')}
              className={`flex-1 py-1 rounded font-bold transition ${
                brushShape === 'rect' ? 'bg-[#F27D26] text-black' : 'bg-[#2A2A2A] text-[#8E9299]'
              }`}
            >
              ПРЯМОУГ.
            </button>
          </div>
        </div>
      )}

      {/* Б. Панель тактического рисования (Draw Flyout) */}
      {activeFlyout === 'draw' && currentTool === 'draw' && (
        <div className="bg-[#151619] border border-[#2A2A2A] rounded-xl shadow-2xl p-3 w-64 flex flex-col gap-3">
          <div className="text-xs font-bold text-[#F27D26] border-b border-[#2A2A2A] pb-1">
            ТАКТИЧЕСКИЙ МАРКЕР
          </div>

          {/* Режим инструмента */}
          <div className="grid grid-cols-3 gap-1 text-[10px]">
            <button
              onClick={() => onDrawTypeChange?.('freehand')}
              className={`p-1.5 rounded font-bold transition text-center ${
                drawType === 'freehand' ? 'bg-[#F27D26] text-black' : 'bg-[#2A2A2A] text-[#8E9299]'
              }`}
            >
              ЛИНИЯ
            </button>
            <button
              onClick={() => onDrawTypeChange?.('arrow')}
              className={`p-1.5 rounded font-bold transition text-center ${
                drawType === 'arrow' ? 'bg-[#F27D26] text-black' : 'bg-[#2A2A2A] text-[#8E9299]'
              }`}
            >
              СТРЕЛКА
            </button>
            <button
              onClick={() => onDrawTypeChange?.('highlighter')}
              className={`p-1.5 rounded font-bold transition text-center ${
                drawType === 'highlighter' ? 'bg-[#F27D26] text-black' : 'bg-[#2A2A2A] text-[#8E9299]'
              }`}
            >
              МАРКЕР
            </button>
          </div>

          {/* Палитра цветов */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] text-[#8E9299]">ЦВЕТ МАРКЕРА:</span>
            <div className="flex flex-wrap gap-1.5 items-center">
              {DRAW_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => onDrawColorChange?.(c)}
                  className={`w-5 h-5 rounded-full border transition ${
                    drawColor === c ? 'scale-125 border-white shadow-md ring-2 ring-[#F27D26]' : 'border-black/50 hover:scale-110'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
              <input
                type="color"
                value={drawColor}
                onChange={(e) => onDrawColorChange?.(e.target.value)}
                className="w-5 h-5 rounded cursor-pointer bg-transparent border-0"
                title="Пользовательский цвет"
              />
            </div>
          </div>

          {/* Толщина линии */}
          <div className="flex flex-col gap-1 text-xs">
            <div className="flex justify-between">
              <span className="text-[#8E9299]">ТОЛЩИНА:</span>
              <span className="font-bold text-[#F27D26]">{drawWidth}px</span>
            </div>
            <input
              type="range"
              min={2}
              max={24}
              step={1}
              value={drawWidth}
              onChange={(e) => onDrawWidthChange?.(Number(e.target.value))}
              className="accent-[#F27D26] h-1.5"
            />
          </div>

          <button
            onClick={onClearDrawings}
            className="p-1.5 bg-red-950/70 hover:bg-red-900 border border-red-800 text-red-300 rounded text-xs font-bold transition flex items-center justify-center gap-1.5 mt-1"
          >
            <Trash2 size={13} />
            <span>ОЧИСТИТЬ РИСУНКИ</span>
          </button>
        </div>
      )}

      {/* Б.1. ПАНЕЛЬ ЛАСТИКА И СТИРАНИЯ (ERASER FLYOUT) */}
      {activeFlyout === 'eraser' && currentTool === 'eraser' && (
        <div className="bg-[#151619] border border-[#2A2A2A] rounded-xl shadow-2xl p-3 w-64 flex flex-col gap-3">
          <div className="flex justify-between items-center text-xs font-bold text-[#F27D26] border-b border-[#2A2A2A] pb-1">
            <div className="flex items-center gap-1.5">
              <Eraser size={14} />
              <span>ЛАСТИК И СТИРАНИЕ</span>
            </div>
          </div>

          <div className="flex flex-col gap-1 text-xs">
            <div className="flex justify-between">
              <span className="text-[#8E9299]">РАДИУС ЛАСТИКА:</span>
              <span className="font-bold text-[#F27D26]">{eraserRadius * 2}px</span>
            </div>
            <input
              type="range"
              min={10}
              max={150}
              step={5}
              value={eraserRadius}
              onChange={(e) => onEraserRadiusChange?.(Number(e.target.value))}
              className="accent-[#F27D26] h-1.5 cursor-pointer"
            />
          </div>

          <div className="text-[10px] text-[#8E9299] leading-relaxed">
            Зажмите левую кнопку мыши и проведите по карте, чтобы стереть рисунки, маркеры, огонь, воду, газ или области заклинаний.
          </div>

          <div className="flex flex-col gap-1.5 pt-2 border-t border-[#2A2A2A]">
            <span className="text-[10px] text-[#8E9299] font-bold uppercase tracking-wider">БЫСТРАЯ ОЧИСТКА:</span>
            <button
              onClick={onClearDrawings}
              className="p-1.5 bg-[#252830] hover:bg-red-950/80 hover:border-red-600 border border-[#333] text-xs font-bold rounded transition flex items-center justify-center gap-1.5 text-[#E0E0E0]"
            >
              <Trash2 size={13} className="text-red-400" />
              <span>Стереть все рисунки</span>
            </button>
            <button
              onClick={() => onClearHazards?.('fire')}
              className="p-1.5 bg-[#252830] hover:bg-orange-950/80 hover:border-orange-600 border border-[#333] text-xs font-bold rounded transition flex items-center justify-center gap-1.5 text-[#E0E0E0]"
            >
              <Flame size={13} className="text-orange-400" />
              <span>Потушить весь огонь</span>
            </button>
            <button
              onClick={() => onClearHazards?.('water')}
              className="p-1.5 bg-[#252830] hover:bg-cyan-950/80 hover:border-cyan-600 border border-[#333] text-xs font-bold rounded transition flex items-center justify-center gap-1.5 text-[#E0E0E0]"
            >
              <Droplets size={13} className="text-cyan-400" />
              <span>Осушить всю воду</span>
            </button>
            <button
              onClick={() => onClearHazards?.('gas')}
              className="p-1.5 bg-[#252830] hover:bg-emerald-950/80 hover:border-emerald-600 border border-[#333] text-xs font-bold rounded transition flex items-center justify-center gap-1.5 text-[#E0E0E0]"
            >
              <Cloud size={13} className="text-emerald-400" />
              <span>Развеять весь газ</span>
            </button>
            <button
              onClick={() => {
                onClearDrawings();
                onClearHazards?.();
                onClearSpellTemplate?.();
                onClearRuler?.();
              }}
              className="p-1.5 bg-red-950/90 hover:bg-red-900 border border-red-700 text-red-200 text-xs font-bold rounded transition flex items-center justify-center gap-1.5 mt-1"
            >
              <Trash2 size={13} />
              <span>ОЧИСТИТЬ ВСЕ СЛОИ</span>
            </button>
          </div>
        </div>
      )}

      {/* Б.2. ПАНЕЛЬ ШАБЛОНОВ ЗАКЛИНАНИЙ (SPELL FLYOUT) */}
      {activeFlyout === 'spell' && currentTool === 'spell_template' && (
        <div className="bg-[#151619] border border-[#2A2A2A] rounded-xl shadow-2xl p-3 w-64 flex flex-col gap-3">
          <div className="flex justify-between items-center text-xs font-bold text-[#F27D26] border-b border-[#2A2A2A] pb-1">
            <div className="flex items-center gap-1.5">
              <Compass size={14} />
              <span>ОБЛАСТЬ ЗАКЛИНАНИЯ (AoE)</span>
            </div>
            {spellTemplate && (
              <button
                onClick={onClearSpellTemplate}
                className="text-[10px] text-red-400 hover:text-red-300 underline font-bold"
              >
                СБРОСИРОВАТЬ
              </button>
            )}
          </div>

          {/* Форма области */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-[#8E9299] font-bold">ФОРМА ОБЛАСТИ:</span>
            <div className="grid grid-cols-2 gap-1 text-[11px]">
              {[
                { id: 'sphere', label: 'СФЕРА / КРУГ' },
                { id: 'cone', label: 'КОНУС (5e)' },
                { id: 'line', label: 'ЛИНИЯ' },
                { id: 'cube', label: 'КУБ / КВАДРАТ' }
              ].map((s) => (
                <button
                  key={s.id}
                  onClick={() => onUpdateSpellTemplate({ shape: s.id as any })}
                  className={`p-1.5 rounded font-bold transition text-center ${
                    spellTemplate?.shape === s.id
                      ? 'bg-[#F27D26] text-black'
                      : 'bg-[#2A2A2A] text-[#8E9299] hover:text-white'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Радиус / Размер в футах */}
          <div className="flex flex-col gap-1 text-xs">
            <div className="flex justify-between">
              <span className="text-[#8E9299]">РАЗМЕР (ФУТЫ / FT):</span>
              <span className="font-bold text-[#F27D26]">{spellTemplate?.sizeFeet || 20} ft.</span>
            </div>
            <div className="flex gap-1 mb-1">
              {[10, 15, 20, 30, 40, 60].map((ft) => (
                <button
                  key={ft}
                  onClick={() => onUpdateSpellTemplate({ sizeFeet: ft })}
                  className={`flex-1 py-0.5 rounded text-[10px] font-bold transition ${
                    spellTemplate?.sizeFeet === ft
                      ? 'bg-[#F27D26] text-black'
                      : 'bg-[#252830] text-[#8E9299] hover:text-white'
                  }`}
                >
                  {ft}'
                </button>
              ))}
            </div>
            <input
              type="range"
              min={5}
              max={120}
              step={5}
              value={spellTemplate?.sizeFeet || 20}
              onChange={(e) => onUpdateSpellTemplate({ sizeFeet: Number(e.target.value) })}
              className="accent-[#F27D26] h-1.5 cursor-pointer"
            />
          </div>

          {/* Цвет шаблона */}
          <div className="flex flex-col gap-1 text-xs">
            <span className="text-[#8E9299]">ЦВЕТ ЗАКЛИНАНИЯ:</span>
            <div className="flex gap-1.5 items-center">
              {[
                'rgba(242, 125, 38, 0.45)',
                'rgba(59, 130, 246, 0.45)',
                'rgba(34, 197, 94, 0.45)',
                'rgba(168, 85, 247, 0.45)',
                'rgba(234, 179, 8, 0.45)',
                'rgba(239, 68, 68, 0.45)'
              ].map((c) => (
                <button
                  key={c}
                  onClick={() => onUpdateSpellTemplate({ color: c })}
                  className={`w-5 h-5 rounded-full border border-black/50 transition ${
                    spellTemplate?.color === c ? 'scale-125 ring-2 ring-[#F27D26]' : 'hover:scale-110'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="text-[10px] text-[#8E9299] leading-relaxed">
            Кликните по карте, чтобы переместить эпицентр. Перемещайте курсор для поворота конуса или линии.
          </div>

          {spellTemplate && (
            <button
              onClick={onClearSpellTemplate}
              className="p-1.5 bg-red-950/70 hover:bg-red-900 border border-red-800 text-red-300 rounded text-xs font-bold transition flex items-center justify-center gap-1.5 mt-1"
            >
              <Trash2 size={13} />
              <span>УДАЛИТЬ С КАРТЫ</span>
            </button>
          )}
        </div>
      )}

      {/* В. ПАНЕЛЬ ПОЖАРА И ОГНЯ (FIRE HAZARDS) */}
      {activeFlyout === 'hazard_fire' && currentTool === 'hazard_fire' && (
        <div className="bg-[#151619] border border-orange-500/40 rounded-xl shadow-2xl p-3 w-72 flex flex-col gap-3">
          <div className="flex justify-between items-center text-xs border-b border-[#2A2A2A] pb-1">
            <div className="flex items-center gap-1.5 font-bold text-orange-400">
              <Flame size={14} />
              <span>ПОЖАР И ОГОНЬ</span>
            </div>
            <button
              onClick={() => onClearHazards?.('fire')}
              className="text-[10px] text-red-400 hover:text-red-300 underline font-bold"
              title="Потушить все очаги пожара на карте"
            >
              ПОТУШИТЬ ВСЕ
            </button>
          </div>

          {/* Пресеты огня */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-[#8E9299] font-bold">ПРЕСЕТЫ ПЛАМЕНИ:</span>
            <div className="grid grid-cols-1 gap-1 max-h-36 overflow-y-auto pr-1">
              {FIRE_PRESETS.map((p) => {
                const isActive = hazardConfig?.subType === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => {
                      onUpdateHazardConfig?.({
                        element: 'fire',
                        subType: p.id,
                        color: p.color,
                        secondaryColor: p.secondaryColor,
                        radius: p.defaultRadius,
                        opacity: p.defaultOpacity,
                        speed: p.defaultSpeed,
                        density: p.defaultDensity
                      });
                    }}
                    className={`p-1.5 rounded text-left text-xs transition flex items-center justify-between ${
                      isActive
                        ? 'bg-orange-950/80 border border-orange-500 text-white font-bold'
                        : 'bg-[#1E2024] hover:bg-[#2A2D33] text-[#A0A4AB]'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{p.icon}</span>
                      <span>{p.name}</span>
                    </div>
                    <div
                      className="w-3.5 h-3.5 rounded-full border border-black/40 shadow-sm"
                      style={{ backgroundColor: p.color }}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Настройка цветов пламени и искр */}
          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#2A2A2A]">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-[#8E9299]">ОСНОВНОЙ ЦВЕТ:</span>
              <div className="flex items-center gap-1.5">
                <input
                  type="color"
                  value={hazardConfig?.color || '#FF4500'}
                  onChange={(e) => onUpdateHazardConfig?.({ color: e.target.value, subType: 'fire_custom' })}
                  className="w-7 h-7 rounded cursor-pointer bg-transparent border-0"
                />
                <span className="text-[10px] font-mono">{hazardConfig?.color || '#FF4500'}</span>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-[#8E9299]">ЦВЕТ ИСКР / ЯДРА:</span>
              <div className="flex items-center gap-1.5">
                <input
                  type="color"
                  value={hazardConfig?.secondaryColor || '#FFD700'}
                  onChange={(e) => onUpdateHazardConfig?.({ secondaryColor: e.target.value })}
                  className="w-7 h-7 rounded cursor-pointer bg-transparent border-0"
                />
                <span className="text-[10px] font-mono">{hazardConfig?.secondaryColor || '#FFD700'}</span>
              </div>
            </div>
          </div>

          {/* Радиус очага и жар */}
          <div className="flex flex-col gap-2 pt-1 border-t border-[#2A2A2A] text-xs">
            <div className="flex justify-between">
              <span className="text-[#8E9299]">ШИРИНА ОЧАГА:</span>
              <span className="font-bold text-orange-400">{(hazardConfig?.radius || 50) * 2} px</span>
            </div>
            <input
              type="range"
              min={15}
              max={150}
              step={5}
              value={hazardConfig?.radius || 50}
              onChange={(e) => onUpdateHazardConfig?.({ radius: Number(e.target.value) })}
              className="accent-orange-500 h-1.5"
            />

            <div className="flex justify-between">
              <span className="text-[#8E9299]">ПЛОТНОСТЬ / ЖАР:</span>
              <span className="font-bold text-orange-400">{Math.round((hazardConfig?.opacity ?? 0.85) * 100)}%</span>
            </div>
            <input
              type="range"
              min={0.2}
              max={1}
              step={0.05}
              value={hazardConfig?.opacity ?? 0.85}
              onChange={(e) => onUpdateHazardConfig?.({ opacity: Number(e.target.value) })}
              className="accent-orange-500 h-1.5"
            />
          </div>
        </div>
      )}

      {/* Г. ПАНЕЛЬ ЗАТОПЛЕНИЯ И ВОДЫ (WATER & LIQUID HAZARDS) */}
      {activeFlyout === 'hazard_water' && currentTool === 'hazard_water' && (
        <div className="bg-[#151619] border border-cyan-500/40 rounded-xl shadow-2xl p-3 w-72 flex flex-col gap-3">
          <div className="flex justify-between items-center text-xs border-b border-[#2A2A2A] pb-1">
            <div className="flex items-center gap-1.5 font-bold text-cyan-400">
              <Droplets size={14} />
              <span>ВОДА, КИСЛОТА И ЛАВА</span>
            </div>
            <button
              onClick={() => onClearHazards?.('water')}
              className="text-[10px] text-red-400 hover:text-red-300 underline font-bold"
              title="Осушить все водные и кислотные зоны на карте"
            >
              ОСУШИТЬ ВСЕ
            </button>
          </div>

          {/* Пресеты жидкостей */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-[#8E9299] font-bold">ТИП ЖИДКОСТИ:</span>
            <div className="grid grid-cols-1 gap-1 max-h-36 overflow-y-auto pr-1">
              {WATER_PRESETS.map((p) => {
                const isActive = hazardConfig?.subType === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => {
                      onUpdateHazardConfig?.({
                        element: 'water',
                        subType: p.id,
                        color: p.color,
                        secondaryColor: p.secondaryColor,
                        radius: p.defaultRadius,
                        opacity: p.defaultOpacity,
                        speed: p.defaultSpeed,
                        density: p.defaultDensity
                      });
                    }}
                    className={`p-1.5 rounded text-left text-xs transition flex items-center justify-between ${
                      isActive
                        ? 'bg-cyan-950/80 border border-cyan-500 text-white font-bold'
                        : 'bg-[#1E2024] hover:bg-[#2A2D33] text-[#A0A4AB]'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{p.icon}</span>
                      <span>{p.name}</span>
                    </div>
                    <div
                      className="w-3.5 h-3.5 rounded-full border border-black/40 shadow-sm"
                      style={{ backgroundColor: p.color }}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Настройка цветов жидкости и ряби */}
          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#2A2A2A]">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-[#8E9299]">ЦВЕТ ЖИДКОСТИ:</span>
              <div className="flex items-center gap-1.5">
                <input
                  type="color"
                  value={hazardConfig?.color || '#0088FF'}
                  onChange={(e) => onUpdateHazardConfig?.({ color: e.target.value, subType: 'water_custom' })}
                  className="w-7 h-7 rounded cursor-pointer bg-transparent border-0"
                />
                <span className="text-[10px] font-mono">{hazardConfig?.color || '#0088FF'}</span>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-[#8E9299]">БЛИКИ / ПУЗЫРИ:</span>
              <div className="flex items-center gap-1.5">
                <input
                  type="color"
                  value={hazardConfig?.secondaryColor || '#66D9FF'}
                  onChange={(e) => onUpdateHazardConfig?.({ secondaryColor: e.target.value })}
                  className="w-7 h-7 rounded cursor-pointer bg-transparent border-0"
                />
                <span className="text-[10px] font-mono">{hazardConfig?.secondaryColor || '#66D9FF'}</span>
              </div>
            </div>
          </div>

          {/* Радиус затопления и прозрачность */}
          <div className="flex flex-col gap-2 pt-1 border-t border-[#2A2A2A] text-xs">
            <div className="flex justify-between">
              <span className="text-[#8E9299]">ШИРИНА ПОТОКА:</span>
              <span className="font-bold text-cyan-400">{(hazardConfig?.radius || 60) * 2} px</span>
            </div>
            <input
              type="range"
              min={15}
              max={150}
              step={5}
              value={hazardConfig?.radius || 60}
              onChange={(e) => onUpdateHazardConfig?.({ radius: Number(e.target.value) })}
              className="accent-cyan-500 h-1.5"
            />

            <div className="flex justify-between">
              <span className="text-[#8E9299]">ПРОЗРАЧНОСТЬ ВОДЫ:</span>
              <span className="font-bold text-cyan-400">{Math.round((hazardConfig?.opacity ?? 0.75) * 100)}%</span>
            </div>
            <input
              type="range"
              min={0.2}
              max={1}
              step={0.05}
              value={hazardConfig?.opacity ?? 0.75}
              onChange={(e) => onUpdateHazardConfig?.({ opacity: Number(e.target.value) })}
              className="accent-cyan-500 h-1.5"
            />
          </div>
        </div>
      )}

      {/* Д. ПАНЕЛЬ ЗАДЫМЛЕНИЯ И ГАЗА (GAS & SMOKE HAZARDS) */}
      {activeFlyout === 'hazard_gas' && currentTool === 'hazard_gas' && (
        <div className="bg-[#151619] border border-emerald-500/40 rounded-xl shadow-2xl p-3 w-72 flex flex-col gap-3">
          <div className="flex justify-between items-center text-xs border-b border-[#2A2A2A] pb-1">
            <div className="flex items-center gap-1.5 font-bold text-emerald-400">
              <Cloud size={14} />
              <span>ГАЗ, ДЫМ И ТУМАН</span>
            </div>
            <button
              onClick={() => onClearHazards?.('gas')}
              className="text-[10px] text-red-400 hover:text-red-300 underline font-bold"
              title="Развеять все облака дыма и газа на карте"
            >
              РАЗВЕЯТЬ ВСЕ
            </button>
          </div>

          {/* Пресеты газа */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-[#8E9299] font-bold">ТИП ГАЗА / ТУМАНА:</span>
            <div className="grid grid-cols-1 gap-1 max-h-36 overflow-y-auto pr-1">
              {GAS_PRESETS.map((p) => {
                const isActive = hazardConfig?.subType === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => {
                      onUpdateHazardConfig?.({
                        element: 'gas',
                        subType: p.id,
                        color: p.color,
                        secondaryColor: p.secondaryColor,
                        radius: p.defaultRadius,
                        opacity: p.defaultOpacity,
                        speed: p.defaultSpeed,
                        density: p.defaultDensity
                      });
                    }}
                    className={`p-1.5 rounded text-left text-xs transition flex items-center justify-between ${
                      isActive
                        ? 'bg-emerald-950/80 border border-emerald-500 text-white font-bold'
                        : 'bg-[#1E2024] hover:bg-[#2A2D33] text-[#A0A4AB]'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{p.icon}</span>
                      <span>{p.name}</span>
                    </div>
                    <div
                      className="w-3.5 h-3.5 rounded-full border border-black/40 shadow-sm"
                      style={{ backgroundColor: p.color }}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Настройка цветов газа */}
          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#2A2A2A]">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-[#8E9299]">ОТТЕНОК ГАЗА:</span>
              <div className="flex items-center gap-1.5">
                <input
                  type="color"
                  value={hazardConfig?.color || '#52E01F'}
                  onChange={(e) => onUpdateHazardConfig?.({ color: e.target.value, subType: 'gas_custom' })}
                  className="w-7 h-7 rounded cursor-pointer bg-transparent border-0"
                />
                <span className="text-[10px] font-mono">{hazardConfig?.color || '#52E01F'}</span>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-[#8E9299]">ВТОРИЧНЫЙ ПАР:</span>
              <div className="flex items-center gap-1.5">
                <input
                  type="color"
                  value={hazardConfig?.secondaryColor || '#C4F000'}
                  onChange={(e) => onUpdateHazardConfig?.({ secondaryColor: e.target.value })}
                  className="w-7 h-7 rounded cursor-pointer bg-transparent border-0"
                />
                <span className="text-[10px] font-mono">{hazardConfig?.secondaryColor || '#C4F000'}</span>
              </div>
            </div>
          </div>

          {/* Радиус облака и плотность */}
          <div className="flex flex-col gap-2 pt-1 border-t border-[#2A2A2A] text-xs">
            <div className="flex justify-between">
              <span className="text-[#8E9299]">РАДИУС ОБЛАКА:</span>
              <span className="font-bold text-emerald-400">{(hazardConfig?.radius || 75) * 2} px</span>
            </div>
            <input
              type="range"
              min={20}
              max={200}
              step={5}
              value={hazardConfig?.radius || 75}
              onChange={(e) => onUpdateHazardConfig?.({ radius: Number(e.target.value) })}
              className="accent-emerald-500 h-1.5"
            />

            <div className="flex justify-between">
              <span className="text-[#8E9299]">ПЛОТНОСТЬ ДЫМА:</span>
              <span className="font-bold text-emerald-400">{Math.round((hazardConfig?.opacity ?? 0.8) * 100)}%</span>
            </div>
            <input
              type="range"
              min={0.2}
              max={1}
              step={0.05}
              value={hazardConfig?.opacity ?? 0.8}
              onChange={(e) => onUpdateHazardConfig?.({ opacity: Number(e.target.value) })}
              className="accent-emerald-500 h-1.5"
            />
          </div>
        </div>
      )}

      {/* Е. Панель стилей и действий с туманом */}
      {activeFlyout === 'fog' && (
        <div className="bg-[#151619] border border-[#2A2A2A] rounded-xl shadow-2xl p-3 w-64 flex flex-col gap-3">
          <div className="text-xs font-bold text-[#F27D26] border-b border-[#2A2A2A] pb-1">
            ДЕЙСТВИЯ С ТУМАНОМ ВОЙНЫ
          </div>

          <div className="grid grid-cols-2 gap-1.5 text-xs">
            <button
              onClick={onRevealAllFog}
              className="p-1.5 bg-[#2A2A2A] hover:bg-[#3A3A3A] text-white rounded font-bold"
            >
              ОТКРЫТЬ ВСЕ
            </button>
            <button
              onClick={onHideAllFog}
              className="p-1.5 bg-[#2A2A2A] hover:bg-[#3A3A3A] text-white rounded font-bold"
            >
              СКРЫТЬ ВСЕ
            </button>
            <button
              onClick={onInvertFog}
              className="col-span-2 p-1.5 bg-[#2A1F18] border border-[#F27D26] text-[#F27D26] hover:bg-[#F27D26] hover:text-black rounded font-bold"
            >
              ИНВЕРТИРОВАТЬ ТУМАН
            </button>
          </div>

          <div className="text-xs font-bold text-[#8E9299] pt-1 border-t border-[#2A2A2A]">
            ТЕКСТУРА ТУМАНА:
          </div>

          <div className="grid grid-cols-2 gap-1.5 text-[11px]">
            {[
              { id: 'classic_black', label: 'Classic Black' },
              { id: 'mountain_mist', label: 'Mountain Mist' },
              { id: 'toxic_vapor', label: 'Toxic Vapor' },
              { id: 'crypt_darkness', label: 'Crypt Shadow' }
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => onFogStyleChange(st.id as any)}
                className={`p-1.5 rounded text-left transition ${
                  fogStyle === st.id ? 'bg-[#F27D26] text-black font-bold' : 'bg-[#2A2A2A] text-[#8E9299] hover:text-white'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Ж. Панель настройки сетки (Grid) */}
      {activeFlyout === 'grid' && (
        <div className="bg-[#151619] border border-[#2A2A2A] rounded-xl shadow-2xl p-3 w-64 flex flex-col gap-3">
          <div className="flex justify-between items-center text-xs border-b border-[#2A2A2A] pb-1">
            <span className="font-bold text-[#F27D26]">ТАКТИЧЕСКАЯ СЕТКА</span>
            <button
              onClick={() => onUpdateGrid({ enabled: !grid.enabled })}
              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                grid.enabled ? 'bg-green-900 text-green-300' : 'bg-[#2A2A2A] text-[#8E9299]'
              }`}
            >
              {grid.enabled ? 'ВКЛ' : 'ВЫКЛ'}
            </button>
          </div>

          {grid.enabled && (
            <>
              {/* Тип сетки */}
              <div className="flex gap-1 text-[10px]">
                {[
                  { id: 'square', label: 'КВАДРАТ' },
                  { id: 'hex_pointy', label: 'ГЕКС ВЕРТ' },
                  { id: 'hex_flat', label: 'ГЕКС ГОРИЗ' }
                ].map((gt) => (
                  <button
                    key={gt.id}
                    onClick={() => onUpdateGrid({ type: gt.id as any })}
                    className={`flex-1 py-1 rounded font-bold transition ${
                      grid.type === gt.id ? 'bg-[#F27D26] text-black' : 'bg-[#2A2A2A] text-[#8E9299]'
                    }`}
                  >
                    {gt.label}
                  </button>
                ))}
              </div>

              {/* Размер ячейки в пикселях */}
              <div className="flex flex-col gap-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#8E9299]">РАЗМЕР ЯЧЕЙКИ:</span>
                  <span className="font-bold">{grid.size} px</span>
                </div>
                <input
                  type="range"
                  min={25}
                  max={120}
                  step={5}
                  value={grid.size}
                  onChange={(e) => onUpdateGrid({ size: Number(e.target.value) })}
                  className="accent-[#F27D26] h-1.5"
                />
              </div>

              {/* Прозрачность */}
              <div className="flex flex-col gap-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#8E9299]">ПРОЗРАЧНОСТЬ:</span>
                  <span className="font-bold">{Math.round((grid.opacity ?? 0.5) * 100)}%</span>
                </div>
                <input
                  type="range"
                  min={0.1}
                  max={1}
                  step={0.05}
                  value={grid.opacity ?? 0.5}
                  onChange={(e) => onUpdateGrid({ opacity: Number(e.target.value) })}
                  className="accent-[#F27D26] h-1.5"
                />
              </div>

              {/* Кнопка калибровки сетки */}
              {onStartGridCalibration && (
                <div className="pt-2 border-t border-[#2A2A2A]">
                  <button
                    onClick={() => {
                      onStartGridCalibration();
                      toggleFlyout('grid');
                    }}
                    className="w-full p-2 bg-[#2A1F18] border border-[#F27D26] hover:bg-[#F27D26] hover:text-black text-[#F27D26] text-xs font-bold rounded-lg transition flex items-center justify-center gap-2 shadow-md"
                    title="Выделите клетку на изображении карты рамкой мышью"
                  >
                    <Focus size={15} />
                    <span>КАЛИБРОВКА СЕТКИ ПО КАРТЕ</span>
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* З. Панель слоев карты (Layers) */}
      {activeFlyout === 'layers' && (
        <div className="bg-[#151619] border border-[#2A2A2A] rounded-xl shadow-2xl p-3 w-72 flex flex-col gap-3">
          <div className="flex justify-between items-center text-xs border-b border-[#2A2A2A] pb-1">
            <span className="font-bold text-[#F27D26]">СЛОИ КАРТЫ</span>
            <label className="bg-[#F27D26] hover:bg-[#E06C15] text-black px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer">
              <Plus size={11} />
              <span>ДОБАВИТЬ СЛОЙ</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto">
            {layers.map((layer) => {
              const isSelected = selectedLayerId === layer.id;
              return (
                <div
                  key={layer.id}
                  onClick={() => onSelectLayer(layer.id)}
                  className={`p-2 rounded-lg border text-xs flex items-center justify-between cursor-pointer transition ${
                    isSelected
                      ? 'bg-[#2A1F18] border-[#F27D26] text-white font-bold'
                      : 'bg-[#1A1C20] border-[#2A2A2A] text-[#8E9299] hover:text-white'
                  }`}
                >
                  <span className="truncate max-w-[120px]">{layer.name}</span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleLayerVisibility(layer.id);
                      }}
                      className="p-1 hover:text-white"
                      title="Видимость слоя"
                    >
                      {layer.visible ? <Eye size={12} /> : <EyeOff size={12} />}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleLayerLock(layer.id);
                      }}
                      className="p-1 hover:text-white"
                      title="Блокировка слоя"
                    >
                      {layer.locked ? <Lock size={12} className="text-yellow-400" /> : <Unlock size={12} />}
                    </button>
                    {layers.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveLayer(layer.id);
                        }}
                        className="p-1 hover:text-red-400"
                        title="Удалить слой"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* И. Панель шаблонов заклинаний (Spell AoE Flyout) */}
      {activeFlyout === 'spell' && currentTool === 'spell_template' && (
        <div className="bg-[#151619] border border-[#2A2A2A] rounded-xl shadow-2xl p-3 w-64 flex flex-col gap-3">
          <div className="text-xs font-bold text-[#F27D26] border-b border-[#2A2A2A] pb-1">
            ФОРМА ОБЛАСТИ ЗАКЛИНАНИЯ
          </div>

          <div className="grid grid-cols-2 gap-1.5 text-xs">
            {[
              { id: 'sphere', label: 'Сфера (Fireball)' },
              { id: 'cone', label: 'Конус (Burning H.)' },
              { id: 'line', label: 'Линия (Lightning)' },
              { id: 'cube', label: 'Куб (Faerie Fire)' }
            ].map((sp) => (
              <button
                key={sp.id}
                onClick={() => onUpdateSpellTemplate({ shape: sp.id as any })}
                className={`p-1.5 rounded text-left transition ${
                  spellTemplate?.shape === sp.id ? 'bg-[#F27D26] text-black font-bold' : 'bg-[#2A2A2A] text-[#8E9299] hover:text-white'
                }`}
              >
                {sp.label}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-1 text-xs">
            <div className="flex justify-between">
              <span className="text-[#8E9299]">РАЗМЕР (ФУТЫ):</span>
              <span className="font-bold text-[#F27D26]">{spellTemplate?.sizeFeet || 20} ft</span>
            </div>
            <input
              type="range"
              min={5}
              max={120}
              step={5}
              value={spellTemplate?.sizeFeet || 20}
              onChange={(e) => onUpdateSpellTemplate({ sizeFeet: Number(e.target.value) })}
              className="accent-[#F27D26] h-1.5"
            />
          </div>
        </div>
      )}
    </div>
  );
};
