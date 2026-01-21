
import React from 'react';
import { Player, Club, PlayerPosition, UserRole } from '../types';
import { POSITION_SKILLS } from '../constants';

interface DashboardProps {
  player: Player;
  club: Club | null;
  onPositionChange: (pos: PlayerPosition) => void;
  overallRating: number;
  xpProgress: number;
  xpNeeded: number;
}

export const Dashboard: React.FC<DashboardProps> = ({ player, club, overallRating, xpProgress, xpNeeded }) => {
  const isPlayer = player.roles.includes(UserRole.PLAYER);
  const isManager = player.roles.includes(UserRole.MANAGER);
  const relevantSkills = isPlayer ? POSITION_SKILLS[player.position] : [];

  const getSkillTierData = (value: number) => {
    const tier = Math.floor(value / 100);
    const progress = value % 100;
    
    const tiers = [
      { label: 'Amateur', color: 'bg-emerald-500' },      // 0-99
      { label: 'Profi', color: 'bg-blue-500' },         // 100-199
      { label: 'Elite', color: 'bg-purple-500' },        // 200-299
      { label: 'Weltklasse', color: 'bg-cyan-500' },     // 300-399
      { label: 'Star', color: 'bg-orange-500' },         // 400-499
      { label: 'Superstar', color: 'bg-pink-500' },      // 500-599
      { label: 'Titan', color: 'bg-indigo-500' },        // 600-699
      { label: 'Phänomen', color: 'bg-rose-500' },       // 700-799
      { label: 'Legende', color: 'bg-amber-500' },       // 800-899
      { label: 'Ikone', color: 'bg-red-500' },           // 900-999
      { label: 'Gottgleich', color: 'bg-slate-200' },    // 1000-1099
      { label: 'Kosmisch', color: 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 animate-pulse' } // 1100+
    ];

    const currentTier = tiers[Math.min(tier, tiers.length - 1)];
    return { tier, progress, color: currentTier.color, label: currentTier.label };
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight">Moin, {player.name}</h2>
          <div className="flex flex-wrap gap-2 mt-2">
            {player.roles.map(role => (
              <span key={role} className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${
                role === UserRole.MANAGER ? 'text-amber-400 bg-amber-400/10 border-amber-400/20' : 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20'
              }`}>
                {role === UserRole.MANAGER ? 'Manager' : 'Profi-Spieler'}
              </span>
            ))}
          </div>
        </div>
        
        {isPlayer && (
          <div className="flex items-center gap-4 bg-slate-800/50 p-3 rounded-2xl border border-slate-700">
            <div className="text-right">
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Training</p>
              <p className="text-lg font-mono text-emerald-400">{player.trainingPoints} TP</p>
            </div>
            <div className="h-10 w-[1px] bg-slate-700" />
            <div className="text-right">
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Status</p>
              <p className="text-lg font-bold text-white">{club?.name || 'Vereinslos'}</p>
            </div>
          </div>
        )}
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-800 rounded-[2.5rem] p-8 border border-slate-700 shadow-2xl relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 text-9xl opacity-5 group-hover:rotate-12 transition-transform select-none">🏆</div>
          <h3 className="text-sm font-black uppercase text-slate-500 mb-6 tracking-widest border-b border-slate-700 pb-2">Karriere-Pfad</h3>
          
          <div className="flex items-center gap-6 mb-8">
            <div className="relative">
              <img src={player.avatar} alt="Avatar" className="w-24 h-24 rounded-3xl border-4 border-slate-700 shadow-xl object-cover" />
              {isPlayer && (
                <div className="absolute -bottom-3 -right-3 bg-emerald-600 text-xs font-black px-3 py-1 rounded-xl border-2 border-slate-900 shadow-lg min-w-[60px] text-center">
                  GES {overallRating}
                </div>
              )}
            </div>
            <div>
               <p className="text-[10px] uppercase text-slate-500 font-black tracking-widest leading-none mb-1">Stufe</p>
               <h4 className="text-4xl font-black text-white italic">L{player.level}</h4>
            </div>
          </div>

          {isPlayer && (
            <div className="space-y-3 bg-slate-950/50 rounded-2xl p-5 border border-slate-800">
              <div className="flex justify-between items-end">
                 <p className="text-slate-500 text-[10px] uppercase font-black tracking-widest">XP Fortschritt</p>
                 <p className="text-[10px] font-mono font-bold text-emerald-500">{Math.floor(player.experience)} / {xpNeeded}</p>
              </div>
              <div className="h-2.5 w-full bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-800">
                 <div className="h-full bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.3)] transition-all duration-700" style={{ width: `${xpProgress}%` }} />
              </div>
              <p className="text-[9px] text-slate-600 font-bold text-center uppercase tracking-tighter">Sammle XP durch Training & Aktivitäten</p>
            </div>
          )}

          {isManager && club && (
            <div className="mt-6 space-y-3">
              <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Club-Budget</p>
                <p className="text-xl font-mono text-amber-400 font-black">{club.budget.toLocaleString()} €</p>
              </div>
            </div>
          )}
        </div>

        <div className="md:col-span-2 bg-slate-800 rounded-[2.5rem] p-8 border border-slate-700 shadow-2xl relative overflow-hidden">
          {isPlayer ? (
            <>
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="text-2xl font-black uppercase tracking-tight">Spieler-Attribute</h3>
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Fokus: {player.position}</p>
                </div>
                <div className="flex items-center gap-2 bg-slate-900 px-4 py-2 rounded-2xl border border-slate-800">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-[10px] font-black text-slate-400 uppercase">Profi-Status</span>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {relevantSkills.map((skill) => {
                  const value = player.skills[skill] || 0;
                  const { tier, progress, color, label } = getSkillTierData(value);
                  return (
                    <div key={skill} className="bg-slate-900/50 p-5 rounded-[1.5rem] border border-slate-800 group/skill hover:border-slate-700 transition-colors">
                      <div className="flex justify-between mb-2">
                        <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">{skill}</p>
                        <span className="text-[10px] font-bold text-slate-400">RANG {tier}</span>
                      </div>
                      <div className="flex items-baseline gap-2 mb-3">
                        <span className="text-3xl font-black tracking-tighter">{value}</span>
                        <span className={`text-[9px] font-black uppercase text-white ${color} px-2 py-0.5 rounded-md`}>{label}</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div className={`h-full ${color} transition-all duration-1000`} style={{ width: `${progress}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
               <div className="w-24 h-24 bg-slate-900 rounded-[2rem] flex items-center justify-center text-5xl shadow-inner border border-slate-800">📊</div>
               <div>
                 <h3 className="text-2xl font-black uppercase">Manager-Direktion</h3>
                 <p className="text-slate-500 text-sm font-medium max-w-sm mt-2">Leite die Geschicke des Vereins. Dein Level spiegelt deine Erfahrung in der Vereinsführung wider.</p>
               </div>
               {club && (
                 <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
                   <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 text-center">
                     <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">Stadion</p>
                     <p className="text-2xl font-black text-white">Lvl {club.infrastructure.stadium}</p>
                   </div>
                   <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 text-center">
                     <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">Training</p>
                     <p className="text-2xl font-black text-white">Lvl {club.infrastructure.trainingGround}</p>
                   </div>
                 </div>
               )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
