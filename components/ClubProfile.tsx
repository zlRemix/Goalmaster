
import React, { useMemo } from 'react';
import { Club, Player, PlayerPosition, AvatarData } from '../types';
import ClubLogo from './ClubLogo';
import { X } from 'lucide-react';
import { getSkillsForPosition, getSkillRatingColor } from '../utils';
import { createAvatar } from '@dicebear/core';
import * as collections from '@dicebear/collection';

// --- Helpers ---

const getOverall = (player: Player): number => {
    const relevantSkills = getSkillsForPosition(player.position);
    if (relevantSkills.length === 0) return 0;
    const totalSkill = Object.entries(player.skills).reduce((sum, [skill, value]) => {
        if (relevantSkills.includes(skill as any)) return sum + value;
        return sum;
    }, 0);
    return Math.round(totalSkill / relevantSkills.length);
};

const PlayerAvatar: React.FC<{ avatar?: AvatarData, size?: number }> = ({ avatar, size = 32 }) => {
    const avatarSvg = useMemo(() => {
        if (!avatar || !avatar.style || !avatar.seed) return null;
        const styleCollection = (collections as any)[avatar.style];
        if (!styleCollection) return null;
        try {
            return createAvatar(styleCollection, { seed: avatar.seed, size, radius: 50 }).toString();
        } catch (e) {
            console.error("Error creating avatar", e);
            return null;
        }
    }, [avatar, size]);

    if (avatarSvg) return <div style={{ width: size, height: size }} dangerouslySetInnerHTML={{ __html: avatarSvg }} />;
    return <div style={{ width: size, height: size }} className="bg-slate-700 rounded-full shadow-inner" />;
};

// --- ClubProfile Component ---

interface ClubProfileProps {
    club: Club;
    players: Player[];
    managerName: string;
    onClose: () => void;
    averageOverall: number;
}

export const ClubProfile: React.FC<ClubProfileProps> = ({ club, players, managerName, onClose, averageOverall }) => {
    
    const sortedPlayers = useMemo(() => {
        return [...players].sort((a, b) => getOverall(b) - getOverall(a));
    }, [players]);

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
            <div className="bg-slate-900 border-2 border-slate-800 rounded-3xl p-6 max-w-lg w-full m-auto relative shadow-2xl">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors">
                    <X className="w-6 h-6" />
                </button>

                <header className="flex flex-col items-center text-center border-b-2 border-slate-800 pb-4 mb-4">
                    <ClubLogo logo={club.logo} size={96} />
                    <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter mt-3">{club.name}</h2>
                    <p className="text-md font-bold text-slate-400">Manager: {managerName || 'N/A'}</p>
                </header>

                <div className="grid grid-cols-2 gap-4 text-center mb-6">
                     <div>
                        <p className="text-sm font-bold text-slate-500 uppercase">Club GES</p>
                        <p className={`text-4xl font-black ${getSkillRatingColor(averageOverall)}`}>{averageOverall}</p>
                    </div>
                     <div>
                        <p className="text-sm font-bold text-slate-500 uppercase">Kadergröße</p>
                        <p className="text-4xl font-black text-blue-400">{players.length}</p>
                    </div>
                </div>

                <div>
                    <h3 className="text-lg font-bold text-white uppercase tracking-wider mb-3 text-center">Spielerkader</h3>
                    <div className="space-y-1 max-h-64 overflow-y-auto pr-2">
                        {sortedPlayers.map(player => {
                            const overall = getOverall(player);
                            return (
                                <div key={player.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-800/60 hover:bg-slate-800">
                                    <div className="flex items-center gap-3">
                                        <PlayerAvatar avatar={player.avatar} size={32} />
                                        <span className="text-sm font-bold text-white">{player.name}</span>
                                    </div>
                                    <span className={`text-lg font-black ${getSkillRatingColor(overall)}`}>{overall}</span>
                                </div>
                            )
                        })}
                         {players.length === 0 && <p className="text-slate-500 text-center py-4">Dieser Club hat keine Spieler.</p>}
                    </div>
                </div>
            </div>
        </div>
    );
}
