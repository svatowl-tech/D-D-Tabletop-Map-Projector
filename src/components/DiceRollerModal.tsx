/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Интерактивный дайс-роллер мастера (Dice Roller Tray).
 */

import React, { useState } from 'react';
import { DiceRollResult } from '../types';
import { DiceEngine } from '../services/diceEngine';
import { Dices, Sparkles, Skull, Award, History, Send } from 'lucide-react';

interface DiceRollerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBroadcastRoll: (roll: DiceRollResult) => void;
}

export const DiceRollerModal: React.FC<DiceRollerModalProps> = ({
  isOpen,
  onClose,
  onBroadcastRoll
}) => {
  const [history, setHistory] = useState<DiceRollResult[]>([]);
  const [lastRoll, setLastRoll] = useState<DiceRollResult | null>(null);
  const [advantageMode, setAdvantageMode] = useState<'normal' | 'advantage' | 'disadvantage'>('normal');
  const [customFormula, setCustomFormula] = useState('');

  if (!isOpen) return null;

  const executeRoll = (roll: DiceRollResult) => {
    setLastRoll(roll);
    setHistory((prev) => [roll, ...prev.slice(0, 15)]);
    onBroadcastRoll(roll);
  };

  const handleRollDice = (sides: number) => {
    const roll = DiceEngine.rollSingle(sides, 0, sides === 20 ? advantageMode : 'normal', 'DM');
    executeRoll(roll);
  };

  const handleCustomFormulaRoll = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customFormula.trim()) return;
    const roll = DiceEngine.rollFormula(customFormula.trim(), 'DM');
    executeRoll(roll);
    setCustomFormula('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 select-none font-mono text-[#E0E0E0]">
      <div className="bg-[#151619] border border-[#2A2A2A] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Шапка */}
        <div className="p-4 border-b border-[#2A2A2A] bg-[#111214] flex items-center justify-between">
          <div className="flex items-center gap-2 text-[#F27D26]">
            <Dices size={20} />
            <span className="font-bold text-base tracking-wider uppercase">D&D DICE ROLLER</span>
          </div>
          <button onClick={onClose} className="text-[#8E9299] hover:text-white text-sm cursor-pointer">
            ✕
          </button>
        </div>

        <div className="p-5 flex flex-col gap-4 overflow-y-auto">
          {/* Режим преимущества для d20 */}
          <div className="flex gap-2 bg-[#0A0A0A] p-1 rounded-xl border border-[#2A2A2A] text-xs">
            <button
              onClick={() => setAdvantageMode('normal')}
              className={`flex-1 py-1.5 rounded-lg font-bold transition ${
                advantageMode === 'normal' ? 'bg-[#2A2A2A] text-white' : 'text-[#8E9299]'
              }`}
            >
              NORMAL
            </button>
            <button
              onClick={() => setAdvantageMode('advantage')}
              className={`flex-1 py-1.5 rounded-lg font-bold transition ${
                advantageMode === 'advantage' ? 'bg-green-900/80 text-green-300 border border-green-700' : 'text-[#8E9299]'
              }`}
            >
              ADVANTAGE
            </button>
            <button
              onClick={() => setAdvantageMode('disadvantage')}
              className={`flex-1 py-1.5 rounded-lg font-bold transition ${
                advantageMode === 'disadvantage' ? 'bg-red-900/80 text-red-300 border border-red-700' : 'text-[#8E9299]'
              }`}
            >
              DISADVANTAGE
            </button>
          </div>

          {/* Быстрые кнопки кубиков */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { sides: 4, label: 'd4', color: 'border-blue-500/40 text-blue-300' },
              { sides: 6, label: 'd6', color: 'border-amber-500/40 text-amber-300' },
              { sides: 8, label: 'd8', color: 'border-emerald-500/40 text-emerald-300' },
              { sides: 10, label: 'd10', color: 'border-purple-500/40 text-purple-300' },
              { sides: 12, label: 'd12', color: 'border-pink-500/40 text-pink-300' },
              { sides: 20, label: 'd20', color: 'border-[#F27D26] text-[#F27D26] font-extrabold col-span-2' },
              { sides: 100, label: 'd100', color: 'border-cyan-500/40 text-cyan-300' }
            ].map((d) => (
              <button
                key={d.sides}
                onClick={() => handleRollDice(d.sides)}
                className={`py-3 rounded-xl bg-[#1A1C20] border hover:bg-[#252830] active:scale-95 transition flex flex-col items-center justify-center font-bold text-sm ${d.color}`}
              >
                <span>{d.label}</span>
              </button>
            ))}
          </div>

          {/* Произвольная формула */}
          <form onSubmit={handleCustomFormulaRoll} className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. 8d6+5, 2d8+3"
              value={customFormula}
              onChange={(e) => setCustomFormula(e.target.value)}
              className="flex-1 bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#F27D26]"
            />
            <button
              type="submit"
              className="bg-[#F27D26] hover:bg-[#E06C15] text-black font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1"
            >
              <Send size={13} />
              <span>ROLL</span>
            </button>
          </form>

          {/* Результат последнего броска */}
          {lastRoll && (
            <div className="bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl p-4 flex flex-col items-center gap-2">
              <div className="text-[10px] text-[#8E9299] uppercase tracking-widest">
                RESULT: {lastRoll.formula}
              </div>
              <div
                className={`text-5xl font-extrabold tracking-tighter ${
                  lastRoll.isCritSuccess
                    ? 'text-yellow-400'
                    : lastRoll.isCritFail
                    ? 'text-red-500'
                    : 'text-[#E0E0E0]'
                }`}
              >
                {lastRoll.total}
              </div>
              {lastRoll.rolls.length > 1 && (
                <div className="text-xs text-[#8E9299]">
                  [{lastRoll.rolls.join(' + ')}] {lastRoll.modifier !== 0 ? `+ (${lastRoll.modifier})` : ''}
                </div>
              )}
            </div>
          )}

          {/* История бросков */}
          {history.length > 0 && (
            <div className="flex flex-col gap-1.5 pt-2 border-t border-[#2A2A2A]">
              <div className="flex items-center gap-1.5 text-[10px] text-[#8E9299]">
                <History size={11} />
                <span>RECENT ROLLS:</span>
              </div>
              <div className="flex flex-col gap-1 max-h-32 overflow-y-auto">
                {history.map((h) => (
                  <div
                    key={h.id}
                    className="flex justify-between items-center bg-[#1A1C20] px-2.5 py-1 rounded text-xs border border-[#2A2A2A]"
                  >
                    <span className="text-[#8E9299]">{h.formula}</span>
                    <span className="font-bold text-[#F27D26]">{h.total}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
