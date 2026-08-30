/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Интерактивная панель процедурной генерации тактических карт (Dungeon & Cave Generator).
 * Включает мгновенный предварительный просмотр на Canvas 2D, выбор алгоритмов (BSP, Пещеры, Поселение, Таверна),
 * настройку сида, тем и развертывание карты с аудио и заметками в 1 клик.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  DungeonGenerator,
  GeneratorMode,
  MapTheme,
  GeneratorConfig,
  GeneratedMapResult
} from '../services/dungeonGenerator';
import { Scene } from '../types';
import { audioEngine } from '../services/audioEngine';
import {
  Sparkles,
  RefreshCw,
  Download,
  Check,
  Compass,
  Layers,
  Volume2,
  Sliders,
  Play,
  FileText,
  Flame,
  Droplets,
  Castle,
  Trees,
  Coffee,
  Grid
} from 'lucide-react';

interface DungeonGeneratorPanelProps {
  onDeployScene: (scene: Scene) => void;
  onClose?: () => void;
}

export const DungeonGeneratorPanel: React.FC<DungeonGeneratorPanelProps> = ({
  onDeployScene,
  onClose
}) => {
  const [mode, setMode] = useState<GeneratorMode>('bsp_dungeon');
  const [theme, setTheme] = useState<MapTheme>('stone_crypt');
  const [widthCells, setWidthCells] = useState<number>(24);
  const [heightCells, setHeightCells] = useState<number>(18);
  const [cellSize, setCellSize] = useState<number>(55);
  const [seed, setSeed] = useState<number>(() => Math.floor(Math.random() * 100000));

  // BSP параметры
  const [roomCount, setRoomCount] = useState<number>(7);
  const [minRoomSize, setMinRoomSize] = useState<number>(4);
  const [maxRoomSize, setMaxRoomSize] = useState<number>(8);

  // Пещеры параметры
  const [caveFill, setCaveFill] = useState<number>(47);
  const [smoothing, setSmoothing] = useState<number>(4);

  // Результат генерации
  const [result, setResult] = useState<GeneratedMapResult | null>(null);
  const [applyAudio, setApplyAudio] = useState<boolean>(true);

  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  // Перегенерация карты
  const handleGenerate = () => {
    const config: GeneratorConfig = {
      mode,
      theme,
      widthCells,
      heightCells,
      cellSize,
      seed,
      roomCount,
      minRoomSize,
      maxRoomSize,
      caveFillPercentage: caveFill,
      smoothingIterations: smoothing
    };

    const res = DungeonGenerator.generate(config);
    setResult(res);
  };

  useEffect(() => {
    handleGenerate();
  }, [mode, theme, widthCells, heightCells, cellSize, seed, roomCount, minRoomSize, maxRoomSize, caveFill, smoothing]);

  // Развертывание в активную сцену
  const handleDeploy = () => {
    if (!result) return;

    const themeTitles: Record<MapTheme, string> = {
      stone_crypt: 'Каменное подземелье',
      lava_dungeon: 'Лавовые катакомбы',
      ice_cavern: 'Ледяной грот',
      arcane_temple: 'Астральный храм',
      forest_ruins: 'Лесные руины',
      toxic_swamp: 'Чумные топи',
      desert_tomb: 'Гробница фараона',
      cyber_grid: 'Кибер-арена',
      cozy_tavern: 'Таверна «У камина»',
      village_day: 'Поселение и река'
    };

    const newScene: Scene = {
      id: `scene_gen_${Date.now()}`,
      name: `${themeTitles[theme]} (${widthCells}x${heightCells})`,
      grid: {
        enabled: true,
        size: cellSize,
        color: 'rgba(255, 255, 255, 0.25)',
        opacity: 0.5,
        type: 'square',
        offsetX: 0,
        offsetY: 0
      },
      layers: [
        {
          id: `layer_${Date.now()}`,
          name: `Map (${mode})`,
          url: result.dataUrl,
          dataUrl: result.dataUrl,
          x: 0,
          y: 0,
          width: result.widthPx,
          height: result.heightPx,
          opacity: 1,
          visible: true,
          zIndex: 1,
          locked: true
        }
      ],
      drawings: [],
      portals: [],
      notes: result.notes
    };

    // Применяем аудио-пресет
    if (applyAudio && result.suggestedAudio) {
      if (result.suggestedAudio.bgm) {
        audioEngine.playBgmPreset(result.suggestedAudio.bgm);
      }
      Object.entries(result.suggestedAudio.ambience).forEach(([ch, vol]) => {
        audioEngine.setAmbienceChannel(ch as any, vol as number);
      });
    }

    onDeployScene(newScene);
    if (onClose) onClose();
  };

  const handleDownloadPNG = () => {
    if (!result) return;
    const a = document.createElement('a');
    a.href = result.dataUrl;
    a.download = `battlemap_${mode}_${theme}_${Date.now()}.png`;
    a.click();
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-full text-xs font-mono text-[#E0E0E0]">
      {/* 1. ЛЕВАЯ КОЛОНКА НАСТРОЕК */}
      <div className="w-full lg:w-80 flex flex-col gap-3.5 bg-[#151619] p-3.5 rounded-xl border border-[#2A2A2A] overflow-y-auto max-h-[75vh]">
        {/* Режим генератора */}
        <div>
          <label className="text-[11px] font-bold text-[#8E9299] uppercase tracking-wider block mb-1.5">
            Тип локации
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            {[
              { id: 'bsp_dungeon', label: 'Dungeon (BSP)', icon: <Castle size={13} /> },
              { id: 'cellular_cave', label: 'Caves (CA)', icon: <Droplets size={13} /> },
              { id: 'village', label: 'Village Map', icon: <Trees size={13} /> },
              { id: 'tavern', label: 'Cozy Tavern', icon: <Coffee size={13} /> }
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => setMode(m.id as GeneratorMode)}
                className={`p-2 rounded-lg border flex items-center gap-1.5 font-bold transition text-left ${
                  mode === m.id
                    ? 'bg-[#2A1F18] text-[#F27D26] border-[#F27D26]'
                    : 'bg-[#1A1C20] text-[#8E9299] border-[#2A2A2A] hover:text-white'
                }`}
              >
                {m.icon}
                <span className="truncate">{m.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Тема визуального оформления */}
        <div>
          <label className="text-[11px] font-bold text-[#8E9299] uppercase tracking-wider block mb-1.5">
            Тема окружения
          </label>
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value as MapTheme)}
            className="w-full bg-[#1A1C20] border border-[#2A2A2A] rounded-lg p-2 text-white font-bold outline-none focus:border-[#F27D26]"
          >
            <option value="stone_crypt">Каменное подземелье (Stone Crypt)</option>
            <option value="lava_dungeon">Лавовый вулкан (Volcanic Lava)</option>
            <option value="ice_cavern">Ледяной грот (Frozen Cavern)</option>
            <option value="arcane_temple">Астральный храм (Arcane Temple)</option>
            <option value="forest_ruins">Лесные руины (Forest Ruins)</option>
            <option value="toxic_swamp">Чумные топи (Toxic Swamp)</option>
            <option value="desert_tomb">Гробница песков (Desert Tomb)</option>
            <option value="cyber_grid">Киберпанк сетка (Cyber Grid)</option>
            <option value="cozy_tavern">Деревянная таверна (Cozy Tavern)</option>
            <option value="village_day">Деревня и река (Village Day)</option>
          </select>
        </div>

        {/* Размеры карты */}
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="text-[10px] text-[#8E9299] block mb-1">Ширина (кл)</label>
            <input
              type="number"
              min={10}
              max={60}
              value={widthCells}
              onChange={(e) => setWidthCells(Math.max(10, Number(e.target.value)))}
              className="w-full bg-[#1A1C20] border border-[#2A2A2A] rounded p-1.5 text-center text-white"
            />
          </div>
          <div>
            <label className="text-[10px] text-[#8E9299] block mb-1">Высота (кл)</label>
            <input
              type="number"
              min={10}
              max={60}
              value={heightCells}
              onChange={(e) => setHeightCells(Math.max(10, Number(e.target.value)))}
              className="w-full bg-[#1A1C20] border border-[#2A2A2A] rounded p-1.5 text-center text-white"
            />
          </div>
          <div>
            <label className="text-[10px] text-[#8E9299] block mb-1">Сетка (px)</label>
            <input
              type="number"
              min={30}
              max={100}
              value={cellSize}
              onChange={(e) => setCellSize(Math.max(30, Number(e.target.value)))}
              className="w-full bg-[#1A1C20] border border-[#2A2A2A] rounded p-1.5 text-center text-white"
            />
          </div>
        </div>

        {/* Специфичные слайдеры в зависимости от режима */}
        {mode === 'bsp_dungeon' && (
          <div className="space-y-2 pt-2 border-t border-[#2A2A2A]">
            <div className="flex justify-between items-center text-[10px] text-[#8E9299]">
              <span>Количество комнат:</span>
              <span className="text-white font-bold">{roomCount}</span>
            </div>
            <input
              type="range"
              min={4}
              max={14}
              value={roomCount}
              onChange={(e) => setRoomCount(Number(e.target.value))}
              className="w-full accent-[#F27D26]"
            />
          </div>
        )}

        {mode === 'cellular_cave' && (
          <div className="space-y-2.5 pt-2 border-t border-[#2A2A2A]">
            <div>
              <div className="flex justify-between items-center text-[10px] text-[#8E9299] mb-1">
                <span>Плотность стен (%):</span>
                <span className="text-white font-bold">{caveFill}%</span>
              </div>
              <input
                type="range"
                min={40}
                max={55}
                value={caveFill}
                onChange={(e) => setCaveFill(Number(e.target.value))}
                className="w-full accent-[#F27D26]"
              />
            </div>
            <div>
              <div className="flex justify-between items-center text-[10px] text-[#8E9299] mb-1">
                <span>Итерации сглаживания (CA):</span>
                <span className="text-white font-bold">{smoothing}</span>
              </div>
              <input
                type="range"
                min={2}
                max={6}
                value={smoothing}
                onChange={(e) => setSmoothing(Number(e.target.value))}
                className="w-full accent-[#F27D26]"
              />
            </div>
          </div>
        )}

        {/* Сид рандома */}
        <div className="pt-2 border-t border-[#2A2A2A]">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] text-[#8E9299]">Сид генератора:</span>
            <button
              onClick={() => setSeed(Math.floor(Math.random() * 1000000))}
              className="px-2 py-1 bg-[#252830] hover:bg-[#323640] rounded text-[10px] text-[#F27D26] flex items-center gap-1 font-bold"
            >
              <RefreshCw size={11} />
              Рандом
            </button>
          </div>
        </div>

        {/* Галочка аудио */}
        <div className="pt-2 border-t border-[#2A2A2A]">
          <label className="flex items-center gap-2 cursor-pointer text-[11px] text-[#8E9299] hover:text-white">
            <input
              type="checkbox"
              checked={applyAudio}
              onChange={(e) => setApplyAudio(e.target.checked)}
              className="accent-[#F27D26]"
            />
            <Volume2 size={13} className="text-[#F27D26]" />
            <span>Включить атмосферный саундтрек</span>
          </label>
        </div>
      </div>

      {/* 2. ПРАВАЯ КОЛОНКА: ИНТЕРАКТИВНЫЙ ПРОСМОТР КАРТЫ */}
      <div className="flex-1 flex flex-col bg-[#151619] p-3.5 rounded-xl border border-[#2A2A2A] overflow-hidden">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Sparkles size={14} className="text-[#F27D26]" />
            <span className="font-bold text-white uppercase text-[11px]">
              Предварительный просмотр ({widthCells * cellSize}x{heightCells * cellSize} px)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPNG}
              className="px-2.5 py-1.5 rounded-lg bg-[#252830] hover:bg-[#323640] text-[#E0E0E0] font-bold text-xs flex items-center gap-1.5 transition"
              title="Скачать карту как PNG"
            >
              <Download size={13} />
              <span>Экспорт PNG</span>
            </button>

            <button
              onClick={handleDeploy}
              className="px-3.5 py-1.5 rounded-lg bg-[#F27D26] hover:bg-[#E06C15] text-black font-extrabold text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition"
              title="Создать новую сцену и переключиться"
            >
              <Check size={14} />
              <span>Создать сцену</span>
            </button>
          </div>
        </div>

        {/* Область изображения карты */}
        <div className="flex-1 bg-[#0A0A0C] border border-[#222] rounded-lg p-2 flex items-center justify-center overflow-auto">
          {result && (
            <img
              src={result.dataUrl}
              alt="Procedural Map Preview"
              className="max-h-[50vh] max-w-full object-contain rounded shadow-2xl border border-[#333]"
            />
          )}
        </div>

        {/* Сводка комнат и монстров под картой */}
        {result && result.rooms.length > 0 && (
          <div className="mt-2.5 p-2 bg-[#1A1C20] rounded border border-[#2A2A2A] max-h-24 overflow-y-auto">
            <span className="text-[10px] text-[#F27D26] font-bold block mb-1">
              Сгенерировано локаций ({result.rooms.length}):
            </span>
            <div className="flex flex-wrap gap-1.5">
              {result.rooms.map((r, i) => (
                <span
                  key={r.id}
                  className="px-1.5 py-0.5 bg-[#252830] text-[#B0B4BC] rounded text-[9px] font-bold border border-[#333]"
                >
                  {r.name} {r.suggestedEncounter ? `(⚔️ ${r.suggestedEncounter})` : ''}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
