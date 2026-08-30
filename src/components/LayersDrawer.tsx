/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Панель управления слоями изображений (Layers Drawer).
 * Позволяет мастеру накладывать несколько картинок на холст,
 * управлять их порядком, прозрачностью, видимостью и положением.
 */

import React, { useRef, useState } from 'react';
import {
  Layers,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Trash2,
  MoveUp,
  MoveDown,
  Plus,
  Copy,
  Sliders,
  Sparkles,
  Maximize2,
  X
} from 'lucide-react';
import { MapLayer } from '../types';
import { SAMPLE_OVERLAYS, SampleOverlayDefinition } from '../utils/sampleOverlays';

interface LayersDrawerProps {
  layers: MapLayer[];
  selectedLayerId: string | null;
  onSelectLayer: (id: string | null) => void;
  onUpdateLayer: (id: string, update: Partial<MapLayer>) => void;
  onAddLayerFromFile: (file: File) => void;
  onAddSampleOverlay: (sample: SampleOverlayDefinition) => void;
  onRemoveLayer: (id: string) => void;
  onDuplicateLayer: (id: string) => void;
  onMoveLayerZ: (id: string, direction: 'up' | 'down') => void;
  onCenterLayer: (id: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const LayersDrawer: React.FC<LayersDrawerProps> = ({
  layers,
  selectedLayerId,
  onSelectLayer,
  onUpdateLayer,
  onAddLayerFromFile,
  onAddSampleOverlay,
  onRemoveLayer,
  onDuplicateLayer,
  onMoveLayerZ,
  onCenterLayer,
  isOpen,
  onClose
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showPresets, setShowPresets] = useState(false);

  if (!isOpen) return null;

  // Сортируем слои по zIndex сверху вниз (самый верхний слой первым в списке)
  const sortedLayers = [...layers].sort((a, b) => b.zIndex - a.zIndex);

  return (
    <aside
      id="layers-drawer-panel"
      className="absolute top-16 right-4 z-40 w-80 max-h-[calc(100vh-5rem)] bg-[#151619]/95 backdrop-blur-md border border-[#2A2A2A] rounded-lg shadow-2xl flex flex-col font-sans select-none overflow-hidden text-[#E0E0E0]"
    >
      {/* Заголовок панели */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-[#0D0D0F] border-b border-[#2A2A2A]">
        <div className="flex items-center gap-2">
          <Layers size={15} className="text-[#F27D26]" />
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#E0E0E0]">
            IMAGE LAYERS ({layers.length})
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowPresets(!showPresets)}
            className="p-1 rounded bg-[#2A2A2A] hover:bg-[#333333] text-[#F27D26] hover:text-white transition text-[10px] font-bold flex items-center gap-1 px-2"
            title="Готовые ассеты (тайлы, сундуки, круги, токены)"
          >
            <Sparkles size={12} />
            <span>PRESETS</span>
          </button>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-[#2A2A2A] text-[#8E9299] hover:text-[#E0E0E0] transition"
            title="Закрыть панель слоев"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Меню готовых оверлеев/тайлов */}
      {showPresets && (
        <div className="bg-[#111214] border-b border-[#2A2A2A] p-2 flex flex-col gap-1.5 max-h-48 overflow-y-auto">
          <span className="text-[9px] font-mono text-[#8E9299] uppercase tracking-widest px-1 font-bold">
            QUICK OVERLAY ASSETS
          </span>
          <div className="grid grid-cols-2 gap-1.5">
            {SAMPLE_OVERLAYS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => {
                  onAddSampleOverlay(preset);
                  setShowPresets(false);
                }}
                className="flex flex-col text-left p-1.5 rounded bg-[#1A1A1C] hover:bg-[#2A2A2A] border border-[#2A2A2A] hover:border-[#F27D26] transition"
              >
                <span className="text-[11px] font-semibold text-[#E0E0E0] truncate">
                  {preset.name}
                </span>
                <span className="text-[9px] font-mono text-[#8E9299]">
                  {preset.width}x{preset.height}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Список слоев */}
      <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1.5 max-h-96 min-h-32">
        {sortedLayers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center text-[#8E9299]">
            <Layers size={28} className="mb-2 opacity-40 text-[#F27D26]" />
            <span className="text-xs font-mono">НЕТ НАЛОЖЕННЫХ СЛОЕВ</span>
            <span className="text-[10px] mt-1 opacity-70">
              Добавьте тайлы, токены или доп. карты
            </span>
          </div>
        ) : (
          sortedLayers.map((layer) => {
            const isSelected = selectedLayerId === layer.id;
            return (
              <div
                key={layer.id}
                onClick={() => onSelectLayer(layer.id)}
                className={`flex flex-col p-2 rounded transition cursor-pointer border ${
                  isSelected
                    ? 'bg-[#1E1F24] border-[#F27D26] shadow-sm'
                    : 'bg-[#111214] border-[#222429] hover:border-[#3A3A3A]'
                }`}
              >
                {/* Верхняя строка слоя: Превью, Имя, Действия */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 truncate flex-1">
                    <div className="w-7 h-7 rounded bg-[#0A0A0A] border border-[#2A2A2A] overflow-hidden shrink-0 flex items-center justify-center">
                      <img
                        src={layer.url}
                        alt={layer.name}
                        className="w-full h-full object-cover pointer-events-none"
                      />
                    </div>
                    <div className="flex flex-col truncate">
                      <span className="text-[11px] font-semibold text-[#E0E0E0] truncate">
                        {layer.name}
                      </span>
                      <span className="text-[9px] font-mono text-[#8E9299]">
                        {Math.round(layer.width * layer.scale)}x{Math.round(layer.height * layer.scale)}px (Z:{layer.zIndex})
                      </span>
                    </div>
                  </div>

                  {/* Кнопки видимости и блокировки */}
                  <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => onUpdateLayer(layer.id, { visible: !layer.visible })}
                      className={`p-1 rounded hover:bg-[#2A2A2A] transition ${
                        layer.visible ? 'text-[#E0E0E0]' : 'text-[#8E9299] opacity-40'
                      }`}
                      title={layer.visible ? 'Скрыть на проекторе' : 'Показать на проекторе'}
                    >
                      {layer.visible ? <Eye size={13} className="text-[#00FF00]" /> : <EyeOff size={13} />}
                    </button>

                    <button
                      onClick={() => onUpdateLayer(layer.id, { locked: !layer.locked })}
                      className={`p-1 rounded hover:bg-[#2A2A2A] transition ${
                        layer.locked ? 'text-[#F27D26]' : 'text-[#8E9299]'
                      }`}
                      title={layer.locked ? 'Разблокировать перемещение' : 'Заблокировать слой'}
                    >
                      {layer.locked ? <Lock size={13} /> : <Unlock size={13} />}
                    </button>

                    <button
                      onClick={() => onMoveLayerZ(layer.id, 'up')}
                      className="p-1 rounded hover:bg-[#2A2A2A] text-[#8E9299] hover:text-[#E0E0E0]"
                      title="Поднять слой выше (Z-Order)"
                    >
                      <MoveUp size={12} />
                    </button>

                    <button
                      onClick={() => onMoveLayerZ(layer.id, 'down')}
                      className="p-1 rounded hover:bg-[#2A2A2A] text-[#8E9299] hover:text-[#E0E0E0]"
                      title="Опустить слой ниже (Z-Order)"
                    >
                      <MoveDown size={12} />
                    </button>

                    <button
                      onClick={() => onRemoveLayer(layer.id)}
                      className="p-1 rounded hover:bg-[#2A1810] text-[#8E9299] hover:text-[#EF4444] transition"
                      title="Удалить слой"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>

                {/* Настройки выбранного слоя */}
                {isSelected && (
                  <div
                    className="mt-2 pt-2 border-t border-[#2A2A2A] flex flex-col gap-1.5 text-[10px] font-mono"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Прозрачность */}
                    <div className="flex items-center justify-between">
                      <span className="text-[#8E9299]">OPACITY:</span>
                      <input
                        type="range"
                        min={0.05}
                        max={1}
                        step={0.05}
                        value={layer.opacity}
                        onChange={(e) => onUpdateLayer(layer.id, { opacity: Number(e.target.value) })}
                        className="w-28 accent-[#F27D26] h-1"
                      />
                      <span className="text-[#F27D26] w-8 text-right font-bold">
                        {Math.round(layer.opacity * 100)}%
                      </span>
                    </div>

                    {/* Масштаб */}
                    <div className="flex items-center justify-between">
                      <span className="text-[#8E9299]">SCALE:</span>
                      <input
                        type="range"
                        min={0.1}
                        max={3}
                        step={0.05}
                        value={layer.scale}
                        onChange={(e) => onUpdateLayer(layer.id, { scale: Number(e.target.value) })}
                        className="w-28 accent-[#F27D26] h-1"
                      />
                      <span className="text-[#F27D26] w-8 text-right font-bold">
                        {Math.round(layer.scale * 100)}%
                      </span>
                    </div>

                    {/* Быстрые действия */}
                    <div className="flex items-center justify-between pt-1 gap-1">
                      <button
                        onClick={() => onCenterLayer(layer.id)}
                        className="flex-1 py-1 rounded bg-[#2A2A2A] hover:bg-[#333333] text-[9px] font-bold uppercase tracking-wider text-center text-[#E0E0E0]"
                        title="Поместить в центр холста"
                      >
                        CENTER
                      </button>
                      <button
                        onClick={() => onDuplicateLayer(layer.id)}
                        className="flex-1 py-1 rounded bg-[#2A2A2A] hover:bg-[#333333] text-[9px] font-bold uppercase tracking-wider text-center text-[#E0E0E0]"
                        title="Дублировать слой"
                      >
                        DUPLICATE
                      </button>
                      <button
                        onClick={() => onUpdateLayer(layer.id, { scale: 1, rotation: 0 })}
                        className="flex-1 py-1 rounded bg-[#2A2A2A] hover:bg-[#333333] text-[9px] font-bold uppercase tracking-wider text-center text-[#E0E0E0]"
                        title="Сбросить трансформации"
                      >
                        RESET 1:1
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Нижняя панель добавления нового слоя */}
      <div className="p-2.5 bg-[#0D0D0F] border-t border-[#2A2A2A] flex items-center gap-2">
        <input
          type="file"
          ref={fileInputRef}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) {
              onAddLayerFromFile(f);
              e.target.value = '';
            }
          }}
          accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml,video/mp4,video/webm"
          className="hidden"
        />

        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex-1 bg-[#2A2A2A] hover:bg-[#333333] border border-[#3A3A3A] hover:border-[#F27D26] text-[#E0E0E0] hover:text-white py-2 rounded text-[11px] font-bold font-mono uppercase tracking-wider flex items-center justify-center gap-1.5 transition active:scale-95"
          title="Загрузить локальное изображение или видео как накладываемый слой"
        >
          <Plus size={13} className="text-[#F27D26]" />
          <span>ADD IMAGE LAYER</span>
        </button>
      </div>
    </aside>
  );
};
