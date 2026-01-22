import React, { useState, useEffect, useMemo } from 'react';
import { Player } from '../types';
import { dataService } from '../services/dataService';
import { getSkillsForPosition } from '../utils';

const getOverall = (p: Player) => {
    const relevantSkills = getSkillsForPosition(p.position);
    if (relevantSkills.length === 0) return 0;
    const totalSkill = relevantSkills.reduce((sum, s) => sum + (p.skills[s] || 0), 0);
    return Math.round(totalSkill / relevantSkills.length);
};

const LeaderboardRow: React.FC<{ player: Player; rank: number }> = ({ player, rank }) => {
    const overall = useMemo(() => getOverall(player), [player]);
    const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : null;

    return (
        <div className="flex items-center bg-slate-800/80 p-3 md:p-4 rounded-xl border border-slate-700/50 text-white font-bold transition-all hover:bg-slate-800 hover:border-slate-600">
            <div className="w-10 md:w-12 text-center text-lg md:text-xl font-black text-slate-400">{rank}</div>
            <div className="flex-1 flex items-center gap-3 md:gap-4">
                <span className="text-2xl">{medal || ''}</span>
                <p className="text-base md:text-lg">{player.name}</p>
            </div>
            <div className="w-20 text-center text-blue-400">
                <span className="text-xs text-slate-500">LVL</span> {player.level}
            </div>
            <div className="w-24 text-center text-xl md:text-2xl font-black text-amber-400">{overall}</div>
        </div>
    );
};


export const Leaderboard: React.FC = () => {
    const [allPlayers, setAllPlayers] = useState<Player[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = dataService.listenToAllPlayers((players) => {
            setAllPlayers(players);
            if (isLoading) setIsLoading(false);
        });
        return () => unsubscribe();
    }, [isLoading]);

    const sortedPlayers = useMemo(() => {
        return [...allPlayers].sort((a, b) => getOverall(b) - getOverall(a));
    }, [allPlayers]);

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
                   <div className="flex items-center p-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                        <div className="w-10 md:w-12 text-center">#</div>
                        <div className="flex-1">Spieler</div>
                        <div className="w-20 text-center">Level</div>
                        <div className="w-24 text-center">Gesamt</div>
                    </div>
                    {sortedPlayers.map((player, index) => (
                        <LeaderboardRow key={player.id} player={player} rank={index + 1} />
                    ))}
                </div>
            )}
        </div>
    );
};