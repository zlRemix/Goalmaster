import React, { useState, useEffect, useMemo } from 'react';
import { Player, Club } from '../types';
import { dataService } from '../services/dataService';
import { getSkillsForPosition } from '../utils';

const getOverall = (p: Player) => {
    const relevantSkills = getSkillsForPosition(p.position);
    if (relevantSkills.length === 0) return 0;
    const totalSkill = relevantSkills.reduce((sum, s) => sum + (p.skills[s] || 0), 0);
    return Math.round(totalSkill / relevantSkills.length);
};

const LeaderboardRow: React.FC<{ player: Player; rank: number; clubName: string | null; }> = ({ player, rank, clubName }) => {
    const overall = useMemo(() => getOverall(player), [player]);
    const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : null;

    return (
        <div className="grid grid-cols-[auto,1fr,auto,auto,auto] items-center bg-slate-800/80 p-3 md:p-4 rounded-xl border border-slate-700/50 text-white font-bold transition-all hover:bg-slate-800 hover:border-slate-600 gap-2 md:gap-4">
            <div className="w-8 text-center text-lg md:text-xl font-black text-slate-400">{rank}</div>
            <div className="flex items-center gap-3 md:gap-4">
                <span className="text-2xl w-6 text-center">{medal || ''}</span>
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


export const Leaderboard: React.FC = () => {
    const [allPlayers, setAllPlayers] = useState<Player[]>([]);
    const [allClubs, setAllClubs] = useState<Club[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const unsubscribePlayers = dataService.listenToAllPlayers((players) => {
            setAllPlayers(players);
            if (isLoading && allClubs.length > 0) setIsLoading(false);
        });
        const unsubscribeClubs = dataService.listenToClubs((clubs) => {
            setAllClubs(clubs);
            if (isLoading && allPlayers.length > 0) setIsLoading(false);
        });

        // Initial load timeout
        const timer = setTimeout(() => {
            if(isLoading) setIsLoading(false)
        }, 2000);

        return () => {
            unsubscribePlayers();
            unsubscribeClubs();
            clearTimeout(timer);
        };
    }, [isLoading, allPlayers.length, allClubs.length]);

    const sortedPlayers = useMemo(() => {
        return [...allPlayers].sort((a, b) => getOverall(b) - getOverall(a));
    }, [allPlayers]);

    const clubMap = useMemo(() => {
        return new Map(allClubs.map(c => [c.id, c.name]));
    }, [allClubs]);

    return (
        <div className="space-y-6 md:space-y-8 animate-in fade-in duration-300 pb-20">
            <header>
                <h2 className="text-2xl md:text-3xl font-black">Rangliste</h2>
                <p className="text-slate-400 mt-1">Die besten Spieler des gesamten Servers.</p>
            </header>

            {isLoading ? (
                <div className="text-center p-10">
                    <p className="text-lg font-bold text-slate-400 animate-pulse">Lade Rangliste...</p>
                </div>
            ) : (
                <div className="space-y-2 md:space-y-3">
                   <div className="grid grid-cols-[auto,1fr,auto,auto,auto] items-center p-2 text-xs font-bold text-slate-500 uppercase tracking-wider gap-2 md:gap-4">
                        <div className="w-8 text-center">#</div>
                        <div className="pl-10">Spieler</div>
                        <div className="w-20 text-center">Position</div>
                        <div className="w-28 text-center">Verein</div>
                        <div className="w-24 text-center">Gesamt</div>
                    </div>
                    {sortedPlayers.map((player, index) => (
                        <LeaderboardRow 
                            key={player.id} 
                            player={player} 
                            rank={index + 1} 
                            clubName={player.clubId ? clubMap.get(player.clubId) || null : null}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};