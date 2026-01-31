import React, { useMemo, useId } from 'react';
import { Player, Club, View, AvatarData, EquipmentSlot, PlayerPosition, EquipmentItem } from '../types';
import { dataService } from '../services/dataService';
import { getSkillRatingColor } from '../utils';
import { UserCog, Shield, Package, AlertTriangle, Star, Rocket, Users, Hand, Euro, Zap, Check } from 'lucide-react';
import ClubLogo from './ClubLogo';
import { createAvatar } from '@dicebear/core';
import * as collections from '@dicebear/collection';
import { EQUIPMENT_ITEMS } from '../constants';
import NextMatchday from './NextMatchday';

// --- Navigations-Grafiken (Eigene SVGs für die Buttons) ---

const TrainingGraphic = () => (
    <svg viewBox="0 0 100 100" className="w-12 h-12 mb-3 drop-shadow-[0_0_8px_rgba(250,204,21,0.4)]">
        <defs>
            <linearGradient id="gradTraining" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FDE047" />
                <stop offset="100%" stopColor="#EAB308" />
            </linearGradient>
        </defs>
        <path d="M50 5 L15 35 L25 85 L75 85 L85 35 Z" fill="none" stroke="url(#gradTraining)" strokeWidth="2" strokeDasharray="4 2" opacity="0.3" />
        <path d="M50 15 L35 45 H45 V85 L65 55 H55 V15 Z" fill="url(#gradTraining)" filter="drop-shadow(0 0 5px #FDE047)" />
    </svg>
);

const ClubGraphic = () => (
    <svg viewBox="0 0 100 100" className="w-12 h-12 mb-3 drop-shadow-[0_0_8px_rgba(59,130,246,0.4)]">
        <defs>
            <linearGradient id="gradClub" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#60A5FA" />
                <stop offset="100%" stopColor="#2563EB" />
            </linearGradient>
        </defs>
        <path d="M50 10 L15 25 V55 C15 75 50 90 50 90 C50 90 85 75 85 55 V25 L50 10Z" fill="none" stroke="url(#gradClub)" strokeWidth="2" />
        <circle cx="50" cy="45" r="18" fill="url(#gradClub)" fillOpacity="0.2" stroke="url(#gradClub)" strokeWidth="2" />
        <path d="M50 35 L55 42 H65 L58 48 L61 58 L50 52 L39 58 L42 48 L35 42 H45 Z" fill="url(#gradClub)" />
    </svg>
);

const ShopGraphic = () => (
    <svg viewBox="0 0 100 100" className="w-12 h-12 mb-3 drop-shadow-[0_0_8px_rgba(52,211,153,0.4)]">
        <defs>
            <linearGradient id="gradShop" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#34D399" />
                <stop offset="100%" stopColor="#059669" />
            </linearGradient>
        </defs>
        <rect x="20" y="40" width="60" height="45" rx="4" fill="none" stroke="url(#gradShop)" strokeWidth="2" />
        <path d="M20 45 L50 25 L80 45" fill="none" stroke="url(#gradShop)" strokeWidth="3" strokeLinecap="round" />
        <circle cx="50" cy="62" r="12" fill="url(#gradShop)" />
        <path d="M46 62 H54 M50 58 V66" stroke="white" strokeWidth="2" strokeLinecap="round" />
    </svg>
);

const ProfileGraphic = () => (
    <svg viewBox="0 0 100 100" className="w-12 h-12 mb-3 drop-shadow-[0_0_8px_rgba(148,163,184,0.4)]">
        <defs>
            <linearGradient id="gradProfile" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#94A3B8" />
                <stop offset="100%" stopColor="#475569" />
            </linearGradient>
        </defs>
        <circle cx="50" cy="35" r="15" fill="url(#gradProfile)" />
        <path d="M25 85 C25 65 35 55 50 55 C65 55 75 65 75 85" fill="none" stroke="url(#gradProfile)" strokeWidth="3" />
        <rect x="15" y="15" width="70" height="70" rx="10" fill="none" stroke="url(#gradProfile)" strokeWidth="1" opacity="0.3" />
    </svg>
);

// --- Hilfskomponenten (Position, Avatar, Banner) ---

const PositionIcon: React.FC<{ position: PlayerPosition, className?: string }> = ({ position, className = 'w-5 h-5' }) => {
    const icons: Record<PlayerPosition, React.ElementType> = {
        'Stürmer': Rocket, 'Mittelfeld': Users, 'Abwehr': Shield, 'Torwart': Hand,
    };
    const Icon = icons[position];
    return Icon ? <Icon className={className} /> : null;
};

const PlayerAvatar: React.FC<{ avatar?: AvatarData; size?: number }> = ({ avatar, size = 80 }) => {
    const avatarSvg = useMemo(() => {
        if (!avatar || !avatar.style || !avatar.seed) return null;
        const styleCollection = (collections as any)[avatar.style];
        if (!styleCollection) return null;
        return createAvatar(styleCollection, { seed: avatar.seed, size, radius: 50 }).toString();
    }, [avatar, size]);

    if (avatarSvg) return <div style={{ width: size, height: size }} dangerouslySetInnerHTML={{ __html: avatarSvg }} />;
    return <div style={{ width: size, height: size }} className="bg-slate-700 rounded-full" />;
};

