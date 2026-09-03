/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * AudioSoundboardDrawer.tsx — Полноценный аудиопульт мастера:
 * 1. Интерактивный плейлист-менеджер с авто-сканированием локальных папок и подпапок.
 * 2. Режим мгновенного воспроизведения со случайного трека и бесконечным Shuffle-Looping.
 * 3. Переключение категорий настроения (Бой, Босс, Таверна, Исследования, Магия) в один клик.
 * 4. Встроенный SFX Soundboard + Кастомный саундборд для загрузки личных аудиофайлов/реплик.
 * 5. Нативный 5-канальный Web Audio API эмбиент-микшер.
 */

import React, { useEffect, useRef, useState } from 'react';
import { AudioEngineState } from '../types';
import { AudioPlaylist, CustomSfxItem, MusicPlayerState, PlaybackMode } from '../types/audio';
import { audioEngine } from '../services/audioEngine';
import { musicPlayer } from '../services/musicPlayerService';
import {
  Volume2,
  VolumeX,
  Music,
  FolderOpen,
  Shuffle,
  Repeat,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Square,
  Zap,
  Plus,
  Trash2,
  Sliders,
  Sparkles,
  CloudRain,
  Wind,
  Flame,
  Droplets,
  Beer,
  ListMusic,
  Radio,
  FileAudio,
  Upload,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface AudioSoundboardDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AudioSoundboardDrawer: React.FC<AudioSoundboardDrawerProps> = ({ isOpen, onClose }) => {
  // Состояния движков
  const [audioState, setAudioState] = useState<AudioEngineState>(audioEngine.getState());
  const [playerState, setPlayerState] = useState<MusicPlayerState>(musicPlayer.getState());

  // Активная вкладка в выдвижной панели
  const [activeTab, setActiveTab] = useState<'playlists' | 'soundboard' | 'ambience'>('playlists');

  // Уведомления / Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const folderInputRef = useRef<HTMLInputElement>(null);
  const sfxInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsubAudio = audioEngine.subscribe((s) => setAudioState(s));
    const unsubPlayer = musicPlayer.subscribe((p) => setPlayerState(p));

    return () => {
      unsubAudio();
      unsubPlayer();
    };
  }, []);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Обработка выбора папки с музыкой через File System Access API или fallback
  const handleSelectMusicFolder = async () => {
    try {
      if (typeof window !== 'undefined' && 'showDirectoryPicker' in window) {
        const res = await musicPlayer.importMusicFolderViaPicker();
        showToast(
          `Загружено ${res.playlistsCount} плейлистов (${res.tracksCount} треков)!`,
          'success'
        );
      } else {
        folderInputRef.current?.click();
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.warn('Fallback к стандартному диалогу папки:', err);
        folderInputRef.current?.click();
      }
    }
  };

  const handleFolderInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      try {
        const res = musicPlayer.importFromFileList(e.target.files);
        showToast(
          `Успешно импортировано ${res.playlistsCount} плейлистов (${res.tracksCount} треков)!`,
          'success'
        );
      } catch (err: any) {
        showToast(err.message || 'Ошибка импорта файлов', 'error');
      }
    }
  };

  const handleSfxUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      musicPlayer.addCustomSfx(e.target.files);
      showToast(`Добавлено ${e.target.files.length} звуковых эффектов!`, 'success');
    }
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds <= 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed top-14 right-0 bottom-0 w-84 sm:w-[420px] bg-[#121316] border-l border-[#26272C] shadow-2xl z-40 flex flex-col font-mono text-[#E0E0E0] select-none">
      {/* Скрытые инпуты для загрузки папок и саундборда */}
      <input
        type="file"
        ref={folderInputRef}
        onChange={handleFolderInputChange}
        // @ts-ignore
        webkitdirectory="true"
        directory="true"
        multiple
        className="hidden"
      />
      <input
        type="file"
        ref={sfxInputRef}
        onChange={handleSfxUpload}
        multiple
        accept="audio/*"
        className="hidden"
      />

      {/* 1. ВЕРХНИЙ ХЕДЕР АУДИОПУЛЬТА */}
      <div className="p-3.5 border-b border-[#26272C] flex items-center justify-between bg-[#0E0F12]">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-[#F27D26]/10 text-[#F27D26] border border-[#F27D26]/20">
            <Volume2 size={16} />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-xs tracking-wider text-white uppercase">D&D AUDIO STUDIO</span>
            <span className="text-[10px] text-[#808080]">
              {playerState.rootFolderName ? `Папка: ${playerState.rootFolderName}` : 'Локальный музыкальный плеер'}
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-white/10 text-[#808080] hover:text-white text-xs cursor-pointer transition"
        >
          ✕
        </button>
      </div>

      {/* 2. МАСТЕР-МИКШЕР И ГРОМКОСТЬ */}
      <div className="p-3 border-b border-[#26272C] bg-[#0A0B0D] flex flex-col gap-2">
        <div className="flex justify-between items-center text-xs">
          <span className="text-[#808080] font-bold">ОБЩАЯ ГРОМКОСТЬ (BGM & SFX):</span>
          <span className="text-[#F27D26] font-bold">{Math.round(audioState.masterVolume * 100)}%</span>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={0}
            max={1}
            step={0.02}
            value={audioState.masterVolume}
            onChange={(e) => audioEngine.setMasterVolume(Number(e.target.value))}
            className="flex-1 accent-[#F27D26] h-1.5 bg-[#1F2024] rounded-lg cursor-pointer"
          />
          <button
            onClick={() => {
              audioEngine.stopAll();
              musicPlayer.stop();
            }}
            className="px-2.5 py-1 rounded bg-[#201515] hover:bg-rose-950 text-rose-400 hover:text-rose-200 text-[11px] font-bold flex items-center gap-1 border border-rose-900/50 transition cursor-pointer"
            title="Остановить все звуки, плеер и эмбиент"
          >
            <Square size={11} />
            <span>MUTE ALL</span>
          </button>
        </div>
      </div>

      {/* 3. НАВИГАЦИОННЫЕ ВКЛАДКИ (ПЛЕЙЛИСТЫ / САУНДБОРД / ЭМБИЕНТ) */}
      <div className="flex border-b border-[#26272C] bg-[#141518] p-1 gap-1 text-xs">
        <button
          onClick={() => setActiveTab('playlists')}
          className={`flex-1 py-1.5 rounded-lg font-bold flex items-center justify-center gap-1.5 transition ${
            activeTab === 'playlists'
              ? 'bg-[#2A1F18] text-[#F27D26] border border-[#F27D26]/40 shadow-sm'
              : 'text-[#808080] hover:text-white hover:bg-white/5'
          }`}
        >
          <ListMusic size={14} />
          <span>Плейлисты ({playerState.playlists.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('soundboard')}
          className={`flex-1 py-1.5 rounded-lg font-bold flex items-center justify-center gap-1.5 transition ${
            activeTab === 'soundboard'
              ? 'bg-[#2A1F18] text-[#F27D26] border border-[#F27D26]/40 shadow-sm'
              : 'text-[#808080] hover:text-white hover:bg-white/5'
          }`}
        >
          <Zap size={14} />
          <span>Саундборд</span>
        </button>

        <button
          onClick={() => setActiveTab('ambience')}
          className={`flex-1 py-1.5 rounded-lg font-bold flex items-center justify-center gap-1.5 transition ${
            activeTab === 'ambience'
              ? 'bg-[#2A1F18] text-[#F27D26] border border-[#F27D26]/40 shadow-sm'
              : 'text-[#808080] hover:text-white hover:bg-white/5'
          }`}
        >
          <Sliders size={14} />
          <span>Эмбиент</span>
        </button>
      </div>

      {/* 4. ОСНОВНАЯ РАБОЧАЯ ОБЛАСТЬ */}
      <div className="flex-1 overflow-y-auto p-3.5 flex flex-col gap-4">
        {/* ======================================================== */}
        {/* ВКЛАДКА 1: ПЛЕЙЛИСТЫ ИЗ ЛОКАЛЬНОЙ ПАПКИ                  */}
        {/* ======================================================== */}
        {activeTab === 'playlists' && (
          <div className="flex flex-col gap-3">
            {/* Кнопка выбора/импорта папки */}
            <div className="p-3 rounded-xl bg-[#18191E] border border-[#2A2B32] flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FolderOpen size={16} className="text-[#F27D26]" />
                  <span className="text-xs font-bold text-white">Папка с саундтреками</span>
                </div>
                <button
                  onClick={handleSelectMusicFolder}
                  className="px-3 py-1.5 rounded-lg bg-[#F27D26] hover:bg-[#ff8a34] text-black font-bold text-xs flex items-center gap-1.5 transition shadow-sm cursor-pointer active:scale-95"
                >
                  <FolderOpen size={13} />
                  <span>Указать папку</span>
                </button>
              </div>
              <p className="text-[10px] text-[#808080] leading-relaxed">
                Выберите общую папку музыки. Плеер автоматически создаст отдельные плейлисты для каждой подпапки (например: «Бой», «Босс», «Таверна», «Подземелье») и запустит случайное непрерывное зацикливание.
              </p>
            </div>

            {/* СПИСОК ПЛЕЙЛИСТОВ (КАТЕГОРИЙ) */}
            {playerState.playlists.length > 0 ? (
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center text-[11px] text-[#808080] font-bold px-1">
                  <span>ДОСТУПНЫЕ ПЛЕЙЛИСТЫ:</span>
                  <span className="text-[#F27D26]">{playerState.totalTracksCount} треков</span>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  {playerState.playlists.map((pl) => {
                    const isActive = playerState.activePlaylistId === pl.id;
                    return (
                      <div
                        key={pl.id}
                        className={`p-3 rounded-xl border transition flex flex-col gap-2 ${
                          isActive
                            ? 'bg-[#221A15] border-[#F27D26] shadow-[0_0_15px_rgba(242,125,38,0.2)]'
                            : 'bg-[#18191E] border-[#26272C] hover:border-[#383A42]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <button
                            onClick={() => musicPlayer.playPlaylist(pl.id)}
                            className="flex items-center gap-2.5 text-left flex-1 cursor-pointer"
                          >
                            <div
                              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                              style={{ backgroundColor: `${pl.color || '#F27D26'}25`, color: pl.color || '#F27D26' }}
                            >
                              <Music size={16} />
                            </div>
                            <div className="flex flex-col">
                              <span className={`text-xs font-bold ${isActive ? 'text-[#F27D26]' : 'text-white'}`}>
                                {pl.name}
                              </span>
                              <span className="text-[10px] text-[#808080]">
                                {pl.tracks.length} {pl.tracks.length === 1 ? 'трек' : pl.tracks.length < 5 ? 'трека' : 'треков'} • Зациклен
                              </span>
                            </div>
                          </button>

                          <button
                            onClick={() => {
                              if (isActive && playerState.isPlaying) {
                                musicPlayer.togglePlayPause();
                              } else {
                                musicPlayer.playPlaylist(pl.id);
                              }
                            }}
                            className={`p-2 rounded-lg font-bold text-xs flex items-center gap-1 transition cursor-pointer ${
                              isActive && playerState.isPlaying
                                ? 'bg-[#F27D26] text-black shadow-md'
                                : 'bg-[#26272C] hover:bg-[#32333A] text-white'
                            }`}
                            title={isActive && playerState.isPlaying ? 'Пауза' : 'Включить этот плейлист (Shuffle Loop)'}
                          >
                            {isActive && playerState.isPlaying ? <Pause size={14} /> : <Play size={14} />}
                          </button>
                        </div>

                        {/* Индикатор текущего воспроизведения в этом плейлисте */}
                        {isActive && (
                          <div className="pt-2 border-t border-[#33251E] flex items-center justify-between text-[10px]">
                            <div className="flex items-center gap-1.5 text-emerald-400 truncate max-w-[240px]">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                              <span className="truncate">{playerState.activeTrackName || 'Играет трек...'}</span>
                            </div>
                            <span className="text-[#808080] font-mono shrink-0">
                              {playerState.queueIndex + 1} / {playerState.playQueue.length}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* Заглушка, если папка еще не выбрана */
              <div className="p-6 rounded-2xl border border-dashed border-[#2A2B32] bg-[#141518] flex flex-col items-center text-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-[#F27D26]/10 border border-[#F27D26]/20 flex items-center justify-center text-[#F27D26]">
                  <Music size={24} />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-bold text-white">Музыка не загружена</span>
                  <span className="text-[10px] text-[#808080] max-w-xs">
                    Нажмите «Указать папку» выше и выберите каталог с подпапками (Битва, Таверна, Босс). Плейлисты создадутся автоматически.
                  </span>
                </div>
                <button
                  onClick={handleSelectMusicFolder}
                  className="px-4 py-2 rounded-xl bg-[#F27D26] hover:bg-[#ff8a34] text-black font-bold text-xs flex items-center gap-2 transition cursor-pointer shadow-md"
                >
                  <FolderOpen size={14} />
                  <span>Выбрать папку с музыкой</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* ВКЛАДКА 2: ИНТЕРАКТИВНЫЙ САУНДБОРД (SFX & CUSTOM)        */}
        {/* ======================================================== */}
        {activeTab === 'soundboard' && (
          <div className="flex flex-col gap-4">
            {/* Встроенные процедурные спецэффекты Web Audio API */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center text-xs border-b border-[#26272C] pb-1">
                <span className="font-bold text-[#F27D26] flex items-center gap-1.5">
                  <Zap size={14} />
                  <span>БЫСТРЫЙ САУНДБОРД D&D</span>
                </span>
                <span className="text-[10px] text-[#808080]">WEB AUDIO SYNTH</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'sword', label: '⚔️ Удар меча', color: 'hover:border-slate-400' },
                  { id: 'fireball', label: '💥 Взрыв Фаербола', color: 'hover:border-orange-500' },
                  { id: 'roar', label: '🐉 Рык Дракона', color: 'hover:border-red-500' },
                  { id: 'lightning', label: '⚡ Удар Молнии', color: 'hover:border-blue-400' },
                  { id: 'dice', label: '🎲 Бросок костей', color: 'hover:border-purple-500' },
                  { id: 'coin', label: '💰 Звон монет', color: 'hover:border-amber-400' },
                  { id: 'heal', label: '✨ Исцеление', color: 'hover:border-emerald-400' },
                  { id: 'victory', label: '🎺 Победный фанфар', color: 'hover:border-yellow-300' },
                  { id: 'darkness', label: '🌑 Тьма / Ужас', color: 'hover:border-purple-600' },
                  { id: 'whoosh', label: '💨 Свист заклинания', color: 'hover:border-sky-400' }
                ].map((sfx) => (
                  <button
                    key={sfx.id}
                    onClick={() => audioEngine.playSFX(sfx.id as any)}
                    className={`p-2.5 rounded-xl bg-[#18191E] border border-[#26272C] hover:bg-[#22242B] active:scale-95 transition text-left text-xs font-bold text-[#E0E0E0] cursor-pointer ${sfx.color}`}
                  >
                    {sfx.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Пользовательские аудиоэффекты (Custom Soundboard) */}
            <div className="flex flex-col gap-2 pt-2 border-t border-[#26272C]">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <FileAudio size={14} className="text-[#F27D26]" />
                  <span>ВАШИ АУДИОФИШКИ И ЭФФЕКТЫ</span>
                </span>
                <button
                  onClick={() => sfxInputRef.current?.click()}
                  className="px-2 py-1 rounded bg-[#26272C] hover:bg-[#34363F] text-xs font-bold text-[#F27D26] flex items-center gap-1 transition cursor-pointer"
                >
                  <Plus size={12} />
                  <span>Загрузить SFX</span>
                </button>
              </div>

              {playerState.customSfx.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {playerState.customSfx.map((sfx) => (
                    <div
                      key={sfx.id}
                      className="p-2.5 rounded-xl bg-[#18191E] border border-[#26272C] hover:border-[#F27D26]/50 flex items-center justify-between group transition"
                    >
                      <button
                        onClick={() => musicPlayer.playCustomSfx(sfx.id)}
                        className="flex items-center gap-1.5 text-left flex-1 truncate text-xs font-bold text-white hover:text-[#F27D26] cursor-pointer"
                        title={sfx.name}
                      >
                        <Zap size={12} className="text-[#F27D26] shrink-0" />
                        <span className="truncate">{sfx.name}</span>
                      </button>
                      <button
                        onClick={() => musicPlayer.removeCustomSfx(sfx.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-[#808080] hover:text-rose-400 transition"
                        title="Удалить"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-xl border border-dashed border-[#26272C] bg-[#141518] text-center text-[10px] text-[#808080] flex flex-col items-center gap-2">
                  <p>Загрузите свои короткие звуковые файлы (фразы NPC, ловушки, скримеры, реплики) для быстрого вброса игрокам в бою.</p>
                  <button
                    onClick={() => sfxInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-lg bg-[#26272C] hover:bg-[#32333A] text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Upload size={12} />
                    <span>Добавить аудиофайлы</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* ВКЛАДКА 3: НАСТРОЙКА ЭМБИЕНТА                            */}
        {/* ======================================================== */}
        {activeTab === 'ambience' && (
          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-center text-xs border-b border-[#26272C] pb-1">
              <span className="font-bold text-[#F27D26] flex items-center gap-1.5">
                <Sliders size={14} />
                <span>АТМОСФЕРНЫЙ ЭМБИЕНТ-МИКШЕР</span>
              </span>
              <span className="text-[10px] text-[#808080]">5 КАНАЛОВ</span>
            </div>

            <div className="flex flex-col gap-3 bg-[#18191E] p-3.5 rounded-xl border border-[#26272C]">
              {[
                { key: 'rain', label: 'Дождь и Гроза', icon: <CloudRain size={14} className="text-blue-400" /> },
                { key: 'wind', label: 'Ветер и Метель', icon: <Wind size={14} className="text-slate-400" /> },
                { key: 'fire', label: 'Костер и Треск углей', icon: <Flame size={14} className="text-orange-400" /> },
                { key: 'dungeon', label: 'Капли в пещере', icon: <Droplets size={14} className="text-cyan-400" /> },
                { key: 'tavern', label: 'Шум таверны и кружек', icon: <Beer size={14} className="text-amber-400" /> }
              ].map((ch) => {
                const val = audioState.ambienceChannels[ch.key as keyof typeof audioState.ambienceChannels] || 0;
                return (
                  <div key={ch.key} className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <div className="flex items-center gap-2 text-[#E0E0E0]">
                        {ch.icon}
                        <span>{ch.label}</span>
                      </div>
                      <span className="font-mono text-xs text-[#F27D26] font-bold">{Math.round(val * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={val}
                      onChange={(e) => audioEngine.setAmbienceChannel(ch.key as any, Number(e.target.value))}
                      className="accent-[#F27D26] h-1.5 bg-[#121316] rounded-lg cursor-pointer"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* 5. НИЖНЯЯ ПАНЕЛЬ ТЕКУЩЕГО ТРЕКА И УПРАВЛЕНИЯ ПЛЕЕРОМ     */}
      {/* ======================================================== */}
      <div className="p-3.5 border-t border-[#26272C] bg-[#0E0F12] flex flex-col gap-2.5">
        {/* Название трека и прогресс */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-white truncate max-w-[230px]">
              {playerState.activeTrackName || 'Плеер остановлен'}
            </span>
            <span className="text-[10px] text-[#808080] font-mono">
              {formatTime(playerState.currentTime)} / {formatTime(playerState.duration)}
            </span>
          </div>

          {/* Ползунок перемотки */}
          <input
            type="range"
            min={0}
            max={playerState.duration || 100}
            value={playerState.currentTime}
            onChange={(e) => musicPlayer.seek(Number(e.target.value))}
            className="w-full accent-[#F27D26] h-1 bg-[#26272C] rounded-lg cursor-pointer"
          />
        </div>

        {/* Кнопки управления */}
        <div className="flex items-center justify-between">
          {/* Режим перемешивания / зацикливания */}
          <button
            onClick={() => {
              const nextMode: PlaybackMode =
                playerState.playbackMode === 'shuffle_loop'
                  ? 'sequential_loop'
                  : playerState.playbackMode === 'sequential_loop'
                  ? 'single_repeat'
                  : 'shuffle_loop';
              musicPlayer.setPlaybackMode(nextMode);
            }}
            className={`p-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
              playerState.playbackMode === 'shuffle_loop'
                ? 'text-[#F27D26] bg-[#2A1F18] border border-[#F27D26]/30'
                : 'text-[#808080] hover:text-white bg-[#1A1C20]'
            }`}
            title={`Режим: ${
              playerState.playbackMode === 'shuffle_loop'
                ? 'Shuffle Loop (Случайный бесконечный повтор)'
                : playerState.playbackMode === 'sequential_loop'
                ? 'Sequential Loop (По порядку с зацикливанием)'
                : 'Повтор одного трека'
            }`}
          >
            {playerState.playbackMode === 'shuffle_loop' ? (
              <Shuffle size={14} className="text-[#F27D26]" />
            ) : (
              <Repeat size={14} />
            )}
            <span className="text-[10px]">
              {playerState.playbackMode === 'shuffle_loop' ? 'SHUFFLE' : 'LOOP'}
            </span>
          </button>

          {/* Главные кнопки воспроизведения */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => musicPlayer.playPreviousTrack()}
              disabled={playerState.playQueue.length === 0}
              className="p-2 rounded-lg bg-[#1A1C20] hover:bg-[#252830] text-white disabled:opacity-30 transition cursor-pointer"
              title="Предыдущий трек"
            >
              <SkipBack size={16} />
            </button>

            <button
              onClick={() => musicPlayer.togglePlayPause()}
              className="p-3 rounded-xl bg-[#F27D26] hover:bg-[#ff8a34] text-black font-extrabold shadow-lg shadow-[#F27D26]/20 transition cursor-pointer active:scale-95"
              title={playerState.isPlaying ? 'Пауза' : 'Воспроизведение'}
            >
              {playerState.isPlaying ? <Pause size={18} /> : <Play size={18} />}
            </button>

            <button
              onClick={() => musicPlayer.playNextTrack()}
              disabled={playerState.playQueue.length === 0}
              className="p-2 rounded-lg bg-[#1A1C20] hover:bg-[#252830] text-white disabled:opacity-30 transition cursor-pointer"
              title="Следующий трек"
            >
              <SkipForward size={16} />
            </button>
          </div>

          {/* Индикатор статуса */}
          <div className="text-[10px] text-[#808080] font-mono">
            {playerState.isPlaying ? (
              <span className="text-emerald-400 flex items-center gap-1 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                PLAYING
              </span>
            ) : (
              'PAUSED'
            )}
          </div>
        </div>
      </div>

      {/* 6. УВЕДОМЛЕНИЯ / TOAST */}
      {toast && (
        <div
          className={`absolute top-16 left-4 right-4 z-50 p-3 rounded-xl shadow-xl border backdrop-blur-md flex items-center gap-2 text-xs font-mono animate-in fade-in slide-in-from-top-2 duration-200 ${
            toast.type === 'success'
              ? 'bg-[#0E1F16]/95 border-emerald-500/60 text-emerald-100'
              : toast.type === 'error'
              ? 'bg-[#261010]/95 border-rose-500/60 text-rose-100'
              : 'bg-[#121A26]/95 border-sky-500/60 text-sky-100'
          }`}
        >
          {toast.type === 'success' && <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />}
          {toast.type === 'error' && <AlertCircle size={16} className="text-rose-400 shrink-0" />}
          <span className="flex-1">{toast.message}</span>
        </div>
      )}
    </div>
  );
};
