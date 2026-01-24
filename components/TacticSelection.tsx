
import React from 'react';
import { Club, Tactic } from '../types';
import { TACTICS } from '../constants';
import { dataService } from '../services/dataService';
import { Check, Shield, Sword } from 'lucide-react';

interface TacticCardProps {
  tactic: Tactic;
  isActive: boolean;
  onSelect: () => void;
}

const TacticCard: React.FC<TacticCardProps> = ({ tactic, isActive, onSelect }) => {
  const formatBonus = (bonus: number) => {
    const value = Math.round(bonus * 100);
    if (value > 0) return `+${value}%`;
    if (value < 0) return `${value}%`;
    return '0%';
  };

  return (
    <div
      onClick={onSelect}
      className={`relative rounded-xl p-4 md:p-5 border-2 transition-all duration-200 cursor-pointer ${
        isActive
          ? 'bg-sky-900/50 border-sky-500 shadow-lg shadow-sky-900/50'
          : 'bg-slate-800/60 border-slate-700/80 hover:border-sky-600 hover:bg-slate-800'
      }`}
    >
      <h4 className="font-bold text-base md:text-lg text-white mb-1.5">{tactic.name}</h4>
      <p className="text-xs md:text-sm text-slate-400 mb-4 h-10">{tactic.description}</p>
      <div className="flex items-center justify-start gap-4 md:gap-6 text-sm">
        <div className="flex items-center gap-1.5 font-bold text-green-400">
            <Sword className="h-4 w-4" />
            <span>{formatBonus(tactic.attackBonus)}</span>
        </div>
        <div className="flex items-center gap-1.5 font-bold text-red-400">
            <Shield className="h-4 w-4" />
            <span>{formatBonus(tactic.defenseBonus)}</span>
        </div>
      </div>
      {isActive && (
        <div className="absolute top-3 right-3 bg-sky-500 text-white rounded-full h-6 w-6 flex items-center justify-center">
          <Check className="h-4 w-4" />
        </div>
      )}
    </div>
  );
};

interface TacticSelectionProps {
  club: Club;
}

export const TacticSelection: React.FC<TacticSelectionProps> = ({ club }) => {
  const handleSelectTactic = (tacticId: Tactic['id']) => {
    if (club.id) {
      dataService.updateClub(club.id, { activeTacticId: tacticId });
    }
  };

  const activeTactic = club.activeTacticId || 'balanced';

  return (
    <section>
        <h3 className="text-xl md:text-2xl font-black mb-4">Taktische Ausrichtung</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {TACTICS.map((tactic) => (
                <TacticCard
                    key={tactic.id}
                    tactic={tactic}
                    isActive={activeTactic === tactic.id}
                    onSelect={() => handleSelectTactic(tactic.id)}
                />
            ))}
        </div>
    </section>
  );
};
