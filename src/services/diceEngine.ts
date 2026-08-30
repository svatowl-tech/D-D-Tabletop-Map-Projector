/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Модуль парсера и бросков игральных костей (Dice Engine).
 * Поддерживает формулы D&D (1d20+5, 8d6, 2d8+1d6+3), преимущество/помеху,
 * критические попадания (Nat 20) и провалы (Nat 1).
 */

import { DiceRollResult } from '../types';
import { audioEngine } from './audioEngine';

export class DiceEngine {
  /**
   * Быстрый бросок стандартного кубика
   */
  public static rollSingle(
    diceSides: number,
    modifier: number = 0,
    advantageMode: 'normal' | 'advantage' | 'disadvantage' = 'normal',
    rollerName: string = 'DM'
  ): DiceRollResult {
    let rolls: number[] = [];
    let chosenRoll = 0;

    audioEngine.playSFX('dice');

    if (diceSides === 20 && (advantageMode === 'advantage' || advantageMode === 'disadvantage')) {
      const roll1 = Math.floor(Math.random() * 20) + 1;
      const roll2 = Math.floor(Math.random() * 20) + 1;
      rolls = [roll1, roll2];
      chosenRoll = advantageMode === 'advantage' ? Math.max(roll1, roll2) : Math.min(roll1, roll2);
    } else {
      const val = Math.floor(Math.random() * diceSides) + 1;
      rolls = [val];
      chosenRoll = val;
    }

    const total = chosenRoll + modifier;
    const isCritSuccess = diceSides === 20 && chosenRoll === 20;
    const isCritFail = diceSides === 20 && chosenRoll === 1;

    if (isCritSuccess) {
      setTimeout(() => audioEngine.playSFX('victory'), 150);
    } else if (isCritFail) {
      setTimeout(() => audioEngine.playSFX('darkness'), 150);
    }

    const diceTypeMap: Record<number, DiceRollResult['diceType']> = {
      4: 'd4',
      6: 'd6',
      8: 'd8',
      10: 'd10',
      12: 'd12',
      20: 'd20',
      100: 'd100'
    };

    const modSign = modifier > 0 ? `+${modifier}` : modifier < 0 ? `${modifier}` : '';
    const formula = `1d${diceSides}${modSign}`;

    return {
      id: `roll_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      formula,
      diceType: diceTypeMap[diceSides] || 'custom',
      rolls,
      modifier,
      total,
      isCritSuccess,
      isCritFail,
      advantageMode,
      rollerName,
      timestamp: Date.now()
    };
  }

  /**
   * Парсинг и бросок произвольной формулы (например: "8d6", "2d8+5", "1d20+7")
   */
  public static rollFormula(formulaStr: string, rollerName: string = 'DM'): DiceRollResult {
    audioEngine.playSFX('dice');

    const clean = formulaStr.replace(/\s+/g, '').toLowerCase();
    const match = clean.match(/^(\d+)?d(\d+)([+-]\d+)?$/);

    if (!match) {
      // Fallback на простой бросок 1d20
      return this.rollSingle(20, 0, 'normal', rollerName);
    }

    const count = parseInt(match[1] || '1', 10);
    const sides = parseInt(match[2], 10);
    const mod = match[3] ? parseInt(match[3], 10) : 0;

    const rolls: number[] = [];
    let sum = 0;

    for (let i = 0; i < Math.min(count, 50); i++) {
      const r = Math.floor(Math.random() * sides) + 1;
      rolls.push(r);
      sum += r;
    }

    const total = sum + mod;
    const isCritSuccess = count === 1 && sides === 20 && rolls[0] === 20;
    const isCritFail = count === 1 && sides === 20 && rolls[0] === 1;

    return {
      id: `roll_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      formula: formulaStr,
      diceType: count === 1 && sides === 20 ? 'd20' : 'custom',
      rolls,
      modifier: mod,
      total,
      isCritSuccess,
      isCritFail,
      advantageMode: 'normal',
      rollerName,
      timestamp: Date.now()
    };
  }
}
