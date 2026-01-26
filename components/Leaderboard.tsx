import React, { useState, useEffect, useMemo, ReactNode } from 'react';
import { Player, Club, AvatarData, PlayerPosition } from '../types';
import { dataService } from '../services/dataService';
import { getSkillsForPosition, getRatingColor } from '../utils';
import { MAX_CLUB_PLAYERS } from '../constants';
import { Medal, UserCircle, Rocket, Users, Shield, Hand } from 'lucide-react';
import ClubLogo from './ClubLogo';
import { createAvatar } from '@dicebear/core';
import * as collections from '@dicebear/collection';

const PositionIcon: React.FC<{ position: PlayerPosition, className?: string }> = ({ position, className = 'w-5 h-5' }) => {
    const icons: Record<PlayerPosition, React.ElementType> = {
        'Stürmer': Rocket,
        'Mittelfeld': Users,
        'Abwehr': Shield,
        'Torwart': Hand,
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

    if (avatarSvg) {
        return <div style={{ width: size, height: size }} dangerouslySetInnerHTML={{ __html: avatarSvg }} />;
    }
    return <div style={{ width: size, height: size }} className="bg-slate-700 rounded-full" />;
};


const getTrophyColor = (rank: number): string => {
    if (rank === 1) return "text-yellow-400";
    if (rank === 2) return "text-slate-300";
    if (rank === 3) return "text-amber-600";
    return "text-slate-500";
};

const getOverall = (player: Player): number => {
    const relevantSkills = getSkillsForPosition(player.position);
    const totalSkill = Object.entries(player.skills).reduce((sum, [skill, value]) => {
        if (relevantSkills.includes(skill as any)) {
            return sum + value;
        }
        return sum;
    }, 0);
    return Math.round(totalSkill / relevantSkills.length);
};

// --- PLAYER LEADERBOARD --- 

interface PlayerLeaderboardRowProps {
    player: Player & { rank: number; clubName?: string; overall: number };
}

const PlayerLeaderboardRow: React.FC<PlayerLeaderboardRowProps> = ({ player }) => {
    return (
        <div className="grid grid-cols-[auto,auto,1fr,auto,auto,auto] items-center p-2 rounded-lg transition-colors bg-slate-800/50 border-2 border-transparent hover:bg-slate-800 hover:border-blue-500/20 gap-2 md:gap-4">
            <div className="w-8 text-center">
                <span className={`font-bold text-lg ${getTrophyColor(player.rank)}`}>{player.rank}</span>
            </div>
            <PlayerAvatar avatar={player.avatar} />
            <div>
                <p className="font-bold text-white text-base truncate">{player.name}</p>
                <p className="text-xs text-slate-400 truncate">{player.clubName || 'Vereinslos'}</p>
            </div>
            <div className="w-20 text-center">
                 <PositionIcon position={player.position} className="w-6 h-6 mx-auto text-slate-400" />
            </div>
            <div className="w-24 text-center">
                <p className="font-bold text-slate-300 text-lg">LVL {player.level}</p>
            </div>
            <div className="w-24 text-center">
                <p className={`font-black text-2xl ${getRatingColor(player.overall)}`}>{player.overall}</p>
            </div>
        </div>
    );
};

const PlayerLeaderboard: React.FC<{ players: Player[], clubs: Club[] }> = ({ players, clubs }) => {
    const rankedPlayers = useMemo(() => {
        const clubMap = new Map(clubs.map(c => [c.id, c.name]));
        const playersWithStats = players.map(p => ({
            ...p,
            overall: getOverall(p),
            clubName: p.clubId ? clubMap.get(p.clubId) : undefined,
        }));
        return playersWithStats
            .sort((a, b) => b.overall - a.overall || b.level - a.level || b.experience - a.experience)
            .map((p, index) => ({ ...p, rank: index + 1 }));
    }, [players, clubs]);

    return (
        <div className="space-y-2 md:space-y-3">
            <div className="grid grid-cols-[auto,auto,1fr,auto,auto,auto] items-center p-2 text-xs font-bold text-slate-500 uppercase tracking-wider gap-2 md:gap-4">
                 <div className="w-8 text-center">#</div>
                 <div className="w-8"></div>
                 <div>Spieler</div>
                 <div className="w-20 text-center">Position</div>
                 <div className="w-24 text-center">Level</div>
                 <div className="w-24 text-center">Gesamt</div>
            </div>
            {rankedPlayers.slice(0, 100).map(player => (
                <PlayerLeaderboardRow key={player.id} player={player} />
            ))}
        </div>
    );
};


// --- CLUB LEADERBOARD --- 

interface ClubLeaderboardRowProps {
    club: Club & { averageOverall: number; playerCount: number; managerName?: string };
    rank: number;
}

const ClubLeaderboardRow: React.FC<ClubLeaderboardRowProps> = ({ club, rank }) => (
    <div className="grid grid-cols-[auto,1fr,auto,auto,auto] items-center p-3 rounded-lg transition-colors bg-slate-800/50 border-2 border-transparent hover:bg-slate-800 hover:border-blue-500/20 gap-2 md:gap-4">
        <div className="w-8 text-center">
            <span className={`font-bold text-lg ${getTrophyColor(rank)}`}>{rank}</span>
        </div>
        <div className="flex items-center gap-4">
            <ClubLogo logo={club.logo} size={32} />
            <div>
                <p className="font-bold text-white text-base truncate">{club.name}</p>
                <p className="text-xs text-slate-400 truncate">{club.motto || 'Kein Motto'}</p>
            </div>
        </div>
        <div className="w-28 text-center">
            <p className="text-sm text-slate-300 font-medium truncate">{club.managerName || 'N/A'}</p>
        </div>
        <div className="w-20 text-center">
            <p className="text-sm text-slate-300 font-medium">{club.playerCount} / {MAX_CLUB_PLAYERS}</p>
        </div>
        <div className="w-24 text-center">
            <p className={`font-black text-2xl ${getRatingColor(club.averageOverall)}`}>{club.averageOverall}</p>
        </div>
    </div>
);

const ClubLeaderboard: React.FC<{ players: Player[], clubs: Club[] }> = ({ players, clubs }) => {
    const rankedClubs = useMemo(() => {
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
    const [players, setPlayers] = useState<Player[]>([]);
    const [clubs, setClubs] = useState<Club[]>([]);

    useEffect(() => {
        const unsubscribePlayers = dataService.listenToAllPlayers(setPlayers);
        const unsubscribeClubs = dataService.listenToAllClubs(setClubs);

        return () => {
            unsubscribePlayers();
            unsubscribeClubs();
        };
    }, []);

    return (
        <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500">
            <header>
                <h2 className="text-2xl md:text-3xl font-black text-white">Rangliste</h2>
                <p className="text-slate-400 mt-1">Miss dich mit anderen Spielern und Vereinen.</p>
            </header>

             <div className="bg-slate-800/80 p-2 rounded-xl border border-slate-700 self-start flex gap-2">
                <button 
                    onClick={() => setView('players')}
                    className={`px-6 py-2 rounded-lg text-sm font-bold transition-colors ${view === 'players' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}>
                    Spieler
                </button>
                <button 
                    onClick={() => setView('clubs')}
                    className={`px-6 py-2 rounded-lg text-sm font-bold transition-colors ${view === 'clubs' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}>
                    Vereine
                </button>
            </div>

            {view === 'players' ? <PlayerLeaderboard players={players} clubs={clubs} /> : <ClubLeaderboard players={players} clubs={clubs} />}

        </div>
    );
};
