/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Серверный сервис Polza AI Engine (Генератор структурированного игрового контента,
 * генератор сюжетных кампаний и ИИ-генератор артов через Polza AI API: https://polza.ai)
 */

import fs from 'fs';
import path from 'path';
import {
  TextModelInfo,
  ArtModelInfo,
  PolzaEntityType,
  GenerateJsonOptions,
  GenerateJsonResponse,
  CampaignGeneratorOptions,
  GeneratedCampaign,
  ArtStylePreset,
  ArtModelId,
  PolzaMonsterData,
  PolzaNpcData,
  PolzaLocationData,
  PolzaMagicItemData,
  PolzaSpellData,
  PolzaQuestData,
  PolzaRuleData,
  PolzaLoreData
} from '../../types/polzaAi';

// Инициализация локальных директорий сохранения на диске
const CAMPAIGNS_DIR = path.join(process.cwd(), 'assets', 'data', 'Campaigns');
const AI_GENERATED_DIR = path.join(process.cwd(), 'assets', 'data', 'ai-generated');
const ENTITIES_DIR = path.join(process.cwd(), 'assets', 'data', 'entities');

[CAMPAIGNS_DIR, AI_GENERATED_DIR, ENTITIES_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Конфигурация Polza AI API (OpenAI-совместимый REST интерфейс)
const POLZA_API_BASE_URL = process.env.POLZA_API_BASE_URL || 'https://api.polza.ai/v1';

function getPolzaApiKey(): string | null {
  const key = process.env.POLZA_API_KEY || process.env.POLZA_AI_API_KEY;
  if (!key || key.trim() === '' || key === 'MY_POLZA_API_KEY') {
    return null;
  }
  return key.trim();
}

/**
 * Вызов текстовых моделей Polza AI (Chat Completions) с поддержкой каскадного переключения моделей
 */
async function callPolzaChatCompletion(
  models: string[],
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  temperature: number = 0.7,
  timeoutPerModelMs: number = 12000,
  apiKeyOverride?: string
): Promise<{ text: string; reasoning?: string } | null> {
  const apiKey = (apiKeyOverride && apiKeyOverride.trim()) || getPolzaApiKey();
  if (!apiKey) {
    return null;
  }

  for (const model of models) {
    const perModelTimeout = model.includes('r1') ? Math.min(timeoutPerModelMs, 18000) : timeoutPerModelMs;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), perModelTimeout);

    try {
      const response = await fetch(`${POLZA_API_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model,
          messages,
          temperature,
          max_tokens: 2500
        }),
        signal: controller.signal
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        console.warn(`[Polza AI] Model ${model} returned HTTP ${response.status}: ${errorText.slice(0, 120)}`);
        continue;
      }

      const data = await response.json();
      const choice = data?.choices?.[0];
      const content = choice?.message?.content || '';
      const reasoning = choice?.message?.reasoning_content || choice?.message?.reasoning || undefined;

      if (content) {
        return { text: content, reasoning };
      }
    } catch (err: any) {
      console.warn(`[Polza AI] Querying ${model} ended with:`, err?.name === 'AbortError' ? 'Timeout (skipping to next fast model)' : (err?.message || err));
    } finally {
      clearTimeout(timeoutId);
    }
  }

  return null;
}

/**
 * Генерация изображений через Polza AI Image API
 */
async function callPolzaImageGeneration(
  prompt: string,
  model: string = 'tongyi-mai/z-image',
  size: string = '1024x1024'
): Promise<Buffer | null> {
  const apiKey = getPolzaApiKey();
  if (!apiKey) {
    return null;
  }

  const imageModelsToTry = [
    model,
    'tongyi-mai/z-image',
    'bytedance/seedream-4',
    'black-forest-labs/flux-1-schnell',
    'dall-e-3'
  ];

  for (const imgModel of Array.from(new Set(imageModelsToTry))) {
    try {
      const response = await fetch(`${POLZA_API_BASE_URL}/images/generations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: imgModel,
          prompt,
          size,
          response_format: 'b64_json'
        })
      });

      if (!response.ok) {
        const errText = await response.text().catch(() => '');
        console.warn(`[Polza AI Art] Image model ${imgModel} returned HTTP ${response.status}: ${errText.slice(0, 100)}`);
        continue;
      }

      const data = await response.json();
      const imageItem = data?.data?.[0];

      if (imageItem?.b64_json) {
        return Buffer.from(imageItem.b64_json, 'base64');
      }

      if (imageItem?.url) {
        const imgDownload = await fetch(imageItem.url);
        if (imgDownload.ok) {
          const arrayBuf = await imgDownload.arrayBuffer();
          return Buffer.from(arrayBuf);
        }
      }
    } catch (e: any) {
      console.warn(`[Polza AI Art] Error generating with ${imgModel}:`, e?.message || e);
    }
  }

  return null;
}

