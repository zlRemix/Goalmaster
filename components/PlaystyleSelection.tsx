
import React from 'react';
import { Club, Playstyle } from '../types';
import { PLAYSTYLES } from '../constants';
import { dataService } from '../services/dataService';
import { Check, Shield, Sword } from 'lucide-react';

interface PlaystyleCardProps {
  playstyle: Playstyle;
  isActive: boolean;
  onSelect: () => void;
}

const PlaystyleCard: React.FC<PlaystyleCardProps> = ({ playstyle, isActive, onSelect }) => {
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
      <h4 className="font-bold text-base md:text-lg text-white mb-1.5">{playstyle.name}</h4>
      <p className="text-xs md:text-sm text-slate-400 mb-4 h-10">{playstyle.description}</p>
      <div className="flex items-center justify-start gap-4 md:gap-6 text-sm">
        <div className="flex items-center gap-1.5 font-bold text-green-400">
            <Sword className="h-4 w-4" />
            <span>{formatBonus(playstyle.attackBonus)}</span>
        </div>
        <div className="flex items-center gap-1.5 font-bold text-red-400">
            <Shield className="h-4 w-4" />
            <span>{formatBonus(playstyle.defenseBonus)}</span>
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

interface PlaystyleSelectionProps {
  club: Club;
}

export const PlaystyleSelection: React.FC<PlaystyleSelectionProps> = ({ club }) => {
  const handleSelectPlaystyle = (playstyleId: Playstyle['id']) => {
    if (club.id) {
      dataService.updateClub(club.id, { activePlaystyleId: playstyleId });
    }
  };

  const activePlaystyle = club.activePlaystyleId || 'balanced';

  return (
    <section>
        <h3 className="text-xl md:text-2xl font-black mb-4">Spielstil</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {PLAYSTYLES.map((playstyle) => (
                <PlaystyleCard
                    key={playstyle.id}
                    playstyle={playstyle}
                    isActive={activePlaystyle === playstyle.id}
                    onSelect={() => handleSelectPlaystyle(playstyle.id)}
                />
            ))}
        </div>
    </section>
  );
};
