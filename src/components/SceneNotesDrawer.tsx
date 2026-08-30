/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Панель заметок к сцене, секретов мастера и порталов переходов (Scene Notes & Lore).
 */

import React, { useState } from 'react';
import { Scene, MapPortal } from '../types';
import {
  FileText,
  Eye,
  EyeOff,
  Sparkles,
  Send,
  DoorOpen,
  Plus,
  Trash2,
  Lock,
  ExternalLink
} from 'lucide-react';

interface SceneNotesDrawerProps {
  scene: Scene;
  isOpen: boolean;
  onClose: () => void;
  onUpdateScene: (updated: Partial<Scene>) => void;
  onBroadcastReadAloud: (title: string, text: string) => void;
  onNavigateToPortalScene?: (targetSceneId: string) => void;
  allScenes?: Scene[];
}

export const SceneNotesDrawer: React.FC<SceneNotesDrawerProps> = ({
  scene,
  isOpen,
  onClose,
  onUpdateScene,
  onBroadcastReadAloud,
  onNavigateToPortalScene,
  allScenes = []
}) => {
  const [readAloudTitle, setReadAloudTitle] = useState('SCENE ATMOSPHERE');
  const [readAloudText, setReadAloudText] = useState(
    'The cold air smells of wet stone and ancient decay. Flickering torchlight reveals shadowy arches leading deeper into the forgotten crypt.'
  );

  if (!isOpen) return null;

  return (
    <div className="fixed top-14 right-0 bottom-0 w-80 sm:w-96 bg-[#151619] border-l border-[#2A2A2A] shadow-2xl z-40 flex flex-col font-mono text-[#E0E0E0] select-none">
      {/* Шапка */}
      <div className="p-4 border-b border-[#2A2A2A] flex items-center justify-between bg-[#111214]">
        <div className="flex items-center gap-2">
          <FileText size={18} className="text-[#F27D26]" />
          <span className="font-bold text-sm tracking-wider uppercase">SCENE LORE & SECRETS</span>
        </div>
        <button onClick={onClose} className="text-[#8E9299] hover:text-white text-xs cursor-pointer">
          ✕
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-5">
        {/* 1. ХУДОЖЕСТВЕННЫЙ ТЕКСТ (READ-ALOUD BOX) */}
        <div className="flex flex-col gap-2 bg-[#1A1C20] p-3 rounded-lg border border-[#2A2A2A]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#F27D26] flex items-center gap-1.5">
              <Sparkles size={14} />
              <span>READ-ALOUD NARRATIVE</span>
            </span>
            <span className="text-[9px] text-[#8E9299]">BROADCASTABLE</span>
          </div>

          <input
            type="text"
            placeholder="Narrative Header (e.g. Entering the Tomb)"
            value={readAloudTitle}
            onChange={(e) => setReadAloudTitle(e.target.value)}
            className="bg-[#0A0A0A] border border-[#2A2A2A] rounded px-2.5 py-1.5 text-xs text-white"
          />

          <textarea
            rows={4}
            placeholder="Type atmospheric scene description here..."
            value={readAloudText}
            onChange={(e) => setReadAloudText(e.target.value)}
            className="bg-[#0A0A0A] border border-[#2A2A2A] rounded p-2.5 text-xs text-[#E0E0E0] resize-none leading-relaxed font-serif"
          />

          <button
            onClick={() => onBroadcastReadAloud(readAloudTitle, readAloudText)}
            className="bg-[#F27D26] hover:bg-[#E06C15] text-black font-bold py-2 rounded text-xs flex items-center justify-center gap-1.5 transition active:scale-98"
          >
            <Send size={13} />
            <span>TRANSMIT TO PROJECTOR SCREEN</span>
          </button>
        </div>

        {/* 2. СЕКРЕТНЫЕ ЗАМЕТКИ МАСТЕРА (DM SECRETS) */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs border-b border-[#2A2A2A] pb-1">
            <span className="font-bold text-yellow-400 flex items-center gap-1.5">
              <Lock size={13} />
              <span>DM PRIVATE NOTES & TRAPS</span>
            </span>
            <span className="text-[9px] text-[#8E9299]">NEVER SHOWN TO PLAYERS</span>
          </div>

          <textarea
            rows={5}
            placeholder="- Trap DC 15 Dex save (2d10 poison dart) on the north stone door&#10;- Secret chest hidden behind tapestry (DC 14 Investigation)&#10;- Orc chieftain carries a brass key to room #4"
            value={scene.notes || ''}
            onChange={(e) => onUpdateScene({ notes: e.target.value })}
            className="bg-[#0A0A0A] border border-[#2A2A2A] rounded p-2.5 text-xs text-[#C5C8D0] resize-none leading-relaxed"
          />
        </div>

        {/* 3. ИНТЕРАКТИВНЫЕ ПОРТАЛЫ ПЕРЕХОДА (SUBMAP PORTALS) */}
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between text-xs border-b border-[#2A2A2A] pb-1">
            <span className="font-bold text-[#F27D26] flex items-center gap-1.5">
              <DoorOpen size={14} />
              <span>MAP PORTALS & DOORS</span>
            </span>
            <span className="text-[10px] text-[#8E9299]">SCENE JUMPS</span>
          </div>

          <div className="flex flex-col gap-2">
            {(scene.portals || []).map((portal) => (
              <div
                key={portal.id}
                className="p-2.5 bg-[#1A1C20] border border-[#2A2A2A] rounded-lg flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2">
                  <DoorOpen size={14} className="text-[#F27D26]" />
                  <div>
                    <div className="font-bold text-[#E0E0E0]">{portal.name}</div>
                    <div className="text-[10px] text-[#8E9299]">
                      Target: {allScenes.find((s) => s.id === portal.targetSceneId)?.name || 'Scene ID ' + portal.targetSceneId}
                    </div>
                  </div>
                </div>

                {onNavigateToPortalScene && (
                  <button
                    onClick={() => onNavigateToPortalScene(portal.targetSceneId)}
                    className="p-1.5 rounded bg-[#2A2A2A] hover:bg-[#F27D26] hover:text-black text-[#8E9299]"
                    title="Перейти к этой сцене"
                  >
                    <ExternalLink size={13} />
                  </button>
                )}
              </div>
            ))}

            {(scene.portals || []).length === 0 && (
              <div className="text-[11px] text-[#6E727A] p-3 bg-[#0A0A0A] rounded border border-dashed border-[#2A2A2A] text-center">
                Нет связанных порталов на текущей карте.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
