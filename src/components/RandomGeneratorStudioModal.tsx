/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Интерактивная студия процедурной генерации D&D 5e и быстрый референс кампании.
 * Охватывает 7 генераторов:
 * 1. Bestiary Monster Engine (CR 0 - CR 30)
 * 2. Social NPC Engine
 * 3. Loot & Treasure Engine
 * 4. Wandering Merchants Engine
 * 5. City Stores & Markets Engine
 * 6. Equipment & Affix System
 * 7. Magic, Spells & Wild Magic Engine
 * + Панель закрепленных карточек (Pinned Reference Cards) для мастера.
 */

import React, { useState } from 'react';
import {
  Skull,
  Users,
  Coins,
  Store,
  Compass,
  Sword,
  Sparkles,
  Zap,
  Bookmark,
  Tv,
  Plus,
  Copy,
  RefreshCw,
  X,
  Check,
  Shield,
  Heart,
  FileText,
  Pin
} from 'lucide-react';
import {
  CreatureType,
  MonsterArchetype,
  GeneratedMonster,
  GeneratedNPC,
  GeneratedLoot,
  GeneratedMerchant,
  GeneratedStore,
  GeneratedEquipment,
  GeneratedCustomSpell,
  WildMagicSurgeEffect,
  HandoutCardPayload,
  StoreCategory,
  SettlementSize,
  CampaignTier,
  EquipmentMaterial,
  EquipmentCategory,
  MagicSchool,
  MerchantType,
  SocialAttitude
} from '../types/generator';
import {
  generateMonster,
  monsterToHandoutCard,
  generateSocialNPC,
  npcToHandoutCard,
  generateLoot,
  lootToHandoutCard,
  generateMerchant,
  merchantToHandoutCard,
  generateStore,
  storeToHandoutCard,
  generateEquipment,
  equipmentToHandoutCard,
  generateCustomSpell,
  spellToHandoutCard,
  rollWildMagicSurge,
  wildMagicToHandoutCard
} from '../services/generatorEngine';
import { Combatant, MapLayer, SpellTemplate } from '../types';

interface RandomGeneratorStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBroadcastCard: (card: HandoutCardPayload) => void;
  onAddMonsterToCombat?: (combatant: Partial<Combatant>) => void;
  onSpawnToken?: (layer: Partial<MapLayer>) => void;
  onAppendSceneNotes?: (text: string) => void;
  onApplySpellTemplate?: (template: SpellTemplate) => void;
}

type GeneratorTab = 'monsters' | 'npcs' | 'loot' | 'merchants' | 'stores' | 'equipment' | 'magic' | 'pinned';

