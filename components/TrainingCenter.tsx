import React from 'react';
import { Player, SkillType } from '../types';
import { getSkillsForPosition, getTierInfo } from '../utils'; // Updated import
import { Zap, Plus } from 'lucide-react';

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

export const TrainingCenter: React.FC<TrainingCenterProps> = ({ player, onTrain }) => {
  if (!player) return <div>Lade...</div>;

  const relevantSkills = getSkillsForPosition(player.position || '');

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-300">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h2 className="text-2xl md:text-3xl font-black">Trainingsgelände</h2>
                <p className="text-slate-400 text-sm md:text-base">Investiere TP, um deine Skills zu verbessern.</p>
            </div>
            <div className="bg-gradient-to-tr from-amber-500 to-amber-400 px-4 py-2 rounded-xl font-bold shadow-lg flex items-center gap-2 self-start md:self-auto">
                <Zap className="h-5 w-5 text-white opacity-80" />
                <span className="text-white">{(player.trainingPoints || 0)} TP Verfügbar</span>
            </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            {relevantSkills.length > 0 ? relevantSkills.map((skill) => {
                const value = player.skills?.[skill] || 0;
                const { tier, progress, colorClass, tierLabel, pointsToNext } = getTierInfo(value);

                const cost = 1 + tier * 2;
                const canAfford = (player.trainingPoints || 0) >= cost;

                return (
                    <div key={skill} className="bg-slate-800/80 rounded-2xl p-4 border border-slate-700 flex items-center justify-between group transition-all shadow-md">
                        <div className="space-y-2 flex-1 mr-3">
                            <div className="flex justify-between items-center mb-1">
                                <p className={`font-bold text-base md:text-lg bg-clip-text text-transparent bg-gradient-to-r ${colorClass}`}>{SKILL_TRANSLATIONS[skill] || skill}</p>
                                <div className="text-right">
                                    <span className={`text-[10px] font-black uppercase block leading-none bg-clip-text text-transparent bg-gradient-to-r ${colorClass}`}>{tierLabel}</span>
                                    <span className="text-amber-400 font-mono font-black text-sm">{value}</span>
                                </div>
                            </div>
                            <div className="h-3 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800 p-0.5">
                                <div className={`h-full bg-gradient-to-r ${colorClass} rounded-full`} style={{ width: `${progress}%` }}/>
                            </div>
                            <p className="text-[9px] text-slate-600 font-bold uppercase tracking-tighter">{pointsToNext} bis Rang {tier + 1}</p>
                        </div>
                        <button onClick={() => onTrain(skill)} disabled={!canAfford} className={`h-14 w-14 rounded-lg flex flex-col items-center justify-center font-bold transition-all z-10 flex-shrink-0 ${
                            canAfford ? 'bg-slate-700 hover:bg-emerald-600 text-white cursor-pointer active:scale-90 border border-slate-600' : 'bg-slate-900 text-slate-600 cursor-not-allowed opacity-50 border border-slate-800'}`}>
                            <Plus className="h-6 w-6" />
                            <span className="text-[9px] uppercase opacity-50">{cost} TP</span>
                        </button>
                    </div>
                );
            }) : (
                <div className="lg:col-span-2 bg-slate-800/80 rounded-2xl p-8 border border-amber-500/30 text-center">
                    <h3 className="text-lg font-bold text-amber-400">Keine Skills für Position</h3>
                    <p className="text-slate-400 mt-2 text-sm">Für die Position '{player.position || "N/A"}' sind keine Skills definiert.</p>
                </div>
            )}
        </div>
    </div>
  );
};