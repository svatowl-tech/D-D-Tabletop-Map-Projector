/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Оверлей карточки раздаточного материала для окна игроков / проектора.
 * Отображает сгенерированные монстры, NPC, лут, товары лавок, артефакты,
 * свитки заклинаний и всплески дикой магии в виде стильной настольной карточки.
 */

import React from 'react';
import { HandoutCardPayload } from '../types/generator';
import { Sparkles, Shield, Heart, Zap, Coins, Sword, BookOpen, Skull, X } from 'lucide-react';

interface PlayerHandoutCardOverlayProps {
  card: HandoutCardPayload | null;
  onClose: () => void;
}

export const PlayerHandoutCardOverlay: React.FC<PlayerHandoutCardOverlayProps> = ({ card, onClose }) => {
  if (!card) return null;

  const getCategoryIcon = () => {
    switch (card.category) {
      case 'monster': return <Skull className="text-red-400" size={20} />;
      case 'npc': return <Sparkles className="text-purple-400" size={20} />;
      case 'loot': return <Coins className="text-yellow-400" size={20} />;
      case 'merchant': return <Coins className="text-emerald-400" size={20} />;
      case 'store': return <Shield className="text-blue-400" size={20} />;
      case 'equipment': return <Sword className="text-amber-400" size={20} />;
      case 'magic': return <Zap className="text-rose-400" size={20} />;
      case 'wild_magic': return <Sparkles className="text-pink-400" size={20} />;
      default: return <BookOpen className="text-slate-300" size={20} />;
    }
  };

  return (
    <div className="fixed inset-0 z-[9600] flex items-center justify-center p-4 sm:p-8 bg-black/80 backdrop-blur-md animate-in fade-in zoom-in-95 duration-300">
      <div className="relative w-full max-w-2xl bg-[#141518] border-2 border-[#2A2D35] rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col max-h-[90vh] text-[#E0E0E0] font-mono">
        
        {/* Верхняя декоративная полоса */}
        <div
          className="h-2 w-full"
          style={{ backgroundColor: card.rarityColor || '#F27D26' }}
        />

        {/* Шапка карточки */}
        <div className="p-5 border-b border-[#252830] bg-[#101114] flex items-start justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-3 bg-[#1A1D24] border border-[#2F3440] rounded-xl shadow-inner flex items-center justify-center">
              {getCategoryIcon()}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-serif font-bold text-white tracking-wide">
                  {card.title}
                </h2>
                {card.badge && (
                  <span
                    className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase border"
                    style={{
                      borderColor: card.rarityColor || '#F27D26',
                      color: card.rarityColor || '#F27D26',
                      backgroundColor: 'rgba(0,0,0,0.4)'
                    }}
                  >
                    {card.badge}
                  </span>
                )}
              </div>
              {card.subtitle && (
                <p className="text-xs text-[#8E9299] mt-1">
                  {card.subtitle}
                </p>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-[#1A1D24] hover:bg-[#252830] text-[#8E9299] hover:text-white transition cursor-pointer"
            title="Закрыть карточку"
          >
            <X size={18} />
          </button>
        </div>

        {/* Статы / Ключевые показатели */}
        {card.stats && card.stats.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-4 bg-[#0D0E10] border-b border-[#252830] text-xs">
            {card.stats.map((st, idx) => (
              <div key={idx} className="bg-[#16181D] border border-[#22262E] p-2 rounded-lg flex flex-col">
                <span className="text-[10px] text-[#8E9299] font-bold uppercase tracking-wider">{st.label}</span>
                <span className="text-xs sm:text-sm font-extrabold text-[#F27D26] mt-0.5">{st.value}</span>
              </div>
            ))}
          </div>
        )}

        {/* Тело карточки с секциями */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {card.sections.map((sec, sIdx) => (
            <div key={sIdx} className="bg-[#181B22] border border-[#252A34] rounded-xl p-3.5 shadow-sm">
              <h3 className="text-[11px] font-bold tracking-wider text-[#F27D26] uppercase mb-2 flex items-center gap-1.5">
                <span>{sec.title}</span>
              </h3>

              {/* Список предметов */}
              {sec.type === 'item_list' && sec.items && (
                <div className="space-y-2">
                  {sec.items.map((item, iIdx) => (
                    <div key={iIdx} className="p-2 bg-[#101216] border border-[#20242D] rounded-lg flex flex-col gap-1">
                      <div className="flex items-center justify-between font-bold text-[#E0E0E0]">
                        <span className="text-white">{item.name}</span>
                        {item.cost && <span className="text-[#F27D26]">{item.cost}</span>}
                        {item.badge && (
                          <span className="px-1.5 py-0.2 bg-[#2A2D35] text-[10px] text-amber-300 rounded font-normal">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      {item.desc && <p className="text-[11px] text-[#A0A5AD]">{item.desc}</p>}
                    </div>
                  ))}
                </div>
              )}

              {/* Цитата */}
              {sec.type === 'quote' && sec.content && (
                <blockquote className="p-3 bg-[#101216] border-l-2 border-[#F27D26] rounded-r-lg text-amber-200/90 italic">
                  {sec.content}
                </blockquote>
              )}

              {/* Обычный текст */}
              {(!sec.type || sec.type === 'text') && sec.content && (
                <p className="text-[#C8CCD4] whitespace-pre-line leading-relaxed">
                  {sec.content}
                </p>
              )}
            </div>
          ))}

          {/* Художественный текст (Flavor) */}
          {card.flavorText && (
            <div className="p-3 bg-[#121316] border border-[#22252C] rounded-xl text-[11px] text-[#8E9299] italic">
              {card.flavorText}
            </div>
          )}
        </div>

        {/* Подвал */}
        {card.footerNote && (
          <div className="p-3 bg-[#0D0E10] border-t border-[#252830] text-[10px] text-[#8E9299] text-center">
            {card.footerNote}
          </div>
        )}
      </div>
    </div>
  );
};
