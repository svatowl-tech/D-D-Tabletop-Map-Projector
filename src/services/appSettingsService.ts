/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * appSettingsService.ts — Единый централизованный сервис конфигураций и настроек VTT-ZERO.
 * 
 * Охватывает все разделы:
 * 1. Польза AI (модель, температура, токены, таймаут, API ключ, reasoning)
 * 2. Второе окно / Проектор (разрешение, частота, туман, сетка, линейка, скрытие HP/имен монстров)
 * 3. Разрешения и Безопасность (буфер обмена, звуковой автоплей, скрытые броски, beforeunload, лазер)
 * 4. Расширения и Правила Homebrew (включение модулей, питье зелий, криты, фланги)
 * 5. Рабочая папка и Хранилище (папка AetherMap_Data, IndexedDB, экспорт/импорт бэкапов)
 * 6. Настройка генераторов (BSP подземелья, лут, торговцы, язык, сложность)
 * 7. Системные промпты (пресеты тональности, промпты монстров, кампаний, лута и описаний)
 */

import { FogTextureStyle, BlackoutTheme } from '../types';

export interface AppSettings {
  // 1. Польза AI
  polzaAi: {
    defaultModel: string;
    temperature: number;
    maxTokens: number;
    enableReasoning: boolean;
    autoSaveEntities: boolean;
    autoSaveCampaigns: boolean;
    requestTimeoutSec: number;
    apiBaseUrl: string;
    customApiKey: string;
  };

  // 2. Второе окно / Проектор (Player View)
  projector: {
    resolutionPreset: '1080p' | '4k' | '1440p' | '720p' | 'custom';
    customWidth: number;
    customHeight: number;
    targetFps: number;
    autoFullscreenOnOpen: boolean;
    defaultFogStyle: FogTextureStyle;
    masterFogOpacity: number;
    showGridToPlayers: boolean;
    showRulerToPlayers: boolean;
    showPingsToPlayers: boolean;
    showLaserToPlayers: boolean;
    showCombatHudToPlayers: boolean;
    playerCombatHpDisplay: 'exact' | 'bars_only' | 'status_text' | 'hidden';
    showMonsterRealNames: boolean;
    defaultBlackoutTheme: BlackoutTheme;
    cameraFollowDm: boolean;
  };

  // 3. Разрешения и Безопасность
  permissions: {
    allowClipboardPasteMap: boolean;
    allowWebAudioAutoplay: boolean;
    allowSecretDmRolls: boolean;
    warnOnTabClose: boolean;
    laserPointerDurationSec: number;
    pingDurationSec: number;
  };

  // 4. Расширения и Модули (Интерфейс и Homebrew D&D)
  extensions: {
    showPolzaAiButton: boolean;
    showDndGenButton: boolean;
    showMapStudioButton: boolean;
    showAssetFolderButton: boolean;
    showAudioButton: boolean;
    showCombatButton: boolean;
    showSrdButton: boolean;
    showNotesButton: boolean;
    showDiceButton: boolean;
    // D&D Homebrew Rules
    rulePotionBonusAction: boolean;
    ruleCriticalExploding: boolean;
    ruleFlankingBonus: boolean;
    ruleDeathSaveSecret: boolean;
  };

  // 5. Рабочая папка и Хранилище
  storage: {
    rootFolderName: string;
    autoRescanOnLaunch: boolean;
    cacheAudioInIndexedDb: boolean;
    cacheMapsInIndexedDb: boolean;
    compressionQuality: number;
  };

  // 6. Настройка генераторов
  generators: {
    bspResolution: number;
    bspRoomDensity: 'low' | 'medium' | 'high';
    bspDungeonTheme: 'stone_crypt' | 'obsidian' | 'mossy' | 'sandstone';
    defaultLanguage: 'ru' | 'en' | 'bilingual';
    defaultLootTier: 'cr0_4' | 'cr5_10' | 'cr11_16' | 'cr17_plus';
    magicItemRarityBias: 'low' | 'medium' | 'high';
    merchantPriceMultiplier: number;
    npcPersonalityTone: 'neutral' | 'friendly' | 'suspicious' | 'hostile';
  };

