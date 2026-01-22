import React, { useState, useEffect } from 'react';
import { Club, Player } from '../types';
import { dataService } from '../services/dataService';
import { MAX_CLUB_PLAYERS } from '../constants';

interface ClubSearchProps {
  player: Player;
}

export const ClubSearch: React.FC<ClubSearchProps> = ({ player }) => {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = dataService.listenToClubs((allClubs) => {
      setClubs(allClubs);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleApply = async (clubId: string) => {
    try {
      await dataService.applyToClub(player.id, clubId);
    } catch (error) {
      console.error("Error applying to club:", error);
    }
  };

  const handleCancelApplication = async (clubId: string) => {
    try {
      await dataService.cancelApplication(player.id, clubId);
    } catch (error) {
      console.error("Error cancelling application:", error);
    }
  };

  if (loading) {
    return <div className="text-center p-10"><p className="text-lg font-bold text-slate-400 animate-pulse">Lade Vereine...</p></div>;
  }

  if (player.clubId) {
      return (
        <div className="text-center p-10">
            <h2 className="text-2xl font-bold mb-2">Du hast bereits einen Verein</h2>
            <p className="text-slate-400">Verlasse deinen aktuellen Verein, um einem neuen beizutreten.</p>
        </div>
      )
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
        <header>
            <h2 className="text-2xl md:text-3xl font-black">Verein beitreten</h2>
            <p className="text-slate-400 mt-1">Finde einen passenden Verein und bewirb dich, um Teil des Teams zu werden.</p>
        </header>

      <div className="space-y-3">
        {clubs.map((club) => {
          const hasApplied = club.pendingApplications?.includes(player.id);
          const isFull = (club.players?.length || 0) >= MAX_CLUB_PLAYERS;

          return (
            <div key={club.id} className="grid grid-cols-[1fr,auto,auto] items-center bg-slate-800/80 p-3 md:p-4 rounded-xl border border-slate-700/50 transition-all hover:bg-slate-800 hover:border-slate-600 gap-2 md:gap-4">
              <div>
                <h3 className="font-bold text-base md:text-lg">{club.name}</h3>
                <p className="text-xs md:text-sm text-slate-400">Manager: {club.managerName || 'N/A'}</p>
              </div>
              <div className="w-20 text-center">
                <p className="font-bold text-sm md:text-base">{(club.players?.length || 0)} / {MAX_CLUB_PLAYERS}</p>
                <p className="text-[10px] text-slate-500 font-bold">SPIELER</p>
              </div>
              <div className="w-44 text-right">
                {hasApplied ? (
                   <button 
                    onClick={() => handleCancelApplication(club.id)}
                    className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm"
                  >
                    Bewerbung zurückziehen
                  </button>
                ) : player.pendingClubInvitation === club.id ? (
                    <span className="text-green-400 font-bold text-sm">Eingeladen</span>
                ) : isFull ? (
                  <span className="text-red-500 font-bold text-sm px-4">Kader voll</span>
                ) : (
                  <button 
                    onClick={() => handleApply(club.id)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm"
                  >
                    Bewerben
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
