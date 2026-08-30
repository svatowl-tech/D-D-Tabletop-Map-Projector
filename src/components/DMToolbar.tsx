/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Компактная плавающая боковая панель инструментов Мастера (Photoshop-style DM Toolbar).
 */

import React, { useState } from 'react';
import {
  DMTool,
  GridConfig,
  FogTextureStyle,
  MapLayer,
  SpellTemplate
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
  RotateCcw,
  Sliders,
  Maximize2,
  Trash2,
  Lock,
  Unlock,
  ChevronRight,
  Plus,
  Flame,
  Droplets,
  Palette
} from 'lucide-react';

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
  // Очистка тактических рисунков
  onClearDrawings: () => void;
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
  layers,
  selectedLayerId,
  onSelectLayer,
  onAddLayer,
  onRemoveLayer,
  onToggleLayerLock,
  onToggleLayerVisibility,
  spellTemplate,
  onUpdateSpellTemplate,
  onClearDrawings
}) => {
  const [activeFlyout, setActiveFlyout] = useState<'brush' | 'fog' | 'grid' | 'layers' | 'spell' | null>(null);

  const toggleFlyout = (name: 'brush' | 'fog' | 'grid' | 'layers' | 'spell') => {
    setActiveFlyout(activeFlyout === name ? null : name);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onAddLayer(file);
      e.target.value = '';
    }
  };

  return (
    <div className="absolute top-18 left-4 z-40 flex items-start gap-2 select-none font-mono text-[#E0E0E0]">
      {/* Главная вертикальная колонка инструментов */}
      <div className="bg-[#151619]/95 border border-[#2A2A2A] rounded-xl shadow-2xl p-1.5 flex flex-col gap-1 backdrop-blur">
        {/* 1. ВЫБОР И ПЕРЕМЕЩЕНИЕ СЛОЕВ */}
        <button
          onClick={() => onSelectTool('select')}
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
          onClick={() => onSelectTool('pan')}
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
          onClick={() => onSelectTool('laser')}
          className={`p-2.5 rounded-lg transition flex items-center justify-center ${
            currentTool === 'laser'
              ? 'bg-red-950/80 text-red-400 border border-red-800 shadow-[0_0_10px_rgba(239,68,68,0.4)]'
              : 'text-[#8E9299] hover:bg-[#252830] hover:text-white'
          }`}
          title="Лазерная указка с затухающим следом (L)"
        >
          <Sparkles size={16} />
        </button>

        {/* 6. ПИНГ ВНИМАНИЯ (PING) */}
        <button
          onClick={() => onSelectTool('ping')}
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
          onClick={() => onSelectTool('ruler')}
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
          onClick={() => onSelectTool('draw')}
          className={`p-2.5 rounded-lg transition flex items-center justify-center ${
            currentTool === 'draw'
              ? 'bg-[#2A1F18] text-[#F27D26] border border-[#F27D26]/70 shadow-[0_0_10px_rgba(242,125,38,0.3)]'
              : 'text-[#8E9299] hover:bg-[#252830] hover:text-white'
          }`}
          title="Тактическое рисование маркером и стрелки (D)"
        >
          <Pencil size={16} />
        </button>

        <div className="w-full h-px bg-[#2A2A2A] my-0.5" />

        {/* 10. УПРАВЛЕНИЕ ТУМАНОМ (FOG CONTROLS) */}
        <button
          onClick={() => toggleFlyout('fog')}
          className={`p-2.5 rounded-lg transition flex items-center justify-center ${
            activeFlyout === 'fog' ? 'bg-[#2A2A2A] text-[#F27D26]' : 'text-[#8E9299] hover:bg-[#252830] hover:text-white'
          }`}
          title="Управление туманом войны (Стили, Инверсия, Заливка)"
        >
          <Palette size={16} />
        </button>

        {/* 11. НАСТРОЙКИ СЕТКИ (GRID) */}
        <button
          onClick={() => toggleFlyout('grid')}
          className={`p-2.5 rounded-lg transition flex items-center justify-center ${
            activeFlyout === 'grid' ? 'bg-[#2A2A2A] text-[#F27D26]' : 'text-[#8E9299] hover:bg-[#252830] hover:text-white'
          }`}
          title="Настройки тактической сетки (Квадраты, Гексы, Шаг)"
        >
          <Grid size={16} />
        </button>

        {/* 12. МЕНЕДЖЕР СЛОЕВ КАРТЫ (LAYERS) */}
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

      {/* ВСПЛЫВАЮЩИЕ ПАНЕЛИ НАСТРОЕК (FLYOUTS) */}

      {/* А. Панель параметров кисти */}
      {activeFlyout === 'brush' && (currentTool === 'reveal' || currentTool === 'hide') && (
        <div className="bg-[#151619] border border-[#2A2A2A] rounded-xl shadow-2xl p-3 w-56 flex flex-col gap-2.5">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-[#F27D26]">BRUSH SIZE:</span>
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
              CIRCLE
            </button>
            <button
              onClick={() => onBrushShapeChange('rect')}
              className={`flex-1 py-1 rounded font-bold transition ${
                brushShape === 'rect' ? 'bg-[#F27D26] text-black' : 'bg-[#2A2A2A] text-[#8E9299]'
              }`}
            >
              RECT
            </button>
          </div>
        </div>
      )}

      {/* Б. Панель стилей и действий с туманом */}
      {activeFlyout === 'fog' && (
        <div className="bg-[#151619] border border-[#2A2A2A] rounded-xl shadow-2xl p-3 w-64 flex flex-col gap-3">
          <div className="text-xs font-bold text-[#F27D26] border-b border-[#2A2A2A] pb-1">
            FOG OF WAR ACTIONS
          </div>

          <div className="grid grid-cols-2 gap-1.5 text-xs">
            <button
              onClick={onRevealAllFog}
              className="p-1.5 bg-[#2A2A2A] hover:bg-[#3A3A3A] text-white rounded font-bold"
            >
              REVEAL ALL
            </button>
            <button
              onClick={onHideAllFog}
              className="p-1.5 bg-[#2A2A2A] hover:bg-[#3A3A3A] text-white rounded font-bold"
            >
              HIDE ALL
            </button>
            <button
              onClick={onInvertFog}
              className="col-span-2 p-1.5 bg-[#2A1F18] border border-[#F27D26] text-[#F27D26] hover:bg-[#F27D26] hover:text-black rounded font-bold"
            >
              INVERT FOG MASK
            </button>
          </div>

          <div className="text-xs font-bold text-[#8E9299] pt-1 border-t border-[#2A2A2A]">
            FOG TEXTURE STYLE:
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

      {/* В. Панель настройки сетки (Grid) */}
      {activeFlyout === 'grid' && (
        <div className="bg-[#151619] border border-[#2A2A2A] rounded-xl shadow-2xl p-3 w-64 flex flex-col gap-3">
          <div className="flex justify-between items-center text-xs border-b border-[#2A2A2A] pb-1">
            <span className="font-bold text-[#F27D26]">TACTICAL GRID</span>
            <button
              onClick={() => onUpdateGrid({ enabled: !grid.enabled })}
              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                grid.enabled ? 'bg-green-900 text-green-300' : 'bg-[#2A2A2A] text-[#8E9299]'
              }`}
            >
              {grid.enabled ? 'ON' : 'OFF'}
            </button>
          </div>

          {grid.enabled && (
            <>
              {/* Тип сетки */}
              <div className="flex gap-1 text-[10px]">
                {[
                  { id: 'square', label: 'SQUARE' },
                  { id: 'hex_pointy', label: 'HEX VERT' },
                  { id: 'hex_flat', label: 'HEX HORIZ' }
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
                  <span className="text-[#8E9299]">CELL SIZE:</span>
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
                  <span className="text-[#8E9299]">OPACITY:</span>
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
            </>
          )}
        </div>
      )}

      {/* Г. Панель слоев карты (Layers) */}
      {activeFlyout === 'layers' && (
        <div className="bg-[#151619] border border-[#2A2A2A] rounded-xl shadow-2xl p-3 w-72 flex flex-col gap-3">
          <div className="flex justify-between items-center text-xs border-b border-[#2A2A2A] pb-1">
            <span className="font-bold text-[#F27D26]">MAP LAYERS</span>
            <label className="bg-[#F27D26] hover:bg-[#E06C15] text-black px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer">
              <Plus size={11} />
              <span>ADD IMAGE</span>
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

      {/* Д. Панель шаблонов заклинаний (Spell AoE Flyout) */}
      {activeFlyout === 'spell' && currentTool === 'spell_template' && (
        <div className="bg-[#151619] border border-[#2A2A2A] rounded-xl shadow-2xl p-3 w-64 flex flex-col gap-3">
          <div className="text-xs font-bold text-[#F27D26] border-b border-[#2A2A2A] pb-1">
            SPELL AOE SHAPE
          </div>

          <div className="grid grid-cols-2 gap-1.5 text-xs">
            {[
              { id: 'sphere', label: 'Sphere (Fireball)' },
              { id: 'cone', label: 'Cone (Burning H.)' },
              { id: 'line', label: 'Line (Lightning)' },
              { id: 'cube', label: 'Cube (Faerie Fire)' }
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
              <span className="text-[#8E9299]">SIZE (FEET):</span>
              <span className="font-bold text-[#F27D26]">{spellTemplate?.sizeFeet || 20} ft</span>
            </div>
            <input
              type="range"
              min={5}
              max={100}
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
