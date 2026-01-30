import React, { useState, useEffect, ElementType, useId, memo } from 'react';
import { Club, Player, InfrastructureType, UserRole, ActiveTeamTraining, View, SpecializationID, PendingUpgrade } from '../types';
import { dataService } from '../services/dataService';
import { getSkillsForPosition } from '../utils';
import { INFRA_UPGRADE_COSTS, INFRA_UPGRADE_TIMES, INFRA_LEVEL_BENEFITS, TEAM_TRAININGS, MAX_CLUB_PLAYERS, INFRASTRUCTURE_SPECIALIZATIONS } from '../constants';
import { ClubManagement } from './ClubManagement';
import LogoEditor from './LogoEditor';
import ClubLogo from './ClubLogo';
import { Timer, TrendingUp, Users, Zap, ShieldCheck, Euro, Building2, Star } from 'lucide-react';
import { EliteSpecialization } from './EliteSpecialization';


const InfraVisual: React.FC<{ type: InfrastructureType; color: string; rarityId: string }> = ({ type, color, rarityId }) => {
    const getPaths = () => {
        switch (type) {
            case InfrastructureType.STADIUM:
                return <g><ellipse cx="75" cy="85" rx="55" ry="35" fill="none" stroke="currentColor" strokeWidth="4" /><ellipse cx="75" cy="85" rx="35" ry="20" fill="none" stroke="white" strokeWidth="2" opacity="0.3" /><path d="M40 60 L110 60 M40 110 L110 110 M75 50 V120" stroke="white" strokeWidth="1" opacity="0.2" /></g>;
            case InfrastructureType.TRAINING_GROUND:
                return <g><rect x="35" y="80" width="80" height="15" rx="2" fill="currentColor" /><circle cx="45" cy="87.5" r="15" fill="none" stroke="white" strokeWidth="6" opacity="0.4" /><circle cx="105" cy="87.5" r="15" fill="none" stroke="white" strokeWidth="6" opacity="0.4" /><path d="M75 50 L85 65 H65 Z" fill="white" /></g>;
            case InfrastructureType.MEDICAL_CENTER:
                return <g><rect x="55" y="55" width="40" height="60" rx="4" fill="none" stroke="currentColor" strokeWidth="4" /><path d="M65 85 H85 M75 75 V95" stroke="white" strokeWidth="6" strokeLinecap="round" /><path d="M40 85 H55 M95 85 H110" stroke="white" strokeWidth="2" opacity="0.3" /></g>;
            case InfrastructureType.MARKETING_DEPARTMENT:
                return <g><path d="M40 100 L60 60 L90 60 L110 100 Z" fill="none" stroke="currentColor" strokeWidth="4" /><circle cx="75" cy="75" r="10" fill="white" opacity="0.5" /><path d="M50 110 H100" stroke="white" strokeWidth="4" strokeLinecap="round" /><path d="M75 45 V60" stroke="currentColor" strokeWidth="2" /></g>;
            default:
                return <circle cx="75" cy="80" r="30" fill="currentColor" />;
        }
    };
    return (
        <svg viewBox="0 0 150 160" className="w-full h-full">
            <defs>
                <linearGradient id={`infra_grad_${rarityId}`} x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="white" stopOpacity="0.9" />
                    <stop offset="100%" stopColor={color} />
                </linearGradient>
                <filter id={`infra_glow_${rarityId}`}>
                    <feGaussianBlur stdDeviation="5" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
            </defs>
            <circle cx="75" cy="80" r="35" fill={color} fillOpacity="0.1" filter="blur(15px)" />
            <g fill={`url(#infra_grad_${rarityId})`} color={color} filter={`url(#infra_glow_${rarityId})`}>
                {getPaths()}
            </g>
        </svg>
    );
};

const useCountdown = (endTime: number) => {
    const calculateRemaining = () => Math.max(0, Math.floor((endTime - Date.now()) / 1000));
    const [totalSeconds, setTotalSeconds] = useState(calculateRemaining);
    useEffect(() => {
        if (endTime <= 0) { setTotalSeconds(0); return; }
        const timer = setInterval(() => {
            const remaining = calculateRemaining();
            setTotalSeconds(remaining);
            if (remaining <= 0) clearInterval(timer);
        }, 1000);
        return () => clearInterval(timer);
    }, [endTime]);
    return totalSeconds;
};