export const RandomGeneratorStudioModal: React.FC<RandomGeneratorStudioModalProps> = ({
  isOpen,
  onClose,
  onBroadcastCard,
  onAddMonsterToCombat,
  onSpawnToken,
  onAppendSceneNotes,
  onApplySpellTemplate
}) => {
  const [activeTab, setActiveTab] = useState<GeneratorTab>('monsters');
  const [pinnedCards, setPinnedCards] = useState<HandoutCardPayload[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // 1. Состояние Монстра
  const [monsterCr, setMonsterCr] = useState<string>('2');
  const [monsterType, setMonsterType] = useState<CreatureType>('Гуманоид');
  const [monsterArchetype, setMonsterArchetype] = useState<MonsterArchetype>('Брут');
  const [monsterIsBoss, setMonsterIsBoss] = useState<boolean>(false);
  const [currentMonster, setCurrentMonster] = useState<GeneratedMonster>(() => generateMonster({ cr: '2' }));

  // 2. Состояние NPC
  const [npcRace, setNpcRace] = useState<string>('');
  const [npcOccupation, setNpcOccupation] = useState<string>('');
  const [npcAttitude, setNpcAttitude] = useState<SocialAttitude>('Нейтральный');
  const [currentNPC, setCurrentNPC] = useState<GeneratedNPC>(() => generateSocialNPC());

  // 3. Состояние Лута
  const [lootTier, setLootTier] = useState<CampaignTier>('Tier 2 (Ур. 5-10)');
  const [lootMode, setLootMode] = useState<'individual' | 'hoard'>('hoard');
  const [currentLoot, setCurrentLoot] = useState<GeneratedLoot>(() => generateLoot({ tier: 'Tier 2 (Ур. 5-10)', mode: 'hoard' }));

  // 4. Состояние Торговца
  const [merchantType, setMerchantType] = useState<MerchantType>('Караванщик-кочевник');
  const [currentMerchant, setCurrentMerchant] = useState<GeneratedMerchant>(() => generateMerchant());

  // 5. Состояние Лавки
  const [storeCategory, setStoreCategory] = useState<StoreCategory>('Кузница и Оружейная');
  const [storeSettlement, setStoreSettlement] = useState<SettlementSize>('Городок (Town)');
  const [currentStore, setCurrentStore] = useState<GeneratedStore>(() => generateStore());

  // 6. Состояние Экипировки
  const [equipCategory, setEquipCategory] = useState<EquipmentCategory>('Оружие ближнего боя');
  const [equipMaterial, setEquipMaterial] = useState<EquipmentMaterial>('Адамантин');
  const [currentEquipment, setCurrentEquipment] = useState<GeneratedEquipment>(() => generateEquipment());

  // 7. Состояние Магии
  const [magicMode, setMagicMode] = useState<'spell' | 'wild'>('spell');
  const [spellSchool, setSpellSchool] = useState<MagicSchool>('Воплощение (Evocation)');
  const [spellLevel, setSpellLevel] = useState<number>(3);
  const [currentSpell, setCurrentSpell] = useState<GeneratedCustomSpell>(() => generateCustomSpell({ level: 3 }));
  const [currentWildMagic, setCurrentWildMagic] = useState<WildMagicSurgeEffect>(() => rollWildMagicSurge());

  if (!isOpen) return null;

  // Хэндлеры перегенерации
  const handleRegenMonster = () => {
    setCurrentMonster(generateMonster({
      cr: monsterCr,
      type: monsterType,
      archetype: monsterArchetype,
      isBoss: monsterIsBoss
    }));
  };

  const handleRegenNPC = () => {
    setCurrentNPC(generateSocialNPC({
      race: npcRace || undefined,
      occupation: npcOccupation || undefined,
      attitude: npcAttitude
    }));
  };

  const handleRegenLoot = () => {
    setCurrentLoot(generateLoot({ tier: lootTier, mode: lootMode }));
  };

  const handleRegenMerchant = () => {
    setCurrentMerchant(generateMerchant({ type: merchantType }));
  };

  const handleRegenStore = () => {
    setCurrentStore(generateStore({ category: storeCategory, settlementSize: storeSettlement }));
  };

  const handleRegenEquipment = () => {
    setCurrentEquipment(generateEquipment({ category: equipCategory, material: equipMaterial }));
  };

  const handleRegenMagic = () => {
    if (magicMode === 'spell') {
      setCurrentSpell(generateCustomSpell({ school: spellSchool, level: spellLevel }));
    } else {
      setCurrentWildMagic(rollWildMagicSurge());
    }
  };

  // Закрепление карточки
  const togglePinCard = (card: HandoutCardPayload) => {
    if (pinnedCards.some((c) => c.id === card.id)) {
      setPinnedCards(pinnedCards.filter((c) => c.id !== card.id));
    } else {
      setPinnedCards([...pinnedCards, card]);
    }
  };

  const isCardPinned = (cardId: string) => pinnedCards.some((c) => c.id === cardId);

  // Копирование в буфер
  const copyTextToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200 select-none">
      <div className="w-full max-w-6xl h-[92vh] bg-[#121316] border-2 border-[#2A2E38] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-[#E0E0E0] font-mono">
        
        {/* Верхняя шапка студии */}
        <div className="p-4 border-b border-[#22252C] bg-[#0E0F12] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#2A1F18] border border-[#F27D26]/40 text-[#F27D26]">
              <Sparkles size={18} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold font-serif text-white tracking-wide flex items-center gap-2">
                <span>D&D 5E GENERATOR STUDIO & DM SCREEN</span>
                <span className="px-2 py-0.5 rounded text-[10px] bg-[#2A2E38] text-[#F27D26] font-mono">VTT-ZERO</span>
              </h2>
              <p className="text-[11px] text-[#8E9299]">
                Процедурные генераторы контента, карточки для проектора и быстрый референс мастера
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-[#1A1C20] hover:bg-[#252830] text-[#8E9299] hover:text-white transition cursor-pointer"
            title="Закрыть студию"
          >
            <X size={18} />
          </button>
        </div>

        {/* Навигация по вкладкам 7 генераторов */}
        <div className="flex border-b border-[#22252C] bg-[#0A0B0D] overflow-x-auto text-xs scrollbar-none">
          {[
            { id: 'monsters', label: '1. БЕСТИАРИЙ', icon: <Skull size={13} /> },
            { id: 'npcs', label: '2. NPC И ДИАЛОГИ', icon: <Users size={13} /> },
            { id: 'loot', label: '3. ЛУТ И СОКРОВИЩА', icon: <Coins size={13} /> },
            { id: 'merchants', label: '4. ТОРГОВЦЫ', icon: <Compass size={13} /> },
            { id: 'stores', label: '5. ГОРОДСКИЕ ЛАВКИ', icon: <Store size={13} /> },
            { id: 'equipment', label: '6. ЭКИПИРОВКА И АФФИКСЫ', icon: <Sword size={13} /> },
            { id: 'magic', label: '7. МАГИЯ И СПЛЕСКИ', icon: <Zap size={13} /> },
            { id: 'pinned', label: `ЗАКРЕПЛЕННЫЕ (${pinnedCards.length})`, icon: <Bookmark size={13} className={pinnedCards.length > 0 ? 'text-[#F27D26]' : ''} /> }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as GeneratorTab)}
              className={`px-4 py-3 font-bold uppercase transition flex items-center gap-1.5 whitespace-nowrap border-b-2 ${
                activeTab === tab.id
                  ? 'bg-[#15171C] text-[#F27D26] border-[#F27D26]'
                  : 'text-[#8E9299] hover:text-white border-transparent'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Основная рабочая область генератора */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          
          {/* ========================================================================= */}
          {/* 1. БЕСТИАРИЙ (CR 0 - CR 30) */}
          {/* ========================================================================= */}
          {activeTab === 'monsters' && (
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
              {/* Левая панель параметров */}
              <div className="w-full md:w-80 p-4 border-r border-[#22252C] bg-[#0E0F12] overflow-y-auto space-y-4 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#F27D26] uppercase">ПАРАМЕТРЫ CR & АРХЕТИПА</span>
                  <button
                    onClick={handleRegenMonster}
                    className="px-2.5 py-1 bg-[#F27D26] hover:bg-[#E06C15] text-black font-extrabold rounded flex items-center gap-1 cursor-pointer transition shadow"
                  >
                    <RefreshCw size={12} />
                    <span>СГЕНЕРИРОВАТЬ</span>
                  </button>
                </div>

                <div>
                  <label className="block text-[#8E9299] mb-1 font-bold">Опасность (CR): {monsterCr}</label>
                  <select
                    value={monsterCr}
                    onChange={(e) => setMonsterCr(e.target.value)}
                    className="w-full bg-[#1A1C22] border border-[#2F3440] rounded p-2 text-white outline-none focus:border-[#F27D26]"
                  >
                    {['0', '1/8', '1/4', '1/2', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '12', '14', '16', '18', '20', '24', '30'].map((cr) => (
                      <option key={cr} value={cr}>CR {cr} (EXP {cr === '30' ? '155k' : cr === '20' ? '25k' : ''})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[#8E9299] mb-1 font-bold">Тип существа</label>
                  <select
                    value={monsterType}
                    onChange={(e) => setMonsterType(e.target.value as CreatureType)}
                    className="w-full bg-[#1A1C22] border border-[#2F3440] rounded p-2 text-white outline-none focus:border-[#F27D26]"
                  >
                    {['Гуманоид', 'Нежить', 'Чудовище', 'Дракон', 'Аберрация', 'Исчадие', 'Фея', 'Элементаль', 'Растение', 'Конструкт', 'Великан', 'Зверь'].map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[#8E9299] mb-1 font-bold">Боевой архетип</label>
                  <select
                    value={monsterArchetype}
                    onChange={(e) => setMonsterArchetype(e.target.value as MonsterArchetype)}
                    className="w-full bg-[#1A1C22] border border-[#2F3440] rounded p-2 text-white outline-none focus:border-[#F27D26]"
                  >
                    <option value="Брут">Брут (+HP, +STR, дробящие удары)</option>
                    <option value="Застрельщик">Застрельщик (+DEX, мобильность, луки)</option>
                    <option value="Контролер">Контролер (+INT/WIS, заклинания, дебаффы)</option>
                    <option value="Танк">Танк (+AC, щиты, спасброски)</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="bossToggle"
                    checked={monsterIsBoss}
                    onChange={(e) => setMonsterIsBoss(e.target.checked)}
                    className="accent-[#F27D26] w-4 h-4 cursor-pointer"
                  />
                  <label htmlFor="bossToggle" className="text-white cursor-pointer font-bold">
                    Легендарный Босс (3 действия в раунд)
                  </label>
                </div>

                <div className="p-3 bg-[#16181D] border border-[#252A34] rounded-lg text-[11px] text-[#8E9299] space-y-1">
                  <p className="font-bold text-white">Математика баланса D&D 5e:</p>
                  <p>• HP рассчитывается по размеру костей: d4-d20 + CON mod.</p>
                  <p>• Атакующий CR включает Multiattack и DPR.</p>
                  <p>• Автоматический расчет СЛ спасбросков и попаданий.</p>
                </div>
              </div>

              {/* Правая карточка статблока */}
              <div className="flex-1 p-5 overflow-y-auto bg-[#141519] flex flex-col space-y-4">
                <div className="bg-[#1A1D24] border border-[#2C313E] rounded-xl p-5 shadow-lg space-y-4">
                  
                  {/* Заголовок статблока */}
                  <div className="flex items-start justify-between border-b border-[#2A2E39] pb-4">
                    <div>
                      <h3 className="text-xl sm:text-2xl font-serif font-bold text-[#F27D26]">
                        {currentMonster.name}
                      </h3>
                      <p className="text-xs text-[#8E9299] mt-0.5">
                        {currentMonster.size} {currentMonster.type} ({currentMonster.archetype}), {currentMonster.alignment}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => onBroadcastCard(monsterToHandoutCard(currentMonster))}
                        className="px-3 py-1.5 bg-[#F27D26] hover:bg-[#E06C15] text-black font-extrabold rounded-lg text-xs flex items-center gap-1.5 shadow active:scale-95 transition"
                        title="Показать игрокам на экране проектора"
                      >
                        <Tv size={14} />
                        <span>ПОКАЗАТЬ ИГРОКАМ</span>
                      </button>

                      <button
                        onClick={() => togglePinCard(monsterToHandoutCard(currentMonster))}
                        className={`p-1.5 rounded-lg border text-xs font-bold transition flex items-center gap-1 ${
                          isCardPinned(currentMonster.id)
                            ? 'bg-[#2A1F18] border-[#F27D26] text-[#F27D26]'
                            : 'bg-[#121316] border-[#2A2E38] text-[#8E9299] hover:text-white'
                        }`}
                        title="Закрепить на экране мастера"
                      >
                        <Pin size={14} />
                      </button>

                      {onAddMonsterToCombat && (
                        <button
                          onClick={() => {
                            onAddMonsterToCombat({
                              name: currentMonster.name,
                              type: currentMonster.isBoss ? 'boss' : 'monster',
                              hpCurrent: currentMonster.hp,
                              hpMax: currentMonster.hp,
                              ac: currentMonster.ac
                            });
                          }}
                          className="px-2.5 py-1.5 bg-[#252830] hover:bg-[#323642] text-white border border-[#3A404E] rounded-lg text-xs font-bold flex items-center gap-1"
                          title="Добавить в Combat Tracker"
                        >
                          <Plus size={13} className="text-[#F27D26]" />
                          <span>В БОЙ</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Основные статы */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div className="bg-[#121316] border border-[#242730] p-2.5 rounded-lg">
                      <span className="text-[10px] text-[#8E9299] block font-bold">КЛАСС ДОСПЕХА</span>
                      <span className="text-sm font-bold text-white">{currentMonster.ac} ({currentMonster.acType})</span>
                    </div>
                    <div className="bg-[#121316] border border-[#242730] p-2.5 rounded-lg">
                      <span className="text-[10px] text-[#8E9299] block font-bold">ХИТЫ (HP)</span>
                      <span className="text-sm font-bold text-[#F27D26]">{currentMonster.hp} ({currentMonster.hitDice})</span>
                    </div>
                    <div className="bg-[#121316] border border-[#242730] p-2.5 rounded-lg">
                      <span className="text-[10px] text-[#8E9299] block font-bold">СКОРОСТЬ</span>
                      <span className="text-sm font-bold text-white">{currentMonster.speed}</span>
                    </div>
                    <div className="bg-[#121316] border border-[#242730] p-2.5 rounded-lg">
                      <span className="text-[10px] text-[#8E9299] block font-bold">ОПАСНОСТЬ (CR)</span>
                      <span className="text-sm font-bold text-emerald-400">CR {currentMonster.cr} (Бонус +{currentMonster.proficiencyBonus})</span>
                    </div>
                  </div>

                  {/* Характеристики (6 статов) */}
                  <div className="grid grid-cols-6 gap-1 bg-[#101216] border border-[#242730] p-2 rounded-lg text-center text-xs">
                    {[
                      { l: 'СИЛ', v: currentMonster.abilities.str },
                      { l: 'ЛОВ', v: currentMonster.abilities.dex },
                      { l: 'ТЕЛ', v: currentMonster.abilities.con },
                      { l: 'ИНТ', v: currentMonster.abilities.int },
                      { l: 'МУД', v: currentMonster.abilities.wis },
                      { l: 'ХАР', v: currentMonster.abilities.cha }
                    ].map((st) => {
                      const mod = Math.floor((st.v - 10) / 2);
                      return (
                        <div key={st.l} className="p-1">
                          <span className="text-[10px] text-[#8E9299] block font-bold">{st.l}</span>
                          <span className="font-bold text-white text-xs">{st.v}</span>
                          <span className="text-[10px] text-[#F27D26] block font-bold">{mod >= 0 ? `+${mod}` : mod}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Свойства и чувства */}
                  <div className="text-xs text-[#A0A5AD] space-y-1 bg-[#121316] p-3 rounded-lg border border-[#242730]">
                    {currentMonster.savingThrows && <p><strong className="text-white">Спасброски:</strong> {currentMonster.savingThrows}</p>}
                    {currentMonster.skills && <p><strong className="text-white">Навыки:</strong> {currentMonster.skills}</p>}
                    {currentMonster.damageResistances && <p><strong className="text-white">Сопротивление урону:</strong> {currentMonster.damageResistances}</p>}
                    {currentMonster.damageImmunities && <p><strong className="text-white">Иммунитет к урону:</strong> {currentMonster.damageImmunities}</p>}
                    {currentMonster.conditionImmunities && <p><strong className="text-white">Иммунитет к состояниям:</strong> {currentMonster.conditionImmunities}</p>}
                    <p><strong className="text-white">Чувства:</strong> {currentMonster.senses}</p>
                    <p><strong className="text-white">Языки:</strong> {currentMonster.languages}</p>
                  </div>

                  {/* Особенности (Traits) */}
                  {currentMonster.traits.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-[#F27D26] uppercase tracking-wider border-b border-[#2A2E38] pb-1">
                        ОСОБЕННОСТИ И ЧЕРТЫ
                      </h4>
                      {currentMonster.traits.map((t, idx) => (
                        <div key={idx} className="text-xs">
                          <strong className="text-white">{t.name}.</strong> <span className="text-[#C5C9D0]">{t.desc}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Действия (Actions) */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-[#F27D26] uppercase tracking-wider border-b border-[#2A2E38] pb-1">
                      ДЕЙСТВИЯ (ACTIONS)
                    </h4>
                    {currentMonster.actions.map((a, idx) => (
                      <div key={idx} className="text-xs bg-[#101216] p-2.5 rounded-lg border border-[#22252D]">
                        <strong className="text-white">{a.name}.</strong> <span className="text-[#C5C9D0]">{a.desc}</span>
                      </div>
                    ))}
                  </div>

                  {/* Реакции */}
                  {currentMonster.reactions && currentMonster.reactions.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-[#F27D26] uppercase tracking-wider border-b border-[#2A2E38] pb-1">
                        РЕАКЦИИ
                      </h4>
                      {currentMonster.reactions.map((r, idx) => (
                        <div key={idx} className="text-xs">
                          <strong className="text-white">{r.name}.</strong> <span className="text-[#C5C9D0]">{r.desc}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Легендарные действия */}
                  {currentMonster.legendaryActions && (
                    <div className="space-y-2 bg-[#121316] p-3 rounded-lg border border-red-500/30">
                      <h4 className="text-xs font-bold text-red-400 uppercase tracking-wider">
                        ЛЕГЕНДАРНЫЕ ДЕЙСТВИЯ ({currentMonster.legendaryActions.pointsPerRound} ОЧКА В РАУНД)
                      </h4>
                      <p className="text-[11px] text-[#8E9299]">
                        Существо может совершать 3 легендарных действия в конце хода другого существа.
                      </p>
                      {currentMonster.legendaryActions.actions.map((la, idx) => (
                        <div key={idx} className="text-xs">
                          <strong className="text-amber-300">{la.name} (Стоимость: {la.cost}).</strong> <span className="text-[#C5C9D0]">{la.desc}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Тактический совет для мастера */}
                  <div className="p-3 bg-[#111215] border-l-2 border-[#F27D26] rounded-r-lg text-xs text-[#A0A5AD]">
                    <strong className="text-white">Совет для DM:</strong> {currentMonster.tacticsAdvice}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 2. СОЦИАЛЬНЫЙ NPC И ДИАЛОГИ */}
          {/* ========================================================================= */}
          {activeTab === 'npcs' && (
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
              {/* Параметры NPC */}
              <div className="w-full md:w-80 p-4 border-r border-[#22252C] bg-[#0E0F12] overflow-y-auto space-y-4 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#F27D26] uppercase">ПАРАМЕТРЫ NPC</span>
                  <button
                    onClick={handleRegenNPC}
                    className="px-2.5 py-1 bg-[#F27D26] hover:bg-[#E06C15] text-black font-extrabold rounded flex items-center gap-1 cursor-pointer transition shadow"
                  >
                    <RefreshCw size={12} />
                    <span>СГЕНЕРИРОВАТЬ</span>
                  </button>
                </div>

                <div>
                  <label className="block text-[#8E9299] mb-1 font-bold">Отношение к партии</label>
                  <select
                    value={npcAttitude}
                    onChange={(e) => setNpcAttitude(e.target.value as SocialAttitude)}
                    className="w-full bg-[#1A1C22] border border-[#2F3440] rounded p-2 text-white outline-none focus:border-[#F27D26]"
                  >
                    <option value="Враждебный">Враждебный (Hostile)</option>
                    <option value="Настороженный">Настороженный (Cautious)</option>
                    <option value="Нейтральный">Нейтральный (Neutral)</option>
                    <option value="Дружелюбный">Дружелюбный (Friendly)</option>
                  </select>
                </div>

                <div className="p-3 bg-[#16181D] border border-[#252A34] rounded-lg text-[11px] text-[#8E9299] space-y-1">
                  <p className="font-bold text-white">Матрица личности:</p>
                  <p>• Мировоззрение 3x3 + Идеал, Привязанность, Слабость.</p>
                  <p>• Секрет с проверкой DC Харизмы (Убеждение/Запугивание).</p>
                  <p>• Слух для квеста и подсказка по отыгрышу голоса.</p>
                </div>
              </div>

              {/* Карточка NPC */}
              <div className="flex-1 p-5 overflow-y-auto bg-[#141519] flex flex-col space-y-4">
                <div className="bg-[#1A1D24] border border-[#2C313E] rounded-xl p-5 shadow-lg space-y-4">
                  <div className="flex items-start justify-between border-b border-[#2A2E39] pb-4">
                    <div>
                      <h3 className="text-xl font-serif font-bold text-[#F27D26]">{currentNPC.name}</h3>
                      <p className="text-xs text-[#8E9299] mt-0.5">
                        {currentNPC.gender}, {currentNPC.race}, {currentNPC.age} • {currentNPC.socialClass}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onBroadcastCard(npcToHandoutCard(currentNPC))}
                        className="px-3 py-1.5 bg-[#F27D26] hover:bg-[#E06C15] text-black font-extrabold rounded-lg text-xs flex items-center gap-1.5 shadow active:scale-95 transition"
                      >
                        <Tv size={14} />
                        <span>ПОКАЗАТЬ ИГРОКАМ</span>
                      </button>

                      <button
                        onClick={() => togglePinCard(npcToHandoutCard(currentNPC))}
                        className={`p-1.5 rounded-lg border text-xs font-bold transition flex items-center gap-1 ${
                          isCardPinned(currentNPC.id)
                            ? 'bg-[#2A1F18] border-[#F27D26] text-[#F27D26]'
                            : 'bg-[#121316] border-[#2A2E38] text-[#8E9299] hover:text-white'
                        }`}
                      >
                        <Pin size={14} />
                      </button>

                      {onAppendSceneNotes && (
                        <button
                          onClick={() => {
                            onAppendSceneNotes(`\n### NPC: ${currentNPC.name} (${currentNPC.race}, ${currentNPC.socialClass})\n- Отношение: ${currentNPC.attitude}\n- Идеал: ${currentNPC.ideal}\n- Секрет: ${currentNPC.secret.text} (Сл ${currentNPC.secret.dc} ${currentNPC.secret.checkType})\n- Слух: ${currentNPC.rumor.text}`);
                          }}
                          className="p-1.5 bg-[#252830] hover:bg-[#323642] text-white border border-[#3A404E] rounded-lg text-xs font-bold"
                          title="Добавить в заметки сцены"
                        >
                          <FileText size={14} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Статус и мировоззрение */}
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="bg-[#121316] p-2.5 rounded-lg border border-[#242730]">
                      <span className="text-[10px] text-[#8E9299] block font-bold">ОТНОШЕНИЕ</span>
                      <span className="font-bold text-[#F27D26]">{currentNPC.attitude}</span>
                    </div>
                    <div className="bg-[#121316] p-2.5 rounded-lg border border-[#242730]">
                      <span className="text-[10px] text-[#8E9299] block font-bold">МИРОВОЗЗРЕНИЕ</span>
                      <span className="font-bold text-white">{currentNPC.alignment}</span>
                    </div>
                    <div className="bg-[#121316] p-2.5 rounded-lg border border-[#242730]">
                      <span className="text-[10px] text-[#8E9299] block font-bold">ПРОВЕРКА СЕКРЕТА</span>
                      <span className="font-bold text-amber-300">DC {currentNPC.secret.dc} ({currentNPC.secret.checkType})</span>
                    </div>
                  </div>

                  {/* Внешность и привычки */}
                  <div className="bg-[#121316] p-3 rounded-lg border border-[#242730] text-xs space-y-1.5">
                    <p><strong className="text-white">Внешность:</strong> {currentNPC.appearance.join('. ')}</p>
                    <p><strong className="text-[#F27D26]">Привычка/Примета:</strong> {currentNPC.quirks.join('. ')}</p>
                  </div>

                  {/* Психологический профиль */}
                  <div className="space-y-2 text-xs">
                    <h4 className="text-xs font-bold text-[#F27D26] uppercase tracking-wider border-b border-[#2A2E38] pb-1">
                      ПСИХОЛОГИЧЕСКИЙ ПРОФИЛЬ
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div className="bg-[#101216] p-2.5 rounded-lg border border-[#22252D]">
                        <span className="text-[10px] text-[#8E9299] block font-bold uppercase">ИДЕАЛ</span>
                        <p className="text-white mt-1">{currentNPC.ideal}</p>
                      </div>
                      <div className="bg-[#101216] p-2.5 rounded-lg border border-[#22252D]">
                        <span className="text-[10px] text-[#8E9299] block font-bold uppercase">ПРИВЯЗАННОСТЬ</span>
                        <p className="text-white mt-1">{currentNPC.bond}</p>
                      </div>
                      <div className="bg-[#101216] p-2.5 rounded-lg border border-[#22252D]">
                        <span className="text-[10px] text-[#8E9299] block font-bold uppercase">СЛАБОСТЬ</span>
                        <p className="text-white mt-1">{currentNPC.flaw}</p>
                      </div>
                    </div>
                  </div>

                  {/* Секрет и Слух */}
                  <div className="space-y-2 text-xs">
                    <div className="p-3 bg-red-950/20 border border-red-500/30 rounded-lg">
                      <div className="flex items-center justify-between text-red-400 font-bold mb-1">
                        <span>ТАЙНЫЙ СЕКРЕТ (Только для DM)</span>
                        <span>Сл {currentNPC.secret.dc} ({currentNPC.secret.checkType})</span>
                      </div>
                      <p className="text-[#E0E0E0]">{currentNPC.secret.text}</p>
                    </div>

                    <div className="p-3 bg-amber-950/20 border border-amber-500/30 rounded-lg">
                      <div className="text-amber-400 font-bold mb-1">
                        <span>СЛУХ / ЗАЦЕПКА ДЛЯ КВЕСТА ({currentNPC.rumor.isTrue ? 'Истинный слух' : 'Ложная молва'})</span>
                      </div>
                      <p className="text-[#E0E0E0] italic">«{currentNPC.rumor.text}»</p>
                    </div>
                  </div>

                  {/* Совет по отыгрышу */}
                  <div className="p-3 bg-[#111215] border-l-2 border-[#9F7AEA] rounded-r-lg text-xs text-[#A0A5AD]">
                    <strong className="text-white">Отыгрыш мастера:</strong> Голос {currentNPC.roleplayTips.voice.toLowerCase()}. Манера: {currentNPC.roleplayTips.manner.toLowerCase()}.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 3. ЛУТ И СОКРОВИЩА */}
          {/* ========================================================================= */}
          {activeTab === 'loot' && (
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
              {/* Параметры Лута */}
              <div className="w-full md:w-80 p-4 border-r border-[#22252C] bg-[#0E0F12] overflow-y-auto space-y-4 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#F27D26] uppercase">ПАРАМЕТРЫ СОКРОВИЩ</span>
                  <button
                    onClick={handleRegenLoot}
                    className="px-2.5 py-1 bg-[#F27D26] hover:bg-[#E06C15] text-black font-extrabold rounded flex items-center gap-1 cursor-pointer transition shadow"
                  >
                    <RefreshCw size={12} />
                    <span>СГЕНЕРИРОВАТЬ</span>
                  </button>
                </div>

                <div>
                  <label className="block text-[#8E9299] mb-1 font-bold">Тир кампании</label>
                  <select
                    value={lootTier}
                    onChange={(e) => setLootTier(e.target.value as CampaignTier)}
                    className="w-full bg-[#1A1C22] border border-[#2F3440] rounded p-2 text-white outline-none focus:border-[#F27D26]"
                  >
                    <option value="Tier 1 (Ур. 1-4)">Tier 1 (Ур. 1-4)</option>
                    <option value="Tier 2 (Ур. 5-10)">Tier 2 (Ур. 5-10)</option>
                    <option value="Tier 3 (Ур. 11-16)">Tier 3 (Ур. 11-16)</option>
                    <option value="Tier 4 (Ур. 17-20)">Tier 4 (Ур. 17-20)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#8E9299] mb-1 font-bold">Режим сокровищ</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setLootMode('hoard')}
                      className={`p-2 rounded font-bold transition border ${
                        lootMode === 'hoard' ? 'bg-[#2A1F18] text-[#F27D26] border-[#F27D26]' : 'bg-[#16181D] text-[#8E9299] border-[#252A34]'
                      }`}
                    >
                      Сундук босса
                    </button>
                    <button
                      onClick={() => setLootMode('individual')}
                      className={`p-2 rounded font-bold transition border ${
                        lootMode === 'individual' ? 'bg-[#2A1F18] text-[#F27D26] border-[#F27D26]' : 'bg-[#16181D] text-[#8E9299] border-[#252A34]'
                      }`}
                    >
                      Карманы врагов
                    </button>
                  </div>
                </div>

                <div className="p-3 bg-[#16181D] border border-[#252A34] rounded-lg text-[11px] text-[#8E9299] space-y-1">
                  <p className="font-bold text-white">Таблицы сокровищ:</p>
                  <p>• Монеты CP, SP, GP, PP по формулам распределения.</p>
                  <p>• Самоцветы от 10 GP до 5000 GP и произведения искусства.</p>
                  <p>• Магические предметы, зелья и свитки.</p>
                </div>
              </div>

              {/* Карточка Лута */}
              <div className="flex-1 p-5 overflow-y-auto bg-[#141519] flex flex-col space-y-4">
                <div className="bg-[#1A1D24] border border-[#2C313E] rounded-xl p-5 shadow-lg space-y-4">
                  <div className="flex items-start justify-between border-b border-[#2A2E39] pb-4">
                    <div>
                      <h3 className="text-xl font-serif font-bold text-yellow-400">{currentLoot.title}</h3>
                      <p className="text-xs text-[#8E9299] mt-0.5">{currentLoot.containerDescription}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onBroadcastCard(lootToHandoutCard(currentLoot))}
                        className="px-3 py-1.5 bg-[#F27D26] hover:bg-[#E06C15] text-black font-extrabold rounded-lg text-xs flex items-center gap-1.5 shadow active:scale-95 transition"
                      >
                        <Tv size={14} />
                        <span>ПОКАЗАТЬ ИГРОКАМ</span>
                      </button>

                      <button
                        onClick={() => togglePinCard(lootToHandoutCard(currentLoot))}
                        className={`p-1.5 rounded-lg border text-xs font-bold transition flex items-center gap-1 ${
                          isCardPinned(currentLoot.id)
                            ? 'bg-[#2A1F18] border-[#F27D26] text-[#F27D26]'
                            : 'bg-[#121316] border-[#2A2E38] text-[#8E9299] hover:text-white'
                        }`}
                      >
                        <Pin size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Монеты и общая ценность */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div className="bg-[#121316] p-2.5 rounded-lg border border-[#242730]">
                      <span className="text-[10px] text-[#8E9299] block font-bold">ЗОЛОТО (GP)</span>
                      <span className="font-bold text-yellow-400 text-sm">{currentLoot.coins.gp} GP</span>
                    </div>
                    <div className="bg-[#121316] p-2.5 rounded-lg border border-[#242730]">
                      <span className="text-[10px] text-[#8E9299] block font-bold">СЕРЕБРО / МЕДЬ</span>
                      <span className="font-bold text-slate-300 text-sm">{currentLoot.coins.sp} SP / {currentLoot.coins.cp} CP</span>
                    </div>
                    <div className="bg-[#121316] p-2.5 rounded-lg border border-[#242730]">
                      <span className="text-[10px] text-[#8E9299] block font-bold">ПЛАТИНА (PP)</span>
                      <span className="font-bold text-cyan-300 text-sm">{currentLoot.coins.pp} PP</span>
                    </div>
                    <div className="bg-[#121316] p-2.5 rounded-lg border border-[#242730]">
                      <span className="text-[10px] text-[#8E9299] block font-bold">ОБЩАЯ СТОИМОСТЬ</span>
                      <span className="font-bold text-[#F27D26] text-sm">~{currentLoot.totalValueGp.toLocaleString()} GP</span>
                    </div>
                  </div>

                  {/* Самоцветы */}
                  {currentLoot.gems.length > 0 && (
                    <div className="space-y-2 text-xs">
                      <h4 className="text-xs font-bold text-yellow-400 uppercase tracking-wider border-b border-[#2A2E38] pb-1">
                        ДРАГОЦЕННЫЕ КАМНИ (GEMS)
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {currentLoot.gems.map((g, idx) => (
                          <div key={idx} className="p-2.5 bg-[#101216] border border-[#22252D] rounded-lg flex justify-between items-center">
                            <div>
                              <strong className="text-white">{g.name}</strong> <span className="text-[#8E9299]">(x{g.quantity})</span>
                              <p className="text-[11px] text-[#A0A5AD]">{g.description}</p>
                            </div>
                            <span className="text-yellow-400 font-bold">{g.valueGp * g.quantity} GP</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Предметы искусства */}
                  {currentLoot.artObjects.length > 0 && (
                    <div className="space-y-2 text-xs">
                      <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider border-b border-[#2A2E38] pb-1">
                        ПРОИЗВЕДЕНИЯ ИСКУССТВА (ART OBJECTS)
                      </h4>
                      {currentLoot.artObjects.map((a, idx) => (
                        <div key={idx} className="p-2.5 bg-[#101216] border border-[#22252D] rounded-lg flex justify-between items-center">
                          <div>
                            <strong className="text-white">{a.name}</strong>
                            <p className="text-[11px] text-[#A0A5AD]">{a.description}</p>
                          </div>
                          <span className="text-yellow-400 font-bold">{a.valueGp} GP</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Магические предметы */}
                  {currentLoot.magicItems.length > 0 && (
                    <div className="space-y-2 text-xs">
                      <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider border-b border-[#2A2E38] pb-1">
                        МАГИЧЕСКИЕ ПРЕДМЕТЫ (MAGIC ITEMS)
                      </h4>
                      {currentLoot.magicItems.map((m, idx) => (
                        <div key={idx} className="p-2.5 bg-[#101216] border border-[#22252D] rounded-lg">
                          <div className="flex justify-between items-center font-bold">
                            <span className="text-white">{m.name}</span>
                            <span className="text-purple-300 text-[11px]">{m.rarity} ({m.type})</span>
                          </div>
                          <p className="text-[11px] text-[#A0A5AD] mt-1">{m.desc}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Ловушка на сундуке */}
                  {currentLoot.trapOrHazard && (
                    <div className="p-3 bg-red-950/20 border border-red-500/40 rounded-lg text-xs text-red-300">
                      <strong className="text-red-400">ВНИМАНИЕ (DM):</strong> {currentLoot.trapOrHazard}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 4. СТРАНСТВУЮЩИЕ ТОРГОВЦЫ */}
          {/* ========================================================================= */}
          {activeTab === 'merchants' && (
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
              <div className="w-full md:w-80 p-4 border-r border-[#22252C] bg-[#0E0F12] overflow-y-auto space-y-4 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#F27D26] uppercase">ТИПАЖ ТОРГОВЦА</span>
                  <button
                    onClick={handleRegenMerchant}
                    className="px-2.5 py-1 bg-[#F27D26] hover:bg-[#E06C15] text-black font-extrabold rounded flex items-center gap-1 cursor-pointer transition shadow"
                  >
                    <RefreshCw size={12} />
                    <span>СГЕНЕРИРОВАТЬ</span>
                  </button>
                </div>

                <div>
                  <label className="block text-[#8E9299] mb-1 font-bold">Архетип</label>
                  <select
                    value={merchantType}
                    onChange={(e) => setMerchantType(e.target.value as MerchantType)}
                    className="w-full bg-[#1A1C22] border border-[#2F3440] rounded p-2 text-white outline-none focus:border-[#F27D26]"
                  >
                    <option value="Караванщик-кочевник">Караванщик-кочевник</option>
                    <option value="Скупщик краденого / Контрабандист">Скупщик краденого / Контрабандист</option>
                    <option value="Таинственный бродячий алхимик">Таинственный бродячий алхимик</option>
                    <option value="Гоблин-старьевщик">Гоблин-старьевщик</option>
                  </select>
                </div>
              </div>

              <div className="flex-1 p-5 overflow-y-auto bg-[#141519] flex flex-col space-y-4">
                <div className="bg-[#1A1D24] border border-[#2C313E] rounded-xl p-5 shadow-lg space-y-4">
                  <div className="flex items-start justify-between border-b border-[#2A2E39] pb-4">
                    <div>
                      <h3 className="text-xl font-serif font-bold text-emerald-400">{currentMerchant.name}</h3>
                      <p className="text-xs text-[#8E9299] mt-0.5">{currentMerchant.title} • {currentMerchant.type}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onBroadcastCard(merchantToHandoutCard(currentMerchant))}
                        className="px-3 py-1.5 bg-[#F27D26] hover:bg-[#E06C15] text-black font-extrabold rounded-lg text-xs flex items-center gap-1.5 shadow active:scale-95 transition"
                      >
                        <Tv size={14} />
                        <span>ПОКАЗАТЬ ИГРОКАМ</span>
                      </button>

                      <button
                        onClick={() => togglePinCard(merchantToHandoutCard(currentMerchant))}
                        className={`p-1.5 rounded-lg border text-xs font-bold transition flex items-center gap-1 ${
                          isCardPinned(currentMerchant.id)
                            ? 'bg-[#2A1F18] border-[#F27D26] text-[#F27D26]'
                            : 'bg-[#121316] border-[#2A2E38] text-[#8E9299] hover:text-white'
                        }`}
                      >
                        <Pin size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Описание, охрана и касса */}
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="bg-[#121316] p-2.5 rounded-lg border border-[#242730]">
                      <span className="text-[10px] text-[#8E9299] block font-bold">КАССА ДЛЯ ВЫКУПА</span>
                      <span className="font-bold text-yellow-400 text-sm">{currentMerchant.goldReserveGp} GP</span>
                    </div>
                    <div className="bg-[#121316] p-2.5 rounded-lg border border-[#242730]">
                      <span className="text-[10px] text-[#8E9299] block font-bold">СЛ ТОРГА (HAGGLE)</span>
                      <span className="font-bold text-amber-300 text-sm">DC {currentMerchant.haggleDc}</span>
                    </div>
                    <div className="bg-[#121316] p-2.5 rounded-lg border border-[#242730]">
                      <span className="text-[10px] text-[#8E9299] block font-bold">ОХРАНА</span>
                      <span className="font-bold text-white text-xs">{currentMerchant.guardsAndBeasts}</span>
                    </div>
                  </div>

                  <div className="p-3 bg-[#121316] rounded-lg border border-[#242730] text-xs">
                    <p className="text-[#C5C9D0]">{currentMerchant.description}</p>
                    <p className="text-emerald-400 mt-1"><strong>Привычка:</strong> {currentMerchant.quirk}</p>
                  </div>

                  {/* Событие встречи */}
                  <div className="p-3 bg-[#111216] border-l-2 border-emerald-500 rounded-r-lg text-xs space-y-1">
                    <span className="font-bold text-emerald-400 uppercase">СОБЫТИЕ ВСТРЕЧИ: {currentMerchant.encounterEvent.title}</span>
                    <p className="text-[#C5C9D0]">{currentMerchant.encounterEvent.description}</p>
                    <p className="text-amber-300"><strong>Решение:</strong> {currentMerchant.encounterEvent.resolutionSkill} → <strong>Награда:</strong> {currentMerchant.encounterEvent.discountReward}</p>
                  </div>

                  {/* Инвентарь */}
                  <div className="space-y-2 text-xs">
                    <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider border-b border-[#2A2E38] pb-1">
                      АССОРТИМЕНТ ТОВАРОВ
                    </h4>
                    <div className="space-y-2">
                      {currentMerchant.inventory.map((item) => (
                        <div key={item.id} className="p-2.5 bg-[#101216] border border-[#22252D] rounded-lg flex justify-between items-center">
                          <div>
                            <div className="flex items-center gap-2">
                              <strong className="text-white">{item.name}</strong>
                              {item.isIllegal && <span className="px-1.5 py-0.2 bg-red-900/50 text-red-300 text-[10px] rounded">Контрабанда</span>}
                              {item.isUnidentifiedArtifact && <span className="px-1.5 py-0.2 bg-purple-900/50 text-purple-300 text-[10px] rounded">Неопознано</span>}
                            </div>
                            <p className="text-[11px] text-[#A0A5AD] mt-0.5">{item.desc} (В наличии: {item.quantity} шт.)</p>
                          </div>
                          <span className="text-[#F27D26] font-bold">{item.price}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 5. ГОРОДСКИЕ ЛАВКИ И МАГАЗИНЫ */}
          {/* ========================================================================= */}
          {activeTab === 'stores' && (
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
              <div className="w-full md:w-80 p-4 border-r border-[#22252C] bg-[#0E0F12] overflow-y-auto space-y-4 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#F27D26] uppercase">ПАРАМЕТРЫ ЛАВКИ</span>
                  <button
                    onClick={handleRegenStore}
                    className="px-2.5 py-1 bg-[#F27D26] hover:bg-[#E06C15] text-black font-extrabold rounded flex items-center gap-1 cursor-pointer transition shadow"
                  >
                    <RefreshCw size={12} />
                    <span>СГЕНЕРИРОВАТЬ</span>
                  </button>
                </div>

                <div>
                  <label className="block text-[#8E9299] mb-1 font-bold">Категория заведения</label>
                  <select
                    value={storeCategory}
                    onChange={(e) => setStoreCategory(e.target.value as StoreCategory)}
                    className="w-full bg-[#1A1C22] border border-[#2F3440] rounded p-2 text-white outline-none focus:border-[#F27D26]"
                  >
                    <option value="Кузница и Оружейная">Кузница и Оружейная</option>
                    <option value="Алхимическая лавка и Травник">Алхимическая лавка и Травник</option>
                    <option value="Магическая лавка / Башня чародея">Магическая лавка / Башня чародея</option>
                    <option value="Храм и Часовня">Храм и Часовня</option>
                    <option value="Таверна и Лавка провизии">Таверна и Лавка провизии</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#8E9299] mb-1 font-bold">Размер поселения</label>
                  <select
                    value={storeSettlement}
                    onChange={(e) => setStoreSettlement(e.target.value as SettlementSize)}
                    className="w-full bg-[#1A1C22] border border-[#2F3440] rounded p-2 text-white outline-none focus:border-[#F27D26]"
                  >
                    <option value="Деревня (Village)">Деревня (+25% к ценам)</option>
                    <option value="Городок (Town)">Городок (базовые цены)</option>
                    <option value="Торговый мегаполис (Metropolis)">Мегаполис (-10% к ценам)</option>
                  </select>
                </div>
              </div>

              <div className="flex-1 p-5 overflow-y-auto bg-[#141519] flex flex-col space-y-4">
                <div className="bg-[#1A1D24] border border-[#2C313E] rounded-xl p-5 shadow-lg space-y-4">
                  <div className="flex items-start justify-between border-b border-[#2A2E39] pb-4">
                    <div>
                      <h3 className="text-xl font-serif font-bold text-blue-400">{currentStore.name}</h3>
                      <p className="text-xs text-[#8E9299] mt-0.5">
                        {currentStore.category} • {currentStore.settlementSize} • Владелец: {currentStore.ownerName}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onBroadcastCard(storeToHandoutCard(currentStore))}
                        className="px-3 py-1.5 bg-[#F27D26] hover:bg-[#E06C15] text-black font-extrabold rounded-lg text-xs flex items-center gap-1.5 shadow active:scale-95 transition"
                      >
                        <Tv size={14} />
                        <span>ПОКАЗАТЬ ИГРОКАМ</span>
                      </button>

                      <button
                        onClick={() => togglePinCard(storeToHandoutCard(currentStore))}
                        className={`p-1.5 rounded-lg border text-xs font-bold transition flex items-center gap-1 ${
                          isCardPinned(currentStore.id)
                            ? 'bg-[#2A1F18] border-[#F27D26] text-[#F27D26]'
                            : 'bg-[#121316] border-[#2A2E38] text-[#8E9299] hover:text-white'
                        }`}
                      >
                        <Pin size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="p-3 bg-[#121316] rounded-lg border border-[#242730] text-xs space-y-1">
                    <p><strong className="text-white">Атмосфера:</strong> {currentStore.atmosphere}</p>
                    <p><strong className="text-blue-400">Характер владельца:</strong> {currentStore.ownerPersonality}</p>
                    <p><strong className="text-amber-300">Ценовой коэффициент:</strong> x{currentStore.priceModifier} ({currentStore.priceModifierReason})</p>
                  </div>

                  {/* Товары */}
                  <div className="space-y-2 text-xs">
                    <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider border-b border-[#2A2E38] pb-1">
                      ТОВАРЫ НА ПРИЛАВКЕ
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {currentStore.goods.map((item) => (
                        <div key={item.id} className="p-2.5 bg-[#101216] border border-[#22252D] rounded-lg flex justify-between items-center">
                          <div>
                            <strong className="text-white">{item.name}</strong>
                            <p className="text-[11px] text-[#A0A5AD]">{item.desc} (x{item.quantity})</p>
                          </div>
                          <span className="text-[#F27D26] font-bold">{Math.round(item.priceGp * currentStore.priceModifier)} GP</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Услуги */}
                  {currentStore.services.length > 0 && (
                    <div className="space-y-2 text-xs">
                      <h4 className="text-xs font-bold text-blue-300 uppercase tracking-wider border-b border-[#2A2E38] pb-1">
                        УСЛУГИ И МАСТЕРСКАЯ
                      </h4>
                      {currentStore.services.map((srv, idx) => (
                        <div key={idx} className="p-2.5 bg-[#101216] border border-[#22252D] rounded-lg flex justify-between items-center">
                          <div>
                            <strong className="text-white">{srv.name}</strong>
                            <p className="text-[11px] text-[#A0A5AD]">{srv.desc}</p>
                          </div>
                          <span className="text-yellow-400 font-bold">{srv.cost}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 6. ЭКИПИРОВКА И АФФИКСЫ */}
          {/* ========================================================================= */}
          {activeTab === 'equipment' && (
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
              <div className="w-full md:w-80 p-4 border-r border-[#22252C] bg-[#0E0F12] overflow-y-auto space-y-4 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#F27D26] uppercase">ПАРАМЕТРЫ ПРЕДМЕТА</span>
                  <button
                    onClick={handleRegenEquipment}
                    className="px-2.5 py-1 bg-[#F27D26] hover:bg-[#E06C15] text-black font-extrabold rounded flex items-center gap-1 cursor-pointer transition shadow"
                  >
                    <RefreshCw size={12} />
                    <span>СГЕНЕРИРОВАТЬ</span>
                  </button>
                </div>

                <div>
                  <label className="block text-[#8E9299] mb-1 font-bold">Категория</label>
                  <select
                    value={equipCategory}
                    onChange={(e) => setEquipCategory(e.target.value as EquipmentCategory)}
                    className="w-full bg-[#1A1C22] border border-[#2F3440] rounded p-2 text-white outline-none focus:border-[#F27D26]"
                  >
                    <option value="Оружие ближнего боя">Оружие ближнего боя</option>
                    <option value="Оружие дальнего боя">Оружие дальнего боя</option>
                    <option value="Доспех">Доспех</option>
                    <option value="Щит">Щит</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#8E9299] mb-1 font-bold">Материал</label>
                  <select
                    value={equipMaterial}
                    onChange={(e) => setEquipMaterial(e.target.value as EquipmentMaterial)}
                    className="w-full bg-[#1A1C22] border border-[#2F3440] rounded p-2 text-white outline-none focus:border-[#F27D26]"
                  >
                    <option value="Адамантин">Адамантин (блокирует криты / автокриты по объектам)</option>
                    <option value="Мифрил">Мифрил (нет штрафа на скрытность)</option>
                    <option value="Хладное железо">Хладное железо (+2d6 по феям/демонам)</option>
                    <option value="Древесина темного железа">Древесина темного железа (+30 фт дистанция)</option>
                    <option value="Обсидиан глубин">Обсидиан глубин</option>
                    <option value="Драконья кость">Драконья кость (+1d6 стихии)</option>
                    <option value="Звездный металл">Звездный металл</option>
                    <option value="Благородное серебрение">Серебрение</option>
                  </select>
                </div>
              </div>

              <div className="flex-1 p-5 overflow-y-auto bg-[#141519] flex flex-col space-y-4">
                <div className="bg-[#1A1D24] border border-[#2C313E] rounded-xl p-5 shadow-lg space-y-4">
                  <div className="flex items-start justify-between border-b border-[#2A2E39] pb-4">
                    <div>
                      <h3 className="text-xl font-serif font-bold text-amber-400">{currentEquipment.fullName}</h3>
                      <p className="text-xs text-[#8E9299] mt-0.5">
                        {currentEquipment.category} • {currentEquipment.material} • {currentEquipment.rarity}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onBroadcastCard(equipmentToHandoutCard(currentEquipment))}
                        className="px-3 py-1.5 bg-[#F27D26] hover:bg-[#E06C15] text-black font-extrabold rounded-lg text-xs flex items-center gap-1.5 shadow active:scale-95 transition"
                      >
                        <Tv size={14} />
                        <span>ПОКАЗАТЬ ИГРОКАМ</span>
                      </button>

                      <button
                        onClick={() => togglePinCard(equipmentToHandoutCard(currentEquipment))}
                        className={`p-1.5 rounded-lg border text-xs font-bold transition flex items-center gap-1 ${
                          isCardPinned(currentEquipment.id)
                            ? 'bg-[#2A1F18] border-[#F27D26] text-[#F27D26]'
                            : 'bg-[#121316] border-[#2A2E38] text-[#8E9299] hover:text-white'
                        }`}
                      >
                        <Pin size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="bg-[#121316] p-2.5 rounded-lg border border-[#242730]">
                      <span className="text-[10px] text-[#8E9299] block font-bold">ТИП И БОНУС</span>
                      <span className="font-bold text-white text-sm">{currentEquipment.damageOrAc}</span>
                    </div>
                    <div className="bg-[#121316] p-2.5 rounded-lg border border-[#242730]">
                      <span className="text-[10px] text-[#8E9299] block font-bold">ОЦЕНОЧНАЯ СТОИМОСТЬ</span>
                      <span className="font-bold text-yellow-400 text-sm">~{currentEquipment.valueGp} GP</span>
                    </div>
                    <div className="bg-[#121316] p-2.5 rounded-lg border border-[#242730]">
                      <span className="text-[10px] text-[#8E9299] block font-bold">НАСТРОЙКА (ATTUNEMENT)</span>
                      <span className="font-bold text-purple-300 text-sm">{currentEquipment.attunementRequired ? 'Требуется' : 'Не требуется'}</span>
                    </div>
                  </div>

                  {/* Свойства аффиксов */}
                  <div className="space-y-2 text-xs">
                    <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider border-b border-[#2A2E38] pb-1">
                      МАГИЧЕСКИЕ СВОЙСТВА И АФФИКСЫ
                    </h4>
                    {currentEquipment.properties.map((p, idx) => (
                      <div key={idx} className="p-2.5 bg-[#101216] border border-[#22252D] rounded-lg text-white">
                        {p}
                      </div>
                    ))}
                  </div>

                  <div className="p-3 bg-[#121316] rounded-lg border border-[#242730] text-xs text-[#8E9299] italic">
                    {currentEquipment.lore}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 7. МАГИЯ, СПЕЛЛЫ И ДИКАЯ МАГИЯ */}
          {/* ========================================================================= */}
          {activeTab === 'magic' && (
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
              <div className="w-full md:w-80 p-4 border-r border-[#22252C] bg-[#0E0F12] overflow-y-auto space-y-4 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#F27D26] uppercase">РЕЖИМ МАГИИ</span>
                  <button
                    onClick={handleRegenMagic}
                    className="px-2.5 py-1 bg-[#F27D26] hover:bg-[#E06C15] text-black font-extrabold rounded flex items-center gap-1 cursor-pointer transition shadow"
                  >
                    <RefreshCw size={12} />
                    <span>СГЕНЕРИРОВАТЬ</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setMagicMode('spell')}
                    className={`p-2 rounded font-bold transition border ${
                      magicMode === 'spell' ? 'bg-[#2A1F18] text-[#F27D26] border-[#F27D26]' : 'bg-[#16181D] text-[#8E9299] border-[#252A34]'
                    }`}
                  >
                    Заклинание
                  </button>
                  <button
                    onClick={() => setMagicMode('wild')}
                    className={`p-2 rounded font-bold transition border ${
                      magicMode === 'wild' ? 'bg-[#2A1F18] text-[#F27D26] border-[#F27D26]' : 'bg-[#16181D] text-[#8E9299] border-[#252A34]'
                    }`}
                  >
                    Дикая магия d100
                  </button>
                </div>

                {magicMode === 'spell' && (
                  <>
                    <div>
                      <label className="block text-[#8E9299] mb-1 font-bold">Школа магии</label>
                      <select
                        value={spellSchool}
                        onChange={(e) => setSpellSchool(e.target.value as MagicSchool)}
                        className="w-full bg-[#1A1C22] border border-[#2F3440] rounded p-2 text-white outline-none focus:border-[#F27D26]"
                      >
                        <option value="Воплощение (Evocation)">Воплощение (Evocation)</option>
                        <option value="Ограждение (Abjuration)">Ограждение (Abjuration)</option>
                        <option value="Иллюзия (Illusion)">Иллюзия (Illusion)</option>
                        <option value="Некромантия (Necromancy)">Некромантия (Necromancy)</option>
                        <option value="Очарование (Enchantment)">Очарование (Enchantment)</option>
                        <option value="Преобразование (Transmutation)">Преобразование (Transmutation)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[#8E9299] mb-1 font-bold">Круг заклинания (1-6)</label>
                      <input
                        type="range"
                        min={1}
                        max={6}
                        value={spellLevel}
                        onChange={(e) => setSpellLevel(Number(e.target.value))}
                        className="w-full accent-[#F27D26]"
                      />
                      <div className="text-right text-[#F27D26] font-bold">{spellLevel} круг</div>
                    </div>
                  </>
                )}
              </div>

              <div className="flex-1 p-5 overflow-y-auto bg-[#141519] flex flex-col space-y-4">
                {magicMode === 'spell' ? (
                  <div className="bg-[#1A1D24] border border-[#2C313E] rounded-xl p-5 shadow-lg space-y-4">
                    <div className="flex items-start justify-between border-b border-[#2A2E39] pb-4">
                      <div>
                        <h3 className="text-xl font-serif font-bold text-rose-400">{currentSpell.name}</h3>
                        <p className="text-xs text-[#8E9299] mt-0.5">
                          {currentSpell.levelText}, {currentSpell.school}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onBroadcastCard(spellToHandoutCard(currentSpell))}
                          className="px-3 py-1.5 bg-[#F27D26] hover:bg-[#E06C15] text-black font-extrabold rounded-lg text-xs flex items-center gap-1.5 shadow active:scale-95 transition"
                        >
                          <Tv size={14} />
                          <span>ПОКАЗАТЬ ИГРОКАМ</span>
                        </button>

                        <button
                          onClick={() => togglePinCard(spellToHandoutCard(currentSpell))}
                          className={`p-1.5 rounded-lg border text-xs font-bold transition flex items-center gap-1 ${
                            isCardPinned(currentSpell.id)
                              ? 'bg-[#2A1F18] border-[#F27D26] text-[#F27D26]'
                              : 'bg-[#121316] border-[#2A2E38] text-[#8E9299] hover:text-white'
                          }`}
                        >
                          <Pin size={14} />
                        </button>

                        {onApplySpellTemplate && (
                          <button
                            onClick={() => {
                              onApplySpellTemplate({
                                type: currentSpell.aoeShape.includes('Сфера') ? 'circle' : currentSpell.aoeShape.includes('Конус') ? 'cone' : 'line',
                                radiusFt: currentSpell.aoeSizeFeet,
                                lengthFt: currentSpell.aoeSizeFeet,
                                widthFt: 10,
                                angleDeg: 60,
                                color: '#E53E3E',
                                label: currentSpell.name
                              });
                            }}
                            className="px-2.5 py-1.5 bg-[#252830] hover:bg-[#323642] text-white border border-[#3A404E] rounded-lg text-xs font-bold"
                            title="Наложить шаблон заклинания на карту"
                          >
                            <span>ШАБЛОН НА КАРТУ</span>
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <div className="bg-[#121316] p-2.5 rounded-lg border border-[#242730]">
                        <span className="text-[10px] text-[#8E9299] block font-bold">ВРЕМЯ НАКЛАДЫВАНИЯ</span>
                        <span className="font-bold text-white">{currentSpell.castingTime}</span>
                      </div>
                      <div className="bg-[#121316] p-2.5 rounded-lg border border-[#242730]">
                        <span className="text-[10px] text-[#8E9299] block font-bold">ДИСТАНЦИЯ / ЗОНА</span>
                        <span className="font-bold text-rose-300">{currentSpell.range} ({currentSpell.aoeShape})</span>
                      </div>
                      <div className="bg-[#121316] p-2.5 rounded-lg border border-[#242730]">
                        <span className="text-[10px] text-[#8E9299] block font-bold">КОМПОНЕНТЫ</span>
                        <span className="font-bold text-white">{currentSpell.components}</span>
                      </div>
                      <div className="bg-[#121316] p-2.5 rounded-lg border border-[#242730]">
                        <span className="text-[10px] text-[#8E9299] block font-bold">СПАСБРОСОК / УРОН</span>
                        <span className="font-bold text-yellow-400">Сл {currentSpell.saveType} | {currentSpell.damageFormula} ({currentSpell.damageType})</span>
                      </div>
                    </div>

                    <div className="p-3 bg-[#121316] rounded-lg border border-[#242730] text-xs text-[#E0E0E0] leading-relaxed">
                      {currentSpell.description}
                    </div>

                    <div className="p-3 bg-[#101216] rounded-lg border border-[#22252D] text-xs text-[#A0A5AD]">
                      <strong className="text-white">На более высоких кругах:</strong> {currentSpell.higherLevelsDesc}
                    </div>
                  </div>
                ) : (
                  /* Карточка Дикой Магии */
                  <div className="bg-[#1A1D24] border border-[#2C313E] rounded-xl p-5 shadow-lg space-y-4">
                    <div className="flex items-start justify-between border-b border-[#2A2E39] pb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 rounded-md bg-pink-900/60 text-pink-300 font-extrabold text-xs">
                            БРОСОК d100: {currentWildMagic.d100Roll}
                          </span>
                          <h3 className="text-xl font-serif font-bold text-pink-400">{currentWildMagic.title}</h3>
                        </div>
                        <p className="text-xs text-[#8E9299] mt-1">
                          Категория: {currentWildMagic.category} • Длительность: {currentWildMagic.duration}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onBroadcastCard(wildMagicToHandoutCard(currentWildMagic))}
                          className="px-3 py-1.5 bg-[#F27D26] hover:bg-[#E06C15] text-black font-extrabold rounded-lg text-xs flex items-center gap-1.5 shadow active:scale-95 transition"
                        >
                          <Tv size={14} />
                          <span>ПОКАЗАТЬ ИГРОКАМ</span>
                        </button>

                        <button
                          onClick={() => togglePinCard(wildMagicToHandoutCard(currentWildMagic))}
                          className={`p-1.5 rounded-lg border text-xs font-bold transition flex items-center gap-1 ${
                            isCardPinned(`wm_${currentWildMagic.d100Roll}`)
                              ? 'bg-[#2A1F18] border-[#F27D26] text-[#F27D26]'
                              : 'bg-[#121316] border-[#2A2E38] text-[#8E9299] hover:text-white'
                          }`}
                        >
                          <Pin size={14} />
                        </button>
                      </div>
                    </div>

                    <div className="p-4 bg-pink-950/20 border border-pink-500/30 rounded-xl text-sm text-pink-200 leading-relaxed">
                      {currentWildMagic.desc}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 8. ЗАКРЕПЛЕННЫЕ КАРТОЧКИ (PINNED DM SCREEN) */}
          {/* ========================================================================= */}
          {activeTab === 'pinned' && (
            <div className="flex-1 p-5 overflow-y-auto bg-[#141519]">
              {pinnedCards.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 text-[#6E727A]">
                  <Bookmark size={48} className="mb-3 opacity-40 text-[#F27D26]" />
                  <h3 className="text-base font-bold text-white mb-1">НЕТ ЗАКРЕПЛЕННЫХ КАРТОЧЕК</h3>
                  <p className="text-xs max-w-md">
                    Нажимайте иконку булавки 📌 на любой сгенерированной карточке монстра, NPC, торговца или лута, чтобы сохранить быстрый доступ к ней во время сессии.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pinnedCards.map((card) => (
                    <div
                      key={card.id}
                      className="bg-[#1A1D24] border border-[#2C313E] rounded-xl p-4 flex flex-col justify-between shadow"
                    >
                      <div>
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#F27D26] block">
                              {card.category.toUpperCase()} {card.badge ? `• ${card.badge}` : ''}
                            </span>
                            <h4 className="text-base font-bold text-white font-serif">{card.title}</h4>
                            {card.subtitle && <p className="text-xs text-[#8E9299]">{card.subtitle}</p>}
                          </div>

                          <button
                            onClick={() => togglePinCard(card)}
                            className="text-[#8E9299] hover:text-red-400 text-xs p-1"
                            title="Открепить"
                          >
                            ✕
                          </button>
                        </div>

                        {card.stats && card.stats.length > 0 && (
                          <div className="grid grid-cols-2 gap-1.5 my-3 text-[11px] bg-[#121316] p-2 rounded border border-[#242730]">
                            {card.stats.slice(0, 4).map((st, sIdx) => (
                              <div key={sIdx}>
                                <span className="text-[#8E9299] block font-bold text-[9px]">{st.label}</span>
                                <span className="text-white font-bold">{st.value}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {card.flavorText && (
                          <p className="text-xs text-[#A0A5AD] italic mt-2 line-clamp-2">{card.flavorText}</p>
                        )}
                      </div>

                      <div className="mt-4 pt-3 border-t border-[#252A34] flex items-center justify-between">
                        <button
                          onClick={() => onBroadcastCard(card)}
                          className="px-2.5 py-1 bg-[#F27D26] hover:bg-[#E06C15] text-black font-extrabold rounded text-xs flex items-center gap-1"
                        >
                          <Tv size={12} />
                          <span>ВЫВЕСТИ ИГРОКАМ</span>
                        </button>

                        <button
                          onClick={() => copyTextToClipboard(`${card.title}\n${card.subtitle || ''}\n${card.flavorText || ''}`, card.id)}
                          className="p-1 text-[#8E9299] hover:text-white"
                          title="Скопировать текст"
                        >
                          {copiedId === card.id ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
