import React from 'react';
import { Player, Club } from '../types';

interface DashboardProps {
  player: Player;
  club: Club | null; // Allow club to be null
  overallRating: number;
  xpProgress: number;
  xpNeeded: number;
}

export const Dashboard: React.FC<DashboardProps> = ({ player, club, overallRating, xpProgress, xpNeeded }) => {
  // =========================================================================================
  // !!! WICHTIG: DIESE DATEI WURDE AKTUALISIERT, UM ABSTÜRZE DURCH FEHLENDE DATEN ZU VERHINDERN !!!
  // =========================================================================================
  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-5xl font-black text-white">{player.name}</h1>
          <p className="text-xl text-slate-400 font-bold">{club ? club.name : 'Vereinslos'}</p>
        </div>
        <div className="bg-slate-800 p-2 rounded-2xl flex items-center gap-2 border border-slate-700">
          <div className="bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-xl">LEVEL</div>
          <div className="text-white font-black text-2xl px-2">{player.level || 1}</div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-slate-800 rounded-3xl p-8 flex flex-col items-center justify-center border border-slate-700 shadow-lg">
          <p className="text-sm font-bold text-slate-400 mb-2">GESAMTSTÄRKE</p>
          <p className="text-8xl font-black text-white">{overallRating}</p>
        </div>
        <div className="lg:col-span-2 bg-slate-800 rounded-3xl p-8 border border-slate-700 shadow-lg">
          <div className="flex justify-between items-end mb-2">
            <h3 className="text-lg font-bold text-slate-300">Nächstes Level</h3>
            <p className="text-sm text-slate-400 font-mono">{Math.round(player.experience || 0)} / {xpNeeded} XP</p>
          </div>
          <div className="h-6 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800 p-1">
            <div 
              className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all duration-300 rounded-full"
              style={{ width: `${xpProgress}%` }}
            />
          </div>
          <p className="text-xs text-slate-500 mt-2 text-center">Sammle Erfahrung durch Training und Aktivitäten, um aufzusteigen und Trainingspunkte zu erhalten.</p>
        </div>
      </div>

      <div className="bg-slate-800 p-8 rounded-3xl border border-slate-700">
        <h3 className="text-lg font-bold text-white mb-4">Spielerattribute</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center">
            <p className="text-sm text-slate-400">Position</p>
            <p className="text-xl font-bold text-white">{player.position || 'Unbestimmt'}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-slate-400">Alter</p>
            <p className="text-xl font-bold text-white">{player.age || 0}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-slate-400">Marktwert</p>
            <p className="text-xl font-bold text-white">€ {(player.marketValue || 0).toLocaleString('de-DE')}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-slate-400">Moral</p>
            <p className="text-xl font-bold text-emerald-400">Hoch</p>
          </div>
        </div>
      </div>
    </div>
  );
};