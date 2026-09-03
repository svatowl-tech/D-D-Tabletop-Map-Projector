/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Пресеты и конфигурации стихийных эффектов на карте:
 * - Пожар / Огонь / Инферно / Тлеющие угли (Fire Hazards)
 * - Затопление / Вода / Кислота / Магма / Слизь (Water & Liquid Hazards)
 * - Задымление / Отравляющий газ / Туман / Миазма (Gas & Smoke Hazards)
 */

import { ElementalHazardType } from '../types';

export interface ElementalPreset {
  id: string;
  element: ElementalHazardType;
  name: string;
  description: string;
  color: string;
  secondaryColor: string;
  defaultRadius: number;
  defaultOpacity: number;
  defaultSpeed: number; // 0.5 - 2.5
  defaultDensity: number; // 0.5 - 2.0
  tacticalNote: string; // D&D 5e / тактический эффект
  icon: string;
}

export const FIRE_PRESETS: ElementalPreset[] = [
  {
    id: 'fire_raging',
    element: 'fire',
    name: 'Пожар (Огонь)',
    description: 'Яростное пламя с искрами, дымом и жаром',
    color: '#FF4500', // OrangeRed
    secondaryColor: '#FFD700', // Gold core
    defaultRadius: 60,
    defaultOpacity: 0.85,
    defaultSpeed: 1.2,
    defaultDensity: 1.0,
    tacticalNote: '2d6 урона огнем при входе или окончании хода',
    icon: '🔥'
  },
  {
    id: 'fire_hellfire',
    element: 'fire',
    name: 'Адское пламя (Инферно)',
    description: 'Багрово-черное инфернальное пламя Бездны',
    color: '#D60036',
    secondaryColor: '#4A0E4E',
    defaultRadius: 75,
    defaultOpacity: 0.9,
    defaultSpeed: 1.5,
    defaultDensity: 1.2,
    tacticalNote: '4d6 адского пламени (игнорирует сопротивление)',
    icon: '👿'
  },
  {
    id: 'fire_necrotic',
    element: 'fire',
    name: 'Некротическое пламя',
    description: 'Мистический лазурно-синий огонь пожирания душ',
    color: '#00D4FF',
    secondaryColor: '#1A365D',
    defaultRadius: 50,
    defaultOpacity: 0.8,
    defaultSpeed: 1.0,
    defaultDensity: 0.9,
    tacticalNote: '2d6 некротического урона + помеха на спасброски',
    icon: '💀'
  },
  {
    id: 'fire_holy',
    element: 'fire',
    name: 'Священный огонь (Свет)',
    description: 'Ослепительно-золотое сияние божественного гнева',
    color: '#FFE600',
    secondaryColor: '#FFFFFF',
    defaultRadius: 60,
    defaultOpacity: 0.85,
    defaultSpeed: 1.1,
    defaultDensity: 1.0,
    tacticalNote: '3d8 урона излучением нежити и исчадиям',
    icon: '✨'
  },
  {
    id: 'fire_embers',
    element: 'fire',
    name: 'Тлеющие угли и зола',
    description: 'Обугленная горящая земля с тлеющими искрами',
    color: '#FF3B00',
    secondaryColor: '#2B2B2B',
    defaultRadius: 45,
    defaultOpacity: 0.75,
    defaultSpeed: 0.6,
    defaultDensity: 0.7,
    tacticalNote: '1d4 урона огнем + труднопроходимая местность',
    icon: '🪵'
  }
];

export const WATER_PRESETS: ElementalPreset[] = [
  {
    id: 'water_clean',
    element: 'water',
    name: 'Чистая вода (Затопление)',
    description: 'Глубокая лазурная вода с водной рябью и бликами',
    color: '#0088FF',
    secondaryColor: '#66D9FF',
    defaultRadius: 70,
    defaultOpacity: 0.7,
    defaultSpeed: 1.0,
    defaultDensity: 1.0,
    tacticalNote: 'Труднопроходимая местность (плавание 2 фт за 1 фт)',
    icon: '🌊'
  },
  {
    id: 'water_acid',
    element: 'water',
    name: 'Едкая кислота (Слизь)',
    description: 'Бурлящая едко-зеленая кислота с пузырями и едким паром',
    color: '#39FF14',
    secondaryColor: '#A8FF3E',
    defaultRadius: 55,
    defaultOpacity: 0.8,
    defaultSpeed: 1.3,
    defaultDensity: 1.1,
    tacticalNote: '3d6 урона кислотой + разъедание немагических доспехов',
    icon: '🧪'
  },
  {
    id: 'water_magma',
    element: 'water',
    name: 'Раскаленная магма / Лава',
    description: 'Огненная вязкая лава с плавающей базальтовой коркой',
    color: '#FF2A00',
    secondaryColor: '#FFAE00',
    defaultRadius: 65,
    defaultOpacity: 0.95,
    defaultSpeed: 0.7,
    defaultDensity: 1.3,
    tacticalNote: '10d10 огнем при погружении / 2d10 рядом',
    icon: '🌋'
  },
  {
    id: 'water_swamp',
    element: 'water',
    name: 'Болотная жижа (Тина)',
    description: 'Мутно-зеленая вязкая трясина с осадком и ряской',
    color: '#4B6334',
    secondaryColor: '#7A6237',
    defaultRadius: 60,
    defaultOpacity: 0.75,
    defaultSpeed: 0.5,
    defaultDensity: 0.9,
    tacticalNote: 'Труднопроходимая местность + проверка Атлетики Сл 12',
    icon: '🌿'
  },
  {
    id: 'water_blood',
    element: 'water',
    name: 'Кровавая лужа',
    description: 'Густая темно-алая кровь древнего ритуала',
    color: '#8A0303',
    secondaryColor: '#FF2A2A',
    defaultRadius: 50,
    defaultOpacity: 0.85,
    defaultSpeed: 0.4,
    defaultDensity: 1.0,
    tacticalNote: 'Оскверненная земля / следы скольжения',
    icon: '🩸'
  },
  {
    id: 'water_arcane',
    element: 'water',
    name: 'Мистический эфир',
    description: 'Мерцающая жидкая мана со звездными переливами',
    color: '#9B00FF',
    secondaryColor: '#00F0FF',
    defaultRadius: 55,
    defaultOpacity: 0.75,
    defaultSpeed: 1.1,
    defaultDensity: 1.0,
    tacticalNote: 'Всплеск Дикой Магии при сотворении заклинаний',
    icon: '🔮'
  },
  {
    id: 'water_sewage',
    element: 'water',
    name: 'Сточные нечистоты',
    description: 'Грязная зловонная жижа катакомб и канализации',
    color: '#5C4A28',
    secondaryColor: '#8C773E',
    defaultRadius: 60,
    defaultOpacity: 0.8,
    defaultSpeed: 0.8,
    defaultDensity: 0.9,
    tacticalNote: 'Спасбросок Телосложения Сл 11 от отравления',
    icon: '☣️'
  }
];

