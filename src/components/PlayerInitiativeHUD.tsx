/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * HUD Инициативы для экрана проектора / стола (Player View Initiative Banner).
 * Отображает текущий ход, следующего участника ("ON DECK"), раунд и статусы.
 * Поддерживает 4-стороннее позиционирование (Top / Bottom / Left / Right) для круглых/прямоугольных ТВ-столов.
 */

import React from 'react';
import { CombatTrackerState } from '../types';
import { Shield, Heart, Zap, Swords } from 'lucide-react';

interface PlayerInitiativeHUDProps {
  combat: CombatTrackerState;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export const PlayerInitiativeHUD: React.FC<PlayerInitiativeHUDProps> = ({
  combat,
  position = 'top'
}) => {
  if (!combat.isActive || combat.combatants.length === 0) return null;

  const activeIndex = combat.currentTurnIndex % combat.combatants.length;
  const activeCombatant = combat.combatants[activeIndex];
  const nextCombatant = combat.combatants[(activeIndex + 1) % combat.combatants.length];

  const positionClasses = {
    top: 'top-4 left-1/2 -translate-x-1/2 flex-row',
    bottom: 'bottom-4 left-1/2 -translate-x-1/2 flex-row',
    left: 'left-4 top-1/2 -translate-y-1/2 flex-col rotate-90 origin-left',
    right: 'right-4 top-1/2 -translate-y-1/2 flex-col -rotate-90 origin-right'
  }[position];

  return (
    <div
      className={`fixed ${positionClasses} z-40 flex items-center gap-3 bg-[#0A0A0A]/95 border border-[#2A2A2A] rounded-full px-5 py-2 shadow-2xl backdrop-blur select-none font-mono text-white pointer-events-none transition-all duration-300`}
    >
      <div className="flex items-center gap-2 border-r border-[#2A2A2A] pr-3 text-[#F27D26]">
        <Swords size={16} className="animate-pulse" />
        <span className="font-bold text-xs uppercase tracking-widest">
          ROUND {combat.round}
        </span>
      </div>

      {/* Текущий активный ход */}
      <div className="flex items-center gap-2.5">
        <span className="text-[10px] text-[#8E9299] uppercase tracking-wider font-bold">
          TURN:
        </span>
        <div className="flex items-center gap-2 bg-[#F27D26]/20 border border-[#F27D26] px-3 py-1 rounded-full text-white font-bold text-xs shadow-[0_0_12px_rgba(242,125,38,0.4)]">
          <span className="w-2 h-2 rounded-full bg-[#00FF00] animate-ping" />
          <span className="truncate max-w-[160px] text-[#F27D26]">{activeCombatant.name}</span>
          
          {/* Индикатор здоровья для игроков */}
          {activeCombatant.hpMax > 0 && (
            <div className="flex items-center gap-1 text-[11px] font-mono text-[#E0E0E0] ml-1">
              <Heart size={11} className="text-red-400" />
              <span>{activeCombatant.hpCurrent}/{activeCombatant.hpMax}</span>
            </div>
          )}

          {activeCombatant.ac > 0 && (
            <div className="flex items-center gap-0.5 text-[11px] font-mono text-blue-300 ml-1">
              <Shield size={11} />
              <span>{activeCombatant.ac}</span>
            </div>
          )}
        </div>
      </div>

      {/* Следующий на очереди */}
      {nextCombatant && (
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-[#8E9299] border-l border-[#2A2A2A] pl-3">
          <span className="text-[9px] uppercase tracking-widest text-[#6E727A]">ON DECK:</span>
          <span className="text-[#B0B4BC] truncate max-w-[120px] font-semibold">{nextCombatant.name}</span>
        </div>
      )}

      {/* Активные состояния/статусы */}
      {activeCombatant.conditions && activeCombatant.conditions.length > 0 && (
        <div className="hidden md:flex items-center gap-1 border-l border-[#2A2A2A] pl-3">
          {activeCombatant.conditions.map((c, idx) => (
            <span
              key={idx}
              className="text-[9px] px-2 py-0.5 rounded-full bg-red-950/80 text-red-300 border border-red-800 font-bold"
            >
              {c.name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

