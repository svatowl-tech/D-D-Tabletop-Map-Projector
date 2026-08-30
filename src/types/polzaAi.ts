/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Типы данных для ИИ-Движка Polza AI (JSON AI Engine, Full Campaign Engine, Art Engine)
 */

import { MonsterAbilityScores, MonsterAction, CreatureSize, CreatureType } from './generator';

// --- A. ТЕКСТОВЫЕ МОДЕЛИ И ЗАПРОСЫ ---
export type TextModelId =
  | 'deepseek/deepseek-r1-distill-llama-70b'
  | 'google/gemma-3-27b-it'
  | 'openai/gpt-oss-20b'
  | 'deepseek/deepseek-chat'
  | 'openai/gpt-4o';

export interface TextModelInfo {
  id: TextModelId;
  name: string;
  provider: string;
  description: string;
  supportsReasoning: boolean;
  isDefault?: boolean;
}

export type PolzaEntityType =
  | 'monster'
  | 'npc'
  | 'location'
  | 'item'
  | 'spell'
  | 'quest'
  | 'rule'
  | 'lore';

export interface GenerateJsonOptions {
  entityType: PolzaEntityType;
  userPrompt: string;
  cr?: string;
  monsterSize?: CreatureSize;
  monsterType?: CreatureType;
  partyLevel?: string;
  rarity?: string;
  spellLevel?: number;
  setting?: string;
}

export interface GenerateJsonRequest {
  model?: TextModelId;
  options: GenerateJsonOptions;
  temperature?: number;
  autoSaveToDatabase?: boolean;
}

export interface GenerateJsonResponse<T = any> {
  success: boolean;
  entityType: PolzaEntityType;
  jsonData: T;
  reasoning?: string;
  imagePrompt?: string;
  savedFilePath?: string;
  error?: string;
}

// --- B. СТРУКТУРЫ СУЩНОСТЕЙ D&D 5E ---

// 1. Monster Statblock
export interface PolzaMonsterData {
  id: string;
  name: string;
  englishName: string;
  cr: string;
  crNumber: number;
  size: CreatureSize;
  type: CreatureType;
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
  ambushTactics?: string;
  avatarPrompt?: string;
}

// 2. Character / NPC
export interface PolzaNpcData {
  id: string;
  name: string;
  englishName: string;
  race: string;
  className: string;
  gender: string;
  age: string;
  alignment: string;
  appearance: string;
  personalityTraits: string[];
  quirks: string[];
  secrets: string;
  nicknames: string[];
  monocleEquipment: string[];
  plotHooks: string[];
  ideal: string;
  bond: string;
  flaw: string;
  roleplayTips: {
    voice: string;
    manner: string;
  };
}

// 3. Location & Atmospheric Maps
export interface PolzaLocationData {
  id: string;
  name: string;
  englishName: string;
  atmosphere: string;
  sensoryDetails: {
    sight: string;
    sound: string;
    smell: string;
  };
  secretRooms: Array<{
    name: string;
    dcToFind: number;
    contents: string;
  }>;
  hazardsAndTraps: Array<{
    name: string;
    trigger: string;
    effect: string;
    dcToDisarm: number;
  }>;
  keyInhabitants: string[];
  pointsOfInterest: Array<{
    name: string;
    description: string;
  }>;
  plotHooks: string[];
}

// 4. Magic Items & Artifacts
export interface PolzaMagicItemData {
  id: string;
  name: string;
  englishName: string;
  category: 'Wondrous Item' | 'Weapon' | 'Armor' | 'Ring' | 'Wand' | 'Potion' | 'Scroll' | 'Artifact';
  rarity: 'Common' | 'Uncommon' | 'Rare' | 'Very Rare' | 'Legendary' | 'Artifact';
  attunementRequired: boolean;
  attunementDetails?: string;
  activeAbilities: Array<{
    name: string;
    cost: string;
    effect: string;
  }>;
  passiveBonuses: string[];
  damageFormulas?: string;
  charges?: {
    maxCharges: number;
    rechargeFormula: string; // e.g. "1d6+1 на рассвете"
  };
  curses?: string;
  description: string;
  lore: string;
  valueGp: number;
}

// 5. Spells
export interface PolzaSpellData {
  id: string;
  name: string;
  englishName: string;
  level: number; // 0 - 9
  school: string;
  components: {
    verbal: boolean;
    somatic: boolean;
    material: boolean;
    materialDescription?: string;
  };
  range: string;
  castingTime: string;
  duration: string;
  concentration: boolean;
  description: string;
  higherSlotsScaling: string;
  damageOrEffect: string;
}

// 6. Multi-step Quests
export interface QuestObjective {
  id: string;
  description: string;
  status: 'Active' | 'Completed' | 'Optional' | 'Failed';
  optional?: boolean;
}