export const GAS_PRESETS: ElementalPreset[] = [
  {
    id: 'gas_smoke',
    element: 'gas',
    name: 'Густой дым пожара',
    description: 'Клубящийся черный удушливый дым с хлопьями копоти',
    color: '#333338',
    secondaryColor: '#6B6B75',
    defaultRadius: 80,
    defaultOpacity: 0.8,
    defaultSpeed: 0.8,
    defaultDensity: 1.2,
    tacticalNote: 'Сильное затуманивание (Heavy Obscurement) / удушье',
    icon: '💨'
  },
  {
    id: 'gas_poison',
    element: 'gas',
    name: 'Ядовитое облако (Cloudkill)',
    description: 'Едкий тяжелый желто-зеленый газ, стелющийся по полу',
    color: '#52E01F',
    secondaryColor: '#C4F000',
    defaultRadius: 75,
    defaultOpacity: 0.82,
    defaultSpeed: 0.9,
    defaultDensity: 1.1,
    tacticalNote: '5d8 ядом (Спасбросок Телосложения Сл 15 наполовину)',
    icon: '☠️'
  },
  {
    id: 'gas_fog',
    element: 'gas',
    name: 'Магический туман / Дымка',
    description: 'Плотный серебристо-белый туман, скрывающий взор',
    color: '#D6E4F0',
    secondaryColor: '#8EA7C2',
    defaultRadius: 90,
    defaultOpacity: 0.75,
    defaultSpeed: 0.6,
    defaultDensity: 1.0,
    tacticalNote: 'Заклинание «Туманное облако» (Fog Cloud) / ослепление',
    icon: '🌫️'
  },
  {
    id: 'gas_void',
    element: 'gas',
    name: 'Миазма Бездны / Тьма',
    description: 'Темно-фиолетовый потусторонний дым с щупальцами теней',
    color: '#1C062E',
    secondaryColor: '#581C87',
    defaultRadius: 75,
    defaultOpacity: 0.88,
    defaultSpeed: 0.7,
    defaultDensity: 1.2,
    tacticalNote: 'Магическая тьма + 2d6 психического урона',
    icon: '👁️'
  },
  {
    id: 'gas_incense',
    element: 'gas',
    name: 'Священный фимиам',
    description: 'Ароматная золотистая дымка благословения храмов',
    color: '#FFE57F',
    secondaryColor: '#FFF8E1',
    defaultRadius: 65,
    defaultOpacity: 0.6,
    defaultSpeed: 0.5,
    defaultDensity: 0.7,
    tacticalNote: '+1d4 к спасброскам союзников (аналог «Благословения»)',
    icon: '🕯️'
  },
  {
    id: 'gas_blizzard',
    element: 'gas',
    name: 'Ледяной морозный пар',
    description: 'Леденящий дыхание клубящийся пар с ледяными кристаллами',
    color: '#80E5FF',
    secondaryColor: '#E0F7FF',
    defaultRadius: 80,
    defaultOpacity: 0.78,
    defaultSpeed: 1.1,
    defaultDensity: 1.0,
    tacticalNote: '1d6 урона холодом + обледенение поверхностей',
    icon: '❄️'
  }
];

export const ALL_ELEMENTAL_PRESETS: ElementalPreset[] = [
  ...FIRE_PRESETS,
  ...WATER_PRESETS,
  ...GAS_PRESETS
];

export function getPresetsForElement(element: ElementalHazardType): ElementalPreset[] {
  switch (element) {
    case 'fire':
      return FIRE_PRESETS;
    case 'water':
      return WATER_PRESETS;
    case 'gas':
      return GAS_PRESETS;
  }
}

export function findPresetById(id: string): ElementalPreset | undefined {
  return ALL_ELEMENTAL_PRESETS.find((p) => p.id === id);
}
