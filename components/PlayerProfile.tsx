
import React, { useMemo } from 'react';
import { Player, Club, AvatarData, PlayerPosition, SkillType } from '../types';
import { getSkillsForPosition, getSkillRatingColor } from '../utils';
import { X, Rocket, Users, Shield, Hand, Star } from 'lucide-react';
import ClubLogo from './ClubLogo';
import { createAvatar } from '@dicebear/core';
import * as collections from '@dicebear/collection';

const PlayerAvatar: React.FC<{ avatar?: AvatarData, size?: number }> = ({ avatar, size = 80 }) => {
    const avatarSvg = useMemo(() => {
        if (!avatar || !avatar.style || !avatar.seed) return null;
        const styleCollection = (collections as any)[avatar.style];
        if (!styleCollection) return null;
        return createAvatar(styleCollection, { seed: avatar.seed, size, radius: 50 }).toString();
    }, [avatar, size]);

    if (avatarSvg) return <div style={{ width: size, height: size }} dangerouslySetInnerHTML={{ __html: avatarSvg }} />;
    return <div style={{ width: size, height: size }} className="bg-slate-700 rounded-full" />;
};

const PositionIcon: React.FC<{ position: PlayerPosition, className?: string }> = ({ position, className = 'w-5 h-5' }) => {
    const icons: Record<PlayerPosition, React.ElementType> = {
        'Stürmer': Rocket, 'Mittelfeld': Users, 'Abwehr': Shield, 'Torwart': Hand,
    };
    const Icon = icons[position];
    return Icon ? <Icon className={className} /> : null;
};

const getOverall = (player: Player): number => {
    const relevantSkills = getSkillsForPosition(player.position);
    const totalSkill = Object.entries(player.skills).reduce((sum, [skill, value]) => {
        if (relevantSkills.includes(skill as any)) return sum + value;
        return sum;
    }, 0);
    return Math.round(totalSkill / relevantSkills.length);
};

interface PlayerProfileProps {
    player: Player;
    club: Club | null;
    onClose: () => void;
}

export const PlayerProfile: React.FC<PlayerProfileProps> = ({ player, club, onClose }) => {
    const overall = getOverall(player);
    const relevantSkills = getSkillsForPosition(player.position);

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
            <div className="bg-slate-900 border-2 border-slate-800 rounded-3xl p-6 max-w-md w-full m-auto relative shadow-2xl">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors">
                    <X className="w-6 h-6" />
                </button>

                <header className="flex flex-col items-center text-center border-b-2 border-slate-800 pb-4 mb-4">
                    <div className="relative mb-3">
                        <PlayerAvatar avatar={player.avatar} size={96} />
                        <div className="absolute -bottom-1 -right-1 bg-slate-800 rounded-full p-2 border-2 border-slate-700">
                            <PositionIcon position={player.position} className="w-6 h-6 text-blue-400" />
                        </div>
                    </div>
                    <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">{player.name}</h2>
                    {club ? (
                        <div className="flex items-center gap-2 mt-1">
                            <ClubLogo logo={club.logo} size={20} />
                            <span className="text-md font-bold text-slate-300">{club.name}</span>
                        </div>
                    ) : (
                        <span className="text-md font-bold text-slate-500">Vereinslos</span>
                    )}
                </header>

                <div className="grid grid-cols-3 gap-4 text-center mb-6">
                    <div>
                        <p className="text-sm font-bold text-slate-500 uppercase">Level</p>
                        <p className="text-2xl font-black text-blue-400">{player.level}</p>
                    </div>
                    <div>
                        <p className="text-sm font-bold text-slate-500 uppercase">GES</p>
                        <p className={`text-4xl font-black ${getSkillRatingColor(overall)}`}>{overall}</p>
                    </div>
                    <div>
                        <p className="text-sm font-bold text-slate-500 uppercase">TP</p>
                        <p className="text-2xl font-black text-yellow-400">{player.trainingPoints || 0}</p>
                    </div>
                </div>

                <div>
                    <h3 className="text-lg font-bold text-white uppercase tracking-wider mb-3 text-center">Fähigkeiten</h3>
                    <div className="space-y-2">
                        {Object.entries(player.skills).sort(([a], [b]) => relevantSkills.includes(b as SkillType) ? 1 : -1).map(([skill, value]) => {
                            const isRelevant = relevantSkills.includes(skill as SkillType);
                            return (
                                <div key={skill} className={`flex items-center justify-between p-2 rounded-lg ${isRelevant ? 'bg-slate-800' : 'bg-slate-800/50'}`}>
                                    <span className={`flex items-center gap-2 text-sm font-bold ${isRelevant ? 'text-white' : 'text-slate-400'}`}>
                                        {isRelevant && <Star className="w-4 h-4 text-yellow-500" />}
                                        {skill.replace(/_/g, ' ')}
                                    </span>
                                    <span className={`text-lg font-black ${getSkillRatingColor(value)}`}>{value}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};
