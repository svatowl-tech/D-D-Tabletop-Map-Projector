/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Клиентский сервис Polza AI Client для выполнения API запросов к серверу (/api/polza/*)
 */

import {
  TextModelInfo,
  ArtModelInfo,
  GenerateJsonOptions,
  GenerateJsonResponse,
  CampaignGeneratorOptions,
  GeneratedCampaign,
  ArtStylePreset,
  ArtModelId,
  CompilePromptResponse,
  GenerateImageResponse
} from '../types/polzaAi';
import { appSettingsService } from './appSettingsService';

class PolzaAiClient {
  /**
   * Получение списка всех текстовых моделей
   */
  public async getTextModels(): Promise<{ models: TextModelInfo[]; defaultModel: string }> {
    try {
      const res = await fetch('/api/polza/text-models');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return { models: data.models || [], defaultModel: data.defaultModel || 'openai/gpt-4o-mini' };
    } catch (e) {
      console.warn('Fallback text models client mode:', e);
      return {
        models: [
          {
            id: 'openai/gpt-4o-mini',
            name: 'OpenAI GPT-4o Mini',
            provider: 'OpenAI (Polza AI)',
            description: 'Сверхбыстрая компактная модель для генерации точного D&D 5e JSON без задержек.',
            supportsReasoning: false,
            isDefault: true
          },
          {
            id: 'deepseek/deepseek-chat',
            name: 'DeepSeek Chat V3',
            provider: 'DeepSeek (Polza AI)',
            description: 'Флагманская модель для сюжетных квестов и диалогов.',
            supportsReasoning: false
          },
          {
            id: 'qwen/qwen-2.5-72b-instruct',
            name: 'Qwen 2.5 72B Instruct',
            provider: 'Alibaba Cloud',
            description: 'Мощная модель для создания детального фэнтези лора и правил.',
            supportsReasoning: false
          },
          {
            id: 'deepseek/deepseek-r1-distill-llama-70b',
            name: 'DeepSeek R1 Distill Llama 70B',
            provider: 'DeepSeek / Meta',
            description: 'Флагманская модель с блоком рассуждений <think> и D&D 5e математикой.',
            supportsReasoning: true,
            isDefault: false
          }
        ],
        defaultModel: 'openai/gpt-4o-mini'
      };
    }
  }

  /**
   * Генерация структурированной D&D 5e сущности
   */
  public async generateJsonEntity(options: GenerateJsonOptions, model?: string): Promise<GenerateJsonResponse> {
    try {
      const settings = appSettingsService.getSettings();
      const chosenModel = model || settings.polzaAi.defaultModel || 'openai/gpt-4o-mini';
      const systemPrompt = settings.systemPrompts.monsterSystemPrompt;
      const temperature = settings.polzaAi.temperature;
      const apiKey = settings.polzaAi.customApiKey;
      const timeoutMs = (settings.polzaAi.requestTimeoutSec || 10) * 1000;

      const res = await fetch('/api/polza/generate-json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          options,
          model: chosenModel,
          systemPrompt,
          temperature,
          apiKey,
          timeoutMs
        })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e: any) {
      console.error('Error generating JSON entity via server:', e);
      throw e;
    }
  }

  /**
   * Генерация полноценной сюжетной кампании
   */
  public async generateCampaign(options: CampaignGeneratorOptions): Promise<{ campaign: GeneratedCampaign; savedFilePath?: string }> {
    try {
      const settings = appSettingsService.getSettings();
      const chosenModel = settings.polzaAi.defaultModel || 'openai/gpt-4o-mini';
      const systemPrompt = settings.systemPrompts.campaignSystemPrompt;
      const temperature = settings.polzaAi.temperature;
      const apiKey = settings.polzaAi.customApiKey;
      const timeoutMs = (settings.polzaAi.requestTimeoutSec || 12) * 1000;

      const res = await fetch('/api/polza/generate-campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          options,
          model: chosenModel,
          systemPrompt,
          temperature,
          apiKey,
          timeoutMs
        })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e: any) {
      console.error('Error generating campaign via server:', e);
      throw e;
    }
  }

  /**
   * Получение списка всех сохраненных кампаний
   */
  public async getCampaigns(): Promise<string[]> {
    try {
      const res = await fetch('/api/polza/campaigns');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return data.campaigns || [];
    } catch (e) {
      return [];
    }
  }

  /**
   * Получение списка визуальных моделей для генерации артов
   */
  public async getImageModels(): Promise<{ models: ArtModelInfo[]; defaultModel: string }> {
    try {
      const res = await fetch('/api/polza/models');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return { models: data.models || [], defaultModel: data.defaultModel || 'tongyi-mai/z-image' };
    } catch (e) {
      return {
        models: [
          { id: 'tongyi-mai/z-image', name: 'Tongyi Z-Image Pro', description: 'Высокодетализированные фэнтези арты.', isDefault: true }
        ],
        defaultModel: 'tongyi-mai/z-image'
      };
    }
  }

  /**
   * Компиляция детального англоязычного промпта для арта
   */
  public async compileArtPrompt(entity: any, stylePreset: ArtStylePreset): Promise<CompilePromptResponse> {
    try {
      const res = await fetch('/api/polza/prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entity, stylePreset })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e: any) {
      return {
        success: true,
        prompt: `Masterpiece fantasy illustration of ${entity.name || 'Fantasy entity'}. High quality D&D 5e digital art.`,
        stylePreset,
        optimalSize: '1024x1024'
      };
    }
  }

  /**
   * Генерация изображения / арта
   */
  public async generateImage(prompt: string, size: string = '1024x1024', model?: ArtModelId, transparentBackground: boolean = false): Promise<GenerateImageResponse> {
    try {
      const res = await fetch('/api/polza/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, size, model, saveToDisk: true, transparentBackground })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e: any) {
      console.error('Error generating image via server:', e);
      throw e;
    }
  }
}

export const polzaAiClient = new PolzaAiClient();
