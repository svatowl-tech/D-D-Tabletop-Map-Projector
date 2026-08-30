/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Панель трекера инициативы и боевого менеджера (Combat Tracker).
 */

import React, { useState } from 'react';
import { CombatTrackerState, Combatant } from '../types';
import { SRD_MONSTERS, SRD_CONDITIONS } from '../services/srdDatabase';
import {
  Swords,
  Plus,
  Trash2,
  ChevronRight,
  ChevronLeft,
  Heart,
  Shield,
  Zap,
  RotateCcw,
  Sparkles,
  UserPlus,
  Play,
  Pause
} from 'lucide-react';

interface CombatTrackerDrawerProps {
  combat: CombatTrackerState;
  onChangeCombat: (combat: CombatTrackerState) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const CombatTrackerDrawer: React.FC<CombatTrackerDrawerProps> = ({
  combat,
  onChangeCombat,
  isOpen,
  onClose
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newInit, setNewInit] = useState(10);
  const [newHp, setNewHp] = useState(20);
  const [newAc, setNewAc] = useState(14);
  const [newType, setNewType] = useState<Combatant['type']>('monster');

  if (!isOpen) return null;

  const handleNextTurn = () => {
    if (combat.combatants.length === 0) return;
    const nextIdx = (combat.currentTurnIndex + 1) % combat.combatants.length;
    const nextRound = nextIdx === 0 ? combat.round + 1 : combat.round;

    // Уменьшаем таймеры состояний
    const updatedCombatants = combat.combatants.map((c, idx) => {
      if (idx === nextIdx) {
        return {
          ...c,
          conditions: c.conditions
            .map((cond) => ({
              ...cond,
              roundsRemaining: cond.roundsRemaining ? cond.roundsRemaining - 1 : undefined
            }))
            .filter((cond) => cond.roundsRemaining === undefined || cond.roundsRemaining > 0)
        };
      }
      return c;
    });

    onChangeCombat({
      ...combat,
      round: nextRound,
      currentTurnIndex: nextIdx,
      combatants: updatedCombatants
    });
  };

  const handlePrevTurn = () => {
    if (combat.combatants.length === 0) return;
    const prevIdx = (combat.currentTurnIndex - 1 + combat.combatants.length) % combat.combatants.length;
    const prevRound = combat.currentTurnIndex === 0 ? Math.max(1, combat.round - 1) : combat.round;
    onChangeCombat({
      ...combat,
      round: prevRound,
      currentTurnIndex: prevIdx
    });
  };

  const handleSortByInitiative = () => {
    const sorted = [...combat.combatants].sort((a, b) => b.initiative - a.initiative);
    onChangeCombat({
      ...combat,
      combatants: sorted,
      currentTurnIndex: 0
    });
  };

  const handleAddCombatant = () => {
    if (!newName.trim()) return;

    const newCombatant: Combatant = {
      id: `comb_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      name: newName.trim(),
      type: newType,
      initiative: Number(newInit) || 0,
      dexModifier: Math.floor(((Number(newInit) || 10) - 10) / 2),
      hpCurrent: Number(newHp) || 10,
      hpMax: Number(newHp) || 10,
      tempHp: 0,
      ac: Number(newAc) || 10,
      speed: 30,
      passivePerception: 10,
      conditions: []
    };

    const updated = [...combat.combatants, newCombatant];
    onChangeCombat({
      ...combat,
      combatants: updated
    });

    setNewName('');
    setShowAddForm(false);
  };

  const handleImportSrdMonster = (monsterId: string) => {
    const m = SRD_MONSTERS.find((x) => x.id === monsterId);
    if (!m) return;

    const dexMod = Math.floor((m.stats.dex - 10) / 2);
    const initRoll = Math.floor(Math.random() * 20) + 1 + dexMod;

    const newCombatant: Combatant = {
      id: `comb_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      name: m.name,
      type: 'monster',
      initiative: initRoll,
      dexModifier: dexMod,
      hpCurrent: m.hp,
      hpMax: m.hp,
      tempHp: 0,
      ac: m.ac,
      speed: parseInt(m.speed, 10) || 30,
      passivePerception: 10 + Math.floor((m.stats.wis - 10) / 2),
      conditions: []
    };

    onChangeCombat({
      ...combat,
      combatants: [...combat.combatants, newCombatant]
    });
  };

  const handleUpdateHp = (id: string, delta: number) => {
    onChangeCombat({
      ...combat,
      combatants: combat.combatants.map((c) => {
        if (c.id === id) {
          const newCurrent = Math.max(0, Math.min(c.hpMax, c.hpCurrent + delta));
          return { ...c, hpCurrent: newCurrent };
        }
        return c;
      })
    });
  };

  const handleToggleCondition = (combatantId: string, condName: string) => {
    onChangeCombat({
      ...combat,
      combatants: combat.combatants.map((c) => {
        if (c.id === combatantId) {
          const exists = c.conditions.some((x) => x.name === condName);
          if (exists) {
            return { ...c, conditions: c.conditions.filter((x) => x.name !== condName) };
          } else {
            return { ...c, conditions: [...c.conditions, { name: condName, roundsRemaining: 3 }] };
          }
        }
        return c;
      })
    });
  };

  const handleDeleteCombatant = (id: string) => {
    onChangeCombat({
      ...combat,
      combatants: combat.combatants.filter((c) => c.id !== id)
    });
  };

  return (
    <div className="fixed top-14 right-0 bottom-0 w-80 sm:w-96 bg-[#151619] border-l border-[#2A2A2A] shadow-2xl z-40 flex flex-col font-mono text-[#E0E0E0] select-none">
      {/* Шапка трекера */}
      <div className="p-4 border-b border-[#2A2A2A] flex items-center justify-between bg-[#111214]">
        <div className="flex items-center gap-2">
          <Swords size={18} className="text-[#F27D26]" />
          <span className="font-bold text-sm tracking-wider uppercase">COMBAT TRACKER</span>
        </div>
        <button onClick={onClose} className="text-[#8E9299] hover:text-white text-xs cursor-pointer">
          ✕
        </button>
      </div>

      {/* Управление боем и раундами */}
      <div className="p-3 border-b border-[#2A2A2A] bg-[#0A0A0A] flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onChangeCombat({ ...combat, isActive: !combat.isActive })}
            className={`p-2 rounded font-bold text-xs flex items-center gap-1 transition ${
              combat.isActive ? 'bg-[#F27D26] text-black' : 'bg-[#2A2A2A] text-[#8E9299] hover:text-white'
            }`}
            title="Включить / Выключить трансляцию боя на проектор"
          >
            {combat.isActive ? <Pause size={13} /> : <Play size={13} />}
            <span>{combat.isActive ? 'ACTIVE' : 'PAUSED'}</span>
          </button>

          <span className="text-xs font-bold text-[#F27D26] bg-[#1A1A1A] px-2 py-1.5 rounded border border-[#2A2A2A]">
            R: {combat.round}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handlePrevTurn}
            className="p-1.5 rounded bg-[#2A2A2A] hover:bg-[#3A3A3A] text-[#8E9299] hover:text-white"
            title="Предыдущий ход"
          >
            <ChevronLeft size={14} />
          </button>
          <button
            onClick={handleNextTurn}
            className="px-2.5 py-1.5 rounded bg-[#F27D26] hover:bg-[#E06C15] text-black font-bold text-xs flex items-center gap-1"
            title="Следующий ход"
          >
            <span>NEXT</span>
            <ChevronRight size={14} />
          </button>
          <button
            onClick={handleSortByInitiative}
            className="p-1.5 rounded bg-[#2A2A2A] hover:bg-[#3A3A3A] text-[#8E9299] hover:text-white text-[10px] font-bold"
            title="Сортировать по убыванию инициативы"
          >
            SORT
          </button>
        </div>
      </div>

      {/* Список участников */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
        {combat.combatants.map((c, idx) => {
          const isCurrentTurn = combat.isActive && idx === combat.currentTurnIndex;
          const hpPercent = c.hpMax > 0 ? (c.hpCurrent / c.hpMax) * 100 : 0;

          return (
            <div
              key={c.id}
              className={`p-3 rounded-lg border flex flex-col gap-2 transition ${
                isCurrentTurn
                  ? 'bg-[#2A1F18] border-[#F27D26] shadow-[0_0_12px_rgba(242,125,38,0.3)]'
                  : 'bg-[#1A1C20] border-[#2A2A2A]'
              }`}
            >
              {/* Верхняя строка: Имя, Тип, Инициатива, Удаление */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 truncate">
                  {isCurrentTurn && <span className="w-2 h-2 rounded-full bg-[#00FF00] animate-ping" />}
                  <span className={`font-bold text-xs truncate ${isCurrentTurn ? 'text-[#F27D26]' : 'text-[#E0E0E0]'}`}>
                    {c.name}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#0A0A0A] text-[#8E9299] border border-[#2A2A2A] uppercase">
                    {c.type}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold font-mono text-[#F27D26] bg-[#0A0A0A] px-2 py-0.5 rounded border border-[#2A2A2A]">
                    INIT: {c.initiative}
                  </span>
                  <button
                    onClick={() => handleDeleteCombatant(c.id)}
                    className="text-[#6E727A] hover:text-red-400 p-1"
                    title="Удалить из боя"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>

              {/* Здоровье и Защита */}
              <div className="flex items-center justify-between gap-3 text-xs">
                {/* HP управление */}
                <div className="flex items-center gap-1.5 flex-1">
                  <Heart size={13} className="text-red-400 shrink-0" />
                  <div className="flex-1 flex flex-col gap-0.5">
                    <div className="flex justify-between text-[10px]">
                      <span>HP:</span>
                      <span className="font-bold">{c.hpCurrent} / {c.hpMax}</span>
                    </div>
                    <div className="w-full h-1.5 bg-[#0A0A0A] rounded-full overflow-hidden border border-[#2A2A2A]">
                      <div
                        className={`h-full transition-all ${
                          hpPercent > 50 ? 'bg-green-500' : hpPercent > 20 ? 'bg-yellow-500' : 'bg-red-600'
                        }`}
                        style={{ width: `${hpPercent}%` }}
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => handleUpdateHp(c.id, -1)}
                    className="w-5 h-5 rounded bg-[#2A2A2A] hover:bg-red-950 hover:text-red-400 font-bold flex items-center justify-center text-xs"
                  >
                    -
                  </button>
                  <button
                    onClick={() => handleUpdateHp(c.id, 1)}
                    className="w-5 h-5 rounded bg-[#2A2A2A] hover:bg-green-950 hover:text-green-400 font-bold flex items-center justify-center text-xs"
                  >
                    +
                  </button>
                </div>

                {/* AC */}
                <div className="flex items-center gap-1 text-[11px] text-[#8E9299] bg-[#0A0A0A] px-2 py-1 rounded border border-[#2A2A2A]">
                  <Shield size={12} className="text-blue-400" />
                  <span className="font-bold text-[#E0E0E0]">AC {c.ac}</span>
                </div>
              </div>

              {/* Статусы и состояния */}
              <div className="flex flex-wrap gap-1 items-center pt-1 border-t border-[#2A2A2A]/50">
                {c.conditions.map((cond, cIdx) => (
                  <span
                    key={cIdx}
                    onClick={() => handleToggleCondition(c.id, cond.name)}
                    className="text-[9px] px-1.5 py-0.5 rounded bg-red-950/60 text-red-300 border border-red-800/80 cursor-pointer hover:line-through"
                    title="Кликните, чтобы снять состояние"
                  >
                    {cond.name} {cond.roundsRemaining ? `(${cond.roundsRemaining}r)` : ''}
                  </span>
                ))}
                
                {/* Быстрое добавление состояния */}
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      handleToggleCondition(c.id, e.target.value);
                      e.target.value = '';
                    }
                  }}
                  className="bg-[#0A0A0A] border border-[#2A2A2A] rounded text-[9px] px-1 py-0.5 text-[#8E9299]"
                >
                  <option value="">+ Condition</option>
                  {SRD_CONDITIONS.map((cond) => (
                    <option key={cond.id} value={cond.name}>{cond.name}</option>
                  ))}
                </select>
              </div>
            </div>
          );
        })}