const InvitationBanner: React.FC<{ player: Player; allClubs: Club[]; }> = ({ player, allClubs }) => {
    if (!player.pendingClubInvitation) return null;
    const invitingClub = allClubs.find(c => c.id === player.pendingClubInvitation);
    if (!invitingClub) return null;
    const handleAccept = () => dataService.acceptClubInvitation(player.id, invitingClub.id).catch(e => console.error(e));
    const handleReject = () => dataService.rejectClubInvitation(player.id).catch(e => console.error(e));

    return (
        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 p-5 rounded-[2rem] border border-indigo-400/30 shadow-xl">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4">
                    <ClubLogo logo={invitingClub.logo} size={48} />
                    <div className="text-center md:text-left">
                        <h3 className="text-lg font-black text-white uppercase italic">Einladung von {invitingClub.name}</h3>
                        <p className="text-indigo-100 text-xs font-bold uppercase tracking-tight">Tritt dem Verein bei!</p>
                    </div>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                    <button onClick={handleAccept} className="flex-1 md:flex-none bg-emerald-500 hover:bg-emerald-400 text-white font-black uppercase text-xs py-3 px-6 rounded-xl transition-all shadow-lg">Annehmen</button>
                    <button onClick={handleReject} className="flex-1 md:flex-none bg-slate-900/50 hover:bg-slate-900 text-white font-black uppercase text-xs py-3 px-6 rounded-xl transition-all">Ablehnen</button>
                </div>
            </div>
        </div>
    );
};

// --- Equipment Manager ---

const EquipmentMiniCard: React.FC<{ item: EquipmentItem; isEquipped: boolean; onToggle: () => void }> = ({ item, isEquipped, onToggle }) => {
    const rarityColor = item.price >= 5000 ? '#FDE047' : item.price >= 1500 ? '#C084FC' : '#38BDF8';
    return (
        <div className={`relative flex flex-col w-full bg-slate-900 border-2 rounded-[2rem] p-3 transition-all ${isEquipped ? 'border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.2)]' : 'border-slate-800 opacity-80 hover:opacity-100'}`}>
            <div className="text-center mb-2 h-8 flex items-center justify-center">
                <h4 className="text-[10px] font-black text-white uppercase italic leading-tight truncate px-1">{item.name}</h4>
            </div>
            <div className="flex flex-col gap-1 mb-3 bg-black/20 p-2 rounded-xl">
                {Object.entries(item.bonus).map(([skill, val]) => (
                    <div key={skill} className="flex justify-between text-[9px] font-bold">
                        <span className="text-slate-500 uppercase">{skill.split('_')[0]}</span>
                        <span style={{ color: rarityColor }}>+{val}</span>
                    </div>
                ))}
            </div>
            <button onClick={onToggle} className={`w-full py-2 rounded-xl text-[10px] font-black uppercase tracking-tighter transition-all ${isEquipped ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-white text-black hover:bg-blue-400 hover:text-white'}`}>
                {isEquipped ? <span className="flex items-center justify-center gap-1"><Check className="w-3 h-3"/> Aktiv</span> : 'Anlegen'}
            </button>
        </div>
    );
};

const EquipmentManager: React.FC<{ player: Player }> = ({ player }) => {
    const ownedItems = useMemo(() =>
        (player.equipment || []).map(id => EQUIPMENT_ITEMS.find(item => item.id === id)).filter(Boolean) as EquipmentItem[],
        [player.equipment]
    );

    const renderSlotGroup = (slot: EquipmentSlot, title: string) => {
        const items = ownedItems.filter(i => i.slot === slot);
        if (items.length === 0) return null;
        return (
            <div className="space-y-3">
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] pl-2">{title}</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {items.map(item => (
                        <EquipmentMiniCard key={item.id} item={item} isEquipped={player.equipped?.[slot] === item.id} onToggle={() => dataService.toggleEquipment(player.id, item.id, slot)} />
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="bg-slate-800/40 p-6 rounded-[2.5rem] border border-slate-800 space-y-6">
            <header className="flex items-center gap-3">
                <Package className="w-6 h-6 text-sky-400" />
                <h2 className="text-xl font-black text-white uppercase italic tracking-tighter">Kabine / Ausrüstung</h2>
            </header>
            <div className="space-y-8">
                {renderSlotGroup(EquipmentSlot.JERSEY, 'Trikots')}
                {renderSlotGroup(EquipmentSlot.SHORTS, 'Hosen')}
                {renderSlotGroup(EquipmentSlot.SHOES, 'Schuhe')}
                {player.position === 'Torwart' && renderSlotGroup(EquipmentSlot.GLOVES, 'Handschuhe')}
            </div>
        </div>
    );
};


// --- Dashboard ---

