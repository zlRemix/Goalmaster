import React, { useState, useEffect, useMemo } from 'react';
import { Player, Club, AvatarData, PlayerPosition } from '../types';
import { dataService } from '../services/dataService';
import { getSkillsForPosition, getSkillRatingColor } from '../utils';
import { MAX_CLUB_PLAYERS } from '../constants';
import { Medal, Rocket, Users, Shield, Hand, Trophy, Star, Crown } from 'lucide-react';
import ClubLogo from './ClubLogo';
import { createAvatar } from '@dicebear/core';
import * as collections from '@dicebear/collection';

// --- Hilfskomponenten ---

const PositionIcon: React.FC<{ position: PlayerPosition, className?: string }> = ({ position, className = 'w-5 h-5' }) => {
    const icons: Record<PlayerPosition, React.ElementType> = {
        'Stürmer': Rocket, 'Mittelfeld': Users, 'Abwehr': Shield, 'Torwart': Hand,
    };
    const Icon = icons[position];
    return Icon ? <Icon className={className} /> : null;
};

const PlayerAvatar: React.FC<{ avatar?: AvatarData, size?: number }> = ({ avatar, size = 32 }) => {
    const avatarSvg = useMemo(() => {
        if (!avatar || !avatar.style || !avatar.seed) return null;
        const styleCollection = (collections as any)[avatar.style];
        if (!styleCollection) return null;
        return createAvatar(styleCollection, { seed: avatar.seed, size, radius: 50 }).toString();
    }, [avatar, size]);

    if (avatarSvg) return <div style={{ width: size, height: size }} dangerouslySetInnerHTML={{ __html: avatarSvg }} />;
    return <div style={{ width: size, height: size }} className="bg-slate-700 rounded-full shadow-inner" />;
};

const getRankAppearance = (rank: number) => {
    if (rank === 1) return { color: "text-yellow-400", bg: "bg-yellow-400/10", border: "border-yellow-400/30", icon: Crown };
    if (rank === 2) return { color: "text-slate-300", bg: "bg-slate-300/10", border: "border-slate-300/30", icon: Medal };
    if (rank === 3) return { color: "text-amber-600", bg: "bg-amber-600/10", border: "border-amber-600/30", icon: Medal };
    return { color: "text-slate-500", bg: "bg-slate-800/40", border: "border-white/5", icon: null };
};

const getOverall = (player: Player): number => {
    const relevantSkills = getSkillsForPosition(player.position);
    const totalSkill = Object.entries(player.skills).reduce((sum, [skill, value]) => {
        if (relevantSkills.includes(skill as any)) return sum + value;
        return sum;
    }, 0);
    return Math.round(totalSkill / relevantSkills.length);
};

// --- PLAYER LEADERBOARD --- 

