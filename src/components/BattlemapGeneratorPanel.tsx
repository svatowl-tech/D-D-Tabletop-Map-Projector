/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Интерактивный React-компонент панели управления процедурным генератором боевых карт (Battlemap Generator).
 * Поддерживает биомы, проекторные разрешения 16:9 (32x18, 48x27, 64x36), переключатели рельефа, POI и погоду.
 */

import React, { useState, useEffect, useRef } from 'react';
import { Scene, MapLayer } from '../types';
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
  Sun,
  Moon,
  CloudRain,
  CloudSnow,
  CloudFog,
  Anchor,
  Mountain,
  Grid,
  Tent,
  Eye,
  Crosshair,
  MapPin,
  ExternalLink
} from 'lucide-react';

interface BattlemapGeneratorPanelProps {
  onDeployScene: (scene: Scene) => void;
  onAddLayer?: (layer: MapLayer) => void;
  onClose?: () => void;
}

export const BattlemapGeneratorPanel: React.FC<BattlemapGeneratorPanelProps> = ({
  onDeployScene,
  onAddLayer,
  onClose
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Параметры генератора
  const [biomeId, setBiomeId] = useState<string>('forest');
  const [resolution, setResolution] = useState<string>('32x18');
  const [seed, setSeed] = useState<string>(() => Math.floor(Math.random() * 1000000).toString());
  const [lighting, setLighting] = useState<string>('day');
  const [treeDensity, setTreeDensity] = useState<string>('dense');
  const [rockDensity, setRockDensity] = useState<string>('normal');
  const [poiType, setPoiType] = useState<string>('random');

  // Переключатели объектов
  const [toggles, setToggles] = useState({
    hasHouse: false,
    hasRiver: true,
    hasRoad: true,
    hasFields: false,
    hasRuins: false,
    hasCamp: false,
    hasMountains: false,
    hasPOI: true
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Перегенерация (отправка postMessage или случайный сид)
  const handleRandomize = () => {
    const newSeed = Math.floor(Math.random() * 1000000).toString();
    setSeed(newSeed);
  };

  const handleToggle = (key: keyof typeof toggles) => {
    setToggles(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Отправка экспорта через postMessage из iframe
  const handleTriggerExport = () => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage({ type: 'BATTLEMAP_REQUEST_EXPORT' }, '*');
    }
  };

  // Слушаем события экспорта от iframe
  useEffect(() => {
    const handleExportMessage = (event: MessageEvent) => {
      const data = event.data;
      if (!data || typeof data !== 'object') return;

      if (data.type === 'BATTLEMAP_EXPORT' || data.type === 'BATTLEMAP_MAP_EXPORT') {
        const mapDataUrl = data.dataUrl;
        if (!mapDataUrl) return;

        const mapTitle = `Боевая карта: ${data.filename || data.title || 'Wilderness Battlemap'}`;
        const [w, h] = resolution.split('x').map(Number);
        const mapWidth = (w || 30) * 50;
        const mapHeight = (h || 20) * 50;

        // Звуковое сопровождение
        const bgm = biomeId === 'ship' || biomeId === 'cabin' ? 'tavern' : biomeId === 'cave' || biomeId === 'dungeon' ? 'dungeon' : 'forest';
        audioEngine.playBgmPreset(bgm);
        if (lighting === 'rain') audioEngine.setAmbienceChannel('rain', 0.6);
        if (lighting === 'night') audioEngine.setAmbienceChannel('fire', 0.4);

        const notesText = `⚔️ БОЕВАЯ ТАКТИЧЕСКАЯ КАРТА (5ft Grid)\nНазвание: ${mapTitle}\nБиом: ${biomeId}\nРазмер: ${w || 30}x${h || 20} клеток (${(w || 30) * 5}\u00d7${(h || 20) * 5} ft)\nСоздано: ${new Date().toLocaleString()}\n\nОсобенности рельефа:\n• Процедурный биом (${biomeId})\n• Тактические укрытия и POI: ${poiType}\n• Погода/Освещение: ${lighting}`;

        const newScene: Scene = {
          id: `battlemap_scene_${Date.now()}`,
          name: mapTitle,
          grid: {
            enabled: true,
            size: 50,
            color: 'rgba(255, 255, 255, 0.25)',
            opacity: 0.5,
            type: 'square',
            offsetX: 0,
            offsetY: 0
          },
          layers: [
            {
              id: `layer_${Date.now()}`,
              name: mapTitle,
              url: mapDataUrl,
              dataUrl: mapDataUrl,
              x: 0,
              y: 0,
              width: mapWidth,
              height: mapHeight,
              opacity: 1,
              visible: true,
              zIndex: 1,
              locked: true
            }
          ],
          drawings: [],
          portals: [],
          notes: notesText
        };

        if (onAddLayer) {
          const newLayer: MapLayer = {
            id: `layer_bm_${Date.now()}`,
            name: mapTitle,
            url: mapDataUrl,
            dataUrl: mapDataUrl,
            x: 0,
            y: 0,
            width: mapWidth,
            height: mapHeight,
            opacity: 1,
            visible: true,
            zIndex: 10,
            locked: false
          };
          onAddLayer(newLayer);
          showToast(`Слой «${mapTitle}» добавлен на текущую сцену!`);
        } else {
          onDeployScene(newScene);
          showToast(`Боевая карта «${mapTitle}» развернута на столе!`);
        }

        if (onClose) onClose();
      }
    };

    window.addEventListener('message', handleExportMessage);
    return () => window.removeEventListener('message', handleExportMessage);
  }, [biomeId, resolution, lighting, poiType, onDeployScene, onAddLayer, onClose]);

  // Формирование URL iframe с GET-параметрами
  const iframeSrc = `./Battlemap/index.html?seed=${encodeURIComponent(seed)}&biome=${encodeURIComponent(biomeId)}&w=${resolution.split('x')[0]}&h=${resolution.split('x')[1]}`;

  return (
    <div className="flex flex-col lg:flex-row w-full h-full bg-[#121215] text-[#E4E4E7] overflow-hidden select-none">
      {/* Toast notification */}
      {toastMessage && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-[#2563EB] text-white font-bold px-4 py-2 rounded-xl shadow-2xl flex items-center gap-2 border border-white/20 animate-bounce">
          <Check size={16} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Панель настроек (Слева / Сверху) */}
      <div className="w-full lg:w-96 bg-[#18181C] border-b lg:border-b-0 lg:border-r border-[#2A2A30] flex flex-col p-4 gap-4 overflow-y-auto">
        <div className="flex items-center justify-between border-b border-[#2A2A30] pb-3">
          <div className="flex items-center gap-2 text-[#3B82F6] font-bold text-lg">
            <Compass size={20} />
            <span>Боевая Карта (Wilderness)</span>
          </div>
          <button
            onClick={handleRandomize}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold rounded-lg transition-colors"
            title="Сгенерировать случайный сид"
          >
            <RefreshCw size={13} />
            <span>Случайно</span>
          </button>
        </div>

        {/* 1. БИОМЫ */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold uppercase tracking-wider text-[#A1A1AA] flex items-center gap-1.5">
            <Trees size={13} />
            <span>Природный Биом</span>
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            {[
              { id: 'forest', name: '🌲 Лес / Чащоба' },
              { id: 'winter', name: '❄️ Зима / Снег' },
              { id: 'desert', name: '🏜️ Пустыня' },
              { id: 'swamp', name: '🐸 Болото' },
              { id: 'cave', name: '🕳️ Пещеры / Грот' },
              { id: 'dungeon', name: '🏰 Подземелье' },
              { id: 'archipelago', name: '🏝️ Архипелаг' },
              { id: 'ship', name: '⛵ Корабли' },
              { id: 'road', name: '🛤️ Проселок' },
              { id: 'river', name: '🌊 Переправа' },
              { id: 'meadow', name: '🌾 Поля / Луга' },
              { id: 'ruins', name: '🏛️ Руины' },
              { id: 'cabin', name: '🏠 Хижина' },
              { id: 'camp', name: '⛺ Лагерь' }
            ].map(b => (
              <button
                key={b.id}
                onClick={() => setBiomeId(b.id)}
                className={`px-2.5 py-1.5 text-xs text-left rounded-md border transition-all ${
                  biomeId === b.id
                    ? 'bg-[#3B82F6] border-[#60A5FA] text-white font-bold shadow'
                    : 'bg-[#212126] border-[#3F3F46] text-[#D4D4D8] hover:bg-[#2A2A30]'
                }`}
              >
                {b.name}
              </button>
            ))}
          </div>
        </div>

        {/* 2. РАЗРЕШЕНИЯ ПРОЕКТОРА */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold uppercase tracking-wider text-[#A1A1AA] flex items-center gap-1.5">
            <Grid size={13} />
            <span>Разрешение Проектора (16:9 HD & Клетки)</span>
          </label>
          <select
            value={resolution}
            onChange={(e) => setResolution(e.target.value)}
            className="w-full bg-[#212126] border border-[#3F3F46] rounded-md px-3 py-1.5 text-xs text-[#F4F4F5] focus:outline-none focus:border-[#3B82F6]"
          >
            <option value="32x18">📺 16:9 Full HD (32×18 - 160×90 ft)</option>
            <option value="48x27">📺 16:9 Full HD (48×27 - 240×135 ft)</option>
            <option value="64x36">📺 16:9 Full HD (64×36 - 320×180 ft)</option>
            <option value="20x15">📐 Стандарт (20×15 - 100×75 ft)</option>
            <option value="30x20">📐 Тактика (30×20 - 150×100 ft)</option>
            <option value="40x30">📐 Большой план (40×30 - 200×150 ft)</option>
          </select>
        </div>

        {/* 3. ПЕРЕКЛЮЧАТЕЛИ ЭЛЕМЕНТОВ */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold uppercase tracking-wider text-[#A1A1AA] flex items-center gap-1.5">
            <Sliders size={13} />
            <span>Элементы Местности</span>
          </label>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {[
              { key: 'hasRiver', label: '🌊 Река / Ручей' },
              { key: 'hasRoad', label: '🛤️ Дорога / Тракт' },
              { key: 'hasHouse', label: '🏠 Постройки / Хижина' },
              { key: 'hasRuins', label: '🏛️ Руины' },
              { key: 'hasCamp', label: '⛺ Лагерь' },
              { key: 'hasMountains', label: '⛰️ Горы и скалы' },
              { key: 'hasPOI', label: '⭐ Тайник / POI' },
              { key: 'hasFields', label: '🌾 Вспаханные поля' }
            ].map(item => (
              <label
                key={item.key}
                className="flex items-center gap-2 cursor-pointer text-[#D4D4D8] hover:text-white"
              >
                <input
                  type="checkbox"
                  checked={toggles[item.key as keyof typeof toggles]}
                  onChange={() => handleToggle(item.key as keyof typeof toggles)}
                  className="rounded accent-[#3B82F6] cursor-pointer"
                />
                <span>{item.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* 4. ВЫБОР ТОЧКИ ИНТЕРЕСА (POI) */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold uppercase tracking-wider text-[#A1A1AA] flex items-center gap-1.5">
            <MapPin size={13} />
            <span>Конкретный POI (Точка интереса)</span>
          </label>
          <select
            value={poiType}
            onChange={(e) => setPoiType(e.target.value)}
            className="w-full bg-[#212126] border border-[#3F3F46] rounded-md px-3 py-1.5 text-xs text-[#F4F4F5] focus:outline-none focus:border-[#3B82F6]"
          >
            <option value="random">🎲 Случайное интересное место</option>
            <option value="cave_entrance">🕳️ Вход в пещеру</option>
            <option value="ancient_altar">🔮 Древний алтарь</option>
            <option value="smuggler_cache">📦 Схрон контрабандистов</option>
            <option value="forgotten_crypt">🪦 Забытый склеп</option>
            <option value="treehouse_lookout">🌲 Дозорный помост на дереве</option>
            <option value="witch_hut">🧙‍♀️ Котёл / Хижина ведьмы</option>
            <option value="stone_henge">🪨 Круг менгиров</option>
            <option value="ruined_watchtower">🏰 Разрушенная дозорная башня</option>
            <option value="monster_nest">🦅 Гнездо монстра</option>
            <option value="cursed_statue">🗿 Проклятый монумент</option>
            <option value="fairy_spring">✨ Светящийся источник фей</option>
            <option value="gallows_crossroad">⛓️ Виселица на распутье</option>
            <option value="shipwreck">⛵ Кораблекрушение на мели</option>
          </select>
        </div>

        {/* 5. ОСВЕЩЕНИЕ И ПОГОДА */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold uppercase tracking-wider text-[#A1A1AA] flex items-center gap-1.5">
            <Sun size={13} />
            <span>Освещение & Погода</span>
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { id: 'day', name: '☀️ День' },
              { id: 'dusk', name: '🌅 Закат' },
              { id: 'night', name: '🌙 Ночь' },
              { id: 'rain', name: '🌧️ Дождь' },
              { id: 'snow', name: '❄️ Снег' },
              { id: 'fog', name: '🌫️ Туман' }
            ].map(l => (
              <button
                key={l.id}
                onClick={() => setLighting(l.id)}
                className={`px-2 py-1.5 text-xs text-center rounded-md border transition-all ${
                  lighting === l.id
                    ? 'bg-[#2563EB] border-[#60A5FA] text-white font-bold'
                    : 'bg-[#212126] border-[#3F3F46] text-[#D4D4D8] hover:bg-[#2A2A30]'
                }`}
              >
                {l.name}
              </button>
            ))}
          </div>
        </div>

        {/* ДЕЙСТВИЯ */}
        <div className="flex flex-col gap-2 mt-auto pt-3 border-t border-[#2A2A30]">
          <button
            onClick={handleTriggerExport}
            className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all"
          >
            <Play size={15} />
            <span>Развернуть Боевую Карту на Стол</span>
          </button>
        </div>
      </div>

      {/* Просмотр генератора в iframe */}
      <div className="flex-1 h-full relative bg-black">
        <iframe
          ref={iframeRef}
          src={iframeSrc}
          className="w-full h-full border-0"
          title="Battlemap Generator Canvas"
        />
      </div>
    </div>
  );
};
