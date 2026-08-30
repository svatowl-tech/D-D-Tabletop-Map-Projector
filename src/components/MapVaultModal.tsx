/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Модальное окно библиотеки карт (Map Vault), полнофункциональной интерактивной студии генераторов
 * (City, Dwellings, Taverns, Village, Caves, BSP Dungeons) и резервного копирования кампании.
 */

import React, { useState, useEffect } from 'react';
import { Scene, MapLayer } from '../types';
import { storageService } from '../services/storageService';
import { InteractiveGeneratorStudio } from './InteractiveGeneratorStudio';
import {
  FolderOpen,
  Plus,
  Sparkles,
  Download,
  Upload,
  Trash2,
  Check,
  Compass,
  MapPin,
  Layers,
  Building2,
  Home,
  Coffee,
  Trees,
  Maximize2
} from 'lucide-react';

interface MapVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentScene: Scene;
  onSwitchScene: (scene: Scene) => void;
  onAddNewScene: (newScene: Scene) => void;
  onAddLayerToCurrentScene?: (layer: MapLayer) => void;
  allScenes: Scene[];
  onImportCampaign: (scenes: Scene[]) => void;
  initialTab?: 'vault' | 'generator' | 'export_import';
}

export const MapVaultModal: React.FC<MapVaultModalProps> = ({
  isOpen,
  onClose,
  currentScene,
  onSwitchScene,
  onAddNewScene,
  onAddLayerToCurrentScene,
  allScenes,
  onImportCampaign,
  initialTab = 'vault'
}) => {
  const [tab, setTab] = useState<'vault' | 'generator' | 'export_import'>(initialTab);
  const [vaultScenes, setVaultScenes] = useState<Scene[]>([]);

  const loadVault = async () => {
    const loaded = await storageService.getAllScenesFromVault();
    setVaultScenes(loaded);
  };

  useEffect(() => {
    if (isOpen) {
      loadVault();
      if (initialTab) setTab(initialTab);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  const handleExportCampaignJson = () => {
    const exportData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      scenes: allScenes
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vtt_campaign_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportCampaignJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed && Array.isArray(parsed.scenes)) {
          onImportCampaign(parsed.scenes);
          onClose();
        } else {
          alert('Неверный формат файла кампании JSON');
        }
      } catch (err) {
        alert('Ошибка при чтении JSON кампании');
      }
    };
    reader.readAsText(file);
  };

  const handleDeleteVaultScene = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await storageService.deleteSceneFromVault(id);
    loadVault();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 select-none font-mono text-[#E0E0E0]">
      <div
        className={`bg-[#151619] border border-[#2A2A2A] rounded-2xl w-full overflow-hidden shadow-2xl flex flex-col transition-all ${
          tab === 'generator'
            ? 'max-w-7xl h-[94vh]'
            : 'max-w-5xl max-h-[90vh]'
        }`}
      >
        {/* Шапка модального окна */}
        <div className="px-4 py-3 border-b border-[#2A2A2A] bg-[#111214] flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-[#F27D26]">
            <Sparkles size={18} />
            <span className="font-bold text-sm sm:text-base tracking-wider uppercase">
              MAP VAULT & WORLD GENERATORS
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-[#8E9299] hover:text-white text-sm cursor-pointer p-1 rounded-lg hover:bg-[#252830]"
            title="Закрыть"
          >
            ✕
          </button>
        </div>

        {/* Табы */}
        <div className="flex border-b border-[#2A2A2A] bg-[#0A0A0A] text-xs font-bold">
          <button
            onClick={() => setTab('vault')}
            className={`flex-1 py-3 uppercase flex items-center justify-center gap-2 transition cursor-pointer ${
              tab === 'vault'
                ? 'bg-[#151619] text-[#F27D26] border-b-2 border-[#F27D26]'
                : 'text-[#8E9299] hover:text-white'
            }`}
          >
            <Layers size={14} />
            <span>SCENE VAULT ({allScenes.length})</span>
          </button>
          <button
            onClick={() => setTab('generator')}
            className={`flex-1 py-3 uppercase flex items-center justify-center gap-2 transition cursor-pointer ${
              tab === 'generator'
                ? 'bg-[#151619] text-[#F27D26] border-b-2 border-[#F27D26]'
                : 'text-[#8E9299] hover:text-white'
            }`}
          >
            <Sparkles size={14} />
            <span>GENERATORS STUDIO (CITY, DWELL, TAVERN, VILLAGE, CAVES)</span>
          </button>
          <button
            onClick={() => setTab('export_import')}
            className={`flex-1 py-3 uppercase flex items-center justify-center gap-2 transition cursor-pointer ${
              tab === 'export_import'
                ? 'bg-[#151619] text-[#F27D26] border-b-2 border-[#F27D26]'
                : 'text-[#8E9299] hover:text-white'
            }`}
          >
            <Download size={14} />
            <span>BACKUP & JSON</span>
          </button>
        </div>

        {/* Тело модального окна */}
        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          {/* 1. БИБЛИОТЕКА КАРТ */}
          {tab === 'vault' && (
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                {allScenes.map((sc) => {
                  const isCurrent = sc.id === currentScene.id;
                  const firstLayer = sc.layers?.[0];

                  return (
                    <div
                      key={sc.id}
                      onClick={() => {
                        onSwitchScene(sc);
                        onClose();
                      }}
                      className={`group p-3 rounded-xl border flex flex-col gap-2 cursor-pointer transition ${
                        isCurrent
                          ? 'bg-[#2A1F18] border-[#F27D26] shadow-[0_0_15px_rgba(242,125,38,0.3)]'
                          : 'bg-[#1A1C20] border-[#2A2A2A] hover:border-[#3A3A3A]'
                      }`}
                    >
                      <div className="w-full h-32 bg-[#0A0A0A] rounded-lg overflow-hidden border border-[#2A2A2A] relative flex items-center justify-center">
                        {firstLayer?.url || firstLayer?.dataUrl ? (
                          <img
                            src={firstLayer.dataUrl || firstLayer.url}
                            alt={sc.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="text-[10px] text-[#6E727A]">EMPTY CANVAS</div>
                        )}
                        {isCurrent && (
                          <div className="absolute top-2 right-2 bg-[#F27D26] text-black px-2 py-0.5 rounded text-[9px] font-bold">
                            ACTIVE
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs truncate text-[#E0E0E0]">{sc.name}</span>
                        {allScenes.length > 1 && !isCurrent && (
                          <button
                            onClick={(e) => handleDeleteVaultScene(sc.id, e)}
                            className="text-[#6E727A] hover:text-red-400 p-1"
                            title="Удалить сцену"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 2. ПОЛНОФУНКЦИОНАЛЬНАЯ СТУДИЯ ГЕНЕРАТОРОВ */}
          {tab === 'generator' && (
            <div className="flex-1 w-full h-full min-h-0 overflow-hidden flex flex-col">
              <InteractiveGeneratorStudio
                currentScene={currentScene}
                onDeployNewScene={(newScene) => {
                  storageService.saveSceneToVault(newScene);
                  onAddNewScene(newScene);
                  onClose();
                }}
                onAddLayerToCurrentScene={(layer) => {
                  if (onAddLayerToCurrentScene) {
                    onAddLayerToCurrentScene(layer);
                  }
                  onClose();
                }}
              />
            </div>
          )}

          {/* 3. ЭКСПОРТ / ИМПОРТ */}
          {tab === 'export_import' && (
            <div className="flex-1 overflow-y-auto p-4">
              <div className="flex flex-col gap-5 max-w-lg mx-auto py-6">
                <div className="p-4 bg-[#1A1C20] rounded-xl border border-[#2A2A2A] flex flex-col gap-3">
                  <span className="font-bold text-white text-sm">Экспорт всей кампании (JSON)</span>
                  <p className="text-xs text-[#8E9299]">
                    Сохраняет все сцены, слои, туман войны, сетку и заметки в один файл резервной копии.
                  </p>
                  <button
                    onClick={handleExportCampaignJson}
                    className="py-2.5 px-4 bg-[#F27D26] hover:bg-[#E06C15] text-black font-extrabold rounded-lg flex items-center justify-center gap-2 cursor-pointer transition shadow-md"
                  >
                    <Download size={16} />
                    <span>Скачать campaign.json</span>
                  </button>
                </div>

                <div className="p-4 bg-[#1A1C20] rounded-xl border border-[#2A2A2A] flex flex-col gap-3">
                  <span className="font-bold text-white text-sm">Импорт кампании (JSON)</span>
                  <p className="text-xs text-[#8E9299]">
                    Загрузить ранее сохраненную кампанию из JSON файла.
                  </p>
                  <label className="py-2.5 px-4 bg-[#252830] hover:bg-[#323640] text-white font-bold rounded-lg flex items-center justify-center gap-2 cursor-pointer border border-[#3A3A3A] transition">
                    <Upload size={16} />
                    <span>Выбрать JSON файл...</span>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImportCampaignJson}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
