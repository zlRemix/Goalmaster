import React, { useId, memo } from 'react';
import { EquipmentItem, EquipmentSlot } from '../types';
import { Euro, ShieldCheck } from 'lucide-react';

interface EquipmentCardProps {
  item: EquipmentItem;
  onPurchase: (item: EquipmentItem) => void;
  isPurchasing: boolean;
  isOwned: boolean;
  playerEuro: number;
}

const ItemVisual: React.FC<{ slot: EquipmentSlot; color: string; rarityId: string }> = ({ slot, color, rarityId }) => {
  const getIconPath = () => {
    switch (slot) {
      case EquipmentSlot.SHOES: return <path d="M30 140C30 120 50 115 70 115H110L115 145H30V140Z M75 115L95 85L115 115H75Z" />;
      case EquipmentSlot.JERSEY: return <path d="M45 90L60 80H90L105 90L100 125L90 120V160H60V120L50 125L45 100Z" />;
      case EquipmentSlot.SHORTS: return <path d="M50 105H100L105 150H85L78 135L72 135L65 150H45L50 105Z" />;
      case EquipmentSlot.GLOVES: return <path d="M55 155V115C55 105 65 100 75 100C85 100 95 105 95 115V155H55Z" />;
      default: return <circle cx="75" cy="125" r="30" />;
    }
  };

  return (
    <svg viewBox="0 0 150 180" className="w-full h-full">
      <defs>
        <linearGradient id={`grad_${rarityId}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="white" stopOpacity="0.9" />
          <stop offset="100%" stopColor={color} />
        </linearGradient>
      </defs>
      <g fill={`url(#grad_${rarityId})`} filter="drop-shadow(0 4px 8px rgba(0,0,0,0.5))">
        {getIconPath()}
      </g>
    </svg>
  );
};

export const EquipmentCard: React.FC<EquipmentCardProps> = memo(({ 
  item, onPurchase, isPurchasing, isOwned, playerEuro 
}) => {
  const rarityId = useId().replace(/:/g, "");
  const canAfford = playerEuro >= item.price;
  
  const theme = item.price >= 5000 
    ? { color: '#FDE047', label: 'LEGENDARY', glow: 'shadow-yellow-500/20' }
    : item.price >= 1500 
    ? { color: '#C084FC', label: 'EPIC', glow: 'shadow-purple-500/20' }
    : { color: '#38BDF8', label: 'STANDARD', glow: 'shadow-blue-500/20' };

  return (
    <div className={`relative flex flex-col w-[170px] bg-slate-900 border-2 border-slate-800 rounded-[2rem] p-3 transition-all duration-300 group hover:-translate-y-1 hover:border-slate-600 shadow-2xl ${theme.glow}`}>
      
      {/* Rarity Label (Top Center) */}
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-slate-800 px-3 py-1 rounded-full border border-slate-700 shadow-xl">
        <span className="text-[9px] font-black tracking-[0.2em]" style={{ color: theme.color }}>
          {theme.label}
        </span>
      </div>

      {/* Item Name (Extrem wichtig & lesbar) */}
      <div className="mt-4 mb-2 text-center h-12 flex items-center justify-center">
        <h3 className="text-sm font-black text-white leading-tight uppercase italic tracking-tight">
          {item.name}
        </h3>
      </div>

      {/* Grafik-Bereich (Kompakter) */}
      <div className="relative h-24 w-full bg-slate-950/50 rounded-2xl flex items-center justify-center border border-white/5 mb-3">
        <div className="w-20 h-20 transform group-hover:scale-110 transition-transform duration-500">
          <ItemVisual slot={item.slot} color={theme.color} rarityId={rarityId} />
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 gap-1 mb-4">
        {Object.entries(item.bonus).map(([skill, value]) => (
          <div key={skill} className="flex justify-between items-center bg-black/20 px-2 py-1 rounded-lg">
            <span className="text-[8px] text-slate-500 font-bold uppercase">{skill.replace(/_/g, ' ')}</span>
            <span className="text-[10px] font-black" style={{ color: theme.color }}>+{value}</span>
          </div>
        ))}
      </div>

      {/* Button */}
      <button
        onClick={() => onPurchase(item)}
        disabled={isPurchasing || (!canAfford && !isOwned) || isOwned}
        className={`w-full py-3 rounded-xl font-black uppercase tracking-tighter text-[11px] flex items-center justify-center gap-2 transition-all
          ${isOwned 
            ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
            : canAfford
              ? 'bg-blue-600 text-white hover:bg-blue-500 shadow-lg'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-60'}
        `}
      >
        {isOwned ? (
          <><ShieldCheck className="w-3.5 h-3.5" /><span>Besitz</span></>
        ) : (
          <><Euro className="w-3.5 h-3.5" /><span>{item.price.toLocaleString()}</span></>
        )}
      </button>
    </div>
  );
});