/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Компонент калибровки и валидации тактической сетки (Grid Calibrator & Validator).
 * Позволяет выделить рамкой 1 клетку (или блок N×M клеток) на загруженном или сгенерированном изображении карты,
 * чтобы автоматически рассчитать точный размер ячейки в пикселях и смещение (offsetX, offsetY).
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GridConfig, StrokePoint } from '../types';
import { Focus, Check, X, ArrowLeft, ArrowRight, ArrowUp, ArrowDown, Plus, Minus, Move, Shield, CheckCircle2, RotateCcw, Sparkles } from 'lucide-react';

interface GridCalibratorOverlayProps {
  active: boolean;
  grid: GridConfig;
  onUpdateGrid: (updated: Partial<GridConfig>) => void;
  onClose: () => void;
  mapWidth: number;
  mapHeight: number;
  viewportScale: number;
  showToast?: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const GridCalibratorOverlay: React.FC<GridCalibratorOverlayProps> = ({
  active,
  grid,
  onUpdateGrid,
  onClose,
  mapWidth,
  mapHeight,
  viewportScale,
  showToast
}) => {
  // Количество ячеек в выделенной рамке (1x1, 2x2, 3x3, 5x5, 10x10)
  const [cellsCount, setCellsCount] = useState<number>(1);

  // Исходная конфигурация сетки до начала калибровки (для сброса)
  const initialGridRef = useRef<GridConfig>(grid);

  // Состояние выделенной области калибровки на карте (в пикселях карты)
  const [selection, setSelection] = useState<{
    x: number;
    y: number;
    w: number;
    h: number;
  } | null>(null);

  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<StrokePoint | null>(null);

  // При активации сохраняем начальное состояние
  useEffect(() => {
    if (active) {
      initialGridRef.current = { ...grid };
      // Если сетка уже настроена, создаем тестовое выделение в центре
      if (grid.size > 0 && !selection) {
        const sz = grid.size * cellsCount;
        const startX = (grid.offsetX || 0) + grid.size * 2;
        const startY = (grid.offsetY || 0) + grid.size * 2;
        setSelection({
          x: startX,
          y: startY,
          w: sz,
          h: sz
        });
      }
    }
  }, [active]);

  // Расчет сетки по выделить область
  const calculateAndApplyGrid = useCallback((x: number, y: number, w: number, h: number, count: number) => {
    if (w < 5 || h < 5) return;

    // Средний размер одной ячейки по X и Y
    const cellW = w / count;
    const cellH = h / count;
    const rawSize = (cellW + cellH) / 2;
    const size = Math.max(10, Math.round(rawSize));

    // Смещение сетки
    const offX = Math.round(((x % size) + size) % size);
    const offY = Math.round(((y % size) + size) % size);

    onUpdateGrid({
      enabled: true,
      size,
      offsetX: offX,
      offsetY: offY
    });
  }, [onUpdateGrid]);

  // Изменение количества ячеек в мультипликаторе (1x1 -> 5x5)
  const handleCellsCountChange = (count: number) => {
    setCellsCount(count);
    if (selection) {
      const newW = (selection.w / cellsCount) * count;
      const newH = (selection.h / cellsCount) * count;
      const newSel = { ...selection, w: newW, h: newH };
      setSelection(newSel);
      calculateAndApplyGrid(newSel.x, newSel.y, newSel.w, newSel.h, count);
    }
  };

  // Микро-подстройка размера сетки (±1px)
  const handleAdjustSize = (delta: number) => {
    const newSize = Math.max(10, grid.size + delta);
    onUpdateGrid({ size: newSize });
  };

  // Микро-подстройка смещения X (±1px)
  const handleAdjustOffsetX = (delta: number) => {
    const size = grid.size || 50;
    const newOffX = (((grid.offsetX || 0) + delta) % size + size) % size;
    onUpdateGrid({ offsetX: Math.round(newOffX) });
  };

  // Микро-подстройка смещения Y (±1px)
  const handleAdjustOffsetY = (delta: number) => {
    const size = grid.size || 50;
    const newOffY = (((grid.offsetY || 0) + delta) % size + size) % size;
    onUpdateGrid({ offsetY: Math.round(newOffY) });
  };

  // Отмена и возврат исходной сетки
  const handleCancel = () => {
    onUpdateGrid(initialGridRef.current);
    onClose();
  };

  // Успешное применение
  const handleConfirm = () => {
    onUpdateGrid({ enabled: true });
    if (showToast) {
      showToast(
        `Сетка откалибрована! Размер клетки: ${grid.size}px (X: ${grid.offsetX || 0}px, Y: ${grid.offsetY || 0}px)`,
        'success'
      );
    }
    onClose();
  };

  if (!active) return null;

  return (
    <>
      {/* 1. ФИКСИРОВАННАЯ ПАНЕЛЬ УПРАВЛЕНИЯ КАЛИБРОВКОЙ (TOP HUD) */}
      <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-[#151619]/95 border-2 border-[#F27D26] rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.8)] backdrop-blur-md p-3.5 w-[520px] max-w-[95vw] text-white flex flex-col gap-3 transition-all animate-in fade-in zoom-in-95 duration-200">
        
        {/* Шапка HUD */}
        <div className="flex items-center justify-between border-b border-[#2A2A2A] pb-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[#F27D26]/20 border border-[#F27D26] text-[#F27D26]">
              <Sparkles size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-wide text-[#F27D26] flex items-center gap-2">
                КАЛИБРОВКА И ВАЛИДАЦИЯ СЕТКИ
              </h3>
              <p className="text-[10px] text-[#A0A4AB]">
                Зажмите ЛКМ и выделите область клеток на карте для точного совпадения
              </p>
            </div>
          </div>
          <button
            onClick={handleCancel}
            className="p-1 text-[#8E9299] hover:text-white hover:bg-[#2A2A2A] rounded transition"
            title="Закрыть без сохранения"
          >
            <X size={18} />
          </button>
        </div>

        {/* Выбор мультипликатора ячеек */}
        <div className="flex items-center justify-between gap-2 bg-[#1A1C20] p-2 rounded-xl border border-[#2A2A2A]">
          <span className="text-[11px] font-bold text-[#8E9299]">ВЫДЕЛЯЕМЫЙ БЛОК:</span>
          <div className="flex gap-1">
            {[
              { count: 1, label: '1×1 клетка' },
              { count: 2, label: '2×2 клетки' },
              { count: 3, label: '3×3 клетки' },
              { count: 5, label: '5×5 клеток' },
              { count: 10, label: '10×10' }
            ].map((m) => (
              <button
                key={m.count}
                onClick={() => handleCellsCountChange(m.count)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                  cellsCount === m.count
                    ? 'bg-[#F27D26] text-black shadow-md scale-105'
                    : 'bg-[#252830] text-[#8E9299] hover:text-white'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Статистика вычислений и микро-подстройка */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          {/* Размер ячейки */}
          <div className="bg-[#1E2024] p-2 rounded-xl border border-[#2A2A2A] flex flex-col gap-1.5">
            <div className="flex justify-between items-center">
              <span className="text-[#8E9299] text-[10px] font-bold">РАЗМЕР ЯЧЕЙКИ:</span>
              <span className="text-[#F27D26] font-mono font-bold text-sm">{grid.size} px</span>
            </div>
            <div className="flex items-center justify-between gap-1 pt-1 border-t border-[#2A2A2A]">
              <span className="text-[10px] text-[#A0A4AB]">Точная подстройка:</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleAdjustSize(-1)}
                  className="p-1 bg-[#2B2E36] hover:bg-[#3A3E48] rounded text-white"
                  title="-1 px"
                >
                  <Minus size={12} />
                </button>
                <button
                  onClick={() => handleAdjustSize(1)}
                  className="p-1 bg-[#2B2E36] hover:bg-[#3A3E48] rounded text-white"
                  title="+1 px"
                >
                  <Plus size={12} />
                </button>
              </div>
            </div>
          </div>

          {/* Смещение (Offsets) */}
          <div className="bg-[#1E2024] p-2 rounded-xl border border-[#2A2A2A] flex flex-col gap-1.5">
            <div className="flex justify-between items-center">
              <span className="text-[#8E9299] text-[10px] font-bold">СМЕЩЕНИЕ (X / Y):</span>
              <span className="text-cyan-400 font-mono font-bold text-xs">
                X:{grid.offsetX || 0}px | Y:{grid.offsetY || 0}px
              </span>
            </div>
            <div className="flex items-center justify-between gap-1 pt-1 border-t border-[#2A2A2A]">
              <span className="text-[10px] text-[#A0A4AB]">Сдвиг сетки:</span>
              <div className="flex items-center gap-1 text-[10px]">
                <button
                  onClick={() => handleAdjustOffsetX(-1)}
                  className="px-1.5 py-0.5 bg-[#2B2E36] hover:bg-[#3A3E48] rounded text-white font-mono"
                  title="Сдвиг влево (-1px)"
                >
                  ←
                </button>
                <button
                  onClick={() => handleAdjustOffsetX(1)}
                  className="px-1.5 py-0.5 bg-[#2B2E36] hover:bg-[#3A3E48] rounded text-white font-mono"
                  title="Сдвиг вправо (+1px)"
                >
                  →
                </button>
                <button
                  onClick={() => handleAdjustOffsetY(-1)}
                  className="px-1.5 py-0.5 bg-[#2B2E36] hover:bg-[#3A3E48] rounded text-white font-mono"
                  title="Сдвиг вверх (-1px)"
                >
                  ↑
                </button>
                <button
                  onClick={() => handleAdjustOffsetY(1)}
                  className="px-1.5 py-0.5 bg-[#2B2E36] hover:bg-[#3A3E48] rounded text-white font-mono"
                  title="Сдвиг вниз (+1px)"
                >
                  ↓
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Кнопки действий */}
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#2A2A2A]">
          <div className="text-[10px] text-[#8E9299]">
            Сетка карты: <span className="font-bold text-white">{Math.floor(mapWidth / (grid.size || 50))} × {Math.floor(mapHeight / (grid.size || 50))} клеток</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCancel}
              className="px-3 py-1.5 bg-[#252830] hover:bg-[#323642] text-[#A0A4AB] text-xs font-bold rounded-xl transition flex items-center gap-1.5"
            >
              <RotateCcw size={13} />
              <span>Отмена</span>
            </button>
            <button
              onClick={handleConfirm}
              className="px-4 py-1.5 bg-[#F27D26] hover:bg-[#E06C15] text-black text-xs font-bold rounded-xl shadow-lg transition flex items-center gap-1.5"
            >
              <CheckCircle2 size={14} />
              <span>ПРИМЕНИТЬ СЕТКУ</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. ИНТЕРАКТИВНАЯ РАМКА ВЫДЕЛЕНИЯ КЛЕТКИ НА КАРТЕ */}
      {selection && (
        <div
          className="absolute pointer-events-none border-2 border-[#F27D26] bg-[#F27D26]/15 shadow-[0_0_20px_rgba(242,125,38,0.5)] z-40 rounded-sm"
          style={{
            left: `${selection.x}px`,
            top: `${selection.y}px`,
            width: `${selection.w}px`,
            height: `${selection.h}px`
          }}
        >
          {/* Разделительные линии внутри рамки для подтверждения сетки N x M */}
          {cellsCount > 1 && (
            <div className="w-full h-full relative">
              {Array.from({ length: cellsCount - 1 }).map((_, i) => (
                <React.Fragment key={i}>
                  <div
                    className="absolute top-0 bottom-0 border-r border-dashed border-[#F27D26]/60"
                    style={{ left: `${((i + 1) / cellsCount) * 100}%` }}
                  />
                  <div
                    className="absolute left-0 right-0 border-b border-dashed border-[#F27D26]/60"
                    style={{ top: `${((i + 1) / cellsCount) * 100}%` }}
                  />
                </React.Fragment>
              ))}
            </div>
          )}

          {/* Маркеры по углам */}
          <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-[#F27D26] rounded-full border border-black shadow" />
          <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-[#F27D26] rounded-full border border-black shadow" />
          <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-[#F27D26] rounded-full border border-black shadow" />
          <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-[#F27D26] rounded-full border border-black shadow" />

          {/* Плашка с размером над рамкой */}
          <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-[#151619] border border-[#F27D26] text-[#F27D26] px-2 py-0.5 rounded text-[10px] font-mono font-bold whitespace-nowrap shadow-lg">
            {cellsCount}×{cellsCount} ячеек ({Math.round(selection.w / cellsCount)}px / клетка)
          </div>

          {/* Тестовый круг токена внутри первой ячейки */}
          <div
            className="absolute border-2 border-dashed border-cyan-400 rounded-full bg-cyan-400/20 flex items-center justify-center text-cyan-300 font-bold text-[10px]"
            style={{
              left: `${(selection.w / cellsCount) * 0.1}px`,
              top: `${(selection.h / cellsCount) * 0.1}px`,
              width: `${(selection.w / cellsCount) * 0.8}px`,
              height: `${(selection.h / cellsCount) * 0.8}px`
            }}
          >
            Токен
          </div>
        </div>
      )}
    </>
  );
};
