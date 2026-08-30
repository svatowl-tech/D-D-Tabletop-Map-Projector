/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * UnifiedAssetFolderModal.tsx — Модальное окно управления рабочей папкой и единым каталогом ресурсов AetherMap_Data.
 * 
 * Функциональность:
 * 1. Указание рабочей папки на диске (showDirectoryPicker) или работа с IndexedDB.
 * 2. Древовидная навигация по иерархии категорий (maps, animated_maps, audio, tokens, vault_presets, blackout_videos).
 * 3. Фильтрация по субпапкам (/Dungeons, /Cities) и тегам (#dungeon, #night, #bossfight, #tavern).
 * 4. Быстрые действия: Загрузить как базу, добавить слой, воспроизвести звук, загрузить пресет, установить заставку blackout.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  FolderOpen,
  RefreshCw,
  Upload,
  Search,
  Tag,
  Map as MapIcon,
  Video,
  Music,
  CloudRain,
  Zap,
  UserCheck,
  FileCode,
  EyeOff,
  Trash2,
  Check,
  Play,
  Volume2,
  X,
  Sparkles,
  FolderTree
} from 'lucide-react';
import { assetCatalog } from '../services/assetCatalog';
import { fileSystemService, AssetItem, AssetCategory } from '../services/fileSystemService';
import { mediaCache } from '../services/mediaCache';
import { Scene } from '../types';

interface UnifiedAssetFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMapAsBase?: (asset: AssetItem) => void;
  onAddLayerFromAsset?: (asset: AssetItem) => void;
  onPlayAudioFromAsset?: (asset: AssetItem) => void;
  onLoadPresetScene?: (scene: Scene) => void;
  onSetBlackoutVideoAsset?: (asset: AssetItem) => void;
}

