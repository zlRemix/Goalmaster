import React from 'react';
import { Player, SkillType } from '../types';
import { getSkillsForPosition } from '../utils';

interface TrainingCenterProps {
  player: Player;
  onTrain: (skill: SkillType) => void;
}

// German translations for the skill types
const SKILL_TRANSLATIONS: Record<SkillType, string> = {
  finishing: 'Abschluss',
  shot_power: 'Schusskraft',
  heading: 'Kopfball',
  long_shots: 'Weitschüsse',
  dribbling: 'Dribbling',
  pace: 'Tempo',
  passing: 'Passen',
  vision: 'Übersicht',
  tackling: 'Zweikampf',
  stamina: 'Ausdauer',
  marking: 'Deckung',
  interceptions: 'Abfangen',
  strength: 'Stärke',
  aggression: 'Aggressivität',
  handling: 'Fangsicherheit',
  reflexes: 'Reflexe',
  diving: 'Hechten',
  positioning: 'Stellungsspiel',
  communication: 'Kommunikation',
  kicking: 'Abschlag',
};

export const TrainingCenter: React.FC<TrainingCenterProps> = ({ player, onTrain }) => {
  if (!player) {
    return <div>Lade Spielerdaten...</div>;
  }

  const relevantSkills = getSkillsForPosition(player.position || '');

  const getTierInfo = (value: number) => {
    const tier = Math.floor(value / 100);
    const progress = value % 100;
    const tiers = [
      { label: 'Amateur', color: 'from-emerald-600 to-emerald-400' }, { label: 'Profi', color: 'from-blue-600 to-blue-400' },
      { label: 'Elite', color: 'from-purple-600 to-purple-400' }, { label: 'Weltklasse', color: 'from-cyan-600 to-cyan-400' },
      { label: 'Star', color: 'from-orange-600 to-orange-400' }, { label: 'Superstar', color: 'from-pink-600 to-pink-400' },
      { label: 'Titan', color: 'from-indigo-600 to-indigo-400' }, { label: 'Phänomen', color: 'from-rose-600 to-rose-400' },
      { label: 'Legende', color: 'from-amber-600 to-amber-400' }, { label: 'Ikone', color: 'from-red-600 to-red-400' },
      { label: 'Gottgleich', color: 'from-slate-400 to-slate-100' }, { label: 'Kosmisch', color: 'from-indigo-600 via-purple-600 to-pink-500' }
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
                <span className="text-white">{(player.trainingPoints || 0)} TP Verfügbar</span>
            </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {relevantSkills.length > 0 ? relevantSkills.map((skill) => {
                const value = (player.skills && player.skills[skill]) || 0;
                const { tier, progress, colorClass, tierLabel } = getTierInfo(value);

                return (
                    <div key={skill} className="bg-slate-800 rounded-3xl p-6 border border-slate-700 flex items-center justify-between group hover:border-emerald-500/30 transition-all shadow-lg relative overflow-hidden">
                        <div className="space-y-2 flex-1 mr-4 z-10">
                            <div className="flex justify-between items-center mb-1">
                                <p className="font-bold text-lg text-slate-100">{SKILL_TRANSLATIONS[skill] || skill}</p>
                                <div className="text-right">
                                    <span className={`text-[10px] font-black uppercase block leading-none bg-clip-text text-transparent bg-gradient-to-r ${colorClass}`}>{tierLabel}</span>
                                    <span className="text-emerald-500 font-mono font-black text-sm">Pkt. {value}</span>
                                </div>
                            </div>
                            <div className="h-4 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800 p-0.5">
                                <div className={`h-full bg-gradient-to-r ${colorClass} transition-all duration-300 rounded-full`} style={{ width: `${progress === 0 && value > 0 ? 100 : progress}%` }}/>
                            </div>
                            <p className="text-[9px] text-slate-600 font-bold uppercase tracking-tighter">{100 - progress} Punkte bis Rang {tier + 1}</p>
                        </div>
                        <button onClick={() => onTrain(skill)} disabled={(player.trainingPoints || 0) <= 0} className={`h-16 w-16 rounded-2xl flex flex-col items-center justify-center font-bold transition-all shadow-inner z-10 ${
                            (player.trainingPoints || 0) > 0 ? 'bg-slate-700 hover:bg-emerald-600 text-white cursor-pointer active:scale-90 border border-slate-600' : 'bg-slate-900 text-slate-600 cursor-not-allowed opacity-50 border border-slate-800'}`}>
                            <span className="text-2xl">+</span>
                            <span className="text-[9px] uppercase opacity-50">1 TP</span>
                        </button>
                    </div>
                );
            }) : (
                <div className="md:col-span-2 bg-slate-800 rounded-3xl p-8 border border-amber-500/30 text-center">
                    <h3 className="text-lg font-bold text-amber-400">Keine Skills für diese Position definiert</h3>
                    <p className="text-slate-400 mt-2">Für die Position '{player.position || "nicht zugewiesen"}' wurden keine spezifischen Skills gefunden. Bitte weisen Sie dem Spieler eine gültige Position zu oder überprüfen Sie die Konfiguration in `utils.ts`.</p>
                </div>
            )}
        </div>
    </div>
  );
};