const formatDuration = (totalSeconds: number) => {
    if (totalSeconds <= 0) return "00:00:00";
    const d = Math.floor(totalSeconds / 86400);
    const h = Math.floor((totalSeconds % 86400) / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = Math.floor(totalSeconds % 60);
    let str = '';
    if (d > 0) str += `${d}T `;
    str += `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return str;
};

const infrastructureInfo: Record<InfrastructureType, { name: string; description: string; }> = {
    [InfrastructureType.STADIUM]: { name: 'Stadion', description: 'Erhöht die Ticketeinnahmen.' },
    [InfrastructureType.TRAINING_GROUND]: { name: 'Trainingsgelände', description: 'Verbessert TP-Gewinn.' },
    [InfrastructureType.MEDICAL_CENTER]: { name: 'Medizinisches Zentrum', description: 'Verkürzt Aktivitäts-Dauer.' },
    [InfrastructureType.MARKETING_DEPARTMENT]: { name: 'Marketingabteilung', description: 'Erhöht PR-Einnahmen.' },
};

const InfrastructureCard: React.FC<{ type: InfrastructureType; club: Club; onUpgrade: (clubId: string, type: InfrastructureType) => void; onSpecializationSelected: () => void; }> = ({ type, club, onUpgrade, onSpecializationSelected }) => {
    const rarityId = useId().replace(/:/g, "");
    const info = infrastructureInfo[type];
    const infraItem = club.infrastructure?.[type];
    const currentLevel = infraItem?.level || 0;
    const upgradeCost = currentLevel < 10 ? INFRA_UPGRADE_COSTS[currentLevel] : null;
    const pendingUpgrade = club.pendingUpgrades?.find(upg => upg.type === type);
    const remainingTime = useCountdown(pendingUpgrade?.endTime || 0);
    const benefits = INFRA_LEVEL_BENEFITS[type] || [];
    const currentBenefit = currentLevel > 0 ? benefits[currentLevel - 1] : "Kein Bonus";
    const nextBenefit = currentLevel < benefits.length ? benefits[currentLevel] : "Maximalstufe";

    const specializationsAvailable = INFRASTRUCTURE_SPECIALIZATIONS.some(p => p.type === type);
    const showSpecializationChoice = currentLevel >= 10 && !infraItem?.specialization && specializationsAvailable && !pendingUpgrade;
    
    const selectedSpecialization = infraItem?.specialization ? 
        INFRASTRUCTURE_SPECIALIZATIONS.find(p => p.type === type)?.specializations.find(s => s.id === infraItem.specialization)
        : null;

    return (
        <div className={`bg-slate-900 border-2 ${selectedSpecialization ? 'border-yellow-400/50' : 'border-slate-800'} rounded-[2.5rem] p-5 flex flex-col gap-4 transition-all hover:border-slate-700 shadow-2xl relative overflow-hidden group`}>
             <div className="flex items-center justify-between">
                <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center border border-blue-500/20">
                    <InfraVisual type={type} color="#3b82f6" rarityId={rarityId} />
                </div>
                <div className="text-right">
                    <span className={`text-[10px] font-black ${currentLevel >= 10 ? 'text-yellow-400' : 'text-blue-400'} uppercase tracking-widest`}>Level {currentLevel} / 10</span>
                    <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">{info.name}</h3>
                </div>
            </div>

            <div className="space-y-3 flex-1">
                 <div className="bg-slate-950/50 p-3 rounded-2xl border border-white/5">
                    <p className="text-[10px] font-bold text-slate-500 uppercase mb-1 italic">Aktueller Bonus</p>
                    <p className="text-sm font-bold text-emerald-400">{currentBenefit}</p>
                    {selectedSpecialization && (
                        <>
                             <p className="text-[10px] font-bold text-slate-500 uppercase mt-2 mb-1 italic">Elite-Bonus</p>
                             <div className="flex items-center gap-2">
                                <Star className="w-4 h-4 text-yellow-400" />
                                <p className="text-sm font-bold text-yellow-300">{selectedSpecialization.name}</p>
                             </div>
                        </>
                    )}
                </div>
                {!pendingUpgrade && currentLevel < 10 && (
                    <div className="bg-slate-950/30 p-3 rounded-2xl border border-dashed border-white/5 opacity-60">
                        <p className="text-[10px] font-bold text-slate-500 uppercase mb-1 italic">Nächster Level</p>
                        <p className="text-sm font-bold text-blue-300">{nextBenefit}</p>
                    </div>
                )}
            </div>

            <div className="pt-2">
                {pendingUpgrade ? (
                     <div className={`p-4 rounded-2xl text-center ${pendingUpgrade.specializationId ? 'bg-yellow-600/10 border border-yellow-600/20' : 'bg-blue-600/10 border border-blue-600/20'}`}>
                        <p className={`text-[10px] font-black ${pendingUpgrade.specializationId ? 'text-yellow-400' : 'text-blue-400'} uppercase animate-pulse mb-1`}>
                            {pendingUpgrade.specializationId ? 'Elite-Ausbau läuft' : 'Ausbau läuft'}
                        </p>
                        <p className="text-xl font-black text-white tabular-nums">{formatDuration(remainingTime)}</p>
                    </div>
                ) : showSpecializationChoice ? (
                     <EliteSpecialization infrastructureType={type} clubId={club.id} clubBudget={club.budget || 0} onSpecializationSelected={onSpecializationSelected} />
                ) : upgradeCost !== null ? (
                    <button disabled={(club.budget || 0) < upgradeCost} onClick={() => onUpgrade(club.id, type)} className="w-full bg-white text-slate-950 hover:bg-blue-400 hover:text-white disabled:bg-slate-800 disabled:text-slate-600 font-black uppercase tracking-widest py-3 rounded-2xl transition-all active:scale-95 text-xs flex items-center justify-center gap-2"><TrendingUp className="w-4 h-4" />Upgrade ({upgradeCost.toLocaleString()} €)</button>
                ) : (
                    <div className={` p-3 rounded-2xl text-center flex items-center justify-center gap-2 ${selectedSpecialization ? 'bg-yellow-500/10 border border-yellow-500/20' : 'bg-emerald-500/10 border border-emerald-500/20'}`}>
                        <ShieldCheck className={`w-4 h-4 ${selectedSpecialization ? 'text-yellow-400' : 'text-emerald-400'}`} />
                        <span className={`text-xs font-black ${selectedSpecialization ? 'text-yellow-400' : 'text-emerald-400'} uppercase`}>Maximum</span>
                    </div>
                )}
            </div>
        </div>
    );
};

const SquadList: React.FC<{ players: Player[] }> = ({ players }) => {
    const getOverall = (p: Player) => {
        const relevantSkills = getSkillsForPosition(p.position);
        const totalSkill = relevantSkills.reduce((sum, s) => sum + (p.skills[s] || 0), 0);
        return relevantSkills.length > 0 ? Math.round(totalSkill / relevantSkills.length) : 0;
    };
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {players.sort((a,b) => getOverall(b) - getOverall(a)).map(p => (
                <div key={p.id} className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex justify-between items-center transition-all hover:bg-slate-800/50"><div className="flex items-center gap-4"><div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center font-black text-[10px] text-blue-400 border border-white/5">{p.position}</div><div><p className="font-black text-white uppercase italic text-sm">{p.name}</p><p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Level {p.level}</p></div></div><div className="text-right"><p className="text-2xl font-black text-blue-400 italic leading-none">{getOverall(p)}</p><p className="text-[8px] font-black text-slate-600 uppercase">GES</p></div></div>
            ))}
        </div>
    );
};

const TeamTraining: React.FC<{club: Club, player: Player, onStart: (trainingId: string) => void}> = ({ club, player, onStart }) => {
    const isManager = player.roles.includes(UserRole.MANAGER);
    const activeTraining = club.activeTeamTraining;
    const activeTrainingDef = activeTraining ? TEAM_TRAININGS.find(t => t.id === activeTraining.trainingId) : null;
    const remainingSeconds = useCountdown(activeTraining ? (activeTraining.startTime + (activeTrainingDef?.durationSeconds || 0) * 1000) : 0);
    return (
        <div className="space-y-6">
            {activeTraining && activeTrainingDef && <div className="bg-slate-900 border-2 border-indigo-500/50 rounded-[2.5rem] p-8 text-center shadow-2xl relative overflow-hidden"><Zap className="w-12 h-12 text-indigo-400 mx-auto mb-4 animate-bounce" /><h3 className="text-2xl font-black text-white italic uppercase mb-2">{activeTrainingDef.name}</h3><p className="text-5xl font-black text-white tabular-nums tracking-widest mb-4">{formatDuration(remainingSeconds)}</p><p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Team erhält Belohnungen nach Abschluss</p></div>}
            {!activeTraining && <div className="grid grid-cols-1 md:grid-cols-2 gap-6">{TEAM_TRAININGS.map(t => <div key={t.id} className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-6 flex flex-col justify-between hover:border-indigo-500/30 transition-all shadow-xl"><div><h3 className="text-xl font-black text-white italic uppercase mb-2">{t.name}</h3><p className="text-xs text-slate-400 mb-6">{t.description}</p><div className="flex gap-2 mb-6">{ (t.reward.xp ?? 0) > 0 && <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-black px-3 py-1 rounded-full border border-emerald-500/20">+{t.reward.xp} XP</span> } { (t.reward.tp ?? 0) > 0 && <span className="bg-blue-500/10 text-blue-400 text-[10px] font-black px-3 py-1 rounded-full border border-blue-500/20">+{t.reward.tp} TP</span> }</div></div><button onClick={() => onStart(t.id)} disabled={!isManager} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white font-black uppercase text-xs py-3 rounded-2xl transition-all active:scale-95">{isManager ? `Starten (${formatDuration(t.durationSeconds)})` : 'Nur Manager'}</button></div>)}</div>}
        </div>
    );
};

type ClubNavView = 'infrastructure' | 'squad' | 'training' | 'management' | 'logo';

interface ClubDashboardProps {
    club: Club | null;
    player: Player;
    onUpgrade: (clubId: string, type: InfrastructureType) => void;
    setView: (view: View) => void;
    forceUpdate: () => void;
}

export const ClubDashboard: React.FC<ClubDashboardProps> = ({ club, player, onUpgrade, setView, forceUpdate }) => {
    const [clubNav, setClubNav] = useState<ClubNavView>('infrastructure');
    const [squadPlayers, setSquadPlayers] = useState<Player[]>([]);
    const isManager = player.roles.includes(UserRole.MANAGER);

    useEffect(() => {
        if (club) {
            const playerIds = new Set(club.players || []);
            if (club.managerId) playerIds.add(club.managerId);
            if (playerIds.size > 0) {
                const unsubscribe = dataService.listenToPlayers(Array.from(playerIds), setSquadPlayers);
                return () => unsubscribe();
            }
        }
    }, [club]);

    return (
        <div className="space-y-6 md:space-y-8 animate-in fade-in duration-300">
            <header className="bg-slate-900 border-2 border-slate-800 p-6 rounded-[3rem] shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6"><div className="flex items-center gap-6"><ClubLogo logo={club?.logo} size={100} /><div className="text-center md:text-left"><h1 className="text-3xl md:text-5xl font-black text-white italic uppercase tracking-tighter leading-none mb-2">{club?.name}</h1><span className="bg-blue-500/10 text-blue-400 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest border border-blue-500/20">Profi-Club</span></div></div><div className="bg-slate-950 px-8 py-4 rounded-[2rem] border border-white/5 text-center shadow-inner"><p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-1 flex items-center justify-center gap-2"><Euro className="w-3 h-3" /> Vereinsbudget</p><p className="text-3xl font-black text-white italic tabular-nums leading-none">{(club?.budget || 0).toLocaleString('de-DE')} €</p></div></header>

            <div className="flex flex-wrap gap-2 p-1.5 bg-slate-950 rounded-3xl border border-slate-800">
                {(['infrastructure', 'squad', 'training', 'management', 'logo'] as ClubNavView[]).map((nav) => {
                    if ((nav === 'management' || nav === 'logo') && !isManager) return null;
                    const labels: Record<string, string> = { infrastructure: 'Infrastruktur', squad: 'Kader', training: 'Training', management: 'Verwaltung', logo: 'Logo' };
                    return <button key={nav} onClick={() => setClubNav(nav)} className={`flex-1 min-w-[120px] font-black uppercase text-[10px] tracking-widest py-3 rounded-2xl transition-all ${clubNav === nav ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>{labels[nav]}</button>;
                })}
            </div>

            <div className="animate-in slide-in-from-bottom-4 duration-500">
                {clubNav === 'infrastructure' && club && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {(Object.keys(infrastructureInfo) as InfrastructureType[]).map(type => (
                            <InfrastructureCard key={type} type={type} club={club} onUpgrade={onUpgrade} onSpecializationSelected={forceUpdate} />
                        ))}
                    </div>
                )}
                {clubNav === 'squad' && <SquadList players={squadPlayers} />}
                {clubNav === 'training' && club && <TeamTraining club={club} player={player} onStart={(tid) => dataService.startTeamTraining(club.id, tid)} />}
                {clubNav === 'management' && isManager && club && <ClubManagement club={club} />}
                {clubNav === 'logo' && isManager && club && <LogoEditor club={club} />}
            </div>
        </div>
    );
};