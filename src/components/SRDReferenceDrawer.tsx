/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Справочник D&D 5e SRD (Бестиарий, Заклинания, Состояния, Предметы).
 */

import React, { useState } from 'react';
import {
  SRD_MONSTERS,
  SRD_SPELLS,
  SRD_CONDITIONS,
  SRD_ITEMS,
  SRDMonster,
  SRDSpell
} from '../services/srdDatabase';
import {
  BookOpen,
  Search,
  Swords,
  Sparkles,
  Shield,
  Heart,
  Plus,
  Compass,
  CheckCircle2
} from 'lucide-react';
import { Combatant, SpellTemplate } from '../types';

interface SRDReferenceDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onAddMonsterToCombat: (monster: SRDMonster) => void;
  onApplySpellTemplate?: (spell: SRDSpell) => void;
}

export const SRDReferenceDrawer: React.FC<SRDReferenceDrawerProps> = ({
  isOpen,
  onClose,
  onAddMonsterToCombat,
  onApplySpellTemplate
}) => {
  const [tab, setTab] = useState<'monsters' | 'spells' | 'conditions' | 'items'>('monsters');
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const filteredMonsters = SRD_MONSTERS.filter((m) =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredSpells = SRD_SPELLS.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.school.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredConditions = SRD_CONDITIONS.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredItems = SRD_ITEMS.filter((i) =>
    i.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed top-14 right-0 bottom-0 w-80 sm:w-96 bg-[#151619] border-l border-[#2A2A2A] shadow-2xl z-40 flex flex-col font-mono text-[#E0E0E0] select-none">
      {/* Шапка */}
      <div className="p-4 border-b border-[#2A2A2A] flex items-center justify-between bg-[#111214]">
        <div className="flex items-center gap-2">
          <BookOpen size={18} className="text-[#F27D26]" />
          <span className="font-bold text-sm tracking-wider uppercase">D&D 5E SRD VAULT</span>
        </div>
        <button onClick={onClose} className="text-[#8E9299] hover:text-white text-xs cursor-pointer">
          ✕
        </button>
      </div>

      {/* Вкладки справочника */}
      <div className="flex border-b border-[#2A2A2A] bg-[#0A0A0A] text-xs">
        {[
          { id: 'monsters', label: 'BESTIARY' },
          { id: 'spells', label: 'SPELLS' },
          { id: 'conditions', label: 'RULES' },
          { id: 'items', label: 'ITEMS' }
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as any)}
            className={`flex-1 py-2.5 font-bold uppercase transition text-center ${
              tab === t.id
                ? 'bg-[#151619] text-[#F27D26] border-b-2 border-[#F27D26]'
                : 'text-[#8E9299] hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Поиск */}
      <div className="p-3 border-b border-[#2A2A2A] bg-[#111214]">
        <div className="flex items-center gap-2 bg-[#0A0A0A] border border-[#2A2A2A] rounded px-2.5 py-1.5 text-xs">
          <Search size={14} className="text-[#8E9299]" />
          <input
            type="text"
            placeholder="Search monsters, spells, rules..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-white outline-none placeholder-[#6E727A]"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="text-[#8E9299] hover:text-white text-xs">
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Контент вкладок */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
        {/* 1. БЕСТИАРИЙ */}
        {tab === 'monsters' && (
          <>
            {filteredMonsters.map((m) => (
              <div
                key={m.id}
                className="bg-[#1A1C20] border border-[#2A2A2A] rounded-lg p-3 flex flex-col gap-2 hover:border-[#F27D26]/60 transition"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-xs text-[#F27D26]">{m.name}</h3>
                    <p className="text-[10px] text-[#8E9299]">{m.type}</p>
                  </div>
                  <span className="text-[10px] font-bold text-[#E0E0E0] bg-[#0A0A0A] px-2 py-0.5 rounded border border-[#2A2A2A]">
                    CR {m.cr}
                  </span>
                </div>

                {/* Базовые статы */}
                <div className="flex items-center gap-3 text-xs bg-[#0A0A0A] p-2 rounded border border-[#2A2A2A]">
                  <div className="flex items-center gap-1 text-red-400 font-bold">
                    <Heart size={12} />
                    <span>{m.hp} HP</span>
                  </div>
                  <div className="flex items-center gap-1 text-blue-400 font-bold">
                    <Shield size={12} />
                    <span>AC {m.ac}</span>
                  </div>
                  <div className="text-[#8E9299] text-[10px]">
                    Speed: {m.speed}
                  </div>
                </div>

                {/* Характеристики */}
                <div className="grid grid-cols-6 gap-1 text-center bg-[#111214] p-1.5 rounded text-[9px]">
                  <div><span className="text-[#8E9299]">STR</span><br/><b className="text-white">{m.stats.str}</b></div>
                  <div><span className="text-[#8E9299]">DEX</span><br/><b className="text-white">{m.stats.dex}</b></div>
                  <div><span className="text-[#8E9299]">CON</span><br/><b className="text-white">{m.stats.con}</b></div>
                  <div><span className="text-[#8E9299]">INT</span><br/><b className="text-white">{m.stats.int}</b></div>
                  <div><span className="text-[#8E9299]">WIS</span><br/><b className="text-white">{m.stats.wis}</b></div>
                  <div><span className="text-[#8E9299]">CHA</span><br/><b className="text-white">{m.stats.cha}</b></div>
                </div>

                {/* Атаки */}
                <div className="flex flex-col gap-1 text-[10px] text-[#C5C8D0]">
                  {m.actions.map((act, aIdx) => (
                    <div key={aIdx} className="bg-[#151619] p-1.5 rounded border border-[#2A2A2A]">
                      <b className="text-[#E0E0E0]">{act.name}: </b>
                      <span>{act.desc}</span>
                    </div>
                  ))}
                </div>

                {/* Кнопка добавления в Combat Tracker */}
                <button
                  onClick={() => onAddMonsterToCombat(m)}
                  className="mt-1 bg-[#2A2A2A] hover:bg-[#F27D26] hover:text-black py-1.5 rounded text-xs font-bold flex items-center justify-center gap-1.5 transition border border-[#3A3A3A]"
                >
                  <Plus size={13} />
                  <span>ADD TO COMBAT TRACKER</span>
                </button>
              </div>
            ))}
          </>
        )}

        {/* 2. ЗАКЛИНАНИЯ */}
        {tab === 'spells' && (
          <>
            {filteredSpells.map((s) => (
              <div
                key={s.id}
                className="bg-[#1A1C20] border border-[#2A2A2A] rounded-lg p-3 flex flex-col gap-2 hover:border-[#F27D26]/60 transition"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-xs text-[#F27D26]">{s.name}</h3>
                    <p className="text-[10px] text-[#8E9299]">Level {s.level} {s.school}</p>
                  </div>
                  <span className="text-[9px] font-bold text-[#8E9299] bg-[#0A0A0A] px-2 py-0.5 rounded border border-[#2A2A2A]">
                    {s.castingTime}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-1 text-[10px] bg-[#0A0A0A] p-2 rounded border border-[#2A2A2A] text-[#8E9299]">
                  <div>Range: <span className="text-white font-bold">{s.range}</span></div>
                  <div>Duration: <span className="text-white font-bold">{s.duration}</span></div>
                  {s.aoe && <div className="col-span-2 text-[#F27D26]">AoE: <span className="text-white">{s.aoe}</span></div>}
                </div>

                <p className="text-[11px] text-[#C5C8D0] leading-relaxed">
                  {s.description}
                </p>

                {s.aoe && onApplySpellTemplate && (
                  <button
                    onClick={() => onApplySpellTemplate(s)}
                    className="bg-[#2A2A2A] hover:bg-[#F27D26] hover:text-black py-1.5 rounded text-xs font-bold flex items-center justify-center gap-1.5 transition border border-[#3A3A3A]"
                  >
                    <Compass size={13} />
                    <span>PLACE AOE TEMPLATE</span>
                  </button>
                )}
              </div>
            ))}
          </>
        )}

        {/* 3. СОСТОЯНИЯ И ПРАВИЛА */}
        {tab === 'conditions' && (
          <>
            {filteredConditions.map((c) => (
              <div key={c.id} className="bg-[#1A1C20] border border-[#2A2A2A] rounded-lg p-3 flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                  <h3 className="font-bold text-xs text-white">{c.name}</h3>
                </div>
                <p className="text-[11px] text-[#8E9299] leading-relaxed pl-4.5">
                  {c.description}
                </p>
              </div>
            ))}
          </>
        )}

        {/* 4. ПРЕДМЕТЫ */}
        {tab === 'items' && (
          <>
            {filteredItems.map((item) => (
              <div key={item.id} className="bg-[#1A1C20] border border-[#2A2A2A] rounded-lg p-3 flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-xs text-[#F27D26]">{item.name}</h3>
                  <span className="text-[9px] text-[#8E9299] bg-[#0A0A0A] px-2 py-0.5 rounded border border-[#2A2A2A]">
                    {item.rarity}
                  </span>
                </div>
                <p className="text-[11px] text-[#8E9299]">{item.description}</p>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
};
