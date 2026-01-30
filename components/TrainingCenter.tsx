import React, { useId, memo } from 'react';
import { Player, SkillType } from '../types';
import { getSkillsForPosition, getTierInfo } from '../utils';
import { Zap, Plus, Award } from 'lucide-react';

interface TrainingCenterProps {
  player: Player;
  onTrain: (skill: SkillType) => void;
}

const SKILL_TRANSLATIONS: Record<SkillType, string> = {
  finishing: 'Abschluss', shot_power: 'Schusskraft', heading: 'Kopfball', long_shots: 'Weitschüsse', 
  dribbling: 'Dribbling', pace: 'Tempo', passing: 'Passen', vision: 'Übersicht', 
  tackling: 'Zweikampf', stamina: 'Ausdauer', marking: 'Deckung', interceptions: 'Abfangen', 
  strength: 'Stärke', aggression: 'Aggressivität', handling: 'Fangsicherheit', reflexes: 'Reflexe', 
  diving: 'Hechten', positioning: 'Stellungsspiel', communication: 'Kommunikation', kicking: 'Abschlag',
};

export const TrainingCenter: React.FC<TrainingCenterProps> = memo(({ player, onTrain }) => {
  if (!player) return <div className="text-white p-8 text-center font-black italic uppercase">Lade...</div>;

  const relevantSkills = getSkillsForPosition(player.position || '');
  const playerTp = player.trainingPoints || 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 px-2">
        <div>
          <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">Trainingsgelände</h2>
          <p className="text-slate-400 text-sm">Investiere deine TP weise, um zum Weltstar zu reifen.</p>
        </div>
        
        <div className="bg-slate-900 border-2 border-blue-500/30 px-6 py-3 rounded-[2rem] shadow-[0_0_20px_rgba(59,130,246,0.15)] flex items-center gap-3">
          <Zap className="h-6 w-6 text-yellow-400 fill-yellow-400" />
          <div className="flex flex-col">
            <span className="text-white text-xl font-black tabular-nums leading-none">{playerTp}</span>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Verfügbare TP</span>
          </div>
        </div>
      </header>

      <div className="flex flex-wrap gap-4 justify-center md:justify-start">
        {relevantSkills.length > 0 ? relevantSkills.map((skill) => {
          const value = player.skills?.[skill] || 0;
          const { tier, progress, colorClass, tierLabel, pointsToNext } = getTierInfo(value);
          const cost = 1 + tier * 2;
          const canAfford = playerTp >= cost;
          const rarityId = `skill_${skill}`;

          return (
            <div 
              key={skill} 
              className={`relative flex flex-col w-[185px] bg-slate-900 border-2 border-slate-800 rounded-[2.5rem] p-4 transition-all duration-300 group hover:-translate-y-1 shadow-2xl hover:border-blue-500/40`}
            >
              {/* Rarity/Tier Label */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#161F32] px-4 py-1 rounded-full border border-slate-700 shadow-xl z-10">
                <span className={`text-[9px] font-black tracking-[0.2em] uppercase bg-clip-text text-transparent bg-gradient-to-r ${colorClass}`}>
                  {tierLabel}
                </span>
              </div>

              {/* Skill Name & Value */}
              <div className="mt-4 mb-2 text-center flex flex-col items-center justify-center">
                <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-tighter mb-1">
                  {SKILL_TRANSLATIONS[skill] || skill}
                </h3>
                <span className={`text-3xl font-black italic tabular-nums bg-clip-text text-transparent bg-gradient-to-r ${colorClass}`}>
                  {value}
                </span>
              </div>

              {/* Progress Visual */}
              <div className="relative h-20 w-full bg-slate-950/50 rounded-2xl flex flex-col items-center justify-center border border-white/5 mb-4 shadow-inner overflow-hidden">
                <Award className={`w-8 h-8 mb-2 opacity-20 bg-gradient-to-r ${colorClass}`} />
                
                {/* Progress Bar Inside Card */}
                <div className="w-4/5 h-1.5 bg-slate-900 rounded-full overflow-hidden border border-white/5">
                  <div 
                    className={`h-full bg-gradient-to-r ${colorClass} transition-all duration-500`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
                
                <span className="text-[8px] text-slate-500 font-bold uppercase mt-2">
                  {pointsToNext > 0 ? `${pointsToNext} bis Rang ${tier + 1}` : 'MAX'}
                </span>
              </div>

              {/* Train Button */}
              <button
                onClick={() => onTrain(skill)}
                disabled={!canAfford}
                className={`
                  w-full py-3 rounded-xl font-black uppercase tracking-widest text-[10px] 
                  flex items-center justify-center gap-2 transition-all duration-300
                  ${canAfford 
                    ? 'bg-white text-black hover:bg-blue-400 hover:text-white shadow-lg active:scale-95' 
                    : 'bg-slate-800 text-slate-600 cursor-not-allowed opacity-50'}
                `}
              >
                <Plus className="w-3 h-3" />
                <span>{cost} TP</span>
              </button>
            </div>
          );
        }) : (
          <div className="w-full bg-slate-900/50 border-2 border-dashed border-slate-800 rounded-[3rem] p-12 text-center">
            <p className="text-slate-500 font-black uppercase italic">Keine Skills für Position "{player.position}"</p>
          </div>
        )}
      </div>
    </div>
  );
});