/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Типы данных для процедурных D&D 5e генераторов и карточек референса.
 */

// 1. БЕСТИАРИЙ (Monster Engine)
export type CreatureType =
  | 'Гуманоид'
  | 'Нежить'
  | 'Чудовище'
  | 'Дракон'
  | 'Аберрация'
  | 'Исчадие'
  | 'Фея'
  | 'Элементаль'
  | 'Растение'
  | 'Конструкт'
  | 'Великан'
  | 'Зверь';

export type MonsterArchetype =
  | 'Брут'        // +HP, +STR, дробящее/силовой урон
  | 'Застрельщик' // +DEX, дистанция, мобильность, уклонение
  | 'Контролер'   // +INT/WIS, заклинания по площади, дебаффы, контроль разума
  | 'Танк';       // +AC, щиты, спасброски, сопротивления

export type CreatureSize = 'Tiny' | 'Small' | 'Medium' | 'Large' | 'Huge' | 'Gargantuan';

export interface MonsterAbilityScores {
  str: number;
  dex: number;
  con: number;
  int: number;
  wis: number;
  cha: number;
}

export interface MonsterAction {
  name: string;
  desc: string;
  isLegendary?: boolean;
  isReaction?: boolean;
  cost?: number; // очков легендарных действий
}

export interface GeneratedMonster {
  id: string;
  name: string;
  cr: string; // e.g. "0", "1/8", "1/4", "1/2", "1" ... "30"
  crNumber: number;
  size: CreatureSize;
  type: CreatureType;
  archetype: MonsterArchetype;
  alignment: string;
  ac: number;
  acType: string;
  hp: number;
  hitDice: string;
  speed: string;
  proficiencyBonus: number;
  abilities: MonsterAbilityScores;
  savingThrows?: string;
  skills?: string;
  damageResistances?: string;
  damageImmunities?: string;
  conditionImmunities?: string;
  senses: string;
  languages: string;
  passivePerception: number;
  traits: MonsterAction[];
  actions: MonsterAction[];
  reactions?: MonsterAction[];
  legendaryActions?: {
    pointsPerRound: number;
    actions: MonsterAction[];
  };
  flavor: string;
  tacticsAdvice: string;
  avatarPlaceholderColor: string;
}

// 2. СОЦИАЛЬНЫЙ NPC (Social NPC Engine)
export type DndAlignment =
  | 'Законопослушный Добрый (LG)'
  | 'Нейтральный Добрый (NG)'
  | 'Хаотичный Добрый (CG)'
  | 'Законопослушный Нейтральный (LN)'
  | 'Истинно Нейтральный (N)'
  | 'Хаотичный Нейтральный (CN)'
  | 'Законопослушный Злой (LE)'
  | 'Нейтральный Злой (NE)'
  | 'Хаотичный Злой (CE)';

export type SocialAttitude = 'Враждебный' | 'Настороженный' | 'Нейтральный' | 'Дружелюбный';

export interface GeneratedNPC {
  id: string;
  name: string;
  race: string;
  gender: string;
  age: string;
  socialClass: string;
  occupation: string;
  appearance: string[];
  quirks: string[]; // дефекты речи, привычки
  alignment: DndAlignment;
  ideal: string;
  bond: string;
  flaw: string;
  attitude: SocialAttitude;
  secret: {
    text: string;
    dc: number;
    checkType: 'Убеждение' | 'Запугивание' | 'Обман' | 'Проницательность';
  };
  rumor: {
    text: string;
    isTrue: boolean;
    questHook: string;
  };
  roleplayTips: {
    voice: string;
    manner: string;
  };
  pocketItems: string[];
}

// 3. ЛУТ И СОКРОВИЩА (Loot & Treasure Engine)
export type CampaignTier = 'Tier 1 (Ур. 1-4)' | 'Tier 2 (Ур. 5-10)' | 'Tier 3 (Ур. 11-16)' | 'Tier 4 (Ур. 17-20)';

export interface CoinPurse {
  cp: number;
  sp: number;
  gp: number;
  pp: number;
  totalGpEquivalent: number;
}

export interface GemItem {
  name: string;
  valueGp: number;
  quantity: number;
  description: string;
}

export interface ArtObject {
  name: string;
  valueGp: number;
  description: string;
}

export interface MagicLootItem {
  name: string;
  rarity: 'Обычный' | 'Необычный' | 'Редкий' | 'Очень редкий' | 'Легендарный' | 'Артефакт';
  type: string;
  desc: string;
  tableSource?: string; // e.g. "Таблица B", "Таблица F"
}

export interface GeneratedLoot {
  id: string;
  tier: CampaignTier;
  mode: 'individual' | 'hoard';
  title: string;
  coins: CoinPurse;
  trinkets: string[];
  gems: GemItem[];
  artObjects: ArtObject[];
  magicItems: MagicLootItem[];
  totalValueGp: number;
  containerDescription: string;
  trapOrHazard?: string;
}

// 4. СТРАНСТВУЮЩИЕ ТОРГОВЦЫ (Wandering Merchants)
export type MerchantType =
  | 'Караванщик-кочевник'
  | 'Скупщик краденого / Контрабандист'
  | 'Таинственный бродячий алхимик'
  | 'Гоблин-старьевщик';

