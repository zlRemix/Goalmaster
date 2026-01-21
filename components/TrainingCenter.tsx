
import React from 'react';
import { Player, SkillType } from '../types';
import { POSITION_SKILLS } from '../constants';

interface TrainingCenterProps {
  player: Player;
  onTrain: (skill: SkillType) => void;
}

export const TrainingCenter: React.FC<TrainingCenterProps> = ({ player, onTrain }) => {
  const relevantSkills = POSITION_SKILLS[player.position];

  const getTierInfo = (value: number) => {
    const tier = Math.floor(value / 100);
    const progress = value % 100;
    
    const tiers = [
      { label: 'Amateur', color: 'from-emerald-600 to-emerald-400' },
      { label: 'Profi', color: 'from-blue-600 to-blue-400' },
      { label: 'Elite', color: 'from-purple-600 to-purple-400' },
      { label: 'Weltklasse', color: 'from-cyan-600 to-cyan-400' },
      { label: 'Star', color: 'from-orange-600 to-orange-400' },
      { label: 'Superstar', color: 'from-pink-600 to-pink-400' },
      { label: 'Titan', color: 'from-indigo-600 to-indigo-400' },
      { label: 'Phänomen', color: 'from-rose-600 to-rose-400' },
      { label: 'Legende', color: 'from-amber-600 to-amber-400' },
      { label: 'Ikone', color: 'from-red-600 to-red-400' },
      { label: 'Gottgleich', color: 'from-slate-400 to-slate-100' },
      { label: 'Kosmisch', color: 'from-indigo-600 via-purple-600 to-pink-500' }
    ];

    const currentTier = tiers[Math.min(tier, tiers.length - 1)];

    return { tier, progress, colorClass: currentTier.color, tierLabel: currentTier.label };
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-black">Trainingsgelände</h2>
          <p className="text-slate-400">Status: <span className="text-emerald-400 font-bold">Kein Limit</span></p>
        </div>
        <div className="bg-emerald-600 px-6 py-3 rounded-2xl font-bold shadow-lg shadow-emerald-900/40 flex items-center gap-3">
           <span className="text-2xl text-white">⚡</span>
           <span className="text-white">{player.trainingPoints} TP Verfügbar</span>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {relevantSkills.map((skill) => {
          const value = player.skills[skill] || 0;
          const { tier, progress, colorClass, tierLabel } = getTierInfo(value);

          return (
            <div key={skill} className="bg-slate-800 rounded-3xl p-6 border border-slate-700 flex items-center justify-between group hover:border-emerald-500/30 transition-all shadow-lg relative overflow-hidden">
              <div className="space-y-2 flex-1 mr-4 z-10">
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-lg text-slate-100">{skill}</p>
                    <div className="flex">
                       {tier > 0 && tier < 6 ? (
                         Array.from({ length: tier }).map((_, i) => (
                           <span key={i} className="text-[10px]">⭐</span>
                         ))
                       ) : tier >= 6 ? (
                         <span className="text-[10px] text-amber-400 font-black">⭐ RANG {tier}</span>
                       ) : null}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-[10px] font-black uppercase block leading-none bg-clip-text text-transparent bg-gradient-to-r ${colorClass}`}>{tierLabel}</span>
                    <span className="text-emerald-500 font-mono font-black text-sm">Pkt. {value}</span>
                  </div>
                </div>
                <div className="h-4 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800 p-0.5">
                  <div 
                    className={`h-full bg-gradient-to-r ${colorClass} transition-all duration-300 rounded-full`}
                    style={{ width: `${progress === 0 && value > 0 ? 100 : progress}%` }}
                  />
                </div>
                <p className="text-[9px] text-slate-600 font-bold uppercase tracking-tighter">
                  {100 - progress} Punkte bis {tierLabel}-Rang {tier + 1}
                </p>
              </div>
              <button
                onClick={() => onTrain(skill)}
                disabled={player.trainingPoints <= 0}
                className={`h-16 w-16 rounded-2xl flex flex-col items-center justify-center font-bold transition-all shadow-inner z-10 ${
                  player.trainingPoints > 0 
                  ? 'bg-slate-700 hover:bg-emerald-600 text-white cursor-pointer active:scale-90 border border-slate-600' 
                  : 'bg-slate-900 text-slate-600 cursor-not-allowed opacity-50 border border-slate-800'
                }`}
              >
                <span className="text-2xl">+</span>
                <span className="text-[9px] uppercase opacity-50">1 TP</span>
              </button>

              {/* Background Rank Indicator */}
              <div className="absolute -right-2 -bottom-4 text-7xl font-black text-slate-900/40 italic select-none pointer-events-none group-hover:scale-110 transition-transform">
                {tier}
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-slate-800 p-8 rounded-3xl border border-slate-700 flex flex-col md:flex-row items-center gap-8">
        <div className="h-20 w-20 bg-slate-900 rounded-2xl flex items-center justify-center text-4xl border border-slate-700 shadow-inner">
          🚀
        </div>
        <div className="flex-1 text-center md:text-left">
          <h4 className="text-xl font-bold text-white mb-2 text-emerald-400">Grenzenlose Entwicklung</h4>
          <p className="text-slate-400 text-sm leading-relaxed">
            Deine Reise hat kein Maximum. Jenseits von Ikone und Gottgleich warten die kosmischen Tiers auf dich. Jedes Training bringt dich näher an einen Status, den kein Profi vor dir je erreicht hat. Die Fußballwelt gehört dir!
          </p>
        </div>
      </div>
    </div>
  );
};
