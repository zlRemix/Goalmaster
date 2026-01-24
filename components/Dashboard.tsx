import React from 'react';
import { Player, Club } from '../types';
import { dataService } from '../services/dataService';

interface DashboardProps {
  player: Player;
  club: Club | null; 
  allClubs: Club[];
  overallRating: number;
  xpProgress: number;
  xpNeeded: number;
}

const InvitationBanner: React.FC<{ player: Player; allClubs: Club[] }> = ({ player, allClubs }) => {
    if (!player.pendingClubInvitation) return null;

    const invitingClub = allClubs.find(c => c.id === player.pendingClubInvitation);
    if (!invitingClub) return null;

    const handleAccept = () => {
        dataService.acceptClubInvitation(player.id, invitingClub.id).catch(e => console.error(e));
    };

    const handleReject = () => {
        dataService.rejectClubInvitation(player.id).catch(e => console.error(e));
    };

    return (
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-5 md:p-6 rounded-3xl border-2 border-blue-400/80 shadow-2xl animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="text-center md:text-left">
                    <h3 className="text-xl md:text-2xl font-black text-white">Einladung erhalten!</h3>
                    <p className="text-blue-200 font-semibold">Der Verein <span className="font-bold">{invitingClub.name}</span> hat dich eingeladen.</p>
                </div>
                <div className="flex gap-3 flex-shrink-0">
                    <button onClick={handleAccept} className="bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-2 px-5 rounded-lg transition-colors shadow-lg active:scale-95">Annehmen</button>
                    <button onClick={handleReject} className="bg-slate-800 hover:bg-slate-700 text-white font-bold py-2 px-5 rounded-lg transition-colors active:scale-95">Ablehnen</button>
                </div>
            </div>
        </div>
    );
}

export const Dashboard: React.FC<DashboardProps> = ({ player, club, allClubs, overallRating, xpProgress, xpNeeded }) => {

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-300">
        
      {player.pendingClubInvitation && <InvitationBanner player={player} allClubs={allClubs} />}

      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-3xl md:text-5xl font-black text-white">{player.name}</h1>
          <p className="text-lg md:text-xl text-slate-400 font-bold">{club ? club.name : 'Vereinslos'}</p>
        </div>
        <div className="bg-slate-800 p-2 rounded-2xl flex items-center gap-2 border border-slate-700 self-start sm:self-auto">
          <div className="bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-xl">LEVEL</div>
          <div className="text-white font-black text-2xl px-2">{player.level || 1}</div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        <div className="lg:col-span-1 bg-slate-800/80 rounded-3xl p-6 md:p-8 flex flex-col items-center justify-center border border-slate-700 shadow-lg">
          <p className="text-sm font-bold text-slate-400 mb-2 uppercase tracking-wider">Gesamt</p>
          <p className="text-7xl md:text-8xl font-black text-white">{overallRating}</p>
        </div>
        <div className="lg:col-span-2 bg-slate-800/80 rounded-3xl p-6 md:p-8 border border-slate-700 shadow-lg">
          <div className="flex justify-between items-end mb-2">
            <h3 className="text-base md:text-lg font-bold text-slate-300">Nächstes Level</h3>
            <p className="text-sm text-slate-400 font-mono">{Math.round(player.experience || 0)} / {xpNeeded} XP</p>
          </div>
          <div className="h-5 md:h-6 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800 p-1">
            <div 
              className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all duration-300 rounded-full"
              style={{ width: `${xpProgress}%` }}
            />
          </div>
          <p className="text-xs text-slate-500 mt-3 text-center">Sammle XP durch Training & Aktivitäten, um aufzusteigen und TP zu erhalten.</p>
        </div>
      </div>

      <div className="bg-slate-800/80 p-6 md:p-8 rounded-3xl border border-slate-700">
        <h3 className="text-lg font-bold text-white mb-4">Spielerdetails</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center bg-slate-900/50 p-4 rounded-xl border border-slate-700/50">
            <p className="text-xs md:text-sm text-slate-400">Position</p>
            <p className="text-base md:text-xl font-bold text-white">{player.position || 'N/A'}</p>
          </div>
          <div className="text-center bg-slate-900/50 p-4 rounded-xl border border-slate-700/50">
            <p className="text-xs md:text-sm text-slate-400">TP</p>
            <p className="text-base md:text-xl font-bold text-amber-400">{player.trainingPoints || 0}</p>
          </div>
          <div className="text-center bg-slate-900/50 p-4 rounded-xl border border-slate-700/50">
            <p className="text-xs md:text-sm text-slate-400">Rolle</p>
            <p className="text-base md:text-xl font-bold text-white capitalize">{player.roles.join(', ')}</p>
          </div>
          <div className="text-center bg-slate-900/50 p-4 rounded-xl border border-slate-700/50">
            <p className="text-xs md:text-sm text-slate-400">Moral</p>
            <p className="text-base md:text-xl font-bold text-emerald-400">Hoch</p>
          </div>
        </div>
      </div>
    </div>
  );
};