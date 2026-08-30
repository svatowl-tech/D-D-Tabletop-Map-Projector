/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Модальное окно Polza AI Studio — Интерактивный генератор структурированного игрового контента D&D 5e,
 * генератор сюжетных кампаний и студия ИИ-артов.
 */

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Bot,
  Scroll,
  Image as ImageIcon,
  Map,
  ShieldAlert,
  Save,
  Send,
  RefreshCw,
  X,
  ChevronDown,
  ChevronRight,
  Brain,
  Zap,
  Users,
  Compass,
  DollarSign,
  HeartHandshake,
  Download,
  Palette,
  CheckCircle2,
  HelpCircle,
  Eye,
  Crosshair
} from 'lucide-react';
import {
  TextModelInfo,
  ArtModelInfo,
  PolzaEntityType,
  ArtStylePreset,
  PolzaMonsterData,
  PolzaNpcData,
  PolzaLocationData,
  PolzaMagicItemData,
  PolzaSpellData,
  PolzaQuestData,
  PolzaRuleData,
  PolzaLoreData,
  GeneratedCampaign
} from '../types/polzaAi';
import { polzaAiClient } from '../services/polzaAiClient';

interface PolzaAiStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyAssetToMap?: (assetUrl: string, title: string) => void;
}

export const PolzaAiStudioModal: React.FC<PolzaAiStudioModalProps> = ({
  isOpen,
  onClose,
  onApplyAssetToMap
}) => {
  // Режим вкладки: 'entity' | 'campaign' | 'art'
  const [activeTab, setActiveTab] = useState<'entity' | 'campaign' | 'art'>('entity');

  // Данные моделей
  const [textModels, setTextModels] = useState<TextModelInfo[]>([]);
  const [selectedTextModel, setSelectedTextModel] = useState<string>('deepseek/deepseek-r1-distill-llama-70b');
  const [artModels, setArtModels] = useState<ArtModelInfo[]>([]);
  const [selectedArtModel, setSelectedArtModel] = useState<string>('tongyi-mai/z-image');

  // --- СОСТОЯНИЕ ВКТАДКИ 1: ГЕНЕРАТОР СУЩНОСТЕЙ ---
  const [entityType, setEntityType] = useState<PolzaEntityType>('monster');
  const [entityPrompt, setEntityPrompt] = useState<string>('');
  const [cr, setCr] = useState<string>('5');
  const [spellLevel, setSpellLevel] = useState<number>(3);
  const [isGeneratingEntity, setIsGeneratingEntity] = useState<boolean>(false);
  const [entityResult, setEntityResult] = useState<{
    jsonData: any;
    reasoning?: string;
    imagePrompt?: string;
  } | null>(null);
  const [showReasoning, setShowReasoning] = useState<boolean>(true);

  // --- СОСТОЯНИЕ ВКЛАДКИ 2: ГЕНЕРАТОР КАМПАНИЙ ---
  const [campaignTitle, setCampaignTitle] = useState<string>('Кровавое Затмение Драговии');
  const [campaignSetting, setCampaignSetting] = useState<string>('Готический хоррор');
  const [campaignTone, setCampaignTone] = useState<string>('Мрачная атмосфера и психология');
  const [partyLevel, setPartyLevel] = useState<string>('1-3');
  const [villainHook, setVillainHook] = useState<string>('Древний граф-вампир в замке на скале');
  const [isGeneratingCampaign, setIsGeneratingCampaign] = useState<boolean>(false);
  const [campaignResult, setCampaignResult] = useState<GeneratedCampaign | null>(null);
  const [activeCampaignSection, setActiveCampaignSection] = useState<'quests' | 'graph' | 'notes' | 'party' | 'safety'>('quests');

  // --- СОСТОЯНИЕ ВКЛАДКИ 3: ГЕНЕРАТОР АРТОВ ---
  const [stylePreset, setStylePreset] = useState<ArtStylePreset>('dnd_cinematic');
  const [artPrompt, setArtPrompt] = useState<string>('Masterpiece fantasy art of a dark vampire lord in a Gothic castle, cinematic lighting, D&D 5e style');
  const [transparentBg, setTransparentBg] = useState<boolean>(false);
  const [isGeneratingArt, setIsGeneratingArt] = useState<boolean>(false);
  const [generatedArtUrl, setGeneratedArtUrl] = useState<string | null>(null);

  // Загрузка списков моделей при открытии
  useEffect(() => {
    if (!isOpen) return;
    polzaAiClient.getTextModels().then((res) => {
      setTextModels(res.models);
      if (res.defaultModel) setSelectedTextModel(res.defaultModel);
    });
    polzaAiClient.getImageModels().then((res) => {
      setArtModels(res.models);
      if (res.defaultModel) setSelectedArtModel(res.defaultModel);
    });
  }, [isOpen]);

  if (!isOpen) return null;

  // Хэндлер генерации сущности
  const handleGenerateEntity = async () => {
    if (!entityPrompt.trim()) return;
    setIsGeneratingEntity(true);
    try {
      const result = await polzaAiClient.generateJsonEntity(
        {
          entityType,
          userPrompt: entityPrompt,
          cr,
          spellLevel
        },
        selectedTextModel
      );
      setEntityResult({
        jsonData: result.jsonData,
        reasoning: result.reasoning,
        imagePrompt: result.imagePrompt
      });
    } catch (e: any) {
      alert(`Ошибка генерации: ${e.message || e}`);
    } finally {
      setIsGeneratingEntity(false);
    }
  };

  // Хэндлер генерации сюжетной кампании
  const handleGenerateCampaign = async () => {
    setIsGeneratingCampaign(true);
    try {
      const res = await polzaAiClient.generateCampaign({
        title: campaignTitle,
        system: 'D&D 5e',
        setting: campaignSetting,
        tone: campaignTone,
        partyLevel,
        villainHook
      });
      setCampaignResult(res.campaign);
    } catch (e: any) {
      alert(`Ошибка создания кампании: ${e.message || e}`);
    } finally {
      setIsGeneratingCampaign(false);
    }
  };

  // Хэндлер генерации арта
  const handleGenerateArt = async () => {
    if (!artPrompt.trim()) return;
    setIsGeneratingArt(true);
    try {
      const res = await polzaAiClient.generateImage(
        artPrompt,
        '1024x1024',
        selectedArtModel as any,
        transparentBg
      );
      if (res.data && res.data[0]) {
        setGeneratedArtUrl(res.data[0].localAssetUrl || res.data[0].url);
      }
    } catch (e: any) {
      alert(`Ошибка генерации арта: ${e.message || e}`);
    } finally {
      setIsGeneratingArt(false);
    }
  };

  // Быстрый перевод сгенерированного промпта в генератор артов
  const handleSendPromptToArtEngine = () => {
    if (entityResult?.imagePrompt) {
      setArtPrompt(entityResult.imagePrompt);
      setActiveTab('art');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-hidden">
      <div className="bg-[#12141A] border border-[#2A2E3D] text-[#E0E2EC] w-full max-w-6xl h-[90vh] rounded-2xl flex flex-col shadow-2xl overflow-hidden">
        
        {/* ВЕРХНИЙ ХЕДЕР МОДАЛКИ */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2A2E3D] bg-[#181A22]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-amber-500/20 to-orange-600/20 border border-amber-500/30 rounded-xl text-amber-400">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-wide text-white flex items-center gap-2">
                POLZA AI STUDIO <span className="text-xs px-2 py-0.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-full">D&amp;D 5e AI Engine</span>
              </h2>
              <p className="text-xs text-[#8E9299]">Генерация бестиария, сюжетных кампаний, предметов и артов с поддержкой рассуждений моделей</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-[#8E9299] hover:text-white bg-[#222530] hover:bg-[#2A2E3D] rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ПАНЕЛЬ НАВИГАЦИИ ПО ВКЛАДКАМ */}
        <div className="flex items-center gap-2 px-6 pt-3 bg-[#181A22] border-b border-[#2A2E3D]">
          <button
            onClick={() => setActiveTab('entity')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition ${
              activeTab === 'entity'
                ? 'border-amber-500 text-amber-400 bg-[#222530]/50 rounded-t-lg'
                : 'border-transparent text-[#8E9299] hover:text-white'
            }`}
          >
            <Bot className="w-4 h-4" />
            Генератор Сущностей (JSON)
          </button>

          <button
            onClick={() => setActiveTab('campaign')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition ${
              activeTab === 'campaign'
                ? 'border-amber-500 text-amber-400 bg-[#222530]/50 rounded-t-lg'
                : 'border-transparent text-[#8E9299] hover:text-white'
            }`}
          >
            <Map className="w-4 h-4" />
            Генератор Кампаний (Campaign)
          </button>

          <button
            onClick={() => setActiveTab('art')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition ${
              activeTab === 'art'
                ? 'border-amber-500 text-amber-400 bg-[#222530]/50 rounded-t-lg'
                : 'border-transparent text-[#8E9299] hover:text-white'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            ИИ-Студия Артов (Image)
          </button>
        </div>

        {/* ОСНОВНОЕ СОДЕРЖИМОЕ ВКЛАДОК */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* ==================== ВКЛАДКА 1: JSON AI ENGINE ==================== */}
          {activeTab === 'entity' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
              {/* Левая форма настроек */}
              <div className="lg:col-span-5 bg-[#181A22] border border-[#2A2E3D] rounded-xl p-5 space-y-4 flex flex-col justify-between">
                <div className="space-y-4">
                  <h3 className="text-base font-semibold text-white flex items-center gap-2">
                    <Brain className="w-5 h-5 text-amber-400" />
                    Параметры Генерации
                  </h3>

                  {/* Выбор модели ИИ */}
                  <div>
                    <label className="block text-xs font-medium text-[#8E9299] mb-1.5">Текстовая модель ИИ</label>
                    <select
                      value={selectedTextModel}
                      onChange={(e) => setSelectedTextModel(e.target.value)}
                      className="w-full bg-[#12141A] border border-[#2A2E3D] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                    >
                      {textModels.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({m.provider})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Выбор типа сущности D&D */}
                  <div>
                    <label className="block text-xs font-medium text-[#8E9299] mb-1.5">Тип сущности D&amp;D 5e</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'monster', label: 'Бестиарий' },
                        { id: 'npc', label: 'Персонаж / NPC' },
                        { id: 'location', label: 'Локация' },
                        { id: 'item', label: 'Предмет' },
                        { id: 'spell', label: 'Заклинание' },
                        { id: 'quest', label: 'Квест' },
                        { id: 'rule', label: 'Домашнее правило' },
                        { id: 'lore', label: 'Лор / Энциклопедия' }
                      ].map((item) => (
                        <button
                          key={item.id}
                          onClick={() => setEntityType(item.id as PolzaEntityType)}
                          className={`px-3 py-2 text-xs font-medium rounded-lg border text-left transition ${
                            entityType === item.id
                              ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                              : 'bg-[#12141A] border-[#2A2E3D] text-[#8E9299] hover:text-white'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Специфичные опции */}
                  {entityType === 'monster' && (
                    <div>
                      <label className="block text-xs font-medium text-[#8E9299] mb-1.5">Опасность (CR Challenge Rating)</label>
                      <input
                        type="text"
                        value={cr}
                        onChange={(e) => setCr(e.target.value)}
                        placeholder="Например: 1/2, 5, 12, 20"
                        className="w-full bg-[#12141A] border border-[#2A2E3D] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  )}

                  {entityType === 'spell' && (
                    <div>
                      <label className="block text-xs font-medium text-[#8E9299] mb-1.5">Уровень заклинания (0-9)</label>
                      <input
                        type="number"
                        min={0}
                        max={9}
                        value={spellLevel}
                        onChange={(e) => setSpellLevel(parseInt(e.target.value) || 0)}
                        className="w-full bg-[#12141A] border border-[#2A2E3D] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  )}

                  {/* Описание Промпта */}
                  <div>
                    <label className="block text-xs font-medium text-[#8E9299] mb-1.5">Промпт / Пожелания к сущности</label>
                    <textarea
                      rows={4}
                      value={entityPrompt}
                      onChange={(e) => setEntityPrompt(e.target.value)}
                      placeholder="Опишите желаемую сущность (например: Древний костяной дракон, обитающий в радиоактивной пещере, с уникальным ядовитым дыханием)..."
                      className="w-full bg-[#12141A] border border-[#2A2E3D] rounded-lg p-3 text-sm text-white focus:outline-none focus:border-amber-500 resize-none"
                    />
                  </div>
                </div>

                <button
                  onClick={handleGenerateEntity}
                  disabled={isGeneratingEntity || !entityPrompt.trim()}
                  className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-medium rounded-xl shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 transition mt-4"
                >
                  {isGeneratingEntity ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      Генерация D&amp;D 5e сущности...
                    </>
                  ) : (
                    <>
                      <Zap className="w-5 h-5 fill-current" />
                      Сгенерировать Сущность
                    </>
                  )}
                </button>
              </div>

              {/* Правая панель результатов */}
              <div className="lg:col-span-7 bg-[#181A22] border border-[#2A2E3D] rounded-xl p-5 flex flex-col justify-between overflow-y-auto">
                {entityResult ? (
                  <div className="space-y-4">
                    {/* Блок рассуждений <think> */}
                    {entityResult.reasoning && (
                      <div className="border border-amber-500/30 bg-amber-500/5 rounded-xl p-3">
                        <button
                          onClick={() => setShowReasoning(!showReasoning)}
                          className="w-full flex items-center justify-between text-xs font-semibold text-amber-400 mb-1"
                        >
                          <span className="flex items-center gap-1.5">
                            <Brain className="w-4 h-4" />
                            Блок Рассуждений ИИ (&lt;think&gt;)
                          </span>
                          {showReasoning ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </button>
                        {showReasoning && (
                          <p className="text-xs text-[#A0A4AD] whitespace-pre-line mt-2 font-mono bg-[#12141A]/60 p-2.5 rounded-lg border border-[#2A2E3D]">
                            {entityResult.reasoning}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Визуальная карточка статблока */}
                    <div className="bg-[#12141A] border border-[#2A2E3D] rounded-xl p-5 text-sm space-y-3 font-serif">
                      <div className="flex items-start justify-between border-b border-[#2A2E3D] pb-3">
                        <div>
                          <h4 className="text-xl font-bold text-amber-400">{entityResult.jsonData.name}</h4>
                          <p className="text-xs text-[#8E9299] italic">{entityResult.jsonData.englishName} • {entityResult.jsonData.type || entityResult.jsonData.category || entityType}</p>
                        </div>
                        {entityResult.jsonData.cr && (
                          <span className="px-2.5 py-1 bg-amber-500/20 text-amber-300 font-sans text-xs font-bold rounded-lg border border-amber-500/30">
                            CR {entityResult.jsonData.cr}
                          </span>
                        )}
                      </div>

                      {/* Статы монстра */}
                      {entityResult.jsonData.ac && (
                        <div className="font-sans grid grid-cols-3 gap-2 py-2 bg-[#181A22] rounded-lg p-3 border border-[#2A2E3D] text-center">
                          <div>
                            <span className="block text-[10px] text-[#8E9299]">КБ (AC)</span>
                            <span className="font-bold text-white text-base">{entityResult.jsonData.ac}</span>
                          </div>
                          <div>
                            <span className="block text-[10px] text-[#8E9299]">Хиты (HP)</span>
                            <span className="font-bold text-red-400 text-base">{entityResult.jsonData.hp}</span>
                          </div>
                          <div>
                            <span className="block text-[10px] text-[#8E9299]">Скорость</span>
                            <span className="font-bold text-emerald-400 text-xs">{entityResult.jsonData.speed || '30 фт.'}</span>
                          </div>
                        </div>
                      )}

                      {/* Описание / Флейвор */}
                      <p className="text-xs text-[#C0C4CC] leading-relaxed italic">
                        {entityResult.jsonData.flavor || entityResult.jsonData.description || entityResult.jsonData.atmosphere}
                      </p>

                      {/* Черты и действия */}
                      {entityResult.jsonData.actions && (
                        <div className="space-y-2 pt-2 border-t border-[#2A2E3D] font-sans">
                          <h5 className="text-xs font-bold text-amber-400 uppercase tracking-wider">Действия в бою</h5>
                          {entityResult.jsonData.actions.map((act: any, idx: number) => (
                            <div key={idx} className="text-xs bg-[#181A22] p-2 rounded border border-[#2A2E3D]">
                              <strong className="text-white">{act.name}:</strong> <span className="text-[#A0A4AD]">{act.desc}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Промпт для арта */}
                    {entityResult.imagePrompt && (
                      <div className="bg-[#181A22] border border-[#2A2E3D] rounded-xl p-3 flex items-center justify-between text-xs">
                        <div className="truncate max-w-[70%]">
                          <span className="text-[#8E9299] block text-[10px]">Скомпилированный промпт для арта:</span>
                          <span className="text-amber-300 font-mono truncate block">{entityResult.imagePrompt}</span>
                        </div>
                        <button
                          onClick={handleSendPromptToArtEngine}
                          className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg transition text-xs font-medium flex items-center gap-1.5"
                        >
                          <ImageIcon className="w-3.5 h-3.5" />
                          Создать Арт
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center text-[#8E9299] space-y-3 py-12">
                    <Bot className="w-12 h-12 stroke-[1.5] text-[#2A2E3D]" />
                    <p className="text-sm">Заполните форму слева и нажмите «Сгенерировать Сущность», чтобы получить готовые игровой статблок и математику D&amp;D 5e.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ==================== ВКЛАДКА 2: CAMPAIGN ENGINE ==================== */}
          {activeTab === 'campaign' && (
            <div className="space-y-6">
              {/* Форма запуска создания кампании */}
              {!campaignResult && (
                <div className="bg-[#181A22] border border-[#2A2E3D] rounded-xl p-6 space-y-5 max-w-3xl mx-auto">
                  <div className="flex items-center gap-3 border-b border-[#2A2E3D] pb-4">
                    <Map className="w-6 h-6 text-amber-400" />
                    <div>
                      <h3 className="text-lg font-bold text-white">Создание Полной Сюжетной Кампании D&amp;D 5e</h3>
                      <p className="text-xs text-[#8E9299]">Генерация лора, погоды, графа связей NPC, фракций, заметок и стартового отряда</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="block text-[#8E9299] mb-1">Название Кампании</label>
                      <input
                        type="text"
                        value={campaignTitle}
                        onChange={(e) => setCampaignTitle(e.target.value)}
                        className="w-full bg-[#12141A] border border-[#2A2E3D] rounded-lg p-2.5 text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[#8E9299] mb-1">Сеттинг</label>
                      <input
                        type="text"
                        value={campaignSetting}
                        onChange={(e) => setCampaignSetting(e.target.value)}
                        placeholder="Например: Готический хоррор, Киберпанк, Темное фэнтези"
                        className="w-full bg-[#12141A] border border-[#2A2E3D] rounded-lg p-2.5 text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[#8E9299] mb-1">Атмосфера и Тон</label>
                      <input
                        type="text"
                        value={campaignTone}
                        onChange={(e) => setCampaignTone(e.target.value)}
                        className="w-full bg-[#12141A] border border-[#2A2E3D] rounded-lg p-2.5 text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[#8E9299] mb-1">Уровень группы (Party Level)</label>
                      <select
                        value={partyLevel}
                        onChange={(e) => setPartyLevel(e.target.value)}
                        className="w-full bg-[#12141A] border border-[#2A2E3D] rounded-lg p-2.5 text-white"
                      >
                        <option value="1-3">Уровни 1 - 3 (Начинающие приключенцы)</option>
                        <option value="4-7">Уровни 4 - 7 (Герои провинции)</option>
                        <option value="8-11">Уровни 8 - 11 (Защитники королевства)</option>
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-[#8E9299] mb-1">Зацепка / Главный Антагонист</label>
                      <textarea
                        rows={3}
                        value={villainHook}
                        onChange={(e) => setVillainHook(e.target.value)}
                        className="w-full bg-[#12141A] border border-[#2A2E3D] rounded-lg p-2.5 text-white resize-none"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleGenerateCampaign}
                    disabled={isGeneratingCampaign}
                    className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-medium rounded-xl shadow-lg flex items-center justify-center gap-2 transition"
                  >
                    {isGeneratingCampaign ? (
                      <>
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        Создание и просчет сюжетной кампании...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5 fill-current" />
                        Сгенерировать Кампанию
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Дашборд сгенерированной кампании */}
              {campaignResult && (
                <div className="space-y-6">
                  {/* Шапка Кампании */}
                  <div className="bg-[#181A22] border border-[#2A2E3D] rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <span className="text-xs px-2.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full font-semibold">
                        {campaignResult.system} • {campaignResult.setting}
                      </span>
                      <h3 className="text-2xl font-bold text-white mt-1">{campaignResult.name}</h3>
                      <p className="text-xs text-[#8E9299] italic">{campaignResult.tone}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCampaignResult(null)}
                        className="px-3 py-2 bg-[#222530] text-[#8E9299] hover:text-white rounded-lg text-xs transition"
                      >
                        Создать новую
                      </button>
                    </div>
                  </div>

                  {/* Виджет Погоды и Календаря */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-[#181A22] border border-[#2A2E3D] p-4 rounded-xl text-xs">
                    <div>
                      <span className="text-[#8E9299] block">Дата в мире:</span>
                      <span className="font-bold text-amber-400">{campaignResult.calendarAndWeather.exactDate}</span>
                    </div>
                    <div>
                      <span className="text-[#8E9299] block">Сезон и Фаза Луны:</span>
                      <span className="font-bold text-white">{campaignResult.calendarAndWeather.season} ({campaignResult.calendarAndWeather.moonPhase})</span>
                    </div>
                    <div>
                      <span className="text-[#8E9299] block">Температура:</span>
                      <span className="font-bold text-sky-400">{campaignResult.calendarAndWeather.temperature}</span>
                    </div>
                    <div>
                      <span className="text-[#8E9299] block">Атмосферная погода:</span>
                      <span className="text-[#C0C4CC] italic">{campaignResult.calendarAndWeather.weatherDescription}</span>
                    </div>
                  </div>

                  {/* Навигация разделам кампании */}
                  <div className="flex gap-2 border-b border-[#2A2E3D] pb-2">
                    {[
                      { id: 'quests', label: 'Квесты и Задачи', icon: Scroll },
                      { id: 'graph', label: 'Граф Связей NPC', icon: Users },
                      { id: 'notes', label: 'Заметки Ленивого DM', icon: Compass },
                      { id: 'party', label: 'Стартовый Отряд (4)', icon: ShieldAlert },
                      { id: 'safety', label: 'Казна и Безопасность', icon: HeartHandshake }
                    ].map((sec) => {
                      const IconComp = sec.icon;
                      return (
                        <button
                          key={sec.id}
                          onClick={() => setActiveCampaignSection(sec.id as any)}
                          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg transition ${
                            activeCampaignSection === sec.id
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-[#181A22] text-[#8E9299] hover:text-white'
                          }`}
                        >
                          <IconComp className="w-3.5 h-3.5" />
                          {sec.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Секция: Квесты */}
                  {activeCampaignSection === 'quests' && (
                    <div className="space-y-4">
                      {/* Главный квест */}
                      <div className="bg-[#181A22] border border-amber-500/40 rounded-xl p-5 space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-base font-bold text-amber-400 flex items-center gap-2">
                            <Zap className="w-4 h-4 fill-current text-amber-400" />
                            Главный Квест: {campaignResult.quests.mainQuest.title}
                          </h4>
                          <span className="text-xs text-[#8E9299]">Заказчик: {campaignResult.quests.mainQuest.giverNpc}</span>
                        </div>
                        <p className="text-xs text-[#C0C4CC] leading-relaxed">{campaignResult.quests.mainQuest.synopsis}</p>
                        
                        <div className="space-y-1.5 pt-2">
                          <span className="text-xs font-semibold text-white">Цели квеста:</span>
                          {campaignResult.quests.mainQuest.objectives.map((obj) => (
                            <div key={obj.id} className="flex items-center gap-2 text-xs text-[#A0A4AD] bg-[#12141A] p-2 rounded border border-[#2A2E3D]">
                              <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                              {obj.description}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Секция: Интерактивный Граф NPC */}
                  {activeCampaignSection === 'graph' && (
                    <div className="bg-[#181A22] border border-[#2A2E3D] rounded-xl p-5 space-y-4">
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <Users className="w-4 h-4 text-amber-400" />
                        Интерактивная Сеть Связей Персонажей (NPC Graph)
                      </h4>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {campaignResult.npcGraph.map((node) => (
                          <div key={node.id} className="bg-[#12141A] border border-[#2A2E3D] rounded-lg p-4 space-y-2">
                            <div className="flex items-center justify-between">
                              <h5 className="font-bold text-amber-300 text-sm">{node.name}</h5>
                              <span className="text-[10px] px-2 py-0.5 bg-[#222530] text-[#8E9299] rounded">{node.attitude}</span>
                            </div>
                            <p className="text-xs text-[#8E9299]">{node.role}</p>

                            <div className="pt-2 space-y-1">
                              {node.connections.map((conn, idx) => (
                                <div key={idx} className="text-xs bg-[#181A22] p-2 rounded border border-[#2A2E3D] flex items-center justify-between">
                                  <span className="text-white">→ {conn.targetNpcName}</span>
                                  <span className="text-amber-400 font-semibold text-[10px] uppercase">{conn.relationType}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Секция: Заметки DM */}
                  {activeCampaignSection === 'notes' && (
                    <div className="bg-[#181A22] border border-[#2A2E3D] rounded-xl p-5 space-y-4">
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <Compass className="w-4 h-4 text-amber-400" />
                        Заметки Ленивого Мастера (Lazy DM Notes - Session 0/1)
                      </h4>

                      <div className="space-y-3 text-xs">
                        <div className="bg-[#12141A] p-3 rounded-lg border border-[#2A2E3D]">
                          <strong className="text-amber-400 block mb-1">🔥 Сильный Старт (Strong Start):</strong>
                          <p className="text-[#C0C4CC]">{campaignResult.sessionChronicles.lazyDmNotes.strongStart}</p>
                        </div>

                        <div className="bg-[#12141A] p-3 rounded-lg border border-[#2A2E3D]">
                          <strong className="text-amber-400 block mb-1">🕵️ Секреты и Зацепки (Secrets &amp; Clues):</strong>
                          <ul className="list-disc list-inside text-[#C0C4CC] space-y-1">
                            {campaignResult.sessionChronicles.lazyDmNotes.secretsAndClues.map((sec, idx) => (
                              <li key={idx}>{sec}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Секция: Стартовый Отряд */}
                  {activeCampaignSection === 'party' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {campaignResult.starterParty.map((hero, idx) => (
                        <div key={idx} className="bg-[#181A22] border border-[#2A2E3D] rounded-xl p-4 space-y-2 text-xs">
                          <h5 className="font-bold text-amber-400 text-sm">{hero.name}</h5>
                          <p className="text-[#8E9299]">{hero.raceClass} (Ур. {hero.level})</p>
                          <div className="flex items-center gap-3 font-semibold text-white py-1 bg-[#12141A] px-2 rounded">
                            <span>КБ: {hero.ac}</span>
                            <span className="text-red-400">HP: {hero.hp}</span>
                          </div>
                          <p className="text-[11px] text-[#A0A4AD] font-mono">{hero.stats}</p>
                          <p className="text-[10px] text-[#8E9299] italic">{hero.keyEquipment}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Секция: Безопасность */}
                  {activeCampaignSection === 'safety' && (
                    <div className="bg-[#181A22] border border-[#2A2E3D] rounded-xl p-5 space-y-4 text-xs">
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <HeartHandshake className="w-4 h-4 text-amber-400" />
                        Инструменты Безопасности (Lines &amp; Veils) &amp; Казна
                      </h4>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-[#12141A] p-4 rounded-lg border border-red-500/30">
                          <strong className="text-red-400 block mb-2">⛔ Линии (Строгие табу):</strong>
                          <ul className="list-disc list-inside text-[#C0C4CC] space-y-1">
                            {campaignResult.groupTreasuryAndSafety.linesAndVeils.lines.map((l, i) => (
                              <li key={i}>{l}</li>
                            ))}
                          </ul>
                        </div>

                        <div className="bg-[#12141A] p-4 rounded-lg border border-amber-500/30">
                          <strong className="text-amber-400 block mb-2">🌫️ Завесы (За кадром):</strong>
                          <ul className="list-disc list-inside text-[#C0C4CC] space-y-1">
                            {campaignResult.groupTreasuryAndSafety.linesAndVeils.veils.map((v, i) => (
                              <li key={i}>{v}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ==================== ВКЛАДКА 3: ART & IMAGE ENGINE ==================== */}
          {activeTab === 'art' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Форма генерации арта */}
              <div className="lg:col-span-6 bg-[#181A22] border border-[#2A2E3D] rounded-xl p-5 space-y-4">
                <h3 className="text-base font-semibold text-white flex items-center gap-2">
                  <Palette className="w-5 h-5 text-amber-400" />
                  Студия ИИ-Артов &amp; Токенов
                </h3>

                {/* Выбор визуальной модели */}
                <div>
                  <label className="block text-xs font-medium text-[#8E9299] mb-1.5">Модель генератора артов</label>
                  <select
                    value={selectedArtModel}
                    onChange={(e) => setSelectedArtModel(e.target.value)}
                    className="w-full bg-[#12141A] border border-[#2A2E3D] rounded-lg p-2.5 text-xs text-white"
                  >
                    {artModels.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Выбор стиля пресета */}
                <div>
                  <label className="block text-xs font-medium text-[#8E9299] mb-1.5">Художественный Пресет Стиля</label>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {[
                      { id: 'dnd_cinematic', label: 'D&D 5e Cinematic' },
                      { id: 'grimdark', label: 'Grimdark Dark Fantasy' },
                      { id: 'watercolor_rpg', label: 'Акварель RPG' },
                      { id: 'concept_art', label: 'Concept Art UE5' },
                      { id: 'oil_painting', label: 'Классическая Живопись' },
                      { id: 'isometric_token', label: 'Токен для Карты' },
                      { id: 'anime_fantasy', label: 'Аниме Фэнтези' },
                      { id: 'retro_pixel', label: 'Retro Pixel Art' }
                    ].map((p) => (
                      <button
                        key={p.id}
                        onClick={() => setStylePreset(p.id as ArtStylePreset)}
                        className={`p-2 rounded-lg border text-left transition ${
                          stylePreset === p.id
                            ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                            : 'bg-[#12141A] border-[#2A2E3D] text-[#8E9299] hover:text-white'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Прозрачный фон */}
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="transBg"
                    checked={transparentBg}
                    onChange={(e) => setTransparentBg(e.target.checked)}
                    className="rounded border-[#2A2E3D] text-amber-500 focus:ring-0"
                  />
                  <label htmlFor="transBg" className="text-xs text-[#C0C4CC] cursor-pointer">
                    Прозрачный фон (для токенов персонажей)
                  </label>
                </div>

                {/* Промпт */}
                <div>
                  <label className="block text-xs font-medium text-[#8E9299] mb-1.5">Англоязычный Промпт Иллюстрации</label>
                  <textarea
                    rows={4}
                    value={artPrompt}
                    onChange={(e) => setArtPrompt(e.target.value)}
                    className="w-full bg-[#12141A] border border-[#2A2E3D] rounded-lg p-3 text-xs text-white focus:outline-none focus:border-amber-500 font-mono resize-none"
                  />
                </div>

                <button
                  onClick={handleGenerateArt}
                  disabled={isGeneratingArt || !artPrompt.trim()}
                  className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-medium rounded-xl shadow-lg flex items-center justify-center gap-2 transition"
                >
                  {isGeneratingArt ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      Отрисовка ИИ-арта...
                    </>
                  ) : (
                    <>
                      <ImageIcon className="w-5 h-5" />
                      Сгенерировать Арт
                    </>
                  )}
                </button>
              </div>

              {/* Предпросмотр сгенерированного арта */}
              <div className="lg:col-span-6 bg-[#181A22] border border-[#2A2E3D] rounded-xl p-5 flex flex-col items-center justify-center min-h-[400px]">
                {generatedArtUrl ? (
                  <div className="space-y-4 w-full flex flex-col items-center">
                    <img
                      src={generatedArtUrl}
                      alt="Generated Art"
                      className="max-h-[380px] rounded-xl border border-[#2A2E3D] shadow-2xl object-contain bg-[#12141A]"
                    />

                    <div className="flex items-center gap-3 w-full">
                      {onApplyAssetToMap && (
                        <button
                          onClick={() => onApplyAssetToMap(generatedArtUrl, 'ИИ Токен')}
                          className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-black font-semibold rounded-lg text-xs flex items-center justify-center gap-1.5 transition"
                        >
                          <Send className="w-4 h-4" />
                          Отправить Токен на Карту
                        </button>
                      )}

                      <a
                        href={generatedArtUrl}
                        download="polza_art.png"
                        className="p-2.5 bg-[#222530] hover:bg-[#2A2E3D] text-white rounded-lg text-xs transition"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-[#8E9299] space-y-3">
                    <ImageIcon className="w-12 h-12 stroke-[1.5] text-[#2A2E3D] mx-auto" />
                    <p className="text-xs">Нажмите «Сгенерировать Арт», чтобы создать скомпилированную иллюстрацию D&amp;D 5e.</p>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