  // 7. Системные промпты
  systemPrompts: {
    activePreset: 'heroic_fantasy' | 'gothic_horror' | 'dark_gritty' | 'cyber_mystery' | 'custom';
    monsterSystemPrompt: string;
    campaignSystemPrompt: string;
    lootSystemPrompt: string;
    sceneDescriptionPrompt: string;
    customToneGuidance: string;
  };
}

export const DEFAULT_APP_SETTINGS: AppSettings = {
  polzaAi: {
    defaultModel: 'openai/gpt-4o-mini',
    temperature: 0.7,
    maxTokens: 2500,
    enableReasoning: false,
    autoSaveEntities: true,
    autoSaveCampaigns: true,
    requestTimeoutSec: 10,
    apiBaseUrl: 'https://api.polza.ai/v1',
    customApiKey: ''
  },
  projector: {
    resolutionPreset: '1080p',
    customWidth: 1920,
    customHeight: 1080,
    targetFps: 60,
    autoFullscreenOnOpen: true,
    defaultFogStyle: 'classic_black',
    masterFogOpacity: 0.55,
    showGridToPlayers: true,
    showRulerToPlayers: true,
    showPingsToPlayers: true,
    showLaserToPlayers: true,
    showCombatHudToPlayers: true,
    playerCombatHpDisplay: 'bars_only',
    showMonsterRealNames: false,
    defaultBlackoutTheme: 'pitch_black',
    cameraFollowDm: true
  },
  permissions: {
    allowClipboardPasteMap: true,
    allowWebAudioAutoplay: true,
    allowSecretDmRolls: true,
    warnOnTabClose: true,
    laserPointerDurationSec: 3,
    pingDurationSec: 4
  },
  extensions: {
    showPolzaAiButton: true,
    showDndGenButton: true,
    showMapStudioButton: true,
    showAssetFolderButton: true,
    showAudioButton: true,
    showCombatButton: true,
    showSrdButton: true,
    showNotesButton: true,
    showDiceButton: true,
    rulePotionBonusAction: true,
    ruleCriticalExploding: true,
    ruleFlankingBonus: true,
    ruleDeathSaveSecret: false
  },
  storage: {
    rootFolderName: 'AetherMap_Data',
    autoRescanOnLaunch: true,
    cacheAudioInIndexedDb: true,
    cacheMapsInIndexedDb: true,
    compressionQuality: 0.85
  },
  generators: {
    bspResolution: 2048,
    bspRoomDensity: 'medium',
    bspDungeonTheme: 'stone_crypt',
    defaultLanguage: 'ru',
    defaultLootTier: 'cr0_4',
    magicItemRarityBias: 'medium',
    merchantPriceMultiplier: 1.0,
    npcPersonalityTone: 'neutral'
  },
  systemPrompts: {
    activePreset: 'heroic_fantasy',
    monsterSystemPrompt: `You are a master D&D 5e game designer and system architect.
Generate a strictly valid JSON object representing a D&D 5e entity.
Language requirement: Russian text for description, traits and flavor, English for "englishName".
Follow exact D&D 5e mechanics (Armor Class, Hit Dice formulas, Proficiency Bonus by CR, ability score modifiers).`,
    campaignSystemPrompt: `Create an epic, comprehensive D&D 5e campaign module.
Include: Calendar & weather, Main quest + 2 side quests, NPC relationship graph, factions, Session 0/1 Lazy DM chronicle, Starter Party heroes, Group Treasury & safety guidelines.
All descriptions in Russian with English names for key entities.`,
    lootSystemPrompt: `Generate balanced D&D 5e treasure hoard or merchant inventory with fair market prices in gp/sp/cp, magical attunement rules, and unique lore flavor.`,
    sceneDescriptionPrompt: `Provide atmospheric, immersive read-aloud boxed text for the Dungeon Master to narrate to players. Focus on sensory details: smells, sounds, ambient lighting, shadows, and subtle environmental clues.`,
    customToneGuidance: `Maintain a grounded, tactical and cinematic atmosphere with high tension, compelling secrets, and strategic choices for players.`
  }
};

const STORAGE_KEY = 'vtt_zero_app_settings_v1';