export interface MerchantInventoryItem {
  id: string;
  name: string;
  price: string;
  priceGp: number;
  quantity: number;
  rarity: string;
  desc: string;
  isIllegal?: boolean;
  isUnidentifiedArtifact?: boolean;
}

export interface GeneratedMerchant {
  id: string;
  name: string;
  type: MerchantType;
  title: string;
  description: string;
  guardsAndBeasts: string;
  goldReserveGp: number;
  encounterEvent: {
    title: string;
    description: string;
    resolutionSkill: string;
    discountReward: string;
  };
  inventory: MerchantInventoryItem[];
  haggleDc: number;
  quirk: string;
}

// 5. ГОРОДСКИЕ ЛАВКИ И МАГАЗИНЫ (City Stores & Markets)
export type SettlementSize = 'Деревня (Village)' | 'Городок (Town)' | 'Торговый мегаполис (Metropolis)';

export type StoreCategory =
  | 'Кузница и Оружейная'
  | 'Алхимическая лавка и Травник'
  | 'Магическая лавка / Башня чародея'
  | 'Храм и Часовня'
  | 'Таверна и Лавка провизии';

export interface StoreService {
  name: string;
  cost: string;
  desc: string;
}

export interface GeneratedStore {
  id: string;
  name: string;
  category: StoreCategory;
  settlementSize: SettlementSize;
  ownerName: string;
  ownerPersonality: string;
  atmosphere: string;
  priceModifier: number; // 0.8 to 1.6
  priceModifierReason: string;
  goods: MerchantInventoryItem[];
  services: StoreService[];
  rumorOrNotice: string;
}

// 6. СИСТЕМА ЭКИПИРОВКИ И АФФИКСОВ (Equipment & Affix System)
export type EquipmentMaterial =
  | 'Обычная сталь / Кожа'
  | 'Адамантин'
  | 'Мифрил'
  | 'Хладное железо'
  | 'Древесина темного железа'
  | 'Обсидиан глубин'
  | 'Драконья кость'
  | 'Звездный металл'
  | 'Благородное серебрение';

export type EquipmentCategory = 'Оружие ближнего боя' | 'Оружие дальнего боя' | 'Доспех' | 'Щит' | 'Аксессуар';

export interface GeneratedEquipment {
  id: string;
  fullName: string;
  prefix: string;
  baseItem: string;
  suffix: string;
  category: EquipmentCategory;
  material: EquipmentMaterial;
  rarity: 'Обычный' | 'Необычный' | 'Редкий' | 'Очень редкий' | 'Легендарный';
  damageOrAc: string;
  bonus: string;
  properties: string[];
  lore: string;
  attunementRequired: boolean;
  valueGp: number;
}

// 7. МАГИЯ, СВИТКИ И ДИКАЯ МАГИЯ (Magic & Spell Engine)
export type MagicSchool =
  | 'Воплощение (Evocation)'
  | 'Ограждение (Abjuration)'
  | 'Иллюзия (Illusion)'
  | 'Некромантия (Necromancy)'
  | 'Очарование (Enchantment)'
  | 'Преобразование (Transmutation)'
  | 'Прорицание (Divination)'
  | 'Вызов (Conjuration)';

export type AreaOfEffectShape = 'Луч (Line)' | 'Конус (Cone)' | 'Сфера (Sphere)' | 'Цилиндр (Cylinder)' | 'Одиночная цель (Single)';

export interface GeneratedCustomSpell {
  id: string;
  name: string;
  creatorMage: string;
  school: MagicSchool;
  level: number;
  levelText: string;
  castingTime: string;
  range: string;
  aoeShape: AreaOfEffectShape;
  aoeSizeFeet: number;
  components: string;
  duration: string;
  saveType: 'DEX' | 'CON' | 'WIS' | 'STR' | 'INT' | 'CHA' | 'None';
  damageFormula: string;
  damageType: string;
  appliedCondition?: string;
  description: string;
  higherLevelsDesc: string;
}

export interface GeneratedSpellbook {
  id: string;
  title: string;
  bindingMaterial: string;
  coverAppearance: string;
  inkType: string;
  specialProperty: string;
  spells: Array<{
    name: string;
    level: number;
    school: string;
    desc: string;
  }>;
  curseOrWard?: string;
  estimatedValueGp: number;
}

export interface WildMagicSurgeEffect {
  d100Roll: number;
  title: string;
  desc: string;
  duration: string;
  category: 'Комический' | 'Боевой всплеск' | 'Стихийная аномалия' | 'Трансформация' | 'Хаотичный дар';
}

// УНИВЕРСАЛЬНАЯ КАРТОЧКА ДЛЯ ПРОЕКТОРА / ХРАНИЛИЩА (Handout Card)
export interface HandoutCardPayload {
  id: string;
  category: 'monster' | 'npc' | 'loot' | 'merchant' | 'store' | 'equipment' | 'magic' | 'wild_magic';
  title: string;
  subtitle?: string;
  badge?: string;
  rarityColor?: string;
  avatarUrl?: string;
  stats?: Array<{ label: string; value: string | number }>;
  sections: Array<{
    title: string;
    content?: string;
    type?: 'text' | 'table' | 'quote' | 'highlight' | 'item_list';
    items?: Array<{ name: string; cost?: string; desc?: string; badge?: string }>;
  }>;
  flavorText?: string;
  footerNote?: string;
  gmNotesHidden?: string;
}
