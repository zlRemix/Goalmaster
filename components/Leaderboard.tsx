import React, { useState, useEffect, useMemo, ReactNode } from 'react';
import { Player, Club } from '../types';
import { dataService } from '../services/dataService';
import { getSkillsForPosition } from '../utils';
import { MAX_CLUB_PLAYERS } from '../constants';
import { Medal } from 'lucide-react';

// --- HELPERS ---
const getOverall = (p: Player) => {
    const relevantSkills = getSkillsForPosition(p.position);
    if (relevantSkills.length === 0) return 0;
    const totalSkill = relevantSkills.reduce((sum, s) => sum + (p.skills[s] || 0), 0);
    return Math.round(totalSkill / relevantSkills.length);
};

const getMedalIcon = (rank: number): ReactNode => {
    if (rank === 1) return <Medal className="h-6 w-6 text-yellow-400" />;
    if (rank === 2) return <Medal className="h-6 w-6 text-slate-300" />;
    if (rank === 3) return <Medal className="h-6 w-6 text-orange-500" />;
    return null;
};

// --- PLAYER LEADERBOARD ---
const PlayerLeaderboardRow: React.FC<{ player: Player; rank: number; clubName: string | null; }> = ({ player, rank, clubName }) => {
    const overall = useMemo(() => getOverall(player), [player]);
    const medalIcon = getMedalIcon(rank);

    return (
         <div className="grid grid-cols-[auto,1fr,auto,auto,auto] items-center bg-slate-800/80 p-3 md:p-4 rounded-xl border border-slate-700/50 text-white font-bold transition-all hover:bg-slate-800 hover:border-slate-600 gap-2 md:gap-4">
            <div className="w-8 text-center text-lg md:text-xl font-black text-slate-400">{rank}</div>
            <div className="flex items-center gap-3 md:gap-4">
                <div className="w-6 h-6 flex items-center justify-center">{medalIcon}</div>
                <p className="text-base md:text-lg truncate">{player.name}</p>
            </div>
            <div className="w-20 text-center text-slate-300 font-semibold">
                 <div className="font-bold text-slate-300 text-xs md:text-sm w-7 h-7 md:w-8 md:h-8 inline-flex items-center justify-center bg-slate-700 rounded-full flex-shrink-0">{player.position}</div>
            </div>
            <div className="w-28 text-center text-slate-400 text-sm truncate">{clubName || 'Vereinslos'}</div>
            <div className="w-24 text-center">
                 <div className="text-xl md:text-2xl font-black text-amber-400">{overall}</div>
                 <div className="text-[10px] text-slate-500 font-bold -mt-1">GESAMT</div>
            </div>
        </div>
    );
};

const PlayerLeaderboard: React.FC = () => {
    const [allPlayers, setAllPlayers] = useState<Player[]>([]);
    const [allClubs, setAllClubs] = useState<Club[]>([]);
    
    useEffect(() => {
        const unsubscribePlayers = dataService.listenToAllPlayers(setAllPlayers);
        const unsubscribeClubs = dataService.listenToClubs(setAllClubs);
        return () => { unsubscribePlayers(); unsubscribeClubs(); };
    }, []);

    const sortedPlayers = useMemo(() => {
        return [...allPlayers].sort((a, b) => getOverall(b) - getOverall(a));
    }, [allPlayers]);

    const clubMap = useMemo(() => new Map(allClubs.map(c => [c.id, c.name])), [allClubs]);

    return (
        <div className="space-y-2 md:space-y-3">
           <div className="grid grid-cols-[auto,1fr,auto,auto,auto] items-center p-2 text-xs font-bold text-slate-500 uppercase tracking-wider gap-2 md:gap-4">
                <div className="w-8 text-center">#</div>
                <div className="pl-12">Spieler</div>
                <div className="w-20 text-center">Position</div>
                <div className="w-28 text-center">Verein</div>
                <div className="w-24 text-center">Gesamt</div>
            </div>
            {sortedPlayers.map((player, index) => (
                <PlayerLeaderboardRow 
                    key={player.id} 
                    player={player} 
                    rank={index + 1} 
                    clubName={player.clubId ? clubMap.get(player.clubId) || null : null}
                />
            ))}
        </div>
    );
}

// --- CLUB LEADERBOARD ---
interface RankedClub extends Club {
    averageOverall: number;
    playerCount: number;
    managerName?: string;
}