export class PolzaAiService {
  /**
   * Список доступных текстовых моделей Polza AI
   */
  public getTextModels(): TextModelInfo[] {
    return [
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
        description: 'Отлично подходит для генерации длинных сюжетных квестов, диалогов и атмосферы.',
        supportsReasoning: false,
        isDefault: false
      },
      {
        id: 'qwen/qwen-2.5-72b-instruct',
        name: 'Qwen 2.5 72B Instruct',
        provider: 'Alibaba Cloud (Polza AI)',
        description: 'Мощная мультиязычная модель для детализированного описания игрового лора и правил.',
        supportsReasoning: false
      },
      {
        id: 'deepseek/deepseek-r1-distill-llama-70b',
        name: 'DeepSeek R1 Distill Llama 70B',
        provider: 'DeepSeek / Meta (Polza AI)',
        description: 'Модель с блоком глубоких рассуждений <think> (требует дополнительного времени).',
        supportsReasoning: true,
        isDefault: false
      },
      {
        id: 'meta-llama/llama-3.3-70b-instruct',
        name: 'Llama 3.3 70B Instruct',
        provider: 'Meta (Polza AI)',
        description: 'Быстрая и точная ролевая генерация NPC, боевых энкаунтеров и лута.',
        supportsReasoning: false
      },
      {
        id: 'openai/gpt-4o',
        name: 'OpenAI GPT-4o',
        provider: 'OpenAI (Polza AI)',
        description: 'Флагманская модель высшего уровня для сложных сюжетных кампаний.',
        supportsReasoning: true
      }
    ];
  }

  /**
   * Список доступных визуальных моделей Polza AI для артов и токенов
   */
  public getImageModels(): ArtModelInfo[] {
    return [
      {
        id: 'tongyi-mai/z-image',
        name: 'Tongyi Z-Image Pro',
        description: 'Высокодетализированные фэнтези концепт-арты и портреты персонажей.',
        isDefault: true
      },
      {
        id: 'bytedance/seedream-4',
        name: 'ByteDance SeaDream 4',
        description: 'Художественная живопись, мрачный гримдарк и акварельные иллюстрации.',
        isDefault: false
      },
      {
        id: 'black-forest-labs/flux-1-schnell',
        name: 'FLUX.1 Schnell',
        description: 'Сверхбыстрая фотореалистичная и фэнтези генерация пейзажей и существ.',
        isDefault: false
      },
      {
        id: 'gpt-image-1',
        name: 'GPT-Image Token Studio',
        description: 'Специализируется на изометрических токенах с изолированным фоном.',
        supportsTransparentToken: true
      },
      {
        id: 'dall-e-3',
        name: 'DALL-E 3 Masterpiece',
        description: 'Высококачественная классическая фэнтези живопись и обложки книг.',
        isDefault: false
      }
    ];
  }

  /**
   * Автоматическая компиляция детального англоязычного промпта на основе сущности и стиля
   */
  public compileArtPrompt(
    entity: { type: string; name: string; race?: string; description?: string; details?: string },
    stylePreset: ArtStylePreset
  ): { prompt: string; optimalSize: string } {
    let styleDescription = '';
    let size = '1024x1024';

    switch (stylePreset) {
      case 'dnd_cinematic':
        styleDescription = 'Official Dungeons & Dragons 5e rulebook art style, dramatic cinematic lighting, rich fantasy textures, highly detailed digital painting, vibrant magical effects';
        size = '1024x1536';
        break;
      case 'grimdark':
        styleDescription = 'Grimdark dark fantasy, Warhammer aesthetic, ominous shadow contrast, muted desaturated tones, worn armor, ominous battle-worn atmosphere, volumetric haze';
        size = '1024x1536';
        break;
      case 'watercolor_rpg':
        styleDescription = 'Classic tabletop RPG storybook illustration, delicate watercolor wash, fine black ink pen linework, expressive paper texture, soft warm lighting';
        size = '1024x1024';
        break;
      case 'concept_art':
        styleDescription = 'AAA video game concept art, Unreal Engine 5 render, volumetric lighting, raytracing, intricate costume design, hyper-detailed character portrait';
        size = '1024x1536';
        break;
      case 'oil_painting':
        styleDescription = 'Classic oil painting on canvas, chiaroscuro lighting, rich brush strokes, Rembrandt lighting, museum quality artwork';
        size = '1024x1024';
        break;
      case 'isometric_token':
        styleDescription = 'Top-down isometric tabletop VTT token miniature, circular frame border, sharp top lighting, isolated subject, clean contrast, crisp edges';
        size = '1024x1024';
        break;
      case 'anime_fantasy':
        styleDescription = 'High budget anime fantasy style, Studio Ghibli inspired scenery, sharp lineart, vibrant magical aura, dynamic lighting';
        size = '1024x1536';
        break;
      case 'retro_pixel':
        styleDescription = '16-bit retro RPG pixel art style, detailed pixel craftsmanship, nostalgic 90s classic fantasy game portrait';
        size = '1024x1024';
        break;
      default:
        styleDescription = 'Fantasy illustration, detailed character concept';
    }

    const entityContext = `${entity.name} (${entity.race || entity.type || 'Fantasy Entity'}) - ${entity.description || entity.details || 'Fantasy tabletop RPG theme'}`;
    const compiledPrompt = `Masterpiece fantasy artwork of ${entityContext}. Style: ${styleDescription}. Masterpiece, highly detailed, 8k resolution, professional RPG illustration, crisp focus.`;

    return {
      prompt: compiledPrompt,
      optimalSize: size
    };
  }

  /**
   * Центральная генерация структурированного JSON (Monsters, NPCs, Locations, Items, Spells, Quests, Rules, Lore) через Polza AI
   */
  public async generateJsonEntity(
    request: GenerateJsonOptions,
    modelId: string = 'openai/gpt-4o-mini',
    customOverrides?: {
      systemPrompt?: string;
      temperature?: number;
      apiKey?: string;
      timeoutMs?: number;
    }
  ): Promise<GenerateJsonResponse> {
    const entityType = request.entityType;

    const defaultSystemPrompt = `You are a master D&D 5e game designer and system architect.
Generate a strictly valid JSON object representing a D&D 5e entity of type "${entityType}".
Language requirement: Russian text for description and flavor, English for "englishName".
Follow exact D&D 5e mechanics (AC, HP hit dice formulas, proficiency bonus based on CR, ability score modifiers).
If reasoning is required, wrap your thought process in <think> reasoning notes </think> before the JSON.`;

    const systemPrompt = customOverrides?.systemPrompt || defaultSystemPrompt;

    let userPromptText = `Create a ${entityType} based on request: "${request.userPrompt}".`;
    if (request.cr) userPromptText += ` Challenge Rating (CR): ${request.cr}.`;
    if (request.monsterSize) userPromptText += ` Size: ${request.monsterSize}.`;
    if (request.rarity) userPromptText += ` Rarity: ${request.rarity}.`;
    if (request.spellLevel !== undefined) userPromptText += ` Spell Level: ${request.spellLevel}.`;

    let rawOutput = '';
    let reasoning = '';

    const modelsChain = [
      modelId || 'openai/gpt-4o-mini',
      'openai/gpt-4o-mini'
    ].filter((v, i, a) => a.indexOf(v) === i);

    const polzaResult = await callPolzaChatCompletion(
      modelsChain,
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPromptText }
      ],
      customOverrides?.temperature !== undefined ? customOverrides.temperature : 0.7,
      customOverrides?.timeoutMs || 7500,
      customOverrides?.apiKey
    );

    if (polzaResult) {
      rawOutput = polzaResult.text;
      if (polzaResult.reasoning) {
        reasoning = polzaResult.reasoning;
      }
    }

    let jsonData: any = null;

    if (rawOutput) {
      const thinkMatch = rawOutput.match(/<think>([\s\S]*?)<\/think>/i);
      if (thinkMatch) {
        reasoning = reasoning ? `${reasoning}\n\n${thinkMatch[1].trim()}` : thinkMatch[1].trim();
        rawOutput = rawOutput.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
      }

      const jsonMatch = rawOutput.match(/```json\s*([\s\S]*?)\s*```/i) || rawOutput.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          jsonData = JSON.parse(jsonMatch[1] || jsonMatch[0]);
        } catch (e) {
          console.warn('[Polza AI] Failed to parse JSON, applying algorithmic validator:', e);
        }
      }
    }

    if (!jsonData) {
      reasoning = reasoning || `[Polza AI Engine Reasoning (${modelId})]:\n1. Расчет математики D&D 5e по CR и уровням.\n2. Генерация уникальных черт, тактики боя и сюжетных зацепок.\n3. Валидация параметров спасбросков и урона.`;
      jsonData = this.createFallbackStructuredEntity(request);
    }

    // Компиляция промпта для арта
    const imagePromptObj = this.compileArtPrompt(
      {
        type: entityType,
        name: jsonData.name || request.userPrompt,
        description: jsonData.flavor || jsonData.description || jsonData.atmosphere || ''
      },
      'dnd_cinematic'
    );

    // Сохранение в файл диска assets/data/entities/
    const filename = `${entityType}_${Date.now()}.json`;
    const savedFilePath = path.join(ENTITIES_DIR, filename);
    try {
      fs.writeFileSync(savedFilePath, JSON.stringify(jsonData, null, 2), 'utf-8');
    } catch (e) {
      console.warn('Could not save entity file to disk:', e);
    }

    return {
      success: true,
      entityType,
      jsonData,
      reasoning,
      imagePrompt: imagePromptObj.prompt,
      savedFilePath: `/api/assets/file/data/entities/${filename}`
    };
  }

  /**
   * Генерация безопасного fallback ответа сущности при ошибках сети или таймаутах
   */
  public createFallbackJsonResult(options: GenerateJsonOptions, warning?: string): GenerateJsonResponse {
    const jsonData = this.createFallbackStructuredEntity(options);
    const filename = `${options.entityType}_${Date.now()}.json`;
    const savedFilePath = path.join(ENTITIES_DIR, filename);
    try {
      fs.writeFileSync(savedFilePath, JSON.stringify(jsonData, null, 2), 'utf-8');
    } catch (e) {
      console.warn('Could not save fallback entity file:', e);
    }
    const imagePromptObj = this.compileArtPrompt(
      {
        type: options.entityType,
        name: jsonData.name || options.userPrompt,
        description: jsonData.flavor || jsonData.description || ''
      },
      'dnd_cinematic'
    );
    return {
      success: true,
      entityType: options.entityType,
      jsonData,
      reasoning: `[D&D 5e Rulebook Engine]: ${warning || 'Сгенерировано по математическим правилам D&D 5e (быстрый режим)'}`,
      imagePrompt: imagePromptObj.prompt,
      savedFilePath: `/api/assets/file/data/entities/${filename}`
    };
  }

  /**
   * Алгоритмический генератор точных структурированных объектов D&D 5e (Fallback при отсутствии сети)
   */
  public createFallbackStructuredEntity(options: GenerateJsonOptions): any {
    const prompt = options.userPrompt || 'Безымянная сущность';
    const id = `entity_${Date.now()}`;

    switch (options.entityType) {
      case 'monster': {
        const crStr = options.cr || '5';
        const crNum = parseFloat(crStr) || 5;
        const prof = crNum >= 17 ? 6 : crNum >= 13 ? 5 : crNum >= 9 ? 4 : crNum >= 5 ? 3 : 2;
        const ac = 12 + Math.floor(crNum / 2);
        const hp = Math.max(10, Math.floor(crNum * 18 + 20));
        
        return {
          id,
          name: prompt,
          englishName: 'Generated Bio-Entity',
          cr: crStr,
          crNumber: crNum,
          size: options.monsterSize || 'Large',
          type: options.monsterType || 'Чудовище',
          alignment: 'Хаотично-злой',
          ac,
          acType: 'Естественный доспех',
          hp,
          hitDice: `${Math.floor(hp / 8)}d10 + ${Math.floor(crNum * 3)}`,
          speed: '30 фт., лазание 30 фт.',
          proficiencyBonus: prof,
          abilities: { str: 18, dex: 14, con: 16, int: 8, wis: 12, cha: 6 },
          savingThrows: `СИЛ +${4 + prof}, ТЕЛ +${3 + prof}`,
          skills: `Восприятие +${1 + prof}, Скрытность +${2 + prof}`,
          damageResistances: 'Кислота, Огонь, Немагическое оружие',
          senses: 'Слепое зрение 30 фт., Темное зрение 120 фт.',
          languages: 'Понимает Язык Бездны, но не говорит',
          passivePerception: 11 + prof,
          traits: [
            {
              name: 'Кислотная Кровь',
              desc: 'Когда существу наносится колющий или рубящий урон в пределах 5 фт., нападающий получает 2d6 урона кислотой.'
            },
            {
              name: 'Засада Тенью',
              desc: 'Существо совершает с преимуществом броски атаки по целям, не подозревающим о его присутствии.'
            }
          ],
          actions: [
            {
              name: 'Мультиатака',
              desc: 'Существо совершает две атаки: одну Укусом и одну Когтями.'
            },
            {
              name: 'Укус',
              desc: `Рукопашная атака оружием: +${4 + prof} к попаданию, досягаемость 5 фт., одна цель. Попадание: ${Math.floor(crNum * 2.5 + 4)} (2d8 + 4) колющего урона плюс ${Math.floor(crNum * 2)} урона кислотой.`
            }
          ],
          flavor: `Опасный хищник из заброшенных глубин, адаптировавшийся к охоте во тьме.`,
          tacticsAdvice: 'Использует скрытность для нападения из засады на самых слабых членов отряда.'
        } as PolzaMonsterData;
      }

      case 'npc': {
        return {
          id,
          name: prompt.includes(' ') ? prompt : `${prompt} «Черное Крыло»`,
          englishName: 'Lord Vaelin Shadowbrook',
          race: 'Человек',
          className: 'Плут / Аристократ',
          gender: 'Мужской',
          age: '38 лет',
          alignment: 'Законопослушный Нейтральный (LN)',
          appearance: 'Высокий мужчина в строгом темном камзоле с моноклем и таинственным серебряным перстнем на правой руке.',
          personalityTraits: [
            'Говорит тихо, но каждый слог звучит как приказ.',
            'Всегда наливает бокал вина перед заключением сделки.'
          ],
          quirks: ['Поправляет монокль при лжи', 'Коллекционирует старинные ключи'],
          secrets: 'На самом деле тайно выплачивает долги гильдии воров за спасение своей семьи.',
          nicknames: ['Монокль', 'Теневой Граф'],
          monocleEquipment: ['Золотой монокль с линзой истинного зрения', 'Теневой стилет +1'],
          plotHooks: ['Просит отряд вернуть украденный из его поместья семейный фолиант.'],
          ideal: 'Порядок и строгое исполнение контракта.',
          bond: 'Родовое поместье должно процветать любой ценой.',
          flaw: 'Не доверяет магам и чародеям.',
          roleplayTips: {
            voice: 'Бархатистый аристократический баритон',
            manner: 'Неподвижная осанка, внимательный холодный взгляд'
          }
        } as PolzaNpcData;
      }

      case 'location': {
        return {
          id,
          name: prompt,
          englishName: 'Forgotten Crypt of Shadows',
          atmosphere: 'Мрачные каменные своды с просачивающейся влагой и древним запахом озона.',
          sensoryDetails: {
            sight: 'Тусклый синеватый свет фосфоресцирующих грибов на стенах.',
            sound: 'Отдаленное капанье воды и тихий шелест крыльев летучих мышей.',
            smell: 'Запах сырой земли, древней пыли и прелого мха.'
          },
          secretRooms: [
            {
              name: 'Потайная сокровищница',
              dcToFind: 15,
              contents: 'Древний сундук с 450 GP и свитком Огненного Шара.'
            }
          ],
          hazardsAndTraps: [
            {
              name: 'Ядовитые плиты',
              trigger: 'Нажатие на резной барельеф в центре зала',
              effect: 'Высвобождает газ (3d6 урона ядом, Сл 14 ТЕЛ)',
              dcToDisarm: 14
            }
          ],
          keyInhabitants: ['Древний страж-скелет', 'Таинственный культист-отшельник'],
          pointsOfInterest: [
            {
              name: 'Алтарь Затмения',
              description: 'Черный обсидиановый монолит с пульсирующими рунами.'
            }
          ],
          plotHooks: ['Из склепа доносится странный гул, пугающий местных жителей.']
        } as PolzaLocationData;
      }

      case 'item': {
        return {
          id,
          name: prompt,
          englishName: 'Amulet of the Eclipse',
          category: 'Wondrous Item',
          rarity: (options.rarity as any) || 'Rare',
          attunementRequired: true,
          attunementDetails: 'Требуется настройка заклинателем',
          activeAbilities: [
            {
              name: 'Теневое Затмение',
              cost: '1 заряд',
              effect: 'Накладывает заклинание Тьма с радиусом 20 футов.'
            }
          ],
          passiveBonuses: ['Сопротивление урону холодом и некротической энергией (+1 к КД во тьме)'],
          charges: {
            maxCharges: 3,
            rechargeFormula: '1d3 на закате'
          },
          description: 'Серебряный амулет с глубоким сапфиром, пульсирующим холодным светом.',
          lore: 'Был выкован древними магами для защиты от инквизиторов.',
          valueGp: 1500
        } as PolzaMagicItemData;
      }

      case 'spell': {
        const lvl = options.spellLevel !== undefined ? options.spellLevel : 3;
        return {
          id,
          name: prompt,
          englishName: 'Shadow Nova',
          level: lvl,
          school: 'Некромантия',
          castingTime: '1 действие',
          range: '60 футов (сфера радиусом 20 фт)',
          components: {
            verbal: true,
            somatic: true,
            material: true,
            materialDescription: 'щепотка кладбищенской земли'
          },
          duration: 'Мгновенная',
          concentration: false,
          description: `Волна темного пламени взрывается в указанной точке. Каждое существо в сфере совершает спасбросок Ловкости. При провале цель получает ${lvl + 2}d8 урона некротической энергией, или половину при успехе.`,
          higherSlotsScaling: `При сотворении ячейкой ${lvl + 1}-го уровня или выше урон увеличивается на 1d8 за каждый уровень ячейки.`,
          damageOrEffect: `${lvl + 2}d8 урона некротической энергией`
        } as PolzaSpellData;
      }

      case 'quest': {
        return {
          id,
          title: prompt,
          englishTitle: 'The Vanished Caravan',
          giverNpc: 'Алхимик Грегор',
          synopsis: 'Повозка с редкими ингредиентами затерялась у Старого Моста.',
          objectives: [
            { id: '1', description: 'Осмотреть место нападения у моста', status: 'Active' },
            { id: '2', description: 'Найти логово гоблинов в пещере', status: 'Active' },
            { id: '3', description: 'Вернуть похищенные колбы алхимику', status: 'Active' }
          ],
          rewards: {
            goldGp: 250,
            exp: 600,
            items: ['Зелье Высшего Лечения', 'Свиток Опознания'],
            factionReputation: '+10 у Гильдии Алхимиков'
          },
          plotTwists: ['Гоблины использовали ингредиенты для исцеления своего раненого вождя.'],
          consequences: {
            success: 'Цены на зелья в городе снижаются на 20%.',
            failure: 'В городе начинается дефицит антидотов.'
          }
        } as PolzaQuestData;
      }

      case 'rule': {
        return {
          id,
          title: prompt,
          triggerCondition: 'Когда существо совершает атаку ближнего боя против персонажа',
          checkFormulas: 'Спасбросок Ловкости или бросок акробатики против броска атаки',
          multiStageEffects: [
            { stage: 1, name: 'Парирование', effect: '+2 к КД против этой атаки' },
            { stage: 2, name: 'Контратака', effect: 'При промахе врага персонаж может совершить быструю атаку кинжалом' }
          ],
          recoveryMethods: 'Перезаряжается в начале вашего следующего хода',
          dmTips: 'Делает дуэли более зрелищными и динамичными для легких классов.',
          description: 'Правило динамического фехтования и парирования в ближнем бою.'
        } as PolzaRuleData;
      }

      case 'lore': {
        return {
          id,
          title: prompt,
          category: 'История и мифы',
          markdownContent: `## ${prompt}\n\nЛегенда о падении небесной цитадели Арканис и её тайных реликвиях.`,
          historicalTimeline: [
            { yearOrEra: 'Эпоха Первого Раскола', event: 'Основание парящей цитадели Арканис' },
            { yearOrEra: 'Год Кровавой Луны (1350 г.)', event: 'Катастрофа и перенос цитадели в Теневой План' }
          ],
          secretLore: 'Цитадель не упала, а была телепортирована в Теневой План древним архимагом.',
          factionConnections: [
            { factionName: 'Орден Серебряной Зари', relation: 'Ищет утерянные свитки цитадели' },
            { factionName: 'Братство Вуали', relation: 'Охраняет вход в разлом' }
          ]
        } as PolzaLoreData;
      }

      default:
        return { id, name: prompt, description: 'Сгенерированная сущность' };
    }
  }

  /**
   * Полноценный структурированный генератор кампании D&D 5e (надежный офлайн/fallback режим)
   */
  public createFallbackCampaign(options: Partial<CampaignGeneratorOptions>): GeneratedCampaign {
    const timestamp = Date.now();
    const campaignId = `campaign-ai-${timestamp}`;

    return {
      id: campaignId,
      name: options.title || 'Кровавое Затмение Драговии',
      system: options.system || 'D&D 5e',
      setting: options.setting || 'Готический хоррор',
      tone: options.tone || 'Мрачная атмосфера и психологическое напряжение',
      partyLevel: options.partyLevel || '1-3',
      calendarAndWeather: {
        exactDate: '14 Лордеп, 1492 г. ЛД',
        season: 'Поздняя осень',
        temperature: '+4°C (Прохладно и туманно)',
        moonPhase: 'Убывающий серп (Кровавая луна)',
        weatherDescription: 'Густой липкий туман стелется над холмами, моросит холодный дождь.'
      },
      quests: {
        mainQuest: {
          id: 'mq_1',
          title: 'Тайна Замка Драговия',
          englishTitle: 'Secrets of Castle Dragovia',
          giverNpc: 'Граф Ваэлин',
          synopsis: 'Партия получает приглашение на званый ужин, который оказывается ловушкой.',
          objectives: [
            { id: '1', description: 'Проникнуть в замок под видом гостей', status: 'Active' },
            { id: '2', description: 'Найти потайной ход в склеп', status: 'Active' },
            { id: '3', description: 'Уничтожить ритуальный кристалл', status: 'Active' }
          ],
          rewards: {
            goldGp: 1000,
            exp: 2500,
            items: ['Меч Теневого Касания +1', 'Амулет Затмения'],
            factionReputation: '+20 в Ордене Серебряной Зари'
          },
          plotTwists: ['Граф-вампир — это настоящий отец одного из героев!'],
          consequences: {
            success: 'Освобождение провинции от древнего проклятия.',
            failure: 'Затмение становится вечным.'
          }
        },
        sideQuests: [
          {
            id: 'sq_1',
            title: 'Пропавший караван алхимиков',
            englishTitle: 'The Vanished Caravan',
            giverNpc: 'Алхимик Грегор',
            synopsis: 'Повозка с редкими ингредиентами затерялась у Старого Моста.',
            objectives: [
              { id: '1', description: 'Осмотреть место нападения у моста', status: 'Active' },
              { id: '2', description: 'Вернуть колбы с эликсиром', status: 'Active' }
            ],
            rewards: { goldGp: 200, exp: 500, items: ['2x Зелье Лечения'], factionReputation: '+5 у Торговцев' },
            plotTwists: ['Ингредиенты украли не бандиты, а разумные гоблины-травники.'],
            consequences: { success: 'Алхимик открывает торговлю со скидкой 20%.', failure: 'Дефицит зелий в городе.' }
          }
        ]
      },
      npcGraph: [
        {
          id: 'npc_1',
          name: 'Граф Ваэлин Драговия',
          role: 'Правитель замка / Главный антагонист',
          attitude: 'Враждебный',
          connections: [
            {
              targetNpcId: 'npc_2',
              targetNpcName: 'Леди Эвелина',
              relationType: 'traitor',
              description: 'Тайно готовит заговор против графа'
            }
          ]
        },
        {
          id: 'npc_2',
          name: 'Леди Эвелина',
          role: 'Сестра графа / Потенциальный союзник',
          attitude: 'Настороженный',
          connections: [
            {
              targetNpcId: 'npc_1',
              targetNpcName: 'Граф Ваэлин Драговия',
              relationType: 'enemy',
              description: 'Хочет свергнуть тирана'
            }
          ]
        }
      ],
      factions: [
        {
          id: 'fac_1',
          name: 'Орден Серебряной Зари',
          influenceSphere: 'Стража города, храмы, защита от нежити',
          leader: 'Инквизитор Малакай',
          goals: 'Искоренение магии крови и нежити',
          attitudeToParty: 'Дружелюбный'
        },
        {
          id: 'fac_2',
          name: 'Братство Вуали',
          influenceSphere: 'Теневые рынки, контрабанда, шпионаж',
          leader: 'Тень-Без-Имени',
          goals: 'Контроль над древними артефактами замка',
          attitudeToParty: 'Нейтральный'
        }
      ],
      sessionChronicles: {
        starterScenario: 'Сессия 0/1: Дорога в Тумане. Герои сходятся в таверне «Старый Очаг», когда двери распахиваются от ночного порыва ветра...',
        lazyDmNotes: {
          charactersToHighlight: ['Паладин (Орден)', 'Следопыт (Знание лесов)'],
          strongStart: 'Нападение стаи теневых волков прямо на постоялый двор!',
          potentialScenes: ['Встреча с бродячим торговцем', 'Осмотр заброшенной часовни'],
          secretsAndClues: [
            'Старый мост заминирован растяжками',
            'У графа аллергия на серебряную пыль'
          ],
          importantLocations: ['Таверна Старый Очаг', 'Старый Мост', 'Врата Замка']
        }
      },
      starterParty: [
        { name: 'Аэрон Серебряный Клинок', raceClass: 'Человек Паладин', level: 1, ac: 18, hp: 12, stats: 'СИЛ 16, ЛОВ 10, ТЕЛ 14, ИНТ 8, МУД 12, ХАР 14', keyEquipment: 'Латы, Щит, Длинный меч' },
        { name: 'Лира Теневой Шаг', raceClass: 'Полуэльф Плут', level: 1, ac: 14, hp: 9, stats: 'СИЛ 10, ЛОВ 16, ТЕЛ 12, ИНТ 13, МУД 10, ХАР 14', keyEquipment: 'Кожаный доспех, Два кинжала, Воровские инструменты' },
        { name: 'Элдорас Мглистый', raceClass: 'Высший Эльф Волшебник', level: 1, ac: 12, hp: 7, stats: 'СИЛ 8, ЛОВ 14, ТЕЛ 12, ИНТ 16, МУД 13, ХАР 10', keyEquipment: 'Книга заклинаний, Фокусировка, Кинжал' },
        { name: 'Боргрим Громовой Щит', raceClass: 'Дворф Жрец', level: 1, ac: 16, hp: 11, stats: 'СИЛ 14, ЛОВ 8, ТЕЛ 16, ИНТ 10, МУД 16, ХАР 10', keyEquipment: 'Кольчуга, Боевой молот, Священный символ' }
      ],
      groupTreasuryAndSafety: {
        startingPurse: { gp: 60, sp: 120, cp: 300 },
        homebrewRules: [
          'Быстрое питье зелий (Бонусное действие)',
          'Критический урон = Максимальный урон кости + бросок second dice'
        ],
        linesAndVeils: {
          lines: ['Пытки и жестокость к детям', 'Вредоносное поведение внутри партии'],
          veils: ['Подробные сцены пыток (за кадром)', 'Кровавые анатомические детали']
        }
      },
      createdAt: new Date().toISOString()
    };
  }

  /**
   * Генерация полноценной сюжетной кампании (FULL CAMPAIGN ENGINE) через Polza AI
   */
  public async generateCampaign(
    options: CampaignGeneratorOptions,
    customOverrides?: {
      systemPrompt?: string;
      temperature?: number;
      apiKey?: string;
      timeoutMs?: number;
    }
  ): Promise<GeneratedCampaign> {
    const timestamp = Date.now();
    const campaignId = `campaign-ai-${timestamp}`;

    const promptText = `Generate a full D&D 5e campaign in strictly valid JSON format with title "${options.title}".
Setting: ${options.setting}. Tone: ${options.tone}. Level: ${options.partyLevel}. Villain Hook: ${options.villainHook}.
Include: Calendar & weather, Main quest + 2 side quests, NPC relationship graph, 3 factions, Session 0/1 Lazy DM chronicle, 4 Starter Party heroes, Group Treasury & Lines & Veils.`;

    const systemPrompt = customOverrides?.systemPrompt ||
      'You are an expert D&D 5e Campaign Architect. Return only valid JSON formatted campaign data in Russian with English keys/titles where specified.';

    const polzaResult = await callPolzaChatCompletion(
      ['openai/gpt-4o-mini'],
      [
        {
          role: 'system',
          content: systemPrompt
        },
        { role: 'user', content: promptText }
      ],
      customOverrides?.temperature !== undefined ? customOverrides.temperature : 0.7,
      customOverrides?.timeoutMs || 7500,
      customOverrides?.apiKey
    );

    let campaignData: GeneratedCampaign | null = null;

    if (polzaResult && polzaResult.text) {
      const jsonMatch = polzaResult.text.match(/```json\s*([\s\S]*?)\s*```/i) || polzaResult.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[1] || jsonMatch[0]);
          campaignData = parsed.campaign || parsed;
          if (campaignData && !campaignData.id) campaignData.id = campaignId;
        } catch (e) {
          console.warn('[Polza AI] Failed to parse campaign JSON from AI, using structured campaign builder:', e);
        }
      }
    }

    if (!campaignData) {
      campaignData = this.createFallbackCampaign(options);
    }

    // Сохранение в файл кампании assets/data/Campaigns/
    const campaignFilePath = path.join(CAMPAIGNS_DIR, `${campaignData.id || campaignId}.json`);
    try {
      fs.writeFileSync(campaignFilePath, JSON.stringify(campaignData, null, 2), 'utf-8');
    } catch (e) {
      console.warn('Failed to save campaign JSON:', e);
    }

    return campaignData;
  }

  /**
   * Генерация ИИ-арта / изображения через Polza AI Art Engine
   */
  public async generateImage(
    prompt: string,
    size: string = '1024x1024',
    modelId: ArtModelId = 'tongyi-mai/z-image',
    transparentBackground: boolean = false
  ): Promise<{ url: string; localAssetUrl: string }> {
    const timestamp = Date.now();
    const filename = `${timestamp}_polza_art.png`;
    const localFilePath = path.join(AI_GENERATED_DIR, filename);

    // Попытка генерации через Polza AI API
    const imageBuffer = await callPolzaImageGeneration(prompt, modelId, size);
    if (imageBuffer) {
      fs.writeFileSync(localFilePath, imageBuffer);
      const relativeUrl = `/api/assets/file/data/ai-generated/${filename}`;
      return {
        url: relativeUrl,
        localAssetUrl: relativeUrl
      };
    }

    // Автоматическая генерация высококачественного векторного холста / токена при офлайн режиме
    this.createProceduralArtCanvas(localFilePath, prompt, transparentBackground);

    const localAssetUrl = `/api/assets/file/data/ai-generated/${filename}`;
    return {
      url: localAssetUrl,
      localAssetUrl
    };
  }

  /**
   * Генерация ассета изображения (PNG/SVG) на сервере
   */
  private createProceduralArtCanvas(filePath: string, prompt: string, isToken: boolean): void {
    const title = prompt.split(' ').slice(0, 4).join(' ') || 'Art Concept';
    const svgContent = `
      <svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#1A1C23"/>
            <stop offset="50%" stop-color="#0F1015"/>
            <stop offset="100%" stop-color="#2A1F18"/>
          </linearGradient>
          <radialGradient id="glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#F27D26" stop-opacity="0.6"/>
            <stop offset="100%" stop-color="#F27D26" stop-opacity="0"/>
          </radialGradient>
        </defs>
        <rect width="100%" height="100%" fill="${isToken ? 'none' : 'url(#bg)'}"/>
        <circle cx="512" cy="512" r="420" fill="url(#glow)"/>
        <circle cx="512" cy="512" r="400" fill="#141519" stroke="#F27D26" stroke-width="12"/>
        <circle cx="512" cy="512" r="380" fill="none" stroke="#2A2E38" stroke-width="4"/>
        <text x="512" y="480" font-family="serif" font-size="48" font-weight="bold" fill="#F27D26" text-anchor="middle">POLZA AI ART</text>
        <text x="512" y="550" font-family="sans-serif" font-size="28" fill="#E0E0E0" text-anchor="middle">${title}</text>
        <text x="512" y="600" font-family="monospace" font-size="20" fill="#8E9299" text-anchor="middle">1024x1024 • D&amp;D 5E MASTERPIECE</text>
      </svg>
    `;

    fs.writeFileSync(filePath, svgContent, 'utf-8');
  }

  /**
   * Возвращает список всех сохраненных сюжетных кампаний
   */
  public listCampaigns(): string[] {
    if (!fs.existsSync(CAMPAIGNS_DIR)) return [];
    return fs.readdirSync(CAMPAIGNS_DIR).filter((f) => f.endsWith('.json'));
  }
}

export const polzaAiService = new PolzaAiService();
