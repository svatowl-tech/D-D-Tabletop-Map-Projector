/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Верхняя командная панель Мастера (DM Header).
 * Включает переключение сцен, быстрый Blackout, кнопки открытия панелей
 * и кнопку открытия окна проектора.
 */

import React, { useState } from 'react';
import { Scene, BlackoutTheme, CombatTrackerState, AudioEngineState } from '../types';
import {
  FolderOpen,
  Plus,
  Tv,
  Eye,
  EyeOff,
  Flame,
  Sparkles,
  Swords,
  Volume2,
  BookOpen,
  FileText,
  Dices,
  Layers,
  ChevronDown
} from 'lucide-react';

interface DMHeaderProps {
  currentScene: Scene;
  allScenes: Scene[];
  onSwitchScene: (scene: Scene) => void;
  onAddNewScene: () => void;
  blackoutTheme: BlackoutTheme;
  onSetBlackout: (theme: BlackoutTheme) => void;
  onOpenPlayerWindow: () => void;
  // Состояния ящиков и модалок
  combat: CombatTrackerState;
  onToggleCombat: () => void;
  isCombatOpen: boolean;
  onToggleAudio: () => void;
  isAudioOpen: boolean;
  onToggleSRD: () => void;
  isSRDOpen: boolean;
  onToggleNotes: () => void;
  isNotesOpen: boolean;
  onOpenVaultModal: () => void;
  onOpenAssetFolderModal?: () => void;
  onOpenDiceModal: () => void;
  onOpenGeneratorStudio?: () => void;
  onOpenPolzaAiStudio?: () => void;
  audioState: AudioEngineState;
}