const PlayerLeaderboard: React.FC<{ players: Player[], clubs: Club[] }> = ({ players, clubs }) => {
    const rankedPlayers = useMemo(() => {
        const clubMap = new Map(clubs.map(c => [c.id, c.name]));
        return players.map(p => ({
            ...p,
            overall: getOverall(p),
            clubName: p.clubId ? clubMap.get(p.clubId) : undefined,
        }))
        .sort((a, b) => b.overall - a.overall || b.level - a.level)
        .map((p, index) => ({ ...p, rank: index + 1 }));
    }, [players, clubs]);

    return (
        <div className="space-y-3">
            {rankedPlayers.slice(0, 50).map(player => {
                const rankInfo = getRankAppearance(player.rank);
                const RankIcon = rankInfo.icon;

                return (
                    <div 
                        key={player.id} 
                        className={`flex items-center gap-4 p-3 rounded-3xl bg-slate-900 border-2 ${rankInfo.border} transition-all hover:bg-slate-800 group shadow-lg`}
                    >
                        {/* Rank Section */}
                        <div className={`w-12 h-12 rounded-2xl ${rankInfo.bg} flex flex-col items-center justify-center shrink-0 border border-white/5`}>
                            {RankIcon ? <RankIcon className={`w-4 h-4 ${rankInfo.color} mb-0.5`} /> : <span className="text-[10px] font-black text-slate-500 uppercase leading-none">Pos</span>}
                            <span className={`font-black text-xl leading-none italic ${rankInfo.color}`}>{player.rank}</span>
                        </div>

                        {/* Avatar & Name */}
                        <div className="flex-grow flex items-center gap-4 min-w-0">
                            <div className="relative">
                                <PlayerAvatar avatar={player.avatar} size={48} />
                                <div className="absolute -bottom-1 -right-1 bg-slate-900 rounded-full p-1 border border-slate-700 shadow-md">
                                    <PositionIcon position={player.position} className="w-3 h-3 text-blue-400" />
                                </div>
                            </div>
                            <div className="min-w-0">
                                <h4 className="font-black text-white italic uppercase tracking-tighter truncate group-hover:text-blue-400 transition-colors">
                                    {player.name}
                                </h4>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest truncate">
                                    {player.clubName || 'Vereinslos'}
                                </p>
                            </div>
                        </div>

                        {/* Stats Section */}
                        <div className="flex items-center gap-6 px-4">
                            <div className="text-center">
                                <p className="text-[9px] font-black text-slate-600 uppercase">Level</p>
                                <p className="font-black text-slate-200 italic tracking-tighter tabular-nums">{player.level}</p>
                            </div>
                            <div className="text-right min-w-[50px]">
                                <p className="text-[9px] font-black text-slate-600 uppercase">GES</p>
                                <p className={`text-3xl font-black italic leading-none tabular-nums ${getSkillRatingColor(player.overall)}`}>
                                    {player.overall}
                                </p>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

// --- CLUB LEADERBOARD --- 

const ClubLeaderboard: React.FC<{ players: Player[], clubs: Club[] }> = ({ players, clubs }) => {
    const rankedClubs = useMemo(() => {
        const playerMap = new Map(players.map(p => [p.id, p.name]));
        return clubs.map(club => {
            const clubPlayers = players.filter(p => p.clubId === club.id);
            const averageOverall = clubPlayers.length > 0 
                ? Math.round(clubPlayers.reduce((sum, p) => sum + getOverall(p), 0) / clubPlayers.length) 
                : 0;
            return { ...club, averageOverall, playerCount: clubPlayers.length, managerName: club.managerId ? playerMap.get(club.managerId) : 'N/A' };
        })
        .sort((a, b) => b.averageOverall - a.averageOverall);
    }, [players, clubs]);

    return (
        <div className="space-y-3">
            {rankedClubs.map((club, index) => {
                const rank = index + 1;
                const rankInfo = getRankAppearance(rank);
                
                return (
                    <div 
                        key={club.id} 
                        className={`flex items-center gap-4 p-4 rounded-3xl bg-slate-900 border-2 ${rankInfo.border} transition-all hover:bg-slate-800 shadow-xl group`}
                    >
                        <div className={`w-12 h-12 rounded-2xl ${rankInfo.bg} flex items-center justify-center shrink-0 border border-white/5`}>
                            <span className={`font-black text-2xl italic ${rankInfo.color}`}>{rank}</span>
                        </div>

                        <div className="flex-grow flex items-center gap-4 min-w-0">
                            <ClubLogo logo={club.logo} size={48} />
                            <div className="min-w-0">
                                <h4 className="font-black text-white italic uppercase tracking-tighter truncate leading-tight group-hover:text-blue-400">
                                    {club.name}
                                </h4>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest bg-slate-950 px-2 py-0.5 rounded-full border border-white/5 italic">
                                        Mgr: {club.managerName}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-8 px-4">
                            <div className="text-center hidden sm:block">
                                <p className="text-[9px] font-black text-slate-600 uppercase">Kader</p>
                                <p className="font-black text-slate-300 italic tracking-tighter tabular-nums">{club.playerCount}/{MAX_CLUB_PLAYERS}</p>
                            </div>
                            <div className="text-right min-w-[60px]">
                                <p className="text-[9px] font-black text-slate-600 uppercase italic">Club GES</p>
                                <p className={`text-4xl font-black italic leading-none tabular-nums ${getSkillRatingColor(club.averageOverall)}`}>
                                    {club.averageOverall}
                                </p>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

// --- MAIN LEADERBOARD ---

export const Leaderboard: React.FC = () => {
    const [view, setView] = useState<'players' | 'clubs'>('players');
    const [players, setPlayers] = useState<Player[]>([]);
    const [clubs, setClubs] = useState<Club[]>([]);

    useEffect(() => {
        const unsubP = dataService.listenToAllPlayers(setPlayers);
        const unsubC = dataService.listenToAllClubs(setClubs);
        return () => { unsubP(); unsubC(); };
    }, []);

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-10">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                    <h2 className="text-3xl md:text-5xl font-black text-white italic uppercase tracking-tighter">Hall of Fame</h2>
                    <p className="text-slate-400 text-sm md:text-base font-medium">Die besten Profis und Vereine der Saison.</p>
                </div>

                {/* Tab Navigation */}
                <div className="flex gap-2 p-1 bg-slate-950 rounded-2xl border border-slate-800">
                    <button 
                        onClick={() => setView('players')}
                        className={`px-8 py-2.5 rounded-xl font-black uppercase text-xs tracking-widest transition-all ${view === 'players' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' : 'text-slate-500 hover:text-white hover:bg-slate-900'}`}
                    >
                        Spieler
                    </button>
                    <button 
                        onClick={() => setView('clubs')}
                        className={`px-8 py-2.5 rounded-xl font-black uppercase text-xs tracking-widest transition-all ${view === 'clubs' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' : 'text-slate-500 hover:text-white hover:bg-slate-900'}`}
                    >
                        Vereine
                    </button>
                </div>
            </header>

            <div className="bg-slate-800/20 p-4 md:p-6 rounded-[2.5rem] border border-slate-800/50 backdrop-blur-md shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-[100px] -z-10" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/5 blur-[100px] -z-10" />
                
                {view === 'players' 
                    ? <PlayerLeaderboard players={players} clubs={clubs} /> 
                    : <ClubLeaderboard players={players} clubs={clubs} />
                }
            </div>
        </div>
    );
};