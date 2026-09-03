/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Оверлей мгновенной загрузки и замены карты методом Drag-and-Drop (D&D Direct Drop).
 * Позволяет мастеру перетащить изображение или видео карты прямо из проводника/Finder
 * на стол с мгновенной трансляцией игрокам на проектор без лишних диалогов.
 */

import React from 'react';
import { Map, Upload, Sparkles, Tv, Layers, Zap } from 'lucide-react';

interface TabletopDropOverlayProps {
  isDragActive: boolean;
  isShiftPressed?: boolean;
}

export const TabletopDropOverlay: React.FC<TabletopDropOverlayProps> = ({
  isDragActive,
  isShiftPressed = false
}) => {
  if (!isDragActive) return null;

  return (
    <div
      id="tabletop-drop-zone"
      className="absolute inset-0 z-50 pointer-events-none flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="max-w-xl w-full p-8 rounded-2xl border-2 border-dashed border-[#F27D26] bg-[#121316]/95 shadow-[0_0_50px_rgba(242,125,38,0.35)] flex flex-col items-center text-center gap-5 scale-in-95 animate-in duration-200">
        
        {/* Анимированная иконка загрузки */}
        <div className="relative">
          <div className="w-20 h-20 rounded-2xl bg-[#F27D26]/15 border border-[#F27D26]/40 flex items-center justify-center text-[#F27D26] shadow-inner animate-pulse">
            {isShiftPressed ? (
              <Layers size={42} className="text-[#F27D26]" />
            ) : (
              <Map size={42} className="text-[#F27D26]" />
            )}
          </div>
          <div className="absolute -top-1 -right-1 p-1.5 rounded-full bg-[#F27D26] text-black shadow-md">
            <Sparkles size={14} />
          </div>
        </div>

        {/* Заголовки действия */}
        <div className="flex flex-col items-center gap-1.5">
          <span className="text-[11px] font-mono font-bold tracking-[0.25em] text-[#F27D26] uppercase flex items-center gap-1.5">
            <Zap size={14} />
            {isShiftPressed ? 'РЕЖИМ ДОБАВЛЕНИЯ СЛОЯ' : 'МГНОВЕННАЯ ЗАМЕНА КАРТЫ СТОЛА'}
          </span>
          <h2 className="text-2xl font-serif font-bold text-white tracking-wide">
            {isShiftPressed
              ? 'Отпустите файл для наложения слоя'
              : 'Бросьте файл карты прямо на стол'}
          </h2>
          <p className="text-xs text-[#9E9E9E] max-w-md mt-1 leading-relaxed">
            {isShiftPressed
              ? 'Файл будет добавлен как дополнительный слой поверх текущей тактической карты.'
              : 'Карта мгновенно заменит текущую, автоматически адаптирует размер холста и сразу появится на экранах игроков.'}
          </p>
        </div>

        {/* Информационные плашки */}
        <div className="grid grid-cols-2 gap-2.5 w-full mt-2 text-left">
          <div className="p-3 rounded-lg bg-[#1A1B1F] border border-[#2A2B30] flex items-center gap-2.5">
            <Tv size={18} className="text-[#F27D26] shrink-0" />
            <div className="flex flex-col">
              <span className="text-[11px] font-bold text-white">Авто-синхронизация</span>
              <span className="text-[10px] text-[#7E828B]">Проектор обновится моментально</span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-[#1A1B1F] border border-[#2A2B30] flex items-center gap-2.5">
            <Upload size={18} className="text-[#4CAF50] shrink-0" />
            <div className="flex flex-col">
              <span className="text-[11px] font-bold text-white">Все форматы</span>
              <span className="text-[10px] text-[#7E828B]">PNG, JPG, WEBP, GIF, MP4</span>
            </div>
          </div>
        </div>

        {/* Подсказка горячих клавиш */}
        <div className="text-[11px] text-[#808080] font-mono flex items-center gap-2 bg-[#17181C] px-3 py-1.5 rounded-full border border-[#26272C]">
          <span className="text-[#F27D26] font-bold">Shift</span>
          <span>— удерживайте для добавления слоем без замены основы</span>
        </div>
      </div>
    </div>
  );
};