interface DashboardProps {
    player: Player; club: Club | null; allClubs: Club[]; overallRating: number; xpProgress: number; xpNeeded: number; setView: (view: View) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ player, club, allClubs, overallRating, xpProgress, xpNeeded, setView }) => {
    return (
        <div className="space-y-6 md:space-y-8 animate-in fade-in duration-300 pb-20">
            <div className="bg-sky-500/10 border border-sky-500/20 p-4 rounded-3xl flex items-center gap-4">
                <AlertTriangle className="w-5 h-5 text-sky-400" />
                <p className="text-xs font-bold text-sky-300 uppercase tracking-tight">Pre-Alpha Testphase</p>
            </div>

            {player.pendingClubInvitation && <InvitationBanner player={player} allClubs={allClubs} />}

            <header className="flex flex-col lg:flex-row gap-6">
                <div className="flex-1 flex items-center gap-6 bg-slate-800/80 p-6 rounded-[2.5rem] border border-slate-700 relative overflow-hidden group">
                    <div className="relative z-10">
                        <PlayerAvatar avatar={player.avatar} size={80} />
                        <div className="absolute -bottom-2 -right-2 bg-slate-900 p-2 rounded-full border border-slate-700">
                            <PositionIcon position={player.position} className="w-4 h-4 text-blue-400" />
                        </div>
                    </div>
                    <div className="flex-1 z-10">
                        <h1 className="text-3xl font-black text-white italic uppercase tracking-tighter leading-none mb-2">{player.name}</h1>
                        <div className="flex items-center gap-2">
                            {club ? (
                                <div className="flex items-center gap-2 bg-slate-900/50 px-3 py-1 rounded-full border border-white/5">
                                    <ClubLogo logo={club.logo} size={16}/>
                                    <span className="text-xs font-black text-slate-300 uppercase italic">{club.name}</span>
                                </div>
                            ) : <span className="text-xs font-bold text-slate-500 uppercase tracking-widest italic">Vereinslos</span>}
                        </div>
                    </div>
                </div>

                <div className="flex gap-4">
                    <div className="bg-slate-800/80 p-6 rounded-[2.5rem] border border-slate-700 flex flex-col items-center justify-center min-w-[120px]">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">GES</span>
                        <span className={`text-6xl font-black italic leading-none ${getSkillRatingColor(overallRating)}`}>{overallRating}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div className="bg-slate-900/50 px-4 py-2 rounded-2xl border border-white/5 flex flex-col items-center">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Level</span>
                            <span className="text-xl font-black text-blue-400">{player.level || 1}</span>
                        </div>
                        <div className="bg-slate-900/50 px-4 py-2 rounded-2xl border border-white/5 flex flex-col items-center">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">TP</span>
                            <span className="text-xl font-black text-yellow-400">{player.trainingPoints || 0}</span>
                        </div>
                        <div className="bg-slate-900/50 px-4 py-2 rounded-2xl border border-white/5 flex flex-col items-center">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Euro</span>
                            <span className="text-xl font-black text-emerald-400">{(player.euro || 0).toLocaleString()}</span>
                        </div>
                        <div className="bg-slate-900/50 px-4 py-2 rounded-2xl border border-white/5 flex flex-col items-center">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">XP</span>
                            <span className="text-xl font-black text-slate-300">{Math.round(player.experience || 0)}</span>
                        </div>
                    </div>
                </div>
            </header>

            <div className="bg-slate-800/40 p-4 rounded-[2rem] border border-slate-800">
                <div className="flex justify-between items-center mb-2 px-2">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Level Fortschritt</span>
                    <span className="text-[10px] font-black text-blue-400">{Math.round(player.experience || 0)} / {xpNeeded} XP</span>
                </div>
                <div className="h-2.5 w-full bg-slate-900 rounded-full overflow-hidden p-[2px]">
                    <div className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(37,99,235,0.4)]" style={{ width: `${xpProgress}%` }} />
                </div>
            </div>

            <NextMatchday club={club} allClubs={allClubs} />

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { id: 'activities', label: 'Training', desc: 'Skills pushen', graphic: TrainingGraphic },
                    { id: club ? 'club' : 'club-search', label: club ? 'Verein' : 'Suche', desc: 'Team verwalten', graphic: ClubGraphic },
                    { id: 'shop', label: 'Shop', desc: 'Packs & Gear', graphic: ShopGraphic },
                    { id: 'profile', label: 'Profil', desc: 'Avatar & Bio', graphic: ProfileGraphic },
                ].map((btn) => (
                    <button key={btn.id} onClick={() => setView(btn.id as View)} className="bg-slate-800/40 p-5 rounded-[2.5rem] border border-slate-800 hover:border-white/20 hover:bg-slate-800/60 transition-all group text-left shadow-lg flex flex-col items-center">
                        <btn.graphic />
                        <h3 className="font-black text-white text-sm uppercase italic tracking-tighter text-center">{btn.label}</h3>
                        <p className="text-[10px] text-slate-500 font-bold uppercase text-center mt-1">{btn.desc}</p>
                    </button>
                ))}
            </div>
            <EquipmentManager player={player} />
        </div>
    );
};