class AppSettingsService {
  private currentSettings: AppSettings;
  private listeners: Set<(settings: AppSettings) => void> = new Set();

  constructor() {
    this.currentSettings = this.loadFromStorage();
    this.applyGlobalEffects();
  }

  private loadFromStorage(): AppSettings {
    if (typeof window === 'undefined') return { ...DEFAULT_APP_SETTINGS };
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return { ...DEFAULT_APP_SETTINGS };
      const parsed = JSON.parse(stored);
      // Глубокое слияние с дефолтными настройками на случай добавления новых полей
      return {
        polzaAi: { ...DEFAULT_APP_SETTINGS.polzaAi, ...parsed.polzaAi },
        projector: { ...DEFAULT_APP_SETTINGS.projector, ...parsed.projector },
        permissions: { ...DEFAULT_APP_SETTINGS.permissions, ...parsed.permissions },
        extensions: { ...DEFAULT_APP_SETTINGS.extensions, ...parsed.extensions },
        storage: { ...DEFAULT_APP_SETTINGS.storage, ...parsed.storage },
        generators: { ...DEFAULT_APP_SETTINGS.generators, ...parsed.generators },
        systemPrompts: { ...DEFAULT_APP_SETTINGS.systemPrompts, ...parsed.systemPrompts }
      };
    } catch (e) {
      console.warn('[AppSettingsService] Failed to parse settings from storage:', e);
      return { ...DEFAULT_APP_SETTINGS };
    }
  }

  private saveToStorage(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.currentSettings));
    } catch (e) {
      console.warn('[AppSettingsService] Failed to save settings to storage:', e);
    }
  }

  private applyGlobalEffects(): void {
    if (typeof window === 'undefined') return;

    // 1. Защита от случайного закрытия вкладки
    if (this.currentSettings.permissions.warnOnTabClose) {
      window.onbeforeunload = (e) => {
        e.preventDefault();
        return (e.returnValue = 'У вас открыта игровая сессия D&D. Вы уверены, что хотите выйти?');
      };
    } else {
      window.onbeforeunload = null;
    }
  }

  public getSettings(): AppSettings {
    return { ...this.currentSettings };
  }

  public updateSettings(partial: Partial<AppSettings> | ((prev: AppSettings) => AppSettings)): AppSettings {
    if (typeof partial === 'function') {
      this.currentSettings = partial(this.currentSettings);
    } else {
      this.currentSettings = {
        polzaAi: { ...this.currentSettings.polzaAi, ...partial.polzaAi },
        projector: { ...this.currentSettings.projector, ...partial.projector },
        permissions: { ...this.currentSettings.permissions, ...partial.permissions },
        extensions: { ...this.currentSettings.extensions, ...partial.extensions },
        storage: { ...this.currentSettings.storage, ...partial.storage },
        generators: { ...this.currentSettings.generators, ...partial.generators },
        systemPrompts: { ...this.currentSettings.systemPrompts, ...partial.systemPrompts }
      };
    }

    this.saveToStorage();
    this.applyGlobalEffects();
    this.notify();
    return { ...this.currentSettings };
  }

  public resetCategory(category: keyof AppSettings): AppSettings {
    this.currentSettings = {
      ...this.currentSettings,
      [category]: { ...DEFAULT_APP_SETTINGS[category] }
    };
    this.saveToStorage();
    this.applyGlobalEffects();
    this.notify();
    return { ...this.currentSettings };
  }

  public resetAll(): AppSettings {
    this.currentSettings = JSON.parse(JSON.stringify(DEFAULT_APP_SETTINGS));
    this.saveToStorage();
    this.applyGlobalEffects();
    this.notify();
    return { ...this.currentSettings };
  }

  public subscribe(listener: (settings: AppSettings) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    const s = this.getSettings();
    this.listeners.forEach((l) => l(s));
  }

  public exportJson(): string {
    return JSON.stringify(this.currentSettings, null, 2);
  }

  public importJson(jsonString: string): boolean {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed || typeof parsed !== 'object') return false;
      this.updateSettings(parsed);
      return true;
    } catch (e) {
      console.warn('[AppSettingsService] Error importing JSON:', e);
      return false;
    }
  }
}

export const appSettingsService = new AppSettingsService();
