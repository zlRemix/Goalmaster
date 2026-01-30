import React, { useState, useEffect, ElementType, useId } from 'react';
import { Club, Player, InfrastructureType, UserRole, ActiveTeamTraining, View } from '../types';
import { dataService } from '../services/dataService';
import { getSkillsForPosition } from '../utils';
import { INFRA_UPGRADE_COSTS, INFRA_UPGRADE_TIMES, INFRA_LEVEL_BENEFITS, TEAM_TRAININGS, MAX_CLUB_PLAYERS } from '../constants';
import { ClubManagement } from './ClubManagement';
import LogoEditor from './LogoEditor';
import ClubLogo from './ClubLogo';
import InfrastructureIcon from './InfrastructureIcon';
import { Timer, TrendingUp, Users, Zap, ShieldCheck, Euro, Building2 } from 'lucide-react';

// --- HOOKS & HELPERS (Bleiben funktional gleich) ---
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

// --- SUB-COMPONENTS ---

const InfrastructureCard: React.FC<{ type: InfrastructureType; club: Club; onUpgrade: (clubId: string, type: InfrastructureType) => void; }> = ({ type, club, onUpgrade }) => {
    const uniqueId = useId().replace(/:/g, "");
    const info = infrastructureInfo[type];
    const currentLevel = club.infrastructure?.[type]?.level || 0;
    const upgradeCost = currentLevel < 10 ? INFRA_UPGRADE_COSTS[currentLevel] : null;
    const upgradeTime = currentLevel < 10 ? INFRA_UPGRADE_TIMES[currentLevel] : null;
    const pendingUpgrade = club.pendingUpgrades?.find(upg => upg.type === type);
    const remainingTime = useCountdown(pendingUpgrade?.endTime || 0);
    const benefits = INFRA_LEVEL_BENEFITS[type] || [];
    const currentBenefit = currentLevel > 0 ? benefits[currentLevel - 1] : "Kein Bonus";
    const nextBenefit = currentLevel < benefits.length ? benefits[currentLevel] : "Maximalstufe";

    return (
        <div className="bg-slate-900 border-2 border-slate-800 rounded-[2.5rem] p-5 flex flex-col gap-4 transition-all hover:border-slate-700 shadow-2xl relative overflow-hidden group">
            <div className="flex items-center justify-between">
                <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center border border-blue-500/20 text-blue-400">
                    <InfrastructureIcon seed={type} />
                </div>
                <div className="text-right">
                    <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Level {currentLevel} / 10</span>
                    <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">{info.name}</h3>
                </div>
            </div>

            <div className="space-y-3 flex-1">
                <div className="bg-slate-950/50 p-3 rounded-2xl border border-white/5">
                    <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Status</p>
                    <p className="text-sm font-bold text-emerald-400">{currentBenefit}</p>
                </div>
                {!pendingUpgrade && currentLevel < 10 && (
                    <div className="bg-slate-950/30 p-3 rounded-2xl border border-dashed border-white/5 opacity-60">
                        <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Nächstes Level</p>
                        <p className="text-sm font-bold text-blue-300">{nextBenefit}</p>
                    </div>
                )}
            </div>

            <div className="pt-2">
                {pendingUpgrade ? (
                    <div className="bg-blue-600/10 border border-blue-600/20 p-4 rounded-2xl text-center">
                        <p className="text-[10px] font-black text-blue-400 uppercase animate-pulse mb-1">Ausbau läuft</p>
                        <p className="text-xl font-black text-white tabular-nums">{formatDuration(remainingTime)}</p>
                    </div>
                ) : upgradeCost !== null ? (
                    <button
                        disabled={(club.budget || 0) < upgradeCost}
                        onClick={() => onUpgrade(club.id, type)}
                        className="w-full bg-white text-slate-950 hover:bg-blue-400 hover:text-white disabled:bg-slate-800 disabled:text-slate-600 font-black uppercase tracking-widest py-3 rounded-2xl transition-all active:scale-95 text-xs flex items-center justify-center gap-2"
                    >
                        <TrendingUp className="w-4 h-4" />
                        Upgrade ({upgradeCost.toLocaleString()} €)
                    </button>
                ) : (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-2xl text-center flex items-center justify-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs font-black text-emerald-400 uppercase">Maximum</span>
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
                <div key={p.id} className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex justify-between items-center transition-all hover:bg-slate-800/50">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center font-black text-[10px] text-blue-400 border border-white/5">
                            {p.position}
                        </div>
                        <div>
                            <p className="font-black text-white uppercase italic text-sm">{p.name}</p>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Level {p.level}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-2xl font-black text-blue-400 italic leading-none">{getOverall(p)}</p>
                        <p className="text-[8px] font-black text-slate-600 uppercase">GES</p>
                    </div>
                </div>
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
            {activeTraining && activeTrainingDef && (
                <div className="bg-slate-900 border-2 border-indigo-500/50 rounded-[2.5rem] p-8 text-center shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-slate-800">
                        <div className="h-full bg-indigo-500 animate-pulse shadow-[0_0_15px_rgba(99,102,241,0.5)]" style={{ width: '100%' }} />
                    </div>
                    <Zap className="w-12 h-12 text-indigo-400 mx-auto mb-4 animate-bounce" />
                    <h3 className="text-2xl font-black text-white italic uppercase mb-2">{activeTrainingDef.name}</h3>
                    <p className="text-5xl font-black text-white tabular-nums tracking-widest mb-4">{formatDuration(remainingSeconds)}</p>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Team erhält Belohnungen nach Abschluss</p>
                </div>
            )}

            {!activeTraining && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {TEAM_TRAININGS.map(t => (
                        <div key={t.id} className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-6 flex flex-col justify-between hover:border-indigo-500/30 transition-all shadow-xl">
                            <div>
                                <h3 className="text-xl font-black text-white italic uppercase mb-2">{t.name}</h3>
                                <p className="text-xs text-slate-400 mb-6">{t.description}</p>
                                <div className="flex gap-2 mb-6">
                                    { (t.reward.xp ?? 0) > 0 && <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-black px-3 py-1 rounded-full border border-emerald-500/20">+{t.reward.xp} XP</span> }
                                    { (t.reward.tp ?? 0) > 0 && <span className="bg-blue-500/10 text-blue-400 text-[10px] font-black px-3 py-1 rounded-full border border-blue-500/20">+{t.reward.tp} TP</span> }
                                </div>
                            </div>
                            <button 
                                onClick={() => onStart(t.id)}
                                disabled={!isManager}
                                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white font-black uppercase text-xs py-3 rounded-2xl transition-all active:scale-95"
                            >
                                {isManager ? `Starten (${formatDuration(t.durationSeconds)})` : 'Nur Manager'}
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// --- MAIN DASHBOARD ---

export const ClubDashboard: React.FC<ClubDashboardProps> = ({ club, player, onUpgrade, setView }) => {
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

    // Automatischer Check für Upgrades und Training
    useEffect(() => {
        const checkState = () => {
            if (!club) return;
            if (club.pendingUpgrades?.length) {
                const completed = club.pendingUpgrades.filter(upg => Date.now() >= (upg.endTime || 0));
                if (completed.length > 0) dataService.completeInfrastructureUpgrades(club.id, completed);
            }
            if (club.activeTeamTraining) {
                const trainingDef = TEAM_TRAININGS.find(t => t.id === club.activeTeamTraining!.trainingId);
                const endTime = (club.activeTeamTraining!.startTime || 0) + (trainingDef?.durationSeconds || 0) * 1000;
                if (Date.now() >= endTime) dataService.completeTeamTraining(club.id, player.id);
            }
        };
        const interval = setInterval(checkState, 2000);
        return () => clearInterval(interval);
    }, [club, player.id]);

    if (!club) {
        return (
            <div className="text-center py-20 bg-slate-900 border-2 border-dashed border-slate-800 rounded-[3rem] px-6">
                <Building2 className="w-16 h-16 text-slate-700 mx-auto mb-6" />
                <h2 className="text-2xl font-black text-white uppercase italic mb-2">Du bist vereinslos</h2>
                <p className="text-slate-500 mb-8 max-w-xs mx-auto">Schließe dich einem Verein an, um an Team-Trainings teilzunehmen und die Infrastruktur zu nutzen.</p>
                <button 
                    onClick={() => setView('club-search')} 
                    className="bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest py-4 px-10 rounded-2xl transition-all shadow-xl active:scale-95"
                >
                    Verein suchen
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500">
            {/* Club Header */}
            <header className="bg-slate-900 border-2 border-slate-800 p-6 rounded-[3rem] shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                    <div className="relative">
                        <ClubLogo logo={club.logo} size={100} />
                        <div className="absolute -bottom-2 -right-2 bg-slate-900 border border-slate-700 p-2 rounded-full">
                            <ShieldCheck className="w-5 h-5 text-blue-400" />
                        </div>
                    </div>
                    <div className="text-center md:text-left">
                        <h1 className="text-3xl md:text-5xl font-black text-white italic uppercase tracking-tighter leading-none mb-2">{club.name}</h1>
                        <span className="bg-blue-500/10 text-blue-400 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest border border-blue-500/20">
                            Profi-Club
                        </span>
                    </div>
                </div>
                
                <div className="bg-slate-950 px-8 py-4 rounded-[2rem] border border-white/5 text-center shadow-inner">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-1 flex items-center justify-center gap-2">
                        <Euro className="w-3 h-3" /> Vereinsbudget
                    </p>
                    <p className="text-3xl font-black text-white italic tabular-nums leading-none">
                        {(club.budget || 0).toLocaleString('de-DE')} €
                    </p>
                </div>
            </header>

            {/* Navigation */}
            <div className="flex flex-wrap gap-2 p-1.5 bg-slate-950 rounded-3xl border border-slate-800">
                {(['infrastructure', 'squad', 'training', 'management', 'logo'] as ClubNavView[]).map((nav) => {
                    if ((nav === 'management' || nav === 'logo') && !isManager) return null;
                    const labels: Record<string, string> = { 
                        infrastructure: 'Infrastruktur', squad: 'Kader', training: 'Training', 
                        management: 'Verwaltung', logo: 'Logo' 
                    };
                    const icons: Record<string, any> = {
                        infrastructure: Building2, squad: Users, training: Zap, management: TrendingUp, logo: ShieldCheck
                    };
                    const Icon = icons[nav];

                    return (
                        <button 
                            key={nav}
                            onClick={() => setClubNav(nav)} 
                            className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 font-black uppercase text-[10px] tracking-widest py-3 rounded-2xl transition-all ${
                                clubNav === nav ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'
                            }`}
                        >
                            <Icon className="w-3.5 h-3.5" />
                            {labels[nav]}
                        </button>
                    );
                })}
            </div>

            {/* Content Area */}
            <div className="animate-in slide-in-from-bottom-4 duration-500">
                {clubNav === 'infrastructure' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {(Object.keys(infrastructureInfo) as InfrastructureType[]).map(type => (
                            <InfrastructureCard key={type} type={type} club={club} onUpgrade={onUpgrade} />
                        ))}
                    </div>
                )}
                {clubNav === 'squad' && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center px-2">
                            <h3 className="text-sm font-black text-white uppercase italic flex items-center gap-2">
                                <Users className="w-4 h-4 text-blue-400" /> Aktueller Kader
                            </h3>
                            <span className="text-[10px] font-black text-slate-500 uppercase">{squadPlayers.length} / {MAX_CLUB_PLAYERS} Spieler</span>
                        </div>
                        <SquadList players={squadPlayers} />
                    </div>
                )}
                {clubNav === 'training' && <TeamTraining club={club} player={player} onStart={(tid) => dataService.startTeamTraining(club.id, tid)} />}
                {clubNav === 'management' && isManager && <ClubManagement club={club} />}
                {clubNav === 'logo' && isManager && <LogoEditor club={club} />}
            </div>
        </div>
    );
};