export interface PolzaQuestData {
  id: string;
  title: string;
  englishTitle: string;
  giverNpc: string;
  synopsis: string;
  objectives: QuestObjective[];
  rewards: {
    goldGp: number;
    exp: number;
    items: string[];
    factionReputation: string;
  };
  plotTwists: string[];
  consequences: {
    success: string;
    failure: string;
  };
}

// 7. Homebrew Rules & Mechanics
export interface PolzaRuleData {
  id: string;
  title: string;
  triggerCondition: string;
  checkFormulas: string;
  multiStageEffects: Array<{
    stage: number;
    name: string;
    effect: string;
  }>;
  recoveryMethods: string;
  dmTips: string;
  description: string;
}

// 8. Encyclopedia & World Lore
export interface PolzaLoreData {
  id: string;
  title: string;
  category: string;
  markdownContent: string;
  historicalTimeline: Array<{
    yearOrEra: string;
    event: string;
  }>;
  secretLore: string;
  factionConnections: Array<{
    factionName: string;
    relation: string;
  }>;
}

// --- C. СЮЖЕТНАЯ КАМПАНИЯ (FULL CAMPAIGN ENGINE) ---
export interface CampaignGeneratorOptions {
  title: string;
  system: string; // e.g. "D&D 5e"
  setting: string; // e.g. "Готический хоррор"
  tone: string; // e.g. "Мрачная атмосфера"
  partyLevel: string; // e.g. "1-3"
  villainHook: string; // e.g. "Древний граф-вампир"
  customWishes?: string;
}

export interface CampaignNpcNode {
  id: string;
  name: string;
  role: string;
  attitude: string;
  connections: Array<{
    targetNpcId: string;
    targetNpcName: string;
    relationType: 'ally' | 'enemy' | 'debtor' | 'traitor' | 'family' | 'secret';
    description: string;
  }>;
}

export interface CampaignFaction {
  id: string;
  name: string;
  influenceSphere: string;
  leader: string;
  goals: string;
  attitudeToParty: string;
}

export interface CampaignHero {
  name: string;
  raceClass: string;
  level: number;
  ac: number;
  hp: number;
  stats: string; // e.g. "STR 14, DEX 12..."
  keyEquipment: string;
}

export interface GeneratedCampaign {
  id: string;
  name: string;
  system: string;
  setting: string;
  tone: string;
  partyLevel: string;
  calendarAndWeather: {
    exactDate: string;
    season: string;
    temperature: string;
    moonPhase: string;
    weatherDescription: string;
  };
  quests: {
    mainQuest: PolzaQuestData;
    sideQuests: PolzaQuestData[];
  };
  npcGraph: CampaignNpcNode[];
  factions: CampaignFaction[];
  sessionChronicles: {
    starterScenario: string;
    lazyDmNotes: {
      charactersToHighlight: string[];
      strongStart: string;
      potentialScenes: string[];
      secretsAndClues: string[];
      importantLocations: string[];
    };
  };
  starterParty: CampaignHero[];
  groupTreasuryAndSafety: {
    startingPurse: {
      gp: number;
      sp: number;
      cp: number;
    };
    homebrewRules: string[];
    linesAndVeils: {
      lines: string[]; // Строгие табу
      veils: string[]; // Завесы (за кадром)
    };
  };
  createdAt: string;
}

// --- D. ИИ-АРТ И ИЛЛЮСТРАЦИИ (ART & IMAGE ENGINE) ---
export type ArtStylePreset =
  | 'dnd_cinematic'
  | 'grimdark'
  | 'watercolor_rpg'
  | 'concept_art'
  | 'oil_painting'
  | 'isometric_token'
  | 'anime_fantasy'
  | 'retro_pixel';

export type ArtModelId =
  | 'tongyi-mai/z-image'
  | 'google/gemini-2.5-flash-image'
  | 'bytedance/seedream-4'
  | 'gpt-image-1'
  | 'dall-e-3';

export interface ArtModelInfo {
  id: ArtModelId;
  name: string;
  description: string;
  supportsTransparentToken?: boolean;
  isDefault?: boolean;
}

export interface CompilePromptRequest {
  entity: {
    type: string;
    name: string;
    race?: string;
    description?: string;
    details?: string;
  };
  stylePreset: ArtStylePreset;
}

export interface CompilePromptResponse {
  success: boolean;
  prompt: string;
  stylePreset: ArtStylePreset;
  optimalSize: string;
}

export interface GenerateImageRequest {
  model?: ArtModelId;
  prompt: string;
  size?: string; // "1024x1024", "1024x1536", "1536x1024"
  saveToDisk?: boolean;
  transparentBackground?: boolean;
}

export interface GenerateImageResponse {
  success: boolean;
  taskId?: string;
  data: Array<{
    url: string;
    localAssetUrl?: string;
    b64_json?: string;
  }>;
  error?: string;
}
