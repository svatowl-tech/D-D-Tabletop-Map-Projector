/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Оверлей трансляции бросков кубиков и художественного текста (Read-Aloud)
 * на экран игроков / проектор.
 */

import React from 'react';
import { DiceRollResult } from '../types';
import { Sparkles, Skull, Award } from 'lucide-react';

interface PlayerDiceOverlayProps {
  lastRoll: DiceRollResult | null;
  readAloud: { title: string; text: string } | null;
  onDismissRoll?: () => void;
  onDismissReadAloud?: () => void;
}

export const PlayerDiceOverlay: React.FC<PlayerDiceOverlayProps> = ({
  lastRoll,
  readAloud,
  onDismissRoll,
  onDismissReadAloud
}) => {
  return (
    <div className="fixed inset-0 z-[9600] pointer-events-none flex flex-col items-center justify-center p-6 select-none font-mono">
      {/* 1. Всплывающий результат броска кубика */}
      {lastRoll && (
        <div className="animate-in zoom-in-95 duration-300 pointer-events-auto bg-[#0A0A0A]/95 border-2 border-[#2A2A2A] rounded-2xl p-6 shadow-[0_0_50px_rgba(0,0,0,0.9)] flex flex-col items-center gap-3 text-center max-w-sm">
          {/* Индикатор критического успеха / провала */}
          {lastRoll.isCritSuccess && (
            <div className="flex items-center gap-1.5 text-yellow-400 font-bold text-xs uppercase tracking-widest animate-bounce">
              <Award size={16} />
              <span>NATURAL 20! CRITICAL HIT!</span>
            </div>
          )}
          {lastRoll.isCritFail && (
            <div className="flex items-center gap-1.5 text-red-500 font-bold text-xs uppercase tracking-widest animate-pulse">
              <Skull size={16} />
              <span>NATURAL 1! CRITICAL FAIL!</span>
            </div>
          )}

          <div className="text-[10px] text-[#8E9299] uppercase tracking-widest">
            {lastRoll.rollerName} ROLLED <span className="text-[#F27D26] font-bold">{lastRoll.formula}</span>
            {lastRoll.advantageMode === 'advantage' && ' (ADVANTAGE)'}
            {lastRoll.advantageMode === 'disadvantage' && ' (DISADVANTAGE)'}
          </div>

          {/* Числовой результат броска */}
          <div
            className={`text-6xl font-bold font-mono tracking-tighter ${
              lastRoll.isCritSuccess
                ? 'text-yellow-400 drop-shadow-[0_0_20px_#FBBF24]'
                : lastRoll.isCritFail
                ? 'text-red-500 drop-shadow-[0_0_20px_#EF4444]'
                : 'text-[#E0E0E0]'
            }`}
          >
            {lastRoll.total}
          </div>

          {/* Список выпавших значений */}
          {lastRoll.rolls.length > 1 && (
            <div className="text-xs text-[#8E9299] flex items-center gap-1.5">
              <span>ROLLS:</span>
              <span className="font-mono text-[#E0E0E0] bg-[#1A1A1A] px-2 py-0.5 rounded border border-[#2A2A2A]">
                [{lastRoll.rolls.join(', ')}] {lastRoll.modifier !== 0 ? (lastRoll.modifier > 0 ? `+ ${lastRoll.modifier}` : `- ${Math.abs(lastRoll.modifier)}`) : ''}
              </span>
            </div>
          )}
        </div>
      )}

      {/* 2. Художественное описание сцены (Read-Aloud Card) */}
      {readAloud && (
        <div className="pointer-events-auto bg-[#0F1014]/95 border-2 border-[#F27D26]/60 rounded-xl p-6 shadow-2xl backdrop-blur max-w-2xl text-left mt-6 animate-in fade-in-50 duration-500">
          <div className="flex items-center justify-between border-b border-[#2A2A2A] pb-2 mb-3">
            <div className="flex items-center gap-2 text-[#F27D26] font-bold text-xs uppercase tracking-widest">
              <Sparkles size={15} />
              <span>{readAloud.title || 'THE DUNGEON MASTER SPEAKS:'}</span>
            </div>
            {onDismissReadAloud && (
              <button
                onClick={onDismissReadAloud}
                className="text-[#8E9299] hover:text-white text-xs cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>
          <p className="font-serif italic text-base leading-relaxed text-[#E0E0E0]">
            "{readAloud.text}"
          </p>
        </div>
      )}
    </div>
  );
};
