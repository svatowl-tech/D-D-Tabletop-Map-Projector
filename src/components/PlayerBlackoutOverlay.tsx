/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Оверлей режима затемнения стола (Player Blackout Mode).
 * Темы:
 * - 'pitch_black': Полная темнота (подготовка мастера)
 * - 'campfire': Анимированный костер / камин с искрами (отдых в таверне / лагерь)
 * - 'mist': Катящийся туман / мгла
 * - 'stars': Космический / астральный звездный портал с рунами
 */

import React from 'react';
import { BlackoutTheme } from '../types';
import { Flame, Sparkles, EyeOff } from 'lucide-react';

interface PlayerBlackoutOverlayProps {
  theme: BlackoutTheme;
}

export const PlayerBlackoutOverlay: React.FC<PlayerBlackoutOverlayProps> = ({ theme }) => {
  if (theme === 'none' || !theme) return null;

  return (
    <div className="fixed inset-0 z-[9500] pointer-events-none flex flex-col items-center justify-center select-none font-mono transition-opacity duration-700">
      {theme === 'pitch_black' && (
        <div className="absolute inset-0 bg-black flex flex-col items-center justify-center text-[#2A2A2A]">
          <EyeOff size={32} className="opacity-30 mb-2" />
          <span className="text-[10px] tracking-widest uppercase opacity-30">SCENE PREPARATION IN PROGRESS</span>
        </div>
      )}

      {theme === 'campfire' && (
        <div className="absolute inset-0 bg-gradient-to-t from-[#1F0D05] via-[#0D0502] to-black flex flex-col items-center justify-center overflow-hidden">
          {/* Мерцающее сияние костра */}
          <div className="w-96 h-96 rounded-full bg-[#FF5500]/20 filter blur-3xl animate-pulse" />
          
          <div className="relative z-10 flex flex-col items-center gap-3 text-[#FFAA55]">
            <Flame size={54} className="text-[#FF6600] animate-bounce filter drop-shadow-[0_0_25px_#FF4400]" />
            <h2 className="text-xl font-bold font-serif tracking-widest text-[#FFDD99]">
              LONG REST AT THE CAMPFIRE
            </h2>
            <p className="text-xs text-[#AA6633] tracking-widest uppercase">
              The party rests under the quiet night sky...
            </p>
          </div>
        </div>
      )}

      {theme === 'mist' && (
        <div className="absolute inset-0 bg-gradient-to-b from-[#080D14] via-[#0F1722] to-black flex flex-col items-center justify-center">
          <div className="w-full h-full absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-700/20 via-slate-900/40 to-black animate-pulse" />
          <div className="relative z-10 flex flex-col items-center gap-2 text-slate-300">
            <Sparkles size={36} className="text-slate-400 animate-spin" style={{ animationDuration: '8s' }} />
            <h2 className="text-lg font-bold tracking-widest uppercase text-slate-200">
              A DENSE FOG DESCENDS
            </h2>
            <p className="text-xs text-slate-500 uppercase tracking-widest">
              Visibility is obscured by heavy rolling mist...
            </p>
          </div>
        </div>
      )}

      {theme === 'stars' && (
        <div className="absolute inset-0 bg-black flex flex-col items-center justify-center overflow-hidden">
          <div className="w-96 h-96 rounded-full bg-purple-900/30 filter blur-3xl animate-pulse" />
          <div className="relative z-10 flex flex-col items-center gap-3 text-purple-300">
            <div className="w-20 h-20 rounded-full border-2 border-purple-500/50 flex items-center justify-center animate-spin" style={{ animationDuration: '15s' }}>
              <span className="text-2xl font-serif text-purple-400">✧</span>
            </div>
            <h2 className="text-xl font-bold font-serif tracking-widest text-purple-200">
              THE ASTRAL VOID
            </h2>
            <p className="text-xs text-purple-400/70 tracking-widest uppercase">
              Crossing the boundaries of planar realities...
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