export const DMHeader: React.FC<DMHeaderProps> = ({
  currentScene,
  allScenes,
  onSwitchScene,
  onAddNewScene,
  blackoutTheme,
  onSetBlackout,
  onOpenPlayerWindow,
  combat,
  onToggleCombat,
  isCombatOpen,
  onToggleAudio,
  isAudioOpen,
  onToggleSRD,
  isSRDOpen,
  onToggleNotes,
  isNotesOpen,
  onOpenVaultModal,
  onOpenAssetFolderModal,
  onOpenDiceModal,
  onOpenGeneratorStudio,
  onOpenPolzaAiStudio,
  audioState
}) => {
  const [showBlackoutMenu, setShowBlackoutMenu] = useState(false);

  const isAudioPlaying = audioState.activeBgm !== null || Object.values(audioState.ambienceChannels).some((v) => Number(v) > 0);

  return (
    <header className="h-14 bg-[#111214] border-b border-[#2A2A2A] px-3 flex items-center justify-between z-30 select-none font-mono text-[#E0E0E0]">
      {/* 1. Логотип и Вкладки сцен */}
      <div className="flex items-center gap-3 overflow-x-auto max-w-[45vw] py-1">
        <div className="flex items-center gap-1.5 shrink-0 pr-2 border-r border-[#2A2A2A]">
          <span className="font-extrabold text-sm tracking-tighter text-[#F27D26]">VTT-ZERO</span>
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#2A2A2A] text-[#8E9299] font-bold">DM</span>
        </div>

        {/* Список вкладок сцен */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {allScenes.map((sc) => {
            const isActive = sc.id === currentScene.id;
            return (
              <button
                key={sc.id}
                onClick={() => onSwitchScene(sc)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
                  isActive
                    ? 'bg-[#2A1F18] text-[#F27D26] border border-[#F27D26]/70 shadow-[0_0_8px_rgba(242,125,38,0.25)]'
                    : 'bg-[#1A1C20] text-[#8E9299] hover:text-white border border-[#2A2A2A]'
                }`}
              >
                <span className="truncate max-w-[130px]">{sc.name}</span>
              </button>
            );
          })}

          <button
            onClick={onAddNewScene}
            className="p-1.5 rounded-lg bg-[#1A1C20] hover:bg-[#252830] text-[#8E9299] hover:text-[#F27D26] border border-[#2A2A2A] shrink-0"
            title="Добавить новую сцену"
          >
            <Plus size={14} />
          </button>
        </div>
      </div>

      {/* 2. Быстрые панели инструментов и Blackout */}
      <div className="flex items-center gap-2">
        {/* Кнопка быстрого Blackout */}
        <div className="relative">
          <button
            onClick={() => setShowBlackoutMenu(!showBlackoutMenu)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 border transition ${
              blackoutTheme !== 'none'
                ? 'bg-red-950/80 text-red-300 border-red-800 shadow-[0_0_10px_rgba(239,68,68,0.4)]'
                : 'bg-[#1A1C20] text-[#8E9299] hover:text-white border-[#2A2A2A]'
            }`}
            title="Режимы затемнения экрана игроков"
          >
            {blackoutTheme === 'pitch_black' && <EyeOff size={13} className="text-red-400" />}
            {blackoutTheme === 'campfire' && <Flame size={13} className="text-orange-400 animate-bounce" />}
            {blackoutTheme === 'mist' && <Sparkles size={13} className="text-slate-300" />}
            {blackoutTheme === 'stars' && <Sparkles size={13} className="text-purple-400" />}
            {blackoutTheme === 'none' && <Eye size={13} />}
            <span>BLACKOUT</span>
            <ChevronDown size={11} />
          </button>

          {showBlackoutMenu && (
            <div className="absolute right-0 top-full mt-1.5 w-48 bg-[#151619] border border-[#2A2A2A] rounded-xl shadow-2xl p-1.5 z-50 flex flex-col gap-1 text-xs">
              {[
                { id: 'none', label: 'Disable (Visible)', icon: <Eye size={13} /> },
                { id: 'pitch_black', label: 'Pitch Black', icon: <EyeOff size={13} className="text-red-400" /> },
                { id: 'campfire', label: 'Campfire Rest', icon: <Flame size={13} className="text-orange-400" /> },
                { id: 'mist', label: 'Dense Mist', icon: <Sparkles size={13} className="text-slate-300" /> },
                { id: 'stars', label: 'Astral Stars', icon: <Sparkles size={13} className="text-purple-400" /> }
              ].map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => {
                    onSetBlackout(theme.id as any);
                    setShowBlackoutMenu(false);
                  }}
                  className={`p-2 rounded-lg text-left flex items-center gap-2 transition ${
                    blackoutTheme === theme.id ? 'bg-[#2A1F18] text-[#F27D26] font-bold' : 'text-[#8E9299] hover:bg-[#2A2A2A] hover:text-white'
                  }`}
                >
                  {theme.icon}
                  <span>{theme.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Кнопка Combat Tracker */}
        <button
          onClick={onToggleCombat}
          className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 border transition ${
            isCombatOpen || combat.isActive
              ? 'bg-[#2A1F18] text-[#F27D26] border-[#F27D26]'
              : 'bg-[#1A1C20] text-[#8E9299] hover:text-white border-[#2A2A2A]'
          }`}
          title="Боевой менеджер и инициатива"
        >
          <Swords size={13} className={combat.isActive ? 'animate-pulse text-[#F27D26]' : ''} />
          <span>COMBAT</span>
          {combat.combatants.length > 0 && (
            <span className="px-1.5 py-0.2 bg-[#F27D26] text-black text-[9px] font-extrabold rounded-full">
              {combat.combatants.length}
            </span>
          )}
        </button>

        {/* Кнопка Audio Soundboard */}
        <button
          onClick={onToggleAudio}
          className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 border transition ${
            isAudioOpen || isAudioPlaying
              ? 'bg-[#2A1F18] text-[#F27D26] border-[#F27D26]'
              : 'bg-[#1A1C20] text-[#8E9299] hover:text-white border-[#2A2A2A]'
          }`}
          title="Аудиопульт и эмбиент"
        >
          <Volume2 size={13} className={isAudioPlaying ? 'text-green-400 animate-pulse' : ''} />
          <span>AUDIO</span>
        </button>

        {/* Кнопка SRD Reference */}
        <button
          onClick={onToggleSRD}
          className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 border transition ${
            isSRDOpen
              ? 'bg-[#2A1F18] text-[#F27D26] border-[#F27D26]'
              : 'bg-[#1A1C20] text-[#8E9299] hover:text-white border-[#2A2A2A]'
          }`}
          title="Справочник D&D 5e SRD (Бестиарий, Заклинания)"
        >
          <BookOpen size={13} />
          <span>SRD</span>
        </button>

        {/* Кнопка Scene Notes */}
        <button
          onClick={onToggleNotes}
          className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 border transition ${
            isNotesOpen
              ? 'bg-[#2A1F18] text-[#F27D26] border-[#F27D26]'
              : 'bg-[#1A1C20] text-[#8E9299] hover:text-white border-[#2A2A2A]'
          }`}
          title="Заметки сцены и художественный текст"
        >
          <FileText size={13} />
          <span>NOTES</span>
        </button>

        {/* Кнопка Dice Roller Modal */}
        <button
          onClick={onOpenDiceModal}
          className="p-1.5 rounded-lg bg-[#1A1C20] hover:bg-[#252830] text-[#8E9299] hover:text-[#F27D26] border border-[#2A2A2A]"
          title="Бросить кубики (Dices)"
        >
          <Dices size={15} />
        </button>

        {/* Кнопка D&D Generator Studio & Reference */}
        {onOpenGeneratorStudio && (
          <button
            onClick={onOpenGeneratorStudio}
            className="px-2.5 py-1.5 rounded-lg bg-[#2A1F18] hover:bg-[#3D2C20] text-[#F27D26] border border-[#F27D26]/40 text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition"
            title="Генераторы D&D 5e: Бестиарий (CR 0-30), NPC, Лут, Торговцы, Лавки, Экипировка, Магия и Закрепленные карточки"
          >
            <Sparkles size={13} className="text-[#F27D26]" />
            <span>D&D GEN</span>
          </button>
        )}

        {/* Кнопка ИИ-Движка Polza AI Studio */}
        {onOpenPolzaAiStudio && (
          <button
            onClick={onOpenPolzaAiStudio}
            className="px-2.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/50 text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition animate-pulse"
            title="Polza AI Studio: ИИ-генератор бестиария D&D 5e, сюжетных кампаний и артов"
          >
            <Sparkles size={13} className="text-amber-400" />
            <span>POLZA AI</span>
          </button>
        )}

        {/* Кнопка рабочей папки ресурсов AetherMap_Data */}
        {onOpenAssetFolderModal && (
          <button
            onClick={onOpenAssetFolderModal}
            className="px-2.5 py-1.5 rounded-lg bg-[#2A1F18] hover:bg-[#3D2C20] text-[#F27D26] border border-[#F27D26]/40 text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition"
            title="Рабочая папка ресурсов AetherMap_Data и автосинхронизация с диском"
          >
            <FolderOpen size={13} className="text-[#F27D26]" />
            <span>AETHERMAP_DATA</span>
          </button>
        )}

        {/* Кнопка Map Vault / Generator Studio Modal */}
        <button
          onClick={onOpenVaultModal}
          className="px-2.5 py-1.5 rounded-lg bg-[#1A1C20] hover:bg-[#252830] text-[#8E9299] hover:text-[#F27D26] border border-[#2A2A2A] text-xs font-bold flex items-center gap-1.5"
          title="Студия генераторов (Города, Здания, Таверны, Деревни, Пещеры) и Хранилище карт"
        >
          <Sparkles size={13} className="text-[#F27D26]" />
          <span>MAP STUDIO</span>
        </button>

        {/* Кнопка открытия окна проектора */}
        <button
          onClick={onOpenPlayerWindow}
          className="px-3 py-1.5 rounded-lg bg-[#F27D26] hover:bg-[#E06C15] text-black font-extrabold text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition ml-1"
          title="Открыть окно вывода на ТВ / Проектор (Player Window)"
        >
          <Tv size={14} />
          <span className="hidden sm:inline">PROJECTOR</span>
        </button>
      </div>
    </header>
  );
};