export const UnifiedAssetFolderModal: React.FC<UnifiedAssetFolderModalProps> = ({
  isOpen,
  onClose,
  onSelectMapAsBase,
  onAddLayerFromAsset,
  onPlayAudioFromAsset,
  onLoadPresetScene,
  onSetBlackoutVideoAsset
}) => {
  const [selectedCategory, setSelectedCategory] = useState<AssetCategory | 'all'>('all');
  const [selectedSubfolder, setSelectedSubfolder] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [assets, setAssets] = useState<AssetItem[]>([]);
  const [workingFolder, setWorkingFolder] = useState<string>('AetherMap_Data');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});
  const [isDragOver, setIsDragOver] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Первоначальная загрузка
    refreshCatalog();

    // Подписка на изменения каталога
    const unsubscribe = assetCatalog.subscribe(() => {
      refreshCatalog();
    });

    return () => {
      unsubscribe();
    };
  }, [isOpen, selectedCategory, selectedSubfolder, selectedTag, searchQuery]);

  const refreshCatalog = async () => {
    setWorkingFolder(fileSystemService.getWorkingDirectoryName());
    const filtered = assetCatalog.getFilteredAssets({
      category: selectedCategory,
      subfolder: selectedSubfolder,
      tag: selectedTag,
      search: searchQuery
    });
    setAssets(filtered);

    // Подготовка прозрачных URL для превью через mediaCache
    const resolvedMap: Record<string, string> = {};
    for (const asset of filtered) {
      if (asset.category === 'maps' || asset.category === 'tokens' || asset.category === 'animated_maps' || asset.category === 'blackout_videos') {
        const resolved = await mediaCache.resolveMediaUrl(asset.url);
        resolvedMap[asset.id] = resolved;
      }
    }
    setPreviewUrls(resolvedMap);
  };

  if (!isOpen) return null;

  // Выбор рабочей папки на диске
  const handleSelectFolder = async () => {
    try {
      setIsSyncing(true);
      await fileSystemService.selectWorkingDirectory();
      await assetCatalog.init();
      refreshCatalog();
    } catch (err: any) {
      console.warn('[UnifiedAssetFolderModal] Folder pick canceled or unsupported:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  // Ручное сканирование и автосинхронизация
  const handleScanDisk = async () => {
    setIsSyncing(true);
    await fileSystemService.scanDirectoryTree();
    await assetCatalog.init();
    refreshCatalog();
    setIsSyncing(false);
  };

  // Загрузка файлов через классический Input File или Drag&Drop
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setIsSyncing(true);
    const cat = selectedCategory === 'all' ? 'maps' : selectedCategory;
    await assetCatalog.importBrowserFiles(e.target.files, cat, selectedSubfolder === 'all' ? '/' : selectedSubfolder);
    refreshCatalog();
    setIsSyncing(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setIsSyncing(true);
      const cat = selectedCategory === 'all' ? 'maps' : selectedCategory;
      await assetCatalog.importBrowserFiles(e.dataTransfer.files, cat, selectedSubfolder === 'all' ? '/' : selectedSubfolder);
      refreshCatalog();
      setIsSyncing(false);
    }
  };

  const handleToDeleteAsset = async (id: string) => {
    if (window.confirm('Удалить данный ресурс из каталога?')) {
      await assetCatalog.deleteAsset(id);
      refreshCatalog();
    }
  };

  const handlePresetImportClick = async (asset: AssetItem) => {
    if (!onLoadPresetScene) return;
    try {
      let jsonContent = '';
      if (asset.blob) {
        jsonContent = await asset.blob.text();
      } else {
        const res = await fetch(asset.url);
        jsonContent = await res.text();
      }
      const scene = await assetCatalog.importPreset(jsonContent);
      onLoadPresetScene(scene);
      onClose();
    } catch (err) {
      alert('Ошибка при чтении файла пресета: ' + err);
    }
  };

  const allTags = assetCatalog.getAllTags();
  const allSubfolders = assetCatalog.getAllSubfolders(selectedCategory === 'all' ? undefined : selectedCategory);

  const categoriesList: { id: AssetCategory | 'all'; label: string; icon: React.ReactNode }[] = [
    { id: 'all', label: 'Все ресурсы', icon: <FolderTree size={14} /> },
    { id: 'maps', label: 'Карты (maps)', icon: <MapIcon size={14} /> },
    { id: 'animated_maps', label: 'Живые видеокарты (animated)', icon: <Video size={14} /> },
    { id: 'audio_bgm', label: 'Фоновая музыка (bgm)', icon: <Music size={14} /> },
    { id: 'audio_ambience', label: 'Эмбиент (ambience)', icon: <CloudRain size={14} /> },
    { id: 'audio_sfx', label: 'Звуковые эффекты (sfx)', icon: <Zap size={14} /> },
    { id: 'tokens', label: 'Токены (tokens)', icon: <UserCheck size={14} /> },
    { id: 'vault_presets', label: 'Пресеты сцен (.json)', icon: <FileCode size={14} /> },
    { id: 'blackout_videos', label: 'Видео затемнения', icon: <EyeOff size={14} /> }
  ];

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 font-mono text-sm text-[#E0E0E0] select-none">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        className={`bg-[#121316] border ${
          isDragOver ? 'border-[#F27D26] bg-[#1A1815]' : 'border-[#2A2A2A]'
        } rounded-2xl w-full max-w-6xl h-[90vh] flex flex-col shadow-2xl overflow-hidden transition-all`}
      >
        {/* HEADER */}
        <div className="p-4 bg-[#181A1F] border-b border-[#2A2A2A] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#2A1F18] border border-[#F27D26]/40 rounded-xl text-[#F27D26]">
              <FolderOpen size={20} />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-[#F27D26] tracking-tight flex items-center gap-2">
                АВТОМАТИЧЕСКИЙ КАТАЛОГ РЕСУРСОВ AETHERMAP
              </h2>
              <p className="text-xs text-[#8E9299]">
                Рабочая папка: <span className="text-white font-bold">📁 {workingFolder}</span>
              </p>
            </div>
          </div>

          {/* Кнопки вызова работы с диском */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleSelectFolder}
              disabled={isSyncing}
              className="px-3 py-1.5 bg-[#2A1F18] hover:bg-[#3D2C20] text-[#F27D26] border border-[#F27D26]/60 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
              title="Выбрать корневую папку AetherMap_Data на компьютере (File System Access)"
            >
              <FolderOpen size={14} />
              <span>Указать папку на ПК</span>
            </button>

            <button
              onClick={handleScanDisk}
              disabled={isSyncing}
              className="px-3 py-1.5 bg-[#1A1C20] hover:bg-[#252830] text-[#8E9299] hover:text-white border border-[#2A2A2A] rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
              title="Фоновое сканирование изменений на диске"
            >
              <RefreshCw size={14} className={isSyncing ? 'animate-spin text-[#F27D26]' : ''} />
              <span>Обновить индекс</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 bg-[#1A1C20] hover:bg-[#252830] text-[#8E9299] hover:text-white border border-[#2A2A2A] rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
              title="Импортировать файлы в IndexedDB хранилище"
            >
              <Upload size={14} />
              <span>Загрузить файлы</span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              multiple
              className="hidden"
            />

            <button
              onClick={onClose}
              className="p-2 text-[#8E9299] hover:text-white hover:bg-[#2A2A2A] rounded-xl transition ml-2"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* MIDDLE CONTENT AREA */}
        <div className="flex-1 flex overflow-hidden">
          {/* SIDEBAR CATEGORIES */}
          <div className="w-64 bg-[#151619] border-r border-[#2A2A2A] p-3 flex flex-col gap-1 overflow-y-auto shrink-0 text-xs">
            <span className="text-[10px] font-bold text-[#8E9299] uppercase px-2 mb-1">
              СТРУКТУРА ДИРЕКТАТОРИЙ
            </span>
            {categoriesList.map((cat) => {
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    setSelectedSubfolder('all');
                  }}
                  className={`p-2.5 rounded-xl text-left font-bold flex items-center gap-2.5 transition ${
                    isActive
                      ? 'bg-[#2A1F18] text-[#F27D26] border border-[#F27D26]/40'
                      : 'text-[#8E9299] hover:bg-[#1F2126] hover:text-white'
                  }`}
                >
                  {cat.icon}
                  <span className="truncate">{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* MAIN ASSET EXPLORER */}
          <div className="flex-1 flex flex-col p-4 bg-[#111214] overflow-hidden gap-3">
            {/* SEARCH, SUBFOLDERS & TAG FILTERS */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                {/* Search Input */}
                <div className="flex-1 relative">
                  <Search size={15} className="absolute left-3 top-2.5 text-[#8E9299]" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Поиск по названию, расширению или тегам (#dungeon)..."
                    className="w-full bg-[#1A1C20] border border-[#2A2A2A] rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-[#8E9299] focus:outline-none focus:border-[#F27D26]"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-2.5 text-[#8E9299] hover:text-white"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* Subfolder filter selector */}
                {allSubfolders.length > 0 && (
                  <select
                    value={selectedSubfolder}
                    onChange={(e) => setSelectedSubfolder(e.target.value)}
                    className="bg-[#1A1C20] border border-[#2A2A2A] text-xs text-white rounded-xl px-3 py-2 focus:outline-none focus:border-[#F27D26]"
                  >
                    <option value="all">📁 Все субпапки</option>
                    {allSubfolders.map((sub) => (
                      <option key={sub} value={sub}>
                        📁 {sub}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Tag Pills */}
              {allTags.length > 0 && (
                <div className="flex items-center gap-1.5 overflow-x-auto py-1 text-[11px]">
                  <span className="text-[#8E9299] flex items-center gap-1 shrink-0 font-bold">
                    <Tag size={12} /> ТЕГИ:
                  </span>
                  <button
                    onClick={() => setSelectedTag('')}
                    className={`px-2 py-0.5 rounded-lg border font-bold shrink-0 ${
                      selectedTag === ''
                        ? 'bg-[#2A1F18] text-[#F27D26] border-[#F27D26]'
                        : 'bg-[#1A1C20] text-[#8E9299] border-[#2A2A2A]'
                    }`}
                  >
                    Все
                  </button>
                  {allTags.map((tag) => {
                    const isActive = selectedTag === tag;
                    return (
                      <button
                        key={tag}
                        onClick={() => setSelectedTag(isActive ? '' : tag)}
                        className={`px-2 py-0.5 rounded-lg border font-bold shrink-0 transition ${
                          isActive
                            ? 'bg-[#2A1F18] text-[#F27D26] border-[#F27D26]'
                            : 'bg-[#1A1C20] text-[#8E9299] hover:text-white border-[#2A2A2A]'
                        }`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ASSETS GRID */}
            <div className="flex-1 overflow-y-auto pr-1">
              {assets.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-[#8E9299] gap-2 border-2 border-dashed border-[#2A2A2A] rounded-2xl p-6 text-center">
                  <FolderOpen size={40} className="text-[#2A2A2A]" />
                  <p className="font-bold text-sm">В данной директории или по вашим тегам ничего не найдено.</p>
                  <p className="text-xs">Перетащите медиафайлы сюда или нажмите «Указать папку на ПК»</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {assets.map((asset) => {
                    const previewUrl = previewUrls[asset.id];
                    const isMedia = asset.category === 'maps' || asset.category === 'tokens';
                    const isVideo = asset.category === 'animated_maps' || asset.category === 'blackout_videos';
                    const isAudio = asset.category.startsWith('audio_');
                    const isPreset = asset.category === 'vault_presets';

                    return (
                      <div
                        key={asset.id}
                        className="bg-[#181A1F] border border-[#2A2A2A] hover:border-[#F27D26]/70 rounded-xl p-2.5 flex flex-col justify-between gap-2 group transition shadow-md"
                      >
                        {/* PREVIEW CONTAINER */}
                        <div className="aspect-video bg-[#0D0E10] rounded-lg overflow-hidden border border-[#2A2A2A] relative flex items-center justify-center">
                          {isMedia && previewUrl && (
                            <img
                              src={previewUrl}
                              alt={asset.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                              loading="lazy"
                            />
                          )}

                          {isVideo && (
                            <div className="w-full h-full relative bg-black flex items-center justify-center">
                              {previewUrl ? (
                                <video
                                  src={previewUrl}
                                  className="w-full h-full object-cover"
                                  muted
                                  loop
                                  onMouseOver={(e) => (e.target as HTMLVideoElement).play()}
                                  onMouseOut={(e) => (e.target as HTMLVideoElement).pause()}
                                />
                              ) : (
                                <Video size={24} className="text-[#F27D26]" />
                              )}
                              <span className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/80 text-[9px] text-[#F27D26] font-bold rounded">
                                VIDEO
                              </span>
                            </div>
                          )}

                          {isAudio && (
                            <div className="flex flex-col items-center gap-1 text-[#F27D26]">
                              <Volume2 size={24} />
                              <span className="text-[9px] text-[#8E9299] uppercase font-bold">
                                {asset.category.replace('audio_', '')}
                              </span>
                            </div>
                          )}

                          {isPreset && (
                            <div className="flex flex-col items-center gap-1 text-purple-400">
                              <FileCode size={24} />
                              <span className="text-[9px] text-[#8E9299] uppercase font-bold">PRESET .JSON</span>
                            </div>
                          )}

                          {/* Subfolder Badge */}
                          <span className="absolute top-1 left-1 px-1.5 py-0.5 bg-black/70 text-[9px] text-[#8E9299] font-bold rounded truncate max-w-[80%]">
                            {asset.subfolder}
                          </span>
                        </div>

                        {/* TEXT METADATA */}
                        <div>
                          <h3
                            className="font-bold text-xs text-white truncate group-hover:text-[#F27D26] transition"
                            title={asset.filename}
                          >
                            {asset.name}
                          </h3>
                          <div className="flex items-center justify-between text-[10px] text-[#8E9299] mt-0.5">
                            <span>{formatFileSize(asset.size)}</span>
                            <span>{asset.filename.split('.').pop()?.toUpperCase()}</span>
                          </div>

                          {/* TAGS */}
                          {asset.tags.length > 0 && (
                            <div className="flex items-center gap-1 overflow-hidden mt-1 text-[9px] text-[#F27D26]">
                              {asset.tags.slice(0, 2).map((t) => (
                                <span key={t} className="bg-[#2A1F18] px-1 py-0.2 rounded truncate">
                                  {t}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* ACTIONS BUTTONS */}
                        <div className="flex items-center gap-1 pt-1 border-t border-[#2A2A2A]">
                          {(asset.category === 'maps' || asset.category === 'animated_maps') && (
                            <>
                              {onSelectMapAsBase && (
                                <button
                                  onClick={() => {
                                    onSelectMapAsBase(asset);
                                    onClose();
                                  }}
                                  className="flex-1 py-1 bg-[#2A1F18] hover:bg-[#3D2C20] text-[#F27D26] border border-[#F27D26]/40 rounded-lg text-[10px] font-bold truncate transition"
                                  title="Установить как главную базовую карту"
                                >
                                  Базовая карта
                                </button>
                              )}
                              {onAddLayerFromAsset && (
                                <button
                                  onClick={() => {
                                    onAddLayerFromAsset(asset);
                                    onClose();
                                  }}
                                  className="py-1 px-2 bg-[#1A1C20] hover:bg-[#252830] text-[#8E9299] hover:text-white border border-[#2A2A2A] rounded-lg text-[10px] font-bold transition"
                                  title="Добавить как слой/декорацию"
                                >
                                  + Слой
                                </button>
                              )}
                            </>
                          )}

                          {asset.category === 'tokens' && onAddLayerFromAsset && (
                            <button
                              onClick={() => {
                                onAddLayerFromAsset(asset);
                                onClose();
                              }}
                              className="w-full py-1 bg-[#2A1F18] hover:bg-[#3D2C20] text-[#F27D26] border border-[#F27D26]/40 rounded-lg text-[10px] font-bold transition"
                            >
                              + Токен на карту
                            </button>
                          )}

                          {isAudio && onPlayAudioFromAsset && (
                            <button
                              onClick={() => onPlayAudioFromAsset(asset)}
                              className="w-full py-1 bg-[#1A1C20] hover:bg-[#252830] text-[#8E9299] hover:text-white border border-[#2A2A2A] rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition"
                            >
                              <Play size={10} /> Воспроизвести
                            </button>
                          )}

                          {isPreset && onLoadPresetScene && (
                            <button
                              onClick={() => handlePresetImportClick(asset)}
                              className="w-full py-1 bg-[#2A1F18] hover:bg-[#3D2C20] text-[#F27D26] border border-[#F27D26]/40 rounded-lg text-[10px] font-bold transition"
                            >
                              Загрузить пресет
                            </button>
                          )}

                          {asset.category === 'blackout_videos' && onSetBlackoutVideoAsset && (
                            <button
                              onClick={() => {
                                onSetBlackoutVideoAsset(asset);
                                onClose();
                              }}
                              className="w-full py-1 bg-purple-950/80 text-purple-300 border border-purple-800 rounded-lg text-[10px] font-bold transition"
                            >
                              Blackout заставка
                            </button>
                          )}

                          <button
                            onClick={() => handleToDeleteAsset(asset.id)}
                            className="p-1 text-[#8E9299] hover:text-red-400 hover:bg-red-950/40 rounded-lg transition shrink-0"
                            title="Удалить файл из каталога"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="px-4 py-2 bg-[#181A1F] border-t border-[#2A2A2A] flex items-center justify-between text-xs text-[#8E9299]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span>
              Всего ресурсов в индексе: <strong className="text-white">{assets.length}</strong>
            </span>
            <span className="text-[#2A2A2A]">|</span>
            <span>Память LRU-кэша: {mediaCache.getActiveCount()} / 40 blob URL</span>
          </div>
          <div>
            <span>
              Поддержка Drag & Drop • Вызов через <kbd className="bg-[#2A2A2A] px-1.5 py-0.5 rounded text-white font-bold">AetherMap_Data</kbd>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