const ClubLeaderboardRow: React.FC<{ club: RankedClub; rank: number }> = ({ club, rank }) => {
    const medalIcon = getMedalIcon(rank);

    return (
        <div className="grid grid-cols-[auto,1fr,auto,auto,auto] items-center bg-slate-800/80 p-3 md:p-4 rounded-xl border border-slate-700/50 text-white font-bold transition-all hover:bg-slate-800 hover:border-slate-600 gap-2 md:gap-4">
            <div className="w-8 text-center text-lg md:text-xl font-black text-slate-400">{rank}</div>
            <div className="flex items-center gap-3 md:gap-4">
                <div className="w-6 h-6 flex items-center justify-center">{medalIcon}</div>
                <p className="text-base md:text-lg truncate">{club.name}</p>
            </div>
            <div className="w-28 text-center text-slate-400 text-sm truncate">{club.managerName || 'N/A'}</div>
            <div className="w-20 text-center text-emerald-400 text-sm">{club.playerCount}/{MAX_CLUB_PLAYERS}</div>
             <div className="w-24 text-center">
                 <div className="text-xl md:text-2xl font-black text-amber-400">{club.averageOverall}</div>
                 <div className="text-[10px] text-slate-500 font-bold -mt-1">GESAMT</div>
            </div>
        </div>
    );
};

const ClubLeaderboard: React.FC = () => {
    const [players, setPlayers] = useState<Player[]>([]);
    const [clubs, setClubs] = useState<Club[]>([]);

    useEffect(() => {
        const unsubPlayers = dataService.listenToAllPlayers(setPlayers);
        const unsubClubs = dataService.listenToClubs(setClubs);
        return () => { unsubPlayers(); unsubClubs(); };
    }, []);

    const rankedClubs = useMemo<RankedClub[]>(() => {
        if (!players.length || !clubs.length) return [];

        const playerMap = new Map(players.map(p => [p.id, p.name]));

        const clubsWithStats = clubs.map(club => {
            const clubPlayers = players.filter(p => p.clubId === club.id);
            const totalOverall = clubPlayers.reduce((sum, p) => sum + getOverall(p), 0);
            const averageOverall = clubPlayers.length > 0 ? Math.round(totalOverall / clubPlayers.length) : 0;
            const managerName = club.managerId ? playerMap.get(club.managerId) : undefined;
            return { ...club, averageOverall, playerCount: clubPlayers.length, managerName };
        });

        return clubsWithStats.sort((a, b) => b.averageOverall - a.averageOverall);
    }, [players, clubs]);

     return (
        <div className="space-y-2 md:space-y-3">
           <div className="grid grid-cols-[auto,1fr,auto,auto,auto] items-center p-2 text-xs font-bold text-slate-500 uppercase tracking-wider gap-2 md:gap-4">
                <div className="w-8 text-center">#</div>
                <div className="pl-12">Club</div>
                <div className="w-28 text-center">Manager</div>
                <div className="w-20 text-center">Spieler</div>
                <div className="w-24 text-center">Gesamt</div>
            </div>
            {rankedClubs.map((club, index) => (
                <ClubLeaderboardRow key={club.id} club={club} rank={index + 1} />
            ))}
        </div>
    );
}

// --- MAIN LEADERBOARD WRAPPER ---
type LeaderboardView = 'players' | 'clubs';

export const Leaderboard: React.FC = () => {
    const [view, setView] = useState<LeaderboardView>('players');

    return (
        <div className="space-y-6 md:space-y-8 animate-in fade-in duration-300 pb-20">
            <header>
                <h2 className="text-2xl md:text-3xl font-black">Rangliste</h2>
                <p className="text-slate-400 mt-1">Die besten Spieler und Vereine des gesamten Servers.</p>
            </header>

            <div className="flex gap-1 md:gap-2 p-1 md:p-2 bg-slate-800 border border-slate-700 rounded-full text-sm">
                <button onClick={() => setView('players')} className={`flex-1 text-center font-bold p-2 md:p-3 rounded-full transition-colors ${view === 'players' ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}>Spieler</button>
                <button onClick={() => setView('clubs')} className={`flex-1 text-center font-bold p-2 md:p-3 rounded-full transition-colors ${view === 'clubs' ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}>Vereine</button>
            </div>

            <div className="animate-in fade-in duration-500">
                {view === 'players' && <PlayerLeaderboard />}
                {view === 'clubs' && <ClubLeaderboard />}
            </div>
        </div>
    );
};