        {combat.combatants.length === 0 && (
          <div className="p-6 text-center text-xs text-[#6E727A] font-mono border border-dashed border-[#2A2A2A] rounded-lg">
            Бой пуст. Добавьте персонажей или выберите монстра из SRD Бестиария ниже.
          </div>
        )}
      </div>

      {/* Нижняя панель: Быстрое добавление и SRD импорт */}
      <div className="p-3 border-t border-[#2A2A2A] bg-[#111214] flex flex-col gap-2">
        {showAddForm ? (
          <div className="flex flex-col gap-2 p-3 bg-[#0A0A0A] rounded-lg border border-[#2A2A2A]">
            <input
              type="text"
              placeholder="Имя персонажа / монстра"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="bg-[#151619] border border-[#2A2A2A] rounded px-2 py-1 text-xs text-white"
            />
            <div className="grid grid-cols-3 gap-2 text-[10px]">
              <div>
                <label className="text-[#8E9299]">INIT:</label>
                <input
                  type="number"
                  value={newInit}
                  onChange={(e) => setNewInit(Number(e.target.value))}
                  className="w-full bg-[#151619] border border-[#2A2A2A] rounded px-1.5 py-0.5 text-white"
                />
              </div>
              <div>
                <label className="text-[#8E9299]">MAX HP:</label>
                <input
                  type="number"
                  value={newHp}
                  onChange={(e) => setNewHp(Number(e.target.value))}
                  className="w-full bg-[#151619] border border-[#2A2A2A] rounded px-1.5 py-0.5 text-white"
                />
              </div>
              <div>
                <label className="text-[#8E9299]">AC:</label>
                <input
                  type="number"
                  value={newAc}
                  onChange={(e) => setNewAc(Number(e.target.value))}
                  className="w-full bg-[#151619] border border-[#2A2A2A] rounded px-1.5 py-0.5 text-white"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleAddCombatant}
                className="flex-1 bg-[#F27D26] hover:bg-[#E06C15] text-black font-bold py-1 rounded text-xs"
              >
                SAVE
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="bg-[#2A2A2A] hover:bg-[#3A3A3A] px-3 py-1 rounded text-xs text-[#8E9299]"
              >
                CANCEL
              </button>
            </div>
          </div>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => setShowAddForm(true)}
              className="flex-1 bg-[#2A2A2A] hover:bg-[#3A3A3A] text-[#E0E0E0] py-2 rounded text-xs font-bold flex items-center justify-center gap-1.5 border border-[#3A3A3A]"
            >
              <Plus size={13} className="text-[#F27D26]" />
              <span>CUSTOM COMBATANT</span>
            </button>
          </div>
        )}

        {/* Быстрый выбор из SRD Бестиария */}
        <div className="flex items-center gap-1 text-[10px]">
          <span className="text-[#8E9299]">QUICK SRD:</span>
          <div className="flex gap-1 overflow-x-auto">
            {SRD_MONSTERS.slice(0, 4).map((m) => (
              <button
                key={m.id}
                onClick={() => handleImportSrdMonster(m.id)}
                className="px-2 py-1 rounded bg-[#1A1A1A] hover:bg-[#2A2A2A] text-[#8E9299] hover:text-[#F27D26] border border-[#2A2A2A] whitespace-nowrap"
              >
                + {m.name.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
