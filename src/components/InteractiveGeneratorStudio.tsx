/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Интерактивная студия генераторов карт (Map & World Generator Studio).
 * Встраивает встроенные генераторы (Cave, City, Dwellings, Taverns, Village) из /public через изолированные iframes
 * с двусторонней связью (postMessage), мгновенным импортом на стол и переключением на проектор игроков.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Scene, MapLayer } from '../types';
import { audioEngine } from '../services/audioEngine';
import { DungeonGeneratorPanel } from './DungeonGeneratorPanel';
import {
  Sparkles,
  Building2,
  Home,
  Coffee,
  Trees,
  Compass,
  Download,
  Check,
  RefreshCw,
  Eye,
  Sliders,
  Layers,
  Volume2,
  FileText,
  Maximize2,
  Minimize2,
  ExternalLink,
  Info,
  ChevronRight
} from 'lucide-react';

export type GeneratorTab = 'battlemap' | 'dungeon' | 'city' | 'dwell' | 'taverns' | 'village' | 'cave' | 'bsp';

interface InteractiveGeneratorStudioProps {
  currentScene: Scene;
  onDeployNewScene: (newScene: Scene) => void;
  onAddLayerToCurrentScene: (layer: MapLayer) => void;
  onClose?: () => void;
}

export const InteractiveGeneratorStudio: React.FC<InteractiveGeneratorStudioProps> = ({
  currentScene,
  onDeployNewScene,
  onAddLayerToCurrentScene,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<GeneratorTab>('dungeon');
  const [importMode, setImportMode] = useState<'new_scene' | 'add_layer'>('new_scene');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Состояние Dwellings
  const [dwellInfo, setDwellInfo] = useState<{
    name: string;
    hasBasement: boolean;
    numFloors: number;
    floors: Array<{ index: number; label: string; name: string; isBasement: boolean }>;
    currentFloor: number;
  } | null>(null);

  const iframeRef = useRef<HTMLIFrameElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Отправка команды в текущий iframe генератора
  const sendIframeMessage = useCallback((message: any) => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage(message, '*');
    }
  }, []);

  // Слушатель сообщений от всех встроенных генераторов
  useEffect(() => {
    const handleWindowMessage = (event: MessageEvent) => {
      const data = event.data;
      if (!data || typeof data !== 'object') return;

      // 1. Dwellings Info
      if (data.type === 'DWELLINGS_INFO_RESPONSE' && data.info) {
        setDwellInfo(data.info);
        return;
      }

      // 2. Унифицированная обработка экспорта карт
      let mapDataUrl: string | null = null;
      let mapTitle: string = 'Сгенерированная карта';
      let mapType: string = 'map';
      let mapWidth = data.width || 2048;
      let mapHeight = data.height || 2048;
      let audioBgm: 'dungeon' | 'crypt' | 'battle' | 'tavern' | 'forest' | null = null;
      let ambiencePresets: Record<string, number> = {};
      let notesText = '';

      if (data.type === 'CITY_MAP_EXPORT') {
        mapDataUrl = data.dataUrl;
        mapTitle = `Город: ${data.filename || 'Medieval City'}`;
        mapType = 'city';
        audioBgm = 'forest';
        ambiencePresets = { wind: 0.3, rain: 0 };
        notesText = `🏙️ ТАКТИЧЕСКАЯ КАРТА ГОРОДА\nНазвание: ${data.filename || 'Средневековый город'}\nСоздано: ${new Date().toLocaleString()}\nМасштаб: Тактический вид сверху / Кварталы\n\nРайоны и достопримечательности:\n• Рыночная площадь\n• Ремесленный квартал\n• Замковая стена и стража`;
      } else if (data.type === 'DWELLINGS_MAP_EXPORT') {
        mapDataUrl = data.dataUrl;
        const floorLabel = data.floorLabel || 'GF';
        const floorTitle = data.floorTitle || `Этаж ${floorLabel}`;
        mapTitle = `Здание: ${data.houseName || 'Особняк'} (${floorLabel})`;
        mapType = 'dwellings';
        audioBgm = 'tavern';
        ambiencePresets = { fire: 0.4, tavern: 0.3 };
        notesText = `🏡 ПЛАН ПОМЕЩЕНИЯ / ОСОБНЯКА\nЗдание: ${data.houseName || 'Жилой дом'}\nУровень: ${floorTitle}\nСоздано: ${new Date().toLocaleString()}\nОсобенности: Комнаты, мебель, камины, двери.`;
      } else if (data.type === 'TAVERN_MAP_EXPORT') {
        mapDataUrl = data.dataUrl;
        mapTitle = `Таверна: ${data.filename || 'Уютный очаг'}`;
        mapType = 'tavern';
        audioBgm = 'tavern';
        ambiencePresets = { fire: 0.6, tavern: 0.7 };
        notesText = `🍺 ТАВЕРНА И ПОСТОЯЛЫЙ ДВОР\nНазвание: ${data.filename || 'Таверна'}\nСоздано: ${new Date().toLocaleString()}\nОкружение: Запах эля, потрескивание дров в камине, музыка барда.\n\nПерсонажи:\n• Трактирщик за стойкой\n• Наемники в дальнем углу\n• Подозрительный гость у камина`;
      } else if (data.type === 'VILLAGE_MAP_EXPORT') {
        mapDataUrl = data.dataUrl;
        mapTitle = `Деревня: ${data.filename || 'Поселение'}`;
        mapType = 'village';
        audioBgm = 'forest';
        ambiencePresets = { wind: 0.5, rain: 0 };
        notesText = `🌲 СРЕДНЕВЕКОВАЯ ДЕРЕВНЯ\nПоселение: ${data.filename || 'Деревня'}\nСоздано: ${new Date().toLocaleString()}\nОкружение: Поля, сады, проселочные дороги, крестьянские дома.\n\nВозможные события:\n• Нападение бандитов на мельницу\n• Ярмарка на деревенской площади`;
      } else if (data.type === 'CAVE_MAP_EXPORT') {
        mapDataUrl = data.dataUrl;
        mapTitle = `Пещера: ${data.filename || 'Подземный грот'}`;
        mapType = 'cave';
        audioBgm = 'dungeon';
        ambiencePresets = { dungeon: 0.8, wind: 0.3 };
        notesText = `🕳️ ПЕЩЕРЫ И КАРСТОВЫЕ РАСЩЕЛИНЫ\nЛокация: ${data.filename || 'Пещера'}\nСоздано: ${new Date().toLocaleString()}\nОкружение: Влажные каменные стены, сталактиты, эхо капель воды.\n\nОпасности:\n• Обвалы и узкие лазы\n• Подземные хищники и пауки`;
      } else if (data.type === 'DUNGEON_MAP_EXPORT') {
        mapDataUrl = data.dataUrl;
        mapTitle = `Подземелье: ${data.filename || 'One-Page Dungeon'}`;
        mapType = 'dungeon';
        audioBgm = 'dungeon';
        ambiencePresets = { dungeon: 0.9, wind: 0.2 };
        notesText = `🗡️ ONE-PAGE DUNGEON (ПОДЗЕМЕЛЬЕ)\nЛокация: ${data.filename || 'Катакомбы'}\nСоздано: ${new Date().toLocaleString()}\nОкружение: Сырость, факелы на каменных стенах, потайные двери и ловушки.\n\nИсследование:\n• Процедурные комнаты и сокровищницы\n• Боевые столкновения и загадки`;
      } else if (data.type === 'BATTLEMAP_EXPORT' || data.type === 'BATTLEMAP_MAP_EXPORT') {
        mapDataUrl = data.dataUrl;
        mapTitle = `Боевая карта: ${data.filename || data.title || 'Wilderness Battlemap'}`;
        mapType = 'battlemap';
        const biomeBgmMap: Record<string, 'dungeon' | 'crypt' | 'battle' | 'tavern' | 'forest'> = {
          forest: 'forest',
          winter: 'forest',
          desert: 'dungeon',
          cave: 'dungeon',
          dungeon: 'crypt',
          swamp: 'dungeon',
          ship: 'tavern',
          archipelago: 'forest',
          river: 'forest'
        };
        audioBgm = biomeBgmMap[data.biome || 'forest'] || 'battle';
        ambiencePresets = { wind: 0.4, rain: data.lighting === 'rain' ? 0.7 : 0 };
        notesText = `⚔️ ТАКТИЧЕСКАЯ БОЕВАЯ КАРТА (5ft Grid)\nНазвание: ${mapTitle}\nБиом: ${data.biome || 'Лес'}\nРазмер: ${data.width || '150'}x${data.height || '100'} ft\nСоздано: ${new Date().toLocaleString()}\n\nОсобенности местности:\n• Процедурный рельеф и биом\n• Точки интереса (POI) и тактическое укрытие\n• Сетка D&D 5e и туман войны`;
      }

      if (mapDataUrl) {
        setIsExporting(false);

        // Применяем аудио-настроение
        if (audioBgm) {
          audioEngine.playBgmPreset(audioBgm);
        }
        Object.entries(ambiencePresets).forEach(([ch, vol]) => {
          audioEngine.setAmbienceChannel(ch as any, vol);
        });

        if (importMode === 'add_layer') {
          // Добавляем как новый слой
          const newLayer: MapLayer = {
            id: `layer_gen_${Date.now()}`,
            name: mapTitle,
            url: mapDataUrl,
            dataUrl: mapDataUrl,
            x: 0,
            y: 0,
            width: mapWidth,
            height: mapHeight,
            opacity: 1,
            visible: true,
            zIndex: (currentScene.layers?.length || 0) + 1,
            locked: false
          };
          onAddLayerToCurrentScene(newLayer);
          showToast(`Слой «${mapTitle}» добавлен на текущую сцену!`);
        } else {
          // Создаем полноценную новую сцену
          const cellSize = mapType === 'city' || mapType === 'village' ? 50 : 60;
          const newScene: Scene = {
            id: `scene_gen_${Date.now()}`,
            name: mapTitle,
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

          onDeployNewScene(newScene);
          showToast(`Сцена «${mapTitle}» создана и развернута на столе!`);
        }
      }
    };

    window.addEventListener('message', handleWindowMessage);
    return () => window.removeEventListener('message', handleWindowMessage);
  }, [importMode, currentScene, onDeployNewScene, onAddLayerToCurrentScene]);

  // Запрос инфо для Dwellings при переключении таба
  useEffect(() => {
    if (activeTab === 'dwell') {
      const timer = setTimeout(() => {
        sendIframeMessage({ type: 'DWELLINGS_GET_INFO' });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [activeTab, sendIframeMessage]);

  const tabsConfig: Array<{ id: GeneratorTab; label: string; icon: React.ReactNode; src: string; desc: string }> = [
    {
      id: 'battlemap',
      label: 'Боевая карта (Battlemap)',
      icon: <Trees size={14} />,
      src: './Battlemap/index.html',
      desc: 'Тактический генератор боевых карт: биомы, рельеф, POI, туман войны и 5ft сетка D&D 5e'
    },
    {
      id: 'dungeon',
      label: 'Подземелье (Dungeon)',
      icon: <Sparkles size={14} />,
      src: './Dungeon/index.html',
      desc: 'Watabou One-Page Dungeon Generator: процедурные катакомбы, залы и секреты'
    },
    {
      id: 'city',
      label: 'Город (City)',
      icon: <Building2 size={14} />,
      src: './city/index.html',
      desc: 'Средневековый город: кварталы, замки, реки и мощеные улицы'
    },
    {
      id: 'dwell',
      label: 'Здания (Dwellings)',
      icon: <Home size={14} />,
      src: './dwell/index.html',
      desc: 'Многоэтажные особняки, комнаты, мебель и подвалы'
    },
    {
      id: 'taverns',
      label: 'Таверна (Taverns)',
      icon: <Coffee size={14} />,
      src: './taverns/index.html',
      desc: 'План таверны: зал, бар, спальни и камин'
    },
    {
      id: 'village',
      label: 'Деревня (Village)',
      icon: <Trees size={14} />,
      src: './village/index.html',
      desc: 'Сельская местность: сады, поля, избы и мельницы'
    },
    {
      id: 'cave',
      label: 'Пещеры (Caves)',
      icon: <Compass size={14} />,
      src: './Cave/index.html',
      desc: 'Органические каверны, гроты и расщелины'
    },
    {
      id: 'bsp',
      label: 'Конструктор (BSP)',
      icon: <Sliders size={14} />,
      src: '',
      desc: 'Алгоритмический генератор залов и катакомб D&D'
    }
  ];

  const currentTabInfo = tabsConfig.find((t) => t.id === activeTab) || tabsConfig[0];

  return (
    <div
      className={`flex flex-col bg-[#111214] text-[#E0E0E0] font-mono select-none overflow-hidden ${
        isFullscreen ? 'fixed inset-0 z-50 p-3' : 'w-full h-full'
      }`}
    >
      {/* Toast уведомление */}
      {toastMessage && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-[#F27D26] text-black font-extrabold px-4 py-2 rounded-xl shadow-2xl flex items-center gap-2 border border-white/20 animate-bounce">
          <Check size={16} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ШАПКА ВЫБОРА ГЕНЕРАТОРА */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-[#18191D] border-b border-[#2A2A2A]">
        {/* Кнопки переключения генераторов */}
        <div className="flex flex-wrap items-center gap-1.5">
          {tabsConfig.map((t) => {
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition cursor-pointer border ${
                  isActive
                    ? 'bg-[#2A1F18] text-[#F27D26] border-[#F27D26] shadow-sm'
                    : 'bg-[#151619] text-[#8E9299] hover:text-white border-[#2A2A2A] hover:border-[#3A3A3A]'
                }`}
              >
                {t.icon}
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Правый блок: режим импорта и полноэкранный режим */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-[#151619] p-0.5 rounded-lg border border-[#2A2A2A] text-[11px]">
            <button
              onClick={() => setImportMode('new_scene')}
              className={`px-2.5 py-1 rounded font-bold transition cursor-pointer ${
                importMode === 'new_scene'
                  ? 'bg-[#F27D26] text-black'
                  : 'text-[#8E9299] hover:text-white'
              }`}
              title="Создавать отдельную новую сцену при импорте"
            >
              Новая сцена
            </button>
            <button
              onClick={() => setImportMode('add_layer')}
              className={`px-2.5 py-1 rounded font-bold transition cursor-pointer ${
                importMode === 'add_layer'
                  ? 'bg-[#F27D26] text-black'
                  : 'text-[#8E9299] hover:text-white'
              }`}
              title="Добавить как дополнительный слой на текущую сцену"
            >
              В текущую сцену
            </button>
          </div>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 bg-[#151619] hover:bg-[#252830] text-[#8E9299] hover:text-white rounded-lg border border-[#2A2A2A]"
            title={isFullscreen ? 'Свернуть окно' : 'На весь экран'}
          >
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 bg-[#151619] hover:bg-[#252830] text-[#8E9299] hover:text-white rounded-lg border border-[#2A2A2A]"
              title="Закрыть студию"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* ПАНЕЛЬ УПРАВЛЕНИЯ АКТИВНЫМ ГЕНЕРАТОРОМ */}
      {activeTab !== 'bsp' && (
        <div className="bg-[#141518] px-3.5 py-2 border-b border-[#25262B] flex flex-wrap items-center justify-between gap-2 text-xs">
          {/* Специфичные кнопки управления для каждого генератора */}
          <div className="flex flex-wrap items-center gap-1.5">
            {/* 0. DUNGEON CONTROLS */}
            {activeTab === 'dungeon' && (
              <>
                <button
                  onClick={() => sendIframeMessage({ action: 'GENERATE' })}
                  className="px-2.5 py-1 rounded bg-[#252830] hover:bg-[#323640] text-white font-bold flex items-center gap-1 border border-[#3A3A3A]"
                  title="Новое процедурное подземелье (Enter)"
                >
                  <RefreshCw size={12} className="text-[#F27D26]" />
                  <span>Новое подземелье</span>
                </button>
                <button
                  onClick={() => sendIframeMessage({ action: 'SHOW_PALETTE' })}
                  className="px-2 py-1 rounded bg-[#1A1C20] hover:bg-[#252830] text-[#B0B4BC] border border-[#2A2A2A]"
                  title="Выбор цветовой палитры и стиля (S)"
                >
                  Палитра
                </button>
                <button
                  onClick={() => sendIframeMessage({ action: 'TOGGLE_PROPS' })}
                  className="px-2 py-1 rounded bg-[#1A1C20] hover:bg-[#252830] text-[#B0B4BC] border border-[#2A2A2A]"
                  title="Детали и убранство комнат (P)"
                >
                  Детали
                </button>
                <button
                  onClick={() => sendIframeMessage({ action: 'TOGGLE_NOTES' })}
                  className="px-2 py-1 rounded bg-[#1A1C20] hover:bg-[#252830] text-[#B0B4BC] border border-[#2A2A2A]"
                  title="Показать/скрыть текстовые описания (N)"
                >
                  Заметки
                </button>
                <button
                  onClick={() => sendIframeMessage({ action: 'TOGGLE_GRID' })}
                  className="px-2 py-1 rounded bg-[#1A1C20] hover:bg-[#252830] text-[#B0B4BC] border border-[#2A2A2A]"
                  title="Тактическая сетка (G)"
                >
                  Сетка
                </button>
              </>
            )}

            {/* 0. BATTLEMAP CONTROLS */}
            {activeTab === 'battlemap' && (
              <>
                <button
                  onClick={() => sendIframeMessage({ action: 'REROLL' })}
                  className="px-2.5 py-1 rounded bg-[#252830] hover:bg-[#323640] text-white font-bold flex items-center gap-1 border border-[#3A3A3A]"
                  title="Перебросить рельеф боевой карты"
                >
                  <RefreshCw size={12} className="text-[#F27D26]" />
                  <span>Новая карта</span>
                </button>
                <div className="flex items-center gap-1 bg-[#1A1C20] px-2 py-0.5 rounded border border-[#2A2A2A] text-[11px]">
                  <span className="text-[#8E9299]">Биом:</span>
                  <button onClick={() => sendIframeMessage({ action: 'SET_BIOME', biome: 'forest' })} className="px-1 hover:text-[#F27D26]">Лес</button>
                  <button onClick={() => sendIframeMessage({ action: 'SET_BIOME', biome: 'winter' })} className="px-1 hover:text-[#F27D26]">Зима</button>
                  <button onClick={() => sendIframeMessage({ action: 'SET_BIOME', biome: 'desert' })} className="px-1 hover:text-[#F27D26]">Пески</button>
                  <button onClick={() => sendIframeMessage({ action: 'SET_BIOME', biome: 'cave' })} className="px-1 hover:text-[#F27D26]">Грот</button>
                  <button onClick={() => sendIframeMessage({ action: 'SET_BIOME', biome: 'dungeon' })} className="px-1 hover:text-[#F27D26]">Замок</button>
                  <button onClick={() => sendIframeMessage({ action: 'SET_BIOME', biome: 'ship' })} className="px-1 hover:text-[#F27D26]">Корабли</button>
                </div>
                <div className="flex items-center gap-1 bg-[#1A1C20] px-2 py-0.5 rounded border border-[#2A2A2A] text-[11px]">
                  <span className="text-[#8E9299]">Свет:</span>
                  <button onClick={() => sendIframeMessage({ action: 'SET_LIGHT', light: 'day' })} className="px-1 hover:text-[#F27D26]">☀️</button>
                  <button onClick={() => sendIframeMessage({ action: 'SET_LIGHT', light: 'dusk' })} className="px-1 hover:text-[#F27D26]">🌅</button>
                  <button onClick={() => sendIframeMessage({ action: 'SET_LIGHT', light: 'night' })} className="px-1 hover:text-[#F27D26]">🌙</button>
                  <button onClick={() => sendIframeMessage({ action: 'SET_LIGHT', light: 'rain' })} className="px-1 hover:text-[#F27D26]">🌧️</button>
                  <button onClick={() => sendIframeMessage({ action: 'SET_LIGHT', light: 'snow' })} className="px-1 hover:text-[#F27D26]">❄️</button>
                </div>
              </>
            )}

            {/* 1. CITY CONTROLS */}
            {activeTab === 'city' && (
              <>
                <button
                  onClick={() => sendIframeMessage({ action: 'GENERATE' })}
                  className="px-2.5 py-1 rounded bg-[#252830] hover:bg-[#323640] text-white font-bold flex items-center gap-1 border border-[#3A3A3A]"
                  title="Случайный новый город (Enter)"
                >
                  <RefreshCw size={12} className="text-[#F27D26]" />
                  <span>Новый город</span>
                </button>
                <div className="flex items-center gap-1 bg-[#1A1C20] px-2 py-0.5 rounded border border-[#2A2A2A] text-[11px]">
                  <span className="text-[#8E9299]">Размер:</span>
                  <button onClick={() => sendIframeMessage({ action: 'SET_SIZE', size: 'small' })} className="px-1.5 py-0.5 hover:text-[#F27D26] font-bold">S</button>
                  <button onClick={() => sendIframeMessage({ action: 'SET_SIZE', size: 'medium' })} className="px-1.5 py-0.5 hover:text-[#F27D26] font-bold text-[#F27D26]">M</button>
                  <button onClick={() => sendIframeMessage({ action: 'SET_SIZE', size: 'large' })} className="px-1.5 py-0.5 hover:text-[#F27D26] font-bold">L</button>
                </div>
                <div className="flex items-center gap-1 bg-[#1A1C20] px-2 py-0.5 rounded border border-[#2A2A2A] text-[11px]">
                  <span className="text-[#8E9299]">Стиль:</span>
                  <button onClick={() => sendIframeMessage({ action: 'SET_PRESET', preset: 'default' })} className="px-1.5 py-0.5 hover:text-[#F27D26]">Дефолт</button>
                  <button onClick={() => sendIframeMessage({ action: 'SET_PRESET', preset: 'ink' })} className="px-1.5 py-0.5 hover:text-[#F27D26]">Тушь</button>
                  <button onClick={() => sendIframeMessage({ action: 'SET_PRESET', preset: 'bw' })} className="px-1.5 py-0.5 hover:text-[#F27D26]">Ч/Б</button>
                  <button onClick={() => sendIframeMessage({ action: 'SET_PRESET', preset: 'vivid' })} className="px-1.5 py-0.5 hover:text-[#F27D26]">Яркий</button>
                </div>
                <button
                  onClick={() => sendIframeMessage({ action: 'REROLL_NAME' })}
                  className="px-2 py-1 rounded bg-[#1A1C20] hover:bg-[#252830] text-[#B0B4BC] border border-[#2A2A2A]"
                  title="Сменить название города"
                >
                  Имя
                </button>
                <button
                  onClick={() => sendIframeMessage({ action: 'TOGGLE_DISTRICTS' })}
                  className="px-2 py-1 rounded bg-[#1A1C20] hover:bg-[#252830] text-[#B0B4BC] border border-[#2A2A2A]"
                  title="Вкл/Выкл цвета районов (L)"
                >
                  Районы
                </button>
              </>
            )}

            {/* 2. DWELLINGS CONTROLS */}
            {activeTab === 'dwell' && (
              <>
                <button
                  onClick={() => sendIframeMessage({ type: 'DWELLINGS_NEW_HOUSE' })}
                  className="px-2.5 py-1 rounded bg-[#252830] hover:bg-[#323640] text-white font-bold flex items-center gap-1 border border-[#3A3A3A]"
                  title="Сгенерировать новый особняк (Enter)"
                >
                  <RefreshCw size={12} className="text-[#F27D26]" />
                  <span>Новый дом</span>
                </button>

                {/* Навигация по этажам */}
                {dwellInfo && dwellInfo.floors && (
                  <div className="flex items-center gap-1 bg-[#1A1C20] px-2 py-0.5 rounded border border-[#2A2A2A]">
                    <span className="text-[#8E9299] text-[10px]">Этажи:</span>
                    {dwellInfo.floors.map((fl) => (
                      <button
                        key={fl.index}
                        onClick={() => sendIframeMessage({ type: 'DWELLINGS_SET_FLOOR', floor: fl.index })}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          dwellInfo.currentFloor === fl.index
                            ? 'bg-[#F27D26] text-black'
                            : 'text-[#8E9299] hover:text-white'
                        }`}
                        title={fl.name}
                      >
                        {fl.label}
                      </button>
                    ))}
                  </div>
                )}

                <button
                  onClick={() => sendIframeMessage({ type: 'DWELLINGS_TOGGLE_ROOF' })}
                  className="px-2 py-1 rounded bg-[#1A1C20] hover:bg-[#252830] text-[#B0B4BC] border border-[#2A2A2A]"
                  title="Переключить план / крышу (Space)"
                >
                  Крыша / План
                </button>
              </>
            )}

            {/* 3. TAVERNS CONTROLS */}
            {activeTab === 'taverns' && (
              <>
                <button
                  onClick={() => sendIframeMessage({ action: 'GENERATE' })}
                  className="px-2.5 py-1 rounded bg-[#252830] hover:bg-[#323640] text-white font-bold flex items-center gap-1 border border-[#3A3A3A]"
                  title="Новая планировка таверны (Enter)"
                >
                  <RefreshCw size={12} className="text-[#F27D26]" />
                  <span>Новая таверна</span>
                </button>
                <button
                  onClick={() => sendIframeMessage({ action: 'FLOOR_UP' })}
                  className="px-2 py-1 rounded bg-[#1A1C20] hover:bg-[#252830] text-[#B0B4BC] border border-[#2A2A2A]"
                  title="Этаж вверх (Up Arrow)"
                >
                  Этаж ▲
                </button>
                <button
                  onClick={() => sendIframeMessage({ action: 'FLOOR_DOWN' })}
                  className="px-2 py-1 rounded bg-[#1A1C20] hover:bg-[#252830] text-[#B0B4BC] border border-[#2A2A2A]"
                  title="Этаж вниз (Down Arrow)"
                >
                  Этаж ▼
                </button>
                <button
                  onClick={() => sendIframeMessage({ action: 'TOGGLE_PROPS' })}
                  className="px-2 py-1 rounded bg-[#1A1C20] hover:bg-[#252830] text-[#B0B4BC] border border-[#2A2A2A]"
                  title="Показать/скрыть столы и бочки (P)"
                >
                  Мебель
                </button>
                <button
                  onClick={() => sendIframeMessage({ action: 'RANDOM_STYLE' })}
                  className="px-2 py-1 rounded bg-[#1A1C20] hover:bg-[#252830] text-[#B0B4BC] border border-[#2A2A2A]"
                  title="Случайная палитра дерева и света (C)"
                >
                  Цвет
                </button>
              </>
            )}

            {/* 4. VILLAGE CONTROLS */}
            {activeTab === 'village' && (
              <>
                <button
                  onClick={() => sendIframeMessage({ action: 'GENERATE' })}
                  className="px-2.5 py-1 rounded bg-[#252830] hover:bg-[#323640] text-white font-bold flex items-center gap-1 border border-[#3A3A3A]"
                  title="Новая деревня (Enter)"
                >
                  <RefreshCw size={12} className="text-[#F27D26]" />
                  <span>Новая деревня</span>
                </button>
                <button
                  onClick={() => sendIframeMessage({ action: 'REROLL_VILLAGE' })}
                  className="px-2 py-1 rounded bg-[#1A1C20] hover:bg-[#252830] text-[#B0B4BC] border border-[#2A2A2A]"
                  title="Перебросить ландшафт (Shift+Enter)"
                >
                  Переброс
                </button>
                <div className="flex items-center gap-1 bg-[#1A1C20] px-2 py-0.5 rounded border border-[#2A2A2A] text-[11px]">
                  <span className="text-[#8E9299]">Биом:</span>
                  <button onClick={() => sendIframeMessage({ action: 'SET_PRESET', preset: 'default' })} className="px-1 hover:text-[#F27D26]">Лето</button>
                  <button onClick={() => sendIframeMessage({ action: 'SET_PRESET', preset: 'sand' })} className="px-1 hover:text-[#F27D26]">Песок</button>
                  <button onClick={() => sendIframeMessage({ action: 'SET_PRESET', preset: 'cold' })} className="px-1 hover:text-[#F27D26]">Зима</button>
                  <button onClick={() => sendIframeMessage({ action: 'SET_PRESET', preset: 'night' })} className="px-1 hover:text-[#F27D26]">Ночь</button>
                </div>
                <button
                  onClick={() => sendIframeMessage({ action: 'TOGGLE_FIELDS' })}
                  className="px-2 py-1 rounded bg-[#1A1C20] hover:bg-[#252830] text-[#B0B4BC] border border-[#2A2A2A]"
                  title="Вкл/Выкл поля"
                >
                  Поля
                </button>
                <button
                  onClick={() => sendIframeMessage({ action: 'TOGGLE_ORCHARDS' })}
                  className="px-2 py-1 rounded bg-[#1A1C20] hover:bg-[#252830] text-[#B0B4BC] border border-[#2A2A2A]"
                  title="Вкл/Выкл сады"
                >
                  Сады
                </button>
              </>
            )}

            {/* 5. CAVE CONTROLS */}
            {activeTab === 'cave' && (
              <>
                <button
                  onClick={() => sendIframeMessage({ action: 'GENERATE' })}
                  className="px-2.5 py-1 rounded bg-[#252830] hover:bg-[#323640] text-white font-bold flex items-center gap-1 border border-[#3A3A3A]"
                  title="Случайная пещера (Enter)"
                >
                  <RefreshCw size={12} className="text-[#F27D26]" />
                  <span>Новая пещера</span>
                </button>
                <button
                  onClick={() => sendIframeMessage({ action: 'TOGGLE_GLADE' })}
                  className="px-2 py-1 rounded bg-[#1A1C20] hover:bg-[#252830] text-[#B0B4BC] border border-[#2A2A2A]"
                  title="Переключить режим Пещера / Лесная поляна (F)"
                >
                  Пещера / Поляна
                </button>
                <button
                  onClick={() => sendIframeMessage({ action: 'TOGGLE_TUNNELS' })}
                  className="px-2 py-1 rounded bg-[#1A1C20] hover:bg-[#252830] text-[#B0B4BC] border border-[#2A2A2A]"
                  title="Узкие тоннели (N)"
                >
                  Тоннели
                </button>
                <button
                  onClick={() => sendIframeMessage({ action: 'TOGGLE_GRID' })}
                  className="px-2 py-1 rounded bg-[#1A1C20] hover:bg-[#252830] text-[#B0B4BC] border border-[#2A2A2A]"
                  title="Сетка (G)"
                >
                  Сетка
                </button>
                <div className="flex items-center gap-1 bg-[#1A1C20] px-2 py-0.5 rounded border border-[#2A2A2A] text-[11px]">
                  <span className="text-[#8E9299]">Цвет:</span>
                  <button onClick={() => sendIframeMessage({ action: 'SET_PRESET', preset: 'default' })} className="px-1 hover:text-[#F27D26]">Камень</button>
                  <button onClick={() => sendIframeMessage({ action: 'SET_PRESET', preset: 'dark' })} className="px-1 hover:text-[#F27D26]">Тьма</button>
                  <button onClick={() => sendIframeMessage({ action: 'SET_PRESET', preset: 'bw' })} className="px-1 hover:text-[#F27D26]">Ч/Б</button>
                </div>
                <button
                  onClick={() => sendIframeMessage({ action: 'OPEN_STYLE' })}
                  className="px-2 py-1 rounded bg-[#1A1C20] hover:bg-[#252830] text-[#B0B4BC] border border-[#2A2A2A]"
                  title="Открыть палитру и настройки стиля (S)"
                >
                  Стиль
                </button>
              </>
            )}
          </div>

          {/* ГЛАВНАЯ КНОПКА ЭКСПОРТА НА СТОЛ */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setIsExporting(true);
                if (activeTab === 'battlemap') sendIframeMessage({ type: 'BATTLEMAP_REQUEST_EXPORT' });
                else if (activeTab === 'dungeon') sendIframeMessage({ action: 'EXPORT_PNG', download: false });
                else if (activeTab === 'city') sendIframeMessage({ action: 'EXPORT_PNG', download: false });
                else if (activeTab === 'dwell') sendIframeMessage({ type: 'DWELLINGS_EXPORT_PNG', download: false });
                else if (activeTab === 'taverns') sendIframeMessage({ action: 'EXPORT_FLOOR', download: false });
                else if (activeTab === 'village') sendIframeMessage({ action: 'EXPORT_PNG', download: false });
                else if (activeTab === 'cave') sendIframeMessage({ action: 'EXPORT_PNG', download: false });
              }}
              disabled={isExporting}
              className="px-4 py-1.5 rounded-lg bg-[#F27D26] hover:bg-[#E06C15] text-black font-extrabold text-xs flex items-center gap-1.5 shadow-lg active:scale-95 transition cursor-pointer"
              title="Перенести карту из генератора прямо на игровой стол"
            >
              <Check size={14} />
              <span>{isExporting ? 'Импортируем...' : 'ИМПОРТ НА СТОЛ'}</span>
            </button>

            <button
              onClick={() => {
                if (activeTab === 'battlemap') sendIframeMessage({ type: 'BATTLEMAP_REQUEST_EXPORT' });
                else if (activeTab === 'dungeon') sendIframeMessage({ action: 'EXPORT_PNG', download: true });
                else if (activeTab === 'city') sendIframeMessage({ action: 'EXPORT_PNG', download: true });
                else if (activeTab === 'dwell') sendIframeMessage({ type: 'DWELLINGS_EXPORT_PNG', download: true });
                else if (activeTab === 'taverns') sendIframeMessage({ action: 'EXPORT_FLOOR', download: true });
                else if (activeTab === 'village') sendIframeMessage({ action: 'EXPORT_PNG', download: true });
                else if (activeTab === 'cave') sendIframeMessage({ action: 'EXPORT_PNG', download: true });
              }}
              className="p-1.5 bg-[#252830] hover:bg-[#323640] text-[#E0E0E0] rounded-lg border border-[#3A3A3A]"
              title="Скачать файл PNG на диск"
            >
              <Download size={13} />
            </button>
          </div>
        </div>
      )}

      {/* ОСНОВНОЙ ВЬЮПОРТ ГЕНЕРАТОРА */}
      <div className="flex-1 bg-black relative overflow-hidden flex flex-col">
        {activeTab === 'bsp' ? (
          <div className="p-4 h-full overflow-y-auto">
            <DungeonGeneratorPanel
              onDeployScene={(sc) => {
                onDeployNewScene(sc);
                showToast(`Сцена «${sc.name}» успешно создана!`);
              }}
            />
          </div>
        ) : (
          <iframe
            ref={iframeRef}
            key={activeTab}
            src={currentTabInfo.src}
            title={currentTabInfo.label}
            className="w-full h-full border-0 bg-black"
            allow="fullscreen"
          />
        )}
      </div>

      {/* ПОДСКАЗКА ВНИЗУ */}
      <div className="bg-[#151619] px-3.5 py-1.5 border-t border-[#2A2A2A] text-[10px] text-[#8E9299] flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Info size={12} className="text-[#F27D26]" />
          <span>{currentTabInfo.desc}</span>
        </div>
        <span className="hidden sm:inline text-[#6E727A]">
          Управление: кликайте на карту внутри для зума и перемещения, нажмите «ИМПОРТ НА СТОЛ» для отправки игрокам.
        </span>
      </div>
    </div>
  );
};
