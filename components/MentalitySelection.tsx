
import React from 'react';
import { Player, PlayerMentality } from '../types';
import { PLAYER_MENTALITIES } from '../constants';
import { dataService } from '../services/dataService';
import { Check, Shield, Sword, TrendingUp } from 'lucide-react';

interface MentalityCardProps {
  mentality: PlayerMentality;
  isActive: boolean;
  onSelect: () => void;
}

const MentalityCard: React.FC<MentalityCardProps> = ({ mentality, isActive, onSelect }) => {
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
      <h4 className="font-bold text-base md:text-lg text-white mb-1.5">{mentality.name}</h4>
      <p className="text-xs md:text-sm text-slate-400 mb-4 h-10">{mentality.description}</p>
      <div className="flex items-center justify-start gap-4 md:gap-6 text-sm">
        <div className="flex items-center gap-1.5 font-bold text-green-400">
            <Sword className="h-4 w-4" />
            <span>{formatBonus(mentality.attackBonus)}</span>
        </div>
        <div className="flex items-center gap-1.5 font-bold text-red-400">
            <Shield className="h-4 w-4" />
            <span>{formatBonus(mentality.defenseBonus)}</span>
        </div>
        <div className="flex items-center gap-1.5 font-bold text-yellow-400">
            <TrendingUp className="h-4 w-4" />
            <span>{formatBonus(mentality.workRateBonus)}</span>
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

interface MentalitySelectionProps {
  player: Player;
}

export const MentalitySelection: React.FC<MentalitySelectionProps> = ({ player }) => {
  const handleSelectMentality = (mentalityId: PlayerMentality['id']) => {
    if (player.id) {
      dataService.updatePlayer(player.id, { activeMentalityId: mentalityId });
    }
  };

  const activeMentality = player.activeMentalityId || 'balanced';

  return (
    <section>
        <h3 className="text-xl md:text-2xl font-black mb-4">Spieler-Mentalität</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {PLAYER_MENTALITIES.map((mentality) => (
                <MentalityCard
                    key={mentality.id}
                    mentality={mentality}
                    isActive={activeMentality === mentality.id}
                    onSelect={() => handleSelectMentality(mentality.id)}
                />
            ))}
        </div>
    </section>
  );
};
