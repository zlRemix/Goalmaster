import React, { useMemo, useState } from 'react';
import { Player, Club, View, AvatarData, EquipmentSlot, EquipmentItem } from '../types';
import { dataService } from '../services/dataService';
import { getRatingColor } from '../utils';
import { UserCog, Shield, Package, Check, X, AlertTriangle, ChevronRight, Star, Swords } from 'lucide-react';
import ClubLogo from './ClubLogo';
import { createAvatar } from '@dicebear/core';
import * as collections from '@dicebear/collection';

const PlayerAvatar: React.FC<{ avatar?: AvatarData; size?: number }> = ({ avatar, size = 80 }) => {
    const avatarSvg = useMemo(() => {
        if (!avatar || !avatar.style || !avatar.seed) return null;
        const styleCollection = (collections as any)[avatar.style];
        if (!styleCollection) return null;
        return createAvatar(styleCollection, { seed: avatar.seed, size, radius: 50 }).toString();
    }, [avatar, size]);

    if (avatarSvg) {
        return <div style={{ width: size, height: size }} dangerouslySetInnerHTML={{ __html: avatarSvg }} />;
    }
    return <div style={{ width: size, height: size }} className="bg-slate-700 rounded-full" />;
};

const InvitationBanner: React.FC<{ player: Player; allClubs: Club[]; }> = ({ player, allClubs }) => {
    if (!player.pendingClubInvitation) return null;

    const invitingClub = allClubs.find(c => c.id === player.pendingClubInvitation);
    if (!invitingClub) return null;

    const handleAccept = () => dataService.acceptClubInvitation(player.id, invitingClub.id).catch(e => console.error(e));
    const handleReject = () => dataService.rejectClubInvitation(player.id).catch(e => console.error(e));

    return (
        <div className="bg-gradient-to-r from-indigo-500 to-blue-500 p-5 rounded-2xl border border-indigo-400/80 shadow-lg">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4">
                    <ClubLogo logo={invitingClub.logo} size={40} />
                    <div className="text-center md:text-left">
                        <h3 className="text-lg font-black text-white">Einladung von {invitingClub.name}</h3>
                        <p className="text-indigo-100 text-sm">Der Verein hat dich eingeladen, beizutreten.</p>
                    </div>
                </div>
                <div className="flex gap-3 flex-shrink-0">
                    <button onClick={handleAccept} className="bg-green-500 hover:bg-green-400 text-white font-bold py-2 px-5 rounded-lg transition-colors shadow-md active:scale-95">Annehmen</button>
                    <button onClick={handleReject} className="bg-slate-800 hover:bg-slate-700 text-white font-bold py-2 px-5 rounded-lg transition-colors active:scale-95">Ablehnen</button>
                </div>
            </div>
        </div>
    );
}

