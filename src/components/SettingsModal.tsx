/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * SettingsModal.tsx — Комплексный центр конфигурации и настроек VTT-ZERO
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  Settings,
  Sparkles,
  Tv,
  Shield,
  Layers,
  FolderTree,
  Wand2,
  Terminal,
  RotateCcw,
  Download,
  Upload,
  Check,
  HelpCircle,
  Cpu,
  Monitor,
  Volume2,
  Key,
  Sliders,
  FileCode,
  Dice5,
  Eye,
  EyeOff,
  Flame,
  Swords,
  Database
} from 'lucide-react';
import { appSettingsService, AppSettings, DEFAULT_APP_SETTINGS } from '../services/appSettingsService';
import { FogTextureStyle, BlackoutTheme } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenProjector?: () => void;
  isProjectorOpen?: boolean;
}

type TabKey = 'polzaAi' | 'projector' | 'permissions' | 'extensions' | 'storage' | 'generators' | 'systemPrompts';

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onOpenProjector,
  isProjectorOpen
}) => {
  const [settings, setSettings] = useState<AppSettings>(() => appSettingsService.getSettings());
  const [activeTab, setActiveTab] = useState<TabKey>('polzaAi');
  const [showSavedToast, setShowSavedToast] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = appSettingsService.subscribe((newSettings) => {
      setSettings(newSettings);
    });
    return unsub;
  }, []);

  if (!isOpen) return null;

  const handleUpdate = (updater: (prev: AppSettings) => AppSettings) => {
    const updated = appSettingsService.updateSettings(updater);
    setSettings(updated);
    triggerSavedIndicator();
  };

  const triggerSavedIndicator = () => {
    setShowSavedToast(true);
    setTimeout(() => setShowSavedToast(false), 2000);
  };

  const handleResetCurrentCategory = () => {
    if (window.confirm(`Сбросить настройки раздела "${getTabTitle(activeTab)}" к значениям по умолчанию?`)) {
      const reset = appSettingsService.resetCategory(activeTab);
      setSettings(reset);
      triggerSavedIndicator();
    }
  };

  const handleResetAll = () => {
    if (window.confirm('Сбросить ВСЕ настройки приложения к заводским значениям?')) {
      const reset = appSettingsService.resetAll();
      setSettings(reset);
      triggerSavedIndicator();
    }
  };

  const handleExport = () => {
    const jsonStr = appSettingsService.exportJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vtt_zero_settings_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const ok = appSettingsService.importJson(content);
        if (ok) {
          setImportError(null);
          triggerSavedIndicator();
        } else {
          setImportError('Неверный формат JSON файла настроек.');
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const getTabTitle = (tab: TabKey): string => {
    switch (tab) {
      case 'polzaAi': return 'Польза AI';
      case 'projector': return 'Второе окно / Проектор';
      case 'permissions': return 'Разрешения и Безопасность';
      case 'extensions': return 'Модули & Homebrew';
      case 'storage': return 'Рабочая папка & Хранилище';
      case 'generators': return 'Генераторы D&D';
      case 'systemPrompts': return 'Системные промпты';
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-6 animate-fadeIn">
      <div className="relative flex flex-col w-full max-w-5xl h-[90vh] bg-neutral-900 border border-neutral-700/80 rounded-2xl shadow-2xl overflow-hidden text-neutral-200">
        
        {/* Верхняя шапка модального окна */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-950/60">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 shadow-inner">
              <Settings className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-neutral-100 flex items-center gap-2">
                Параметры и Настройки VTT-ZERO
                {showSavedToast && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 animate-pulse">
                    <Check className="w-3 h-3" /> Сохранено
                  </span>
                )}
              </h2>
              <p className="text-xs text-neutral-400">
                Полный контроль над AI, проектором, правилами, рабочей директорией и системными промптами
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              title="Экспорт настроек в JSON"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-lg text-neutral-300 transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> Экспорт
            </button>

            <label className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-lg text-neutral-300 transition-colors cursor-pointer">
              <Upload className="w-3.5 h-3.5" /> Импорт
              <input type="file" accept=".json" onChange={handleImport} className="hidden" />
            </label>

            <button
              onClick={onClose}
              className="p-2 text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 rounded-lg transition-colors ml-2"
              title="Закрыть настройки"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {importError && (
          <div className="px-6 py-2 bg-rose-500/20 border-b border-rose-500/30 text-rose-300 text-xs flex items-center justify-between">
            <span>{importError}</span>
            <button onClick={() => setImportError(null)} className="underline hover:text-white">Закрыть</button>
          </div>
        )}

        {/* Основное тело с сайдбаром и контентом */}
        <div className="flex flex-1 overflow-hidden">
          
          {/* Боковая панель вкладок */}
          <div className="w-64 border-r border-neutral-800 bg-neutral-950/40 p-3 flex flex-col gap-1 overflow-y-auto">
            <button
              onClick={() => setActiveTab('polzaAi')}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all text-left ${
                activeTab === 'polzaAi'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              <span>1. Польза AI (LLM & Art)</span>
            </button>

            <button
              onClick={() => setActiveTab('projector')}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all text-left ${
                activeTab === 'projector'
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60'
              }`}
            >
              <Tv className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>2. Второе окно / Проектор</span>
            </button>

            <button
              onClick={() => setActiveTab('permissions')}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all text-left ${
                activeTab === 'permissions'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60'
              }`}
            >
              <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>3. Разрешения & Безопасность</span>
            </button>

            <button
              onClick={() => setActiveTab('extensions')}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all text-left ${
                activeTab === 'extensions'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60'
              }`}
            >
              <Layers className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>4. Модули & D&D Homebrew</span>
            </button>

            <button
              onClick={() => setActiveTab('storage')}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all text-left ${
                activeTab === 'storage'
                  ? 'bg-violet-500/20 text-violet-300 border border-violet-500/40 shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60'
              }`}
            >
              <FolderTree className="w-4 h-4 text-violet-400 shrink-0" />
              <span>5. Рабочая папка & Хранилище</span>
            </button>

            <button
              onClick={() => setActiveTab('generators')}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all text-left ${
                activeTab === 'generators'
                  ? 'bg-pink-500/20 text-pink-300 border border-pink-500/40 shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60'
              }`}
            >
              <Wand2 className="w-4 h-4 text-pink-400 shrink-0" />
              <span>6. Настройка генераторов</span>
            </button>

            <button
              onClick={() => setActiveTab('systemPrompts')}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all text-left ${
                activeTab === 'systemPrompts'
                  ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40 shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60'
              }`}
            >
              <Terminal className="w-4 h-4 text-orange-400 shrink-0" />
              <span>7. Системные промпты</span>
            </button>

            <div className="mt-auto pt-4 border-t border-neutral-800 flex flex-col gap-2">
              <button
                onClick={handleResetCurrentCategory}
                className="flex items-center justify-center gap-1.5 px-3 py-2 text-[11px] text-neutral-400 hover:text-neutral-200 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-lg transition-colors"
              >
                <RotateCcw className="w-3 h-3" /> Сброс этого раздела
              </button>
              <button
                onClick={handleResetAll}
                className="flex items-center justify-center gap-1.5 px-3 py-2 text-[11px] text-rose-400/80 hover:text-rose-300 bg-rose-950/20 hover:bg-rose-900/30 border border-rose-900/30 rounded-lg transition-colors"
              >
                <RotateCcw className="w-3 h-3 text-rose-400" /> Сбросить всё
              </button>
            </div>
          </div>

          {/* Область контента вкладки */}
          <div className="flex-1 p-6 overflow-y-auto bg-neutral-900/50">
            {/* 1. ПОЛЬЗА AI */}
            {activeTab === 'polzaAi' && (
              <div className="space-y-6 max-w-3xl animate-fadeIn">
                <div>
                  <h3 className="text-base font-semibold text-amber-300 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-400" />
                    Настройки интеграции Польза AI
                  </h3>
                  <p className="text-xs text-neutral-400 mt-1">
                    Управление моделями генерации монстров, заклинаний, предметов, сюжетных кампаний и артов.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Выбор основной модели */}
                  <div className="bg-neutral-950/60 border border-neutral-800 rounded-xl p-4 space-y-2">
                    <label className="text-xs font-semibold text-neutral-200 flex items-center gap-1.5">
                      <Cpu className="w-4 h-4 text-amber-400" /> Текстовая модель по умолчанию
                    </label>
                    <select
                      value={settings.polzaAi.defaultModel}
                      onChange={(e) => handleUpdate((p) => ({ ...p, polzaAi: { ...p.polzaAi, defaultModel: e.target.value } }))}
                      className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-amber-500"
                    >
                      <option value="openai/gpt-4o-mini">OpenAI GPT-4o Mini (Быстрый 1-3с, рекомендуемый)</option>
                      <option value="deepseek/deepseek-chat">DeepSeek Chat V3 (Сюжет и атмосфера)</option>
                      <option value="qwen/qwen-2.5-72b-instruct">Qwen 2.5 72B Instruct (Глубокий фэнтези лор)</option>
                      <option value="deepseek/deepseek-r1-distill-llama-70b">DeepSeek R1 Distill 70B (Рассуждения &lt;think&gt;)</option>
                      <option value="meta-llama/llama-3.3-70b-instruct">Meta Llama 3.3 70B Instruct</option>
                      <option value="openai/gpt-4o">OpenAI GPT-4o (Флагман)</option>
                    </select>
                    <p className="text-[11px] text-neutral-500">
                      GPT-4o Mini гарантирует мгновенный ответ без задержек в браузере.
                    </p>
                  </div>

                  {/* Таймаут запроса */}
                  <div className="bg-neutral-950/60 border border-neutral-800 rounded-xl p-4 space-y-2">
                    <label className="text-xs font-semibold text-neutral-200 flex items-center justify-between">
                      <span>Лимит времени ответа (Таймаут)</span>
                      <span className="text-amber-400 font-mono">{settings.polzaAi.requestTimeoutSec} сек</span>
                    </label>
                    <input
                      type="range"
                      min={5}
                      max={30}
                      step={1}
                      value={settings.polzaAi.requestTimeoutSec}
                      onChange={(e) => handleUpdate((p) => ({ ...p, polzaAi: { ...p.polzaAi, requestTimeoutSec: Number(e.target.value) } }))}
                      className="w-full accent-amber-500"
                    />
                    <p className="text-[11px] text-neutral-500">
                      Если модель не уложится в этот срок, сервер автоматически включит точный D&D 5e fallback генератор.
                    </p>
                  </div>

                  {/* Температура креативности */}
                  <div className="bg-neutral-950/60 border border-neutral-800 rounded-xl p-4 space-y-2">
                    <label className="text-xs font-semibold text-neutral-200 flex items-center justify-between">
                      <span className="flex items-center gap-1.5"><Sliders className="w-3.5 h-3.5 text-amber-400" /> Температура (Креативность)</span>
                      <span className="text-amber-400 font-mono">{settings.polzaAi.temperature}</span>
                    </label>
                    <input
                      type="range"
                      min={0.1}
                      max={1.2}
                      step={0.05}
                      value={settings.polzaAi.temperature}
                      onChange={(e) => handleUpdate((p) => ({ ...p, polzaAi: { ...p.polzaAi, temperature: parseFloat(e.target.value) } }))}
                      className="w-full accent-amber-500"
                    />
                    <div className="flex justify-between text-[10px] text-neutral-500">
                      <span>0.2 Строгие правила 5e</span>
                      <span>0.7 Баланс</span>
                      <span>1.0 Бурная фантазия</span>
                    </div>
                  </div>

                  {/* Лимит токенов */}
                  <div className="bg-neutral-950/60 border border-neutral-800 rounded-xl p-4 space-y-2">
                    <label className="text-xs font-semibold text-neutral-200 flex items-center justify-between">
                      <span>Макс. токенов ответа (Max Tokens)</span>
                      <span className="text-amber-400 font-mono">{settings.polzaAi.maxTokens}</span>
                    </label>
                    <input
                      type="range"
                      min={1000}
                      max={6000}
                      step={250}
                      value={settings.polzaAi.maxTokens}
                      onChange={(e) => handleUpdate((p) => ({ ...p, polzaAi: { ...p.polzaAi, maxTokens: Number(e.target.value) } }))}
                      className="w-full accent-amber-500"
                    />
                    <p className="text-[11px] text-neutral-500">
                      2500 токенов идеально для полной таблицы статблока и способностей.
                    </p>
                  </div>
                </div>

                {/* Пользовательский API ключ и эндпоинт */}
                <div className="bg-neutral-950/60 border border-neutral-800 rounded-xl p-4 space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-neutral-200 flex items-center gap-1.5">
                      <Key className="w-4 h-4 text-amber-400" /> Пользовательский API Ключ Polza AI (Опционально)
                    </label>
                    <input
                      type="password"
                      placeholder="Оставьте пустым для использования встроенного ключа сервера"
                      value={settings.polzaAi.customApiKey}
                      onChange={(e) => handleUpdate((p) => ({ ...p, polzaAi: { ...p.polzaAi, customApiKey: e.target.value } }))}
                      className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-xs text-neutral-200 font-mono focus:outline-none focus:border-amber-500"
                    />
                    <p className="text-[11px] text-neutral-500">
                      При указании собственного ключа все запросы студии и генераторов пойдут через ваш персональный аккаунт Polza.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-neutral-800/80">
                    <label className="flex items-center gap-2.5 text-xs text-neutral-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.polzaAi.autoSaveEntities}
                        onChange={(e) => handleUpdate((p) => ({ ...p, polzaAi: { ...p.polzaAi, autoSaveEntities: e.target.checked } }))}
                        className="rounded border-neutral-700 text-amber-500 focus:ring-amber-500"
                      />
                      <span>Автосохранение монстров и предметов на диск</span>
                    </label>

                    <label className="flex items-center gap-2.5 text-xs text-neutral-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.polzaAi.autoSaveCampaigns}
                        onChange={(e) => handleUpdate((p) => ({ ...p, polzaAi: { ...p.polzaAi, autoSaveCampaigns: e.target.checked } }))}
                        className="rounded border-neutral-700 text-amber-500 focus:ring-amber-500"
                      />
                      <span>Автосохранение сгенерированных кампаний</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* 2. ВТОРОЕ ОКНО / ПРОЕКТОР */}
            {activeTab === 'projector' && (
              <div className="space-y-6 max-w-3xl animate-fadeIn">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-indigo-300 flex items-center gap-2">
                      <Tv className="w-5 h-5 text-indigo-400" />
                      Настройки второго экрана / Проектора (Player View)
                    </h3>
                    <p className="text-xs text-neutral-400 mt-1">
                      Конфигурация вывода изображения на стол или экран игроков без элементов интерфейса мастера.
                    </p>
                  </div>
                  {onOpenProjector && (
                    <button
                      onClick={onOpenProjector}
                      className="px-3 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors flex items-center gap-1.5 shadow-md"
                    >
                      <Monitor className="w-3.5 h-3.5" />
                      {isProjectorOpen ? 'Переоткрыть экран игроков' : 'Запустить экран игроков'}
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Пресет разрешения */}
                  <div className="bg-neutral-950/60 border border-neutral-800 rounded-xl p-4 space-y-2">
                    <label className="text-xs font-semibold text-neutral-200">Разрешение проектора / стола</label>
                    <select
                      value={settings.projector.resolutionPreset}
                      onChange={(e) => handleUpdate((p) => ({ ...p, projector: { ...p.projector, resolutionPreset: e.target.value as any } }))}
                      className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="1080p">Full HD 1080p (1920 × 1080) — Стандарт</option>
                      <option value="4k">4K Ultra HD (3840 × 2160) — Высокая четкость</option>
                      <option value="1440p">2K QHD (2560 × 1440)</option>
                      <option value="720p">HD 720p (1280 × 720)</option>
                      <option value="custom">Пользовательское разрешение</option>
                    </select>

                    {settings.projector.resolutionPreset === 'custom' && (
                      <div className="grid grid-cols-2 gap-2 pt-2">
                        <input
                          type="number"
                          placeholder="Ширина (px)"
                          value={settings.projector.customWidth}
                          onChange={(e) => handleUpdate((p) => ({ ...p, projector: { ...p.projector, customWidth: Number(e.target.value) } }))}
                          className="bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-xs text-neutral-200"
                        />
                        <input
                          type="number"
                          placeholder="Высота (px)"
                          value={settings.projector.customHeight}
                          onChange={(e) => handleUpdate((p) => ({ ...p, projector: { ...p.projector, customHeight: Number(e.target.value) } }))}
                          className="bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-xs text-neutral-200"
                        />
                      </div>
                    )}
                  </div>

                  {/* Стиль тумана войны по умолчанию */}
                  <div className="bg-neutral-950/60 border border-neutral-800 rounded-xl p-4 space-y-2">
                    <label className="text-xs font-semibold text-neutral-200">Текстура тумана войны для игроков</label>
                    <select
                      value={settings.projector.defaultFogStyle}
                      onChange={(e) => handleUpdate((p) => ({ ...p, projector: { ...p.projector, defaultFogStyle: e.target.value as FogTextureStyle } }))}
                      className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="classic_black">Классический черный непроглядный туман</option>
                      <option value="parchment_burnt">Обожженный старинный пергамент</option>
                      <option value="cloud_smoke">Клубящийся мистический дым</option>
                      <option value="dungeon_stone">Древняя каменная кладка</option>
                      <option value="void_stars">Звездная пустота Астрала</option>
                    </select>
                    <p className="text-[11px] text-neutral-500">
                      Игроки видят выбранную стилизованную текстуру в неразведанных зонах карты.
                    </p>
                  </div>

                  {/* Отображение HP монстров в боевом HUD */}
                  <div className="bg-neutral-950/60 border border-neutral-800 rounded-xl p-4 space-y-2">
                    <label className="text-xs font-semibold text-neutral-200">Отображение здоровья врагов игрокам</label>
                    <select
                      value={settings.projector.playerCombatHpDisplay}
                      onChange={(e) => handleUpdate((p) => ({ ...p, projector: { ...p.projector, playerCombatHpDisplay: e.target.value as any } }))}
                      className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="bars_only">Только полоска здоровья без точных чисел (Рекомендуется)</option>
                      <option value="status_text">Текстовый статус («Невредим», «Ранен», «При смерти»)</option>
                      <option value="exact">Точные цифры HP (34 / 52)</option>
                      <option value="hidden">Полностью скрыть HP врагов</option>
                    </select>
                  </div>

                  {/* Тема полного затемнения Blackout */}
                  <div className="bg-neutral-950/60 border border-neutral-800 rounded-xl p-4 space-y-2">
                    <label className="text-xs font-semibold text-neutral-200">Тема полного затемнения (Blackout)</label>
                    <select
                      value={settings.projector.defaultBlackoutTheme}
                      onChange={(e) => handleUpdate((p) => ({ ...p, projector: { ...p.projector, defaultBlackoutTheme: e.target.value as BlackoutTheme } }))}
                      className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="pitch_black">Полная тьма (#000000)</option>
                      <option value="theater_curtain">Театральный бордовый занавес</option>
                      <option value="parchment_notes">Древний пергамент с рунами</option>
                      <option value="tavern_fire">Камин уютной таверны</option>
                    </select>
                  </div>
                </div>

                {/* Флажки отображения элементов игрокам */}
                <div className="bg-neutral-950/60 border border-neutral-800 rounded-xl p-4 space-y-3">
                  <h4 className="text-xs font-semibold text-neutral-300">Видимость элементов на экране игроков</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-neutral-300">
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.projector.showGridToPlayers}
                        onChange={(e) => handleUpdate((p) => ({ ...p, projector: { ...p.projector, showGridToPlayers: e.target.checked } }))}
                        className="rounded border-neutral-700 text-indigo-500 focus:ring-indigo-500"
                      />
                      <span>Отображать тактическую сетку</span>
                    </label>

                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.projector.showRulerToPlayers}
                        onChange={(e) => handleUpdate((p) => ({ ...p, projector: { ...p.projector, showRulerToPlayers: e.target.checked } }))}
                        className="rounded border-neutral-700 text-indigo-500 focus:ring-indigo-500"
                      />
                      <span>Показывать дистанцию линейки и шаблонов</span>
                    </label>

                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.projector.showLaserToPlayers}
                        onChange={(e) => handleUpdate((p) => ({ ...p, projector: { ...p.projector, showLaserToPlayers: e.target.checked } }))}
                        className="rounded border-neutral-700 text-indigo-500 focus:ring-indigo-500"
                      />
                      <span>Показывать лазерную указку мастера</span>
                    </label>

                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.projector.showPingsToPlayers}
                        onChange={(e) => handleUpdate((p) => ({ ...p, projector: { ...p.projector, showPingsToPlayers: e.target.checked } }))}
                        className="rounded border-neutral-700 text-indigo-500 focus:ring-indigo-500"
                      />
                      <span>Показывать тактические пинги (сигналы)</span>
                    </label>

                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.projector.showMonsterRealNames}
                        onChange={(e) => handleUpdate((p) => ({ ...p, projector: { ...p.projector, showMonsterRealNames: e.target.checked } }))}
                        className="rounded border-neutral-700 text-indigo-500 focus:ring-indigo-500"
                      />
                      <span>Показывать подлинные имена скрытых монстров</span>
                    </label>

                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.projector.cameraFollowDm}
                        onChange={(e) => handleUpdate((p) => ({ ...p, projector: { ...p.projector, cameraFollowDm: e.target.checked } }))}
                        className="rounded border-neutral-700 text-indigo-500 focus:ring-indigo-500"
                      />
                      <span>Синхронизировать перемещение камеры с мастером</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* 3. РАЗРЕШЕНИЯ & БЕЗОПАСНОСТЬ */}
            {activeTab === 'permissions' && (
              <div className="space-y-6 max-w-3xl animate-fadeIn">
                <div>
                  <h3 className="text-base font-semibold text-emerald-300 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-emerald-400" />
                    Разрешения, Безопасность и Поведение
                  </h3>
                  <p className="text-xs text-neutral-400 mt-1">
                    Управление доступом к системному буферу обмена, защитой от случайного закрытия и скрытностью мастера.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="bg-neutral-950/60 border border-neutral-800 rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold text-neutral-200">Вставка карт из буфера обмена (Ctrl + V)</div>
                      <div className="text-[11px] text-neutral-500">Автоматически создавать сцену или токен при вставке картинки прямо в окно VTT.</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.permissions.allowClipboardPasteMap}
                      onChange={(e) => handleUpdate((p) => ({ ...p, permissions: { ...p.permissions, allowClipboardPasteMap: e.target.checked } }))}
                      className="rounded border-neutral-700 text-emerald-500 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="bg-neutral-950/60 border border-neutral-800 rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold text-neutral-200">Предупреждать перед закрытием вкладки</div>
                      <div className="text-[11px] text-neutral-500">Защищает от случайной потери несохраненного состояния активного боя.</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.permissions.warnOnTabClose}
                      onChange={(e) => handleUpdate((p) => ({ ...p, permissions: { ...p.permissions, warnOnTabClose: e.target.checked } }))}
                      className="rounded border-neutral-700 text-emerald-500 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="bg-neutral-950/60 border border-neutral-800 rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold text-neutral-200">Разрешить скрытые броски кубиков мастера (Secret Rolls)</div>
                      <div className="text-[11px] text-neutral-500">Броски мастера за ширмой не транслируются в экран игроков.</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.permissions.allowSecretDmRolls}
                      onChange={(e) => handleUpdate((p) => ({ ...p, permissions: { ...p.permissions, allowSecretDmRolls: e.target.checked } }))}
                      className="rounded border-neutral-700 text-emerald-500 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="bg-neutral-950/60 border border-neutral-800 rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold text-neutral-200">Автовоспроизведение Web Audio</div>
                      <div className="text-[11px] text-neutral-500">Фоновый эмбиент и звуковые эффекты кубиков без дополнительного клика.</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.permissions.allowWebAudioAutoplay}
                      onChange={(e) => handleUpdate((p) => ({ ...p, permissions: { ...p.permissions, allowWebAudioAutoplay: e.target.checked } }))}
                      className="rounded border-neutral-700 text-emerald-500 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div className="bg-neutral-950/60 border border-neutral-800 rounded-xl p-4 space-y-2">
                      <label className="text-xs font-semibold text-neutral-200 flex justify-between">
                        <span>Длительность следа лазерной указки</span>
                        <span className="text-emerald-400 font-mono">{settings.permissions.laserPointerDurationSec} с</span>
                      </label>
                      <input
                        type="range"
                        min={1}
                        max={10}
                        value={settings.permissions.laserPointerDurationSec}
                        onChange={(e) => handleUpdate((p) => ({ ...p, permissions: { ...p.permissions, laserPointerDurationSec: Number(e.target.value) } }))}
                        className="w-full accent-emerald-500"
                      />
                    </div>

                    <div className="bg-neutral-950/60 border border-neutral-800 rounded-xl p-4 space-y-2">
                      <label className="text-xs font-semibold text-neutral-200 flex justify-between">
                        <span>Длительность пульсации тактического пинга</span>
                        <span className="text-emerald-400 font-mono">{settings.permissions.pingDurationSec} с</span>
                      </label>
                      <input
                        type="range"
                        min={2}
                        max={12}
                        value={settings.permissions.pingDurationSec}
                        onChange={(e) => handleUpdate((p) => ({ ...p, permissions: { ...p.permissions, pingDurationSec: Number(e.target.value) } }))}
                        className="w-full accent-emerald-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 4. МОДУЛИ & HOMEBREW */}
            {activeTab === 'extensions' && (
              <div className="space-y-6 max-w-3xl animate-fadeIn">
                <div>
                  <h3 className="text-base font-semibold text-cyan-300 flex items-center gap-2">
                    <Layers className="w-5 h-5 text-cyan-400" />
                    Модули интерфейса и правила D&D 5e Homebrew
                  </h3>
                  <p className="text-xs text-neutral-400 mt-1">
                    Настройка видимости инструментов в верхней панели и опциональных правил боевки.
                  </p>
                </div>

                <div className="bg-neutral-950/60 border border-neutral-800 rounded-xl p-4 space-y-3">
                  <h4 className="text-xs font-semibold text-cyan-400 flex items-center gap-1.5">
                    <Sliders className="w-4 h-4" /> Быстрые кнопки в панели мастера
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs text-neutral-300">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.extensions.showPolzaAiButton}
                        onChange={(e) => handleUpdate((p) => ({ ...p, extensions: { ...p.extensions, showPolzaAiButton: e.target.checked } }))}
                        className="rounded border-neutral-700 text-cyan-500"
                      />
                      <span>Польза AI Студия</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.extensions.showDndGenButton}
                        onChange={(e) => handleUpdate((p) => ({ ...p, extensions: { ...p.extensions, showDndGenButton: e.target.checked } }))}
                        className="rounded border-neutral-700 text-cyan-500"
                      />
                      <span>Генератор подземелий</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.extensions.showMapStudioButton}
                        onChange={(e) => handleUpdate((p) => ({ ...p, extensions: { ...p.extensions, showMapStudioButton: e.target.checked } }))}
                        className="rounded border-neutral-700 text-cyan-500"
                      />
                      <span>Map Studio 2D</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.extensions.showAssetFolderButton}
                        onChange={(e) => handleUpdate((p) => ({ ...p, extensions: { ...p.extensions, showAssetFolderButton: e.target.checked } }))}
                        className="rounded border-neutral-700 text-cyan-500"
                      />
                      <span>Ассеты & Папка</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.extensions.showAudioButton}
                        onChange={(e) => handleUpdate((p) => ({ ...p, extensions: { ...p.extensions, showAudioButton: e.target.checked } }))}
                        className="rounded border-neutral-700 text-cyan-500"
                      />
                      <span>Музыка & Эмбиент</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.extensions.showCombatButton}
                        onChange={(e) => handleUpdate((p) => ({ ...p, extensions: { ...p.extensions, showCombatButton: e.target.checked } }))}
                        className="rounded border-neutral-700 text-cyan-500"
                      />
                      <span>Боевой трекер</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.extensions.showSrdButton}
                        onChange={(e) => handleUpdate((p) => ({ ...p, extensions: { ...p.extensions, showSrdButton: e.target.checked } }))}
                        className="rounded border-neutral-700 text-cyan-500"
                      />
                      <span>Справочник SRD 5e</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.extensions.showNotesButton}
                        onChange={(e) => handleUpdate((p) => ({ ...p, extensions: { ...p.extensions, showNotesButton: e.target.checked } }))}
                        className="rounded border-neutral-700 text-cyan-500"
                      />
                      <span>Заметки мастера</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.extensions.showDiceButton}
                        onChange={(e) => handleUpdate((p) => ({ ...p, extensions: { ...p.extensions, showDiceButton: e.target.checked } }))}
                        className="rounded border-neutral-700 text-cyan-500"
                      />
                      <span>3D Дайсомет</span>
                    </label>
                  </div>
                </div>

                <div className="bg-neutral-950/60 border border-neutral-800 rounded-xl p-4 space-y-3">
                  <h4 className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
                    <Swords className="w-4 h-4" /> Популярные правила D&D 5e Homebrew
                  </h4>
                  <div className="space-y-2.5 text-xs text-neutral-300">
                    <label className="flex items-start gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.extensions.rulePotionBonusAction}
                        onChange={(e) => handleUpdate((p) => ({ ...p, extensions: { ...p.extensions, rulePotionBonusAction: e.target.checked } }))}
                        className="rounded border-neutral-700 text-amber-500 mt-0.5"
                      />
                      <div>
                        <div className="font-medium text-neutral-200">Зелья лечения бонусным действием (Potion Bonus Action)</div>
                        <div className="text-[11px] text-neutral-500">Выпить зелье себе — бонусное действие; споить союзнику — основное действие.</div>
                      </div>
                    </label>

                    <label className="flex items-start gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.extensions.ruleCriticalExploding}
                        onChange={(e) => handleUpdate((p) => ({ ...p, extensions: { ...p.extensions, ruleCriticalExploding: e.target.checked } }))}
                        className="rounded border-neutral-700 text-amber-500 mt-0.5"
                      />
                      <div>
                        <div className="font-medium text-neutral-200">Сочные критические попадания (Crunchy Crits)</div>
                        <div className="text-[11px] text-neutral-500">Максимальный базовый урон кости + дополнительный бросок кубика.</div>
                      </div>
                    </label>

                    <label className="flex items-start gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.extensions.ruleFlankingBonus}
                        onChange={(e) => handleUpdate((p) => ({ ...p, extensions: { ...p.extensions, ruleFlankingBonus: e.target.checked } }))}
                        className="rounded border-neutral-700 text-amber-500 mt-0.5"
                      />
                      <div>
                        <div className="font-medium text-neutral-200">Преимущество от фланкирования (Flanking Advantage)</div>
                        <div className="text-[11px] text-neutral-500">Атака с преимуществом, если союзник стоит на противоположной стороне от врага.</div>
                      </div>
                    </label>

                    <label className="flex items-start gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.extensions.ruleDeathSaveSecret}
                        onChange={(e) => handleUpdate((p) => ({ ...p, extensions: { ...p.extensions, ruleDeathSaveSecret: e.target.checked } }))}
                        className="rounded border-neutral-700 text-amber-500 mt-0.5"
                      />
                      <div>
                        <div className="font-medium text-neutral-200">Скрытые спасброски от смерти (Secret Death Saves)</div>
                        <div className="text-[11px] text-neutral-500">Результаты бросков от смерти видны только мастеру для усиления драмы.</div>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* 5. РАБОЧАЯ ПАПКА & ХРАНИЛИЩЕ */}
            {activeTab === 'storage' && (
              <div className="space-y-6 max-w-3xl animate-fadeIn">
                <div>
                  <h3 className="text-base font-semibold text-violet-300 flex items-center gap-2">
                    <FolderTree className="w-5 h-5 text-violet-400" />
                    Настройка рабочей папки и локального хранилища
                  </h3>
                  <p className="text-xs text-neutral-400 mt-1">
                    Синхронизация файловой системы проекта (AetherMap_Data), кэш в IndexedDB и управление ресурсами.
                  </p>
                </div>

                <div className="bg-neutral-950/60 border border-neutral-800 rounded-xl p-4 space-y-3">
                  <label className="text-xs font-semibold text-neutral-200 flex items-center gap-1.5">
                    <Database className="w-4 h-4 text-violet-400" /> Название корневой папки ресурсов
                  </label>
                  <input
                    type="text"
                    value={settings.storage.rootFolderName}
                    onChange={(e) => handleUpdate((p) => ({ ...p, storage: { ...p.storage, rootFolderName: e.target.value } }))}
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-violet-500 font-mono"
                  />
                  <p className="text-[11px] text-neutral-500">
                    Стандартная структура каталогов: <code className="text-violet-300">assets/data/Campaigns</code>, <code className="text-violet-300">Maps</code>, <code className="text-violet-300">Tokens</code>, <code className="text-violet-300">Audio</code>.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-neutral-950/60 border border-neutral-800 rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold text-neutral-200">Авто-сканирование при старте</div>
                      <div className="text-[11px] text-neutral-500">Автоматически подгружать новые файлы карт и токенов из папки.</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.storage.autoRescanOnLaunch}
                      onChange={(e) => handleUpdate((p) => ({ ...p, storage: { ...p.storage, autoRescanOnLaunch: e.target.checked } }))}
                      className="rounded border-neutral-700 text-violet-500 focus:ring-violet-500"
                    />
                  </div>

                  <div className="bg-neutral-950/60 border border-neutral-800 rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold text-neutral-200">Кэширование карт в IndexedDB</div>
                      <div className="text-[11px] text-neutral-500">Молниеносная загрузка тяжелых 4K фонов сцен без повторного чтения с диска.</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.storage.cacheMapsInIndexedDb}
                      onChange={(e) => handleUpdate((p) => ({ ...p, storage: { ...p.storage, cacheMapsInIndexedDb: e.target.checked } }))}
                      className="rounded border-neutral-700 text-violet-500 focus:ring-violet-500"
                    />
                  </div>
                </div>

                <div className="bg-neutral-950/60 border border-neutral-800 rounded-xl p-4 space-y-2">
                  <label className="text-xs font-semibold text-neutral-200 flex justify-between">
                    <span>Степень оптимизации и сжатия картинок холста</span>
                    <span className="text-violet-400 font-mono">{Math.round(settings.storage.compressionQuality * 100)}%</span>
                  </label>
                  <input
                    type="range"
                    min={0.5}
                    max={1.0}
                    step={0.05}
                    value={settings.storage.compressionQuality}
                    onChange={(e) => handleUpdate((p) => ({ ...p, storage: { ...p.storage, compressionQuality: Number(e.target.value) } }))}
                    className="w-full accent-violet-500"
                  />
                  <p className="text-[11px] text-neutral-500">
                    85% — баланс между безупречной резкостью деталей карты и высокой производительностью рендеринга на слабых устройствах.
                  </p>
                </div>
              </div>
            )}

            {/* 6. НАСТРОЙКА ГЕНЕРАТОРОВ */}
            {activeTab === 'generators' && (
              <div className="space-y-6 max-w-3xl animate-fadeIn">
                <div>
                  <h3 className="text-base font-semibold text-pink-300 flex items-center gap-2">
                    <Wand2 className="w-5 h-5 text-pink-400" />
                    Параметры процедурных генераторов
                  </h3>
                  <p className="text-xs text-neutral-400 mt-1">
                    Тонкая настройка BSP алгоритма создания подземелий, генератора сокровищниц, лута и торговцев.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Тема подземелья */}
                  <div className="bg-neutral-950/60 border border-neutral-800 rounded-xl p-4 space-y-2">
                    <label className="text-xs font-semibold text-neutral-200">Визуальная тема генератора подземелий (BSP)</label>
                    <select
                      value={settings.generators.bspDungeonTheme}
                      onChange={(e) => handleUpdate((p) => ({ ...p, generators: { ...p.generators, bspDungeonTheme: e.target.value as any } }))}
                      className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-pink-500"
                    >
                      <option value="stone_crypt">Серый каменный склеп / Подземелье</option>
                      <option value="obsidian">Обсидиановые лавовые катакомбы</option>
                      <option value="mossy">Затопленные замшелые руины</option>
                      <option value="sandstone">Гробница древней пустыни</option>
                    </select>
                  </div>

                  {/* Плотность комнат */}
                  <div className="bg-neutral-950/60 border border-neutral-800 rounded-xl p-4 space-y-2">
                    <label className="text-xs font-semibold text-neutral-200">Плотность комнат и разветвлений</label>
                    <select
                      value={settings.generators.bspRoomDensity}
                      onChange={(e) => handleUpdate((p) => ({ ...p, generators: { ...p.generators, bspRoomDensity: e.target.value as any } }))}
                      className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-pink-500"
                    >
                      <option value="low">Мало комнат (Длинные коридоры и засады)</option>
                      <option value="medium">Сбалансированная плотность (Стандарт)</option>
                      <option value="high">Лабиринт с множеством залов</option>
                    </select>
                  </div>

                  {/* Множитель цен торговцев */}
                  <div className="bg-neutral-950/60 border border-neutral-800 rounded-xl p-4 space-y-2">
                    <label className="text-xs font-semibold text-neutral-200 flex justify-between">
                      <span>Множитель цен в магазинах и тавернах</span>
                      <span className="text-pink-400 font-mono">{settings.generators.merchantPriceMultiplier}x</span>
                    </label>
                    <input
                      type="range"
                      min={0.5}
                      max={2.5}
                      step={0.1}
                      value={settings.generators.merchantPriceMultiplier}
                      onChange={(e) => handleUpdate((p) => ({ ...p, generators: { ...p.generators, merchantPriceMultiplier: parseFloat(e.target.value) } }))}
                      className="w-full accent-pink-500"
                    />
                    <div className="flex justify-between text-[10px] text-neutral-500">
                      <span>0.5x Скидки</span>
                      <span>1.0x PHB 5e</span>
                      <span>2.0x Военная инфляция</span>
                    </div>
                  </div>

                  {/* Характер генерируемых NPC */}
                  <div className="bg-neutral-950/60 border border-neutral-800 rounded-xl p-4 space-y-2">
                    <label className="text-xs font-semibold text-neutral-200">Базовое отношение генерируемых NPC</label>
                    <select
                      value={settings.generators.npcPersonalityTone}
                      onChange={(e) => handleUpdate((p) => ({ ...p, generators: { ...p.generators, npcPersonalityTone: e.target.value as any } }))}
                      className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-pink-500"
                    >
                      <option value="neutral">Нейтральный прагматичный</option>
                      <option value="friendly">Дружелюбный и открытый к героям</option>
                      <option value="suspicious">Подозрительный и скрытный</option>
                      <option value="hostile">Враждебный / Высокомерный</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* 7. СИСТЕМНЫЕ ПРОМПТЫ */}
            {activeTab === 'systemPrompts' && (
              <div className="space-y-6 max-w-3xl animate-fadeIn">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-orange-300 flex items-center gap-2">
                      <Terminal className="w-5 h-5 text-orange-400" />
                      Системные промпты и Директивы AI
                    </h3>
                    <p className="text-xs text-neutral-400 mt-1">
                      Точная настройка инструкций и тональности для нейросети при создании контента.
                    </p>
                  </div>
                </div>

                {/* Выбор пресета тональности */}
                <div className="bg-neutral-950/60 border border-neutral-800 rounded-xl p-4 space-y-2">
                  <label className="text-xs font-semibold text-neutral-200 flex items-center gap-1.5">
                    <Flame className="w-4 h-4 text-orange-400" /> Стилевой пресет вселенной (Tone Preset)
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'heroic_fantasy', name: 'Героическое фэнтези' },
                      { id: 'gothic_horror', name: 'Готический хоррор' },
                      { id: 'dark_gritty', name: 'Мрачный Гримдарк' },
                      { id: 'cyber_mystery', name: 'Мистика & Тайна' }
                    ].map((preset) => (
                      <button
                        key={preset.id}
                        onClick={() => handleUpdate((p) => ({ ...p, systemPrompts: { ...p.systemPrompts, activePreset: preset.id as any } }))}
                        className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all text-center ${
                          settings.systemPrompts.activePreset === preset.id
                            ? 'bg-orange-500/20 text-orange-300 border-orange-500/50 shadow-sm'
                            : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                        }`}
                      >
                        {preset.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Редактирование промпта сущностей */}
                <div className="bg-neutral-950/60 border border-neutral-800 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-neutral-200 flex items-center gap-1.5">
                      <FileCode className="w-4 h-4 text-orange-400" /> Системный промпт генерации монстров &amp; сущностей D&D 5e
                    </label>
                    <button
                      onClick={() => handleUpdate((p) => ({ ...p, systemPrompts: { ...p.systemPrompts, monsterSystemPrompt: DEFAULT_APP_SETTINGS.systemPrompts.monsterSystemPrompt } }))}
                      className="text-[11px] text-neutral-500 hover:text-orange-400 underline"
                    >
                      По умолчанию
                    </button>
                  </div>
                  <textarea
                    rows={4}
                    value={settings.systemPrompts.monsterSystemPrompt}
                    onChange={(e) => handleUpdate((p) => ({ ...p, systemPrompts: { ...p.systemPrompts, monsterSystemPrompt: e.target.value } }))}
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-3 text-xs text-neutral-200 font-mono focus:outline-none focus:border-orange-500 leading-relaxed resize-y"
                  />
                </div>

                {/* Редактирование промпта кампаний */}
                <div className="bg-neutral-950/60 border border-neutral-800 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-neutral-200 flex items-center gap-1.5">
                      <FileCode className="w-4 h-4 text-orange-400" /> Системный промпт генерации кампаний (Full Campaign Engine)
                    </label>
                    <button
                      onClick={() => handleUpdate((p) => ({ ...p, systemPrompts: { ...p.systemPrompts, campaignSystemPrompt: DEFAULT_APP_SETTINGS.systemPrompts.campaignSystemPrompt } }))}
                      className="text-[11px] text-neutral-500 hover:text-orange-400 underline"
                    >
                      По умолчанию
                    </button>
                  </div>
                  <textarea
                    rows={4}
                    value={settings.systemPrompts.campaignSystemPrompt}
                    onChange={(e) => handleUpdate((p) => ({ ...p, systemPrompts: { ...p.systemPrompts, campaignSystemPrompt: e.target.value } }))}
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-3 text-xs text-neutral-200 font-mono focus:outline-none focus:border-orange-500 leading-relaxed resize-y"
                  />
                </div>

                {/* Редактирование описаний сцен */}
                <div className="bg-neutral-950/60 border border-neutral-800 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-neutral-200 flex items-center gap-1.5">
                      <FileCode className="w-4 h-4 text-orange-400" /> Промпт художественных описаний локаций для мастера
                    </label>
                    <button
                      onClick={() => handleUpdate((p) => ({ ...p, systemPrompts: { ...p.systemPrompts, sceneDescriptionPrompt: DEFAULT_APP_SETTINGS.systemPrompts.sceneDescriptionPrompt } }))}
                      className="text-[11px] text-neutral-500 hover:text-orange-400 underline"
                    >
                      По умолчанию
                    </button>
                  </div>
                  <textarea
                    rows={3}
                    value={settings.systemPrompts.sceneDescriptionPrompt}
                    onChange={(e) => handleUpdate((p) => ({ ...p, systemPrompts: { ...p.systemPrompts, sceneDescriptionPrompt: e.target.value } }))}
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-3 text-xs text-neutral-200 font-mono focus:outline-none focus:border-orange-500 leading-relaxed resize-y"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Нижний колонтитул */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-neutral-800 bg-neutral-950/80 text-xs text-neutral-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Все изменения сохраняются автоматически в браузере</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold bg-neutral-800 hover:bg-neutral-700 text-neutral-100 rounded-xl transition-colors border border-neutral-700"
          >
            Готово
          </button>
        </div>

      </div>
    </div>
  );
};
