/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Звуковой пульт мастера (Audio Soundboard & Ambience Engine).
 * 100% Web Audio API синтезатор + поддержка пользовательских файлов.
 */

import React, { useEffect, useState } from 'react';
import { AudioEngineState } from '../types';
import { audioEngine } from '../services/audioEngine';
import {
  Volume2,
  VolumeX,
  Music,
  CloudRain,
  Wind,
  Flame,
  Droplets,
  Beer,
  Zap,
  Square,
  Sparkles,
  Radio,
  Sliders
} from 'lucide-react';

interface AudioSoundboardDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AudioSoundboardDrawer: React.FC<AudioSoundboardDrawerProps> = ({ isOpen, onClose }) => {
  const [audioState, setAudioState] = useState<AudioEngineState>(audioEngine.getState());

  useEffect(() => {
    return audioEngine.subscribe((newState) => {
      setAudioState(newState);
    });
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed top-14 right-0 bottom-0 w-80 sm:w-96 bg-[#151619] border-l border-[#2A2A2A] shadow-2xl z-40 flex flex-col font-mono text-[#E0E0E0] select-none">
      {/* Заголовок */}
      <div className="p-4 border-b border-[#2A2A2A] flex items-center justify-between bg-[#111214]">
        <div className="flex items-center gap-2">
          <Volume2 size={18} className="text-[#F27D26]" />
          <span className="font-bold text-sm tracking-wider uppercase">AUDIO SOUNDBOARD</span>
        </div>
        <button onClick={onClose} className="text-[#8E9299] hover:text-white text-xs cursor-pointer">
          ✕
        </button>
      </div>

      {/* Мастер Громкость и Общая Остановка */}
      <div className="p-3 border-b border-[#2A2A2A] bg-[#0A0A0A] flex flex-col gap-2">
        <div className="flex justify-between items-center text-xs">
          <span className="text-[#8E9299] font-bold">MASTER VOLUME:</span>
          <span className="text-[#F27D26] font-bold">{Math.round(audioState.masterVolume * 100)}%</span>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={audioState.masterVolume}
            onChange={(e) => audioEngine.setMasterVolume(Number(e.target.value))}
            className="flex-1 accent-[#F27D26] h-1.5"
          />
          <button
            onClick={() => audioEngine.stopAll()}
            className="px-2.5 py-1 rounded bg-[#2A2A2A] hover:bg-red-950 hover:text-red-400 text-xs font-bold flex items-center gap-1 border border-[#3A3A3A] transition"
            title="Остановить все звуки и музыку"
          >
            <Square size={11} />
            <span>MUTE ALL</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-5">
        {/* 1. СИНТЕЗАТОР ФОНОВОЙ МУЗЫКИ (BGM) */}
        <div className="flex flex-col gap-2.5">
          <div className="flex justify-between items-center text-xs border-b border-[#2A2A2A] pb-1">
            <span className="font-bold text-[#F27D26] flex items-center gap-1.5">
              <Music size={14} />
              <span>BGM SYNTH THEMES</span>
            </span>
            <span className="text-[10px] text-[#8E9299]">
              {audioState.activeBgm ? audioState.activeBgm.toUpperCase() : 'STOPPED'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'battle', name: 'Epic Battle', desc: 'Drums & brass cadence' },
              { id: 'dungeon', name: 'Dark Dungeon', desc: 'Deep mystery drone' },
              { id: 'tavern', name: 'Warm Tavern', desc: 'Cozy acoustic melody' },
              { id: 'crypt', name: 'Haunted Crypt', desc: 'Eerie horror frequencies' },
              { id: 'forest', name: 'Magic Forest', desc: 'Ethereal ambient pad' }
            ].map((bgm) => {
              const isActive = audioState.activeBgm === bgm.id;
              return (
                <button
                  key={bgm.id}
                  onClick={() => audioEngine.playBgmPreset(isActive ? null : (bgm.id as any))}
                  className={`p-2.5 rounded-lg border text-left flex flex-col gap-0.5 transition ${
                    isActive
                      ? 'bg-[#2A1F18] border-[#F27D26] shadow-[0_0_12px_rgba(242,125,38,0.3)]'
                      : 'bg-[#1A1C20] border-[#2A2A2A] hover:bg-[#252830]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold ${isActive ? 'text-[#F27D26]' : 'text-[#E0E0E0]'}`}>
                      {bgm.name}
                    </span>
                    {isActive && <span className="w-2 h-2 rounded-full bg-[#00FF00] animate-pulse" />}
                  </div>
                  <span className="text-[9px] text-[#8E9299]">{bgm.desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. МНОГОКАНАЛЬНЫЙ ЭМБИЕНТ-МИКШЕР */}
        <div className="flex flex-col gap-2.5">
          <div className="flex justify-between items-center text-xs border-b border-[#2A2A2A] pb-1">
            <span className="font-bold text-[#F27D26] flex items-center gap-1.5">
              <Sliders size={14} />
              <span>AMBIENCE MIXER</span>
            </span>
            <span className="text-[10px] text-[#8E9299]">5 NOISE CHANNELS</span>
          </div>

          <div className="flex flex-col gap-2.5 bg-[#0A0A0A] p-3 rounded-lg border border-[#2A2A2A]">
            {[
              { key: 'rain', label: 'Rain & Thunder', icon: <CloudRain size={13} className="text-blue-400" /> },
              { key: 'wind', label: 'Wind & Blizzard', icon: <Wind size={13} className="text-slate-400" /> },
              { key: 'fire', label: 'Campfire & Crackle', icon: <Flame size={13} className="text-orange-400" /> },
              { key: 'dungeon', label: 'Cave Water Drips', icon: <Droplets size={13} className="text-cyan-400" /> },
              { key: 'tavern', label: 'Tavern Murmur', icon: <Beer size={13} className="text-amber-400" /> }
            ].map((ch) => {
              const val = audioState.ambienceChannels[ch.key as keyof typeof audioState.ambienceChannels] || 0;
              return (
                <div key={ch.key} className="flex flex-col gap-1">
                  <div className="flex justify-between items-center text-[11px]">
                    <div className="flex items-center gap-1.5 text-[#E0E0E0]">
                      {ch.icon}
                      <span>{ch.label}</span>
                    </div>
                    <span className="font-mono text-[10px] text-[#F27D26]">{Math.round(val * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={val}
                    onChange={(e) =>
                      audioEngine.setAmbienceChannel(ch.key as any, Number(e.target.value))
                    }
                    className="accent-[#F27D26] h-1"
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. МГНОВЕННЫЙ SFX SOUNDBOARD */}
        <div className="flex flex-col gap-2.5">
          <div className="flex justify-between items-center text-xs border-b border-[#2A2A2A] pb-1">
            <span className="font-bold text-[#F27D26] flex items-center gap-1.5">
              <Zap size={14} />
              <span>SFX SOUNDBOARD</span>
            </span>
            <span className="text-[10px] text-[#8E9299]">INSTANT TRIGGER</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'sword', label: '⚔️ Sword Clash', color: 'hover:border-slate-400' },
              { id: 'fireball', label: '💥 Fireball Burst', color: 'hover:border-orange-500' },
              { id: 'roar', label: '🐉 Dragon Roar', color: 'hover:border-red-500' },
              { id: 'coin', label: '💰 Gold Coins', color: 'hover:border-yellow-500' },
              { id: 'dice', label: '🎲 Dice Roll', color: 'hover:border-purple-500' },
              { id: 'heal', label: '✨ Heal Chime', color: 'hover:border-green-400' },
              { id: 'lightning', label: '⚡ Lightning', color: 'hover:border-blue-400' },
              { id: 'victory', label: '🎺 Victory Chord', color: 'hover:border-yellow-300' }
            ].map((sfx) => (
              <button
                key={sfx.id}
                onClick={() => audioEngine.playSFX(sfx.id as any)}
                className={`p-2.5 rounded-lg bg-[#1A1C20] border border-[#2A2A2A] hover:bg-[#252830] active:scale-95 transition text-left text-xs font-bold text-[#E0E0E0] ${sfx.color}`}
              >
                {sfx.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