export const Dashboard: React.FC<DashboardProps> = ({ player, club, allClubs, overallRating, xpProgress, xpNeeded, setView }) => {
    const [isSimulating, setIsSimulating] = useState(false);

    const handleTestMatch = async () => {
        setIsSimulating(true);
        try {
            const result = await dataService.runTestMatch();
            console.log("--- Test-Match-Ergebnis ---", result);
            alert("Test-Match simuliert! Überprüfe die Entwicklerkonsole für den Spielbericht.");
        } catch (error) {
            console.error("Fehler bei der Test-Match-Simulation:", error);
            alert("Ein Fehler ist aufgetreten. Überprüfe die Konsole für Details.");
        } finally {
            setIsSimulating(false);
        }
    };

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-300">
        <div className="bg-sky-900/50 border border-sky-700 text-sky-300 p-4 rounded-2xl text-sm">
            <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-sky-400 flex-shrink-0" />
                <div>
                    <h3 className="font-bold text-sky-200">Willkommen zur Pre-Alpha!</h3>
                    <p className="text-sky-300/80 text-xs">Diese Version dient dem Testen. Es können Fehler auftreten und Daten zurückgesetzt werden.</p>
                </div>
            </div>
        </div>
        
        <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
                <h3 className="font-bold text-white">Simulations-Test</h3>
                <p className="text-sm text-slate-400">Löse ein zufälliges Spiel aus, um die Match-Engine zu testen.</p>
            </div>
            <button
                onClick={handleTestMatch}
                disabled={isSimulating}
                className="w-full sm:w-auto bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-5 rounded-lg disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 active:scale-95 shadow-lg"
            >
                <Swords className="w-4 h-4"/>
                {isSimulating ? 'Simuliere...' : 'Test-Match starten'}
            </button>
        </div>

      {player.pendingClubInvitation && <InvitationBanner player={player} allClubs={allClubs} />}

      <header className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        <div className="md:col-span-2 flex items-center gap-4 md:gap-6 bg-slate-800/80 p-5 rounded-2xl border border-slate-700">
          <PlayerAvatar avatar={player.avatar} size={64} />
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-white">{player.name}</h1>
            <p className="text-md md:text-lg text-slate-400 font-bold flex items-center gap-2">
              {club ? <><ClubLogo logo={club.logo} size={20}/> {club.name}</> : 'Vereinslos'}
            </p>
          </div>
        </div>
        
        <div className="text-center md:text-right">
            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">GES</p>
            <p className={`text-7xl md:text-8xl font-black ${getRatingColor(overallRating)} -mt-2`}>{overallRating}</p>
        </div>
      </header>

       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-slate-800/80 rounded-2xl p-6 border border-slate-700">
            <div className="flex justify-between items-center mb-1">
                <h3 className="text-sm font-bold text-blue-300 uppercase tracking-wider">Level {player.level || 1}</h3>
                <p className="text-sm text-slate-400 font-mono">{Math.round(player.experience || 0)} / {xpNeeded} XP</p>
            </div>
            <div className="h-4 w-full bg-slate-900 rounded-full border border-slate-800 p-0.5">
                <div 
                className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-500"
                style={{ width: `${xpProgress}%` }}
                />
            </div>
        </div>

        <div className="flex justify-center items-center bg-slate-800/80 rounded-2xl p-3 border border-slate-700">
             <div className="text-center">
                <p className="text-xs text-slate-400 font-bold uppercase">TP</p>
                <p className="text-3xl font-black text-yellow-400">{player.trainingPoints || 0}</p>
            </div>
        </div>
       </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <button onClick={() => setView('skills')} className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700 hover:border-blue-500/50 transition-colors group text-left">
            <Star className="w-8 h-8 text-blue-400 mb-3"/>
            <h3 className="font-bold text-white text-lg">Training</h3>
            <p className="text-sm text-slate-400">Verbessere deine Skills.</p>
        </button>
        <button onClick={() => setView(club ? 'club' : 'club-search')} className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700 hover:border-blue-500/50 transition-colors group text-left">
            <Shield className="w-8 h-8 text-blue-400 mb-3"/>
            <h3 className="font-bold text-white text-lg">{club ? 'Mein Verein' : 'Verein finden'}</h3>
            <p className="text-sm text-slate-400">Verwalte deine Karriere.</p>
        </button>
         <button onClick={() => setView('activities')} className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700 hover:border-blue-500/50 transition-colors group text-left">
            <Package className="w-8 h-8 text-blue-400 mb-3"/>
            <h3 className="font-bold text-white text-lg">Aktivitäten</h3>
            <p className="text-sm text-slate-400">Verdiene Geld und XP.</p>
        </button>
        <button onClick={() => setView('profile')} className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700 hover:border-blue-500/50 transition-colors group text-left">
            <UserCog className="w-8 h-8 text-blue-400 mb-3"/>
            <h3 className="font-bold text-white text-lg">Profil</h3>
            <p className="text-sm text-slate-400">Passe dein Aussehen an.</p>
        </button>
      </div>
    </div>
  );
};