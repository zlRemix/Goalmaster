import React, { useState, useEffect } from 'react';
import { Club, Player, InfrastructureType, UserRole, ActiveTeamTraining } from '../types';
import { dataService } from '../services/dataService';
import { getSkillsForPosition } from '../utils';
import { INFRA_UPGRADE_COSTS, INFRA_LEVEL_BENEFITS, TEAM_TRAININGS } from '../constants';

// --- HOOKS & HELPERS ---
const useCountdown = (endTime: number) => {
  const calculateRemaining = () => Math.max(0, Math.floor((endTime - Date.now()) / 1000));
  const [totalSeconds, setTotalSeconds] = useState(calculateRemaining);

  useEffect(() => {
    setTotalSeconds(calculateRemaining());
    const timer = setInterval(() => setTotalSeconds(prev => Math.max(0, prev - 1)), 1000);
    return () => clearInterval(timer);
  }, [endTime]);

  return totalSeconds;
};

const formatDuration = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = Math.floor(totalSeconds % 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

const infrastructureInfo: Record<InfrastructureType, { name: string; icon: string; description: string; }> = {
    stadium: { name: 'Stadion', icon: '🏟️', description: 'Erhöht die Einnahmen durch Ticketverkäufe und steigert das Prestige.' },
    training_ground: { name: 'Trainingsgelände', icon: '🏋️', description: 'Verbessert die Effektivität aller Trainingseinheiten.' },
    medical_center: { name: 'Medizinisches Zentrum', icon: '⚕️', description: 'Verringert Regenerationszeit und Verletzungsrisiken.' },
    youth_academy: { name: 'Jugendakademie', icon: '👶', description: 'Generiert regelmäßig neue, talentierte Jugendspieler.' },
    scouting_department: { name: 'Scouting-Abteilung', icon: ' scouting_department ', description: 'Verbessert die Qualität von Gegner- und Transfer-Informationen.' },
};

// --- CHILD COMPONENTS (NOW RESPONSIVE) ---

const InfrastructureCard: React.FC<{ type: InfrastructureType; club: Club; onUpgrade: (clubId: string, type: InfrastructureType) => void; }> = ({ type, club, onUpgrade }) => {
    const info = infrastructureInfo[type];
    const currentLevel = club.infrastructure?.[type]?.level || 0;
    const upgradeCost = currentLevel < INFRA_UPGRADE_COSTS.length ? INFRA_UPGRADE_COSTS[currentLevel] : null;
    const benefits = INFRA_LEVEL_BENEFITS[type] || [];
    const nextBenefit = currentLevel < benefits.length ? benefits[currentLevel] : "Voll ausgebaut";
    const pendingUpgrade = club.pendingUpgrades?.find(upg => upg.type === type);

    return (
        <div className="bg-slate-800/80 rounded-2xl p-4 md:p-6 border border-slate-700 shadow-lg flex flex-col justify-between transition-all hover:border-slate-600">
            <div>
                <div className="flex items-center gap-4 mb-4">
                    <div className="text-4xl md:text-5xl opacity-80">{info.icon}</div>
                    <div>
                        <h3 className="text-lg md:text-xl font-black text-white">{info.name}</h3>
                        <p className="text-sm font-bold text-amber-400">Level {currentLevel}</p>
                    </div>
                </div>
                <p className="text-xs md:text-sm text-slate-400 mb-4 h-12">{info.description}</p>
                <div className="bg-slate-900/70 p-3 rounded-lg border border-slate-700/50 mb-6">
                    <p className="text-xs text-slate-400 font-semibold">Nächstes Level:</p>
                    <p className="text-sm font-bold text-emerald-400">{nextBenefit}</p>
                </div>
            </div>
            <div className="mt-auto">
                {pendingUpgrade ? (
                     <div className="text-center bg-slate-700 p-3 rounded-lg"><p className="text-sm font-bold text-amber-400">Upgrade läuft...</p></div>
                ) : upgradeCost !== null ? (
                    <button
                        disabled={(club.budget || 0) < upgradeCost}
                        onClick={() => onUpgrade(club.id, type)}
                        className="w-full bg-emerald-600 text-white font-bold py-3 rounded-lg text-sm md:text-base disabled:bg-slate-600 disabled:cursor-not-allowed hover:bg-emerald-500 transition-colors shadow-md active:scale-95">
                        Upgrade für {upgradeCost.toLocaleString()} €
                    </button>
                ) : <p className="text-center text-sm font-bold text-green-400">Max Level</p>}
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
        <div className="bg-slate-800/80 rounded-2xl p-4 md:p-6 border border-slate-700">
            <h3 className="text-xl md:text-2xl font-black mb-4">Kader ({players.length})</h3>
            <div className="space-y-2">
                {players.sort((a,b) => getOverall(b) - getOverall(a)).map(p => (
                    <div key={p.id} className="flex justify-between items-center bg-slate-900/50 p-2 md:p-3 rounded-lg border border-slate-700/50">
                        <div className="flex items-center gap-2 md:gap-4">
                            <div className="font-bold text-slate-300 text-xs md:text-sm w-7 h-7 md:w-8 md:h-8 flex items-center justify-center bg-slate-700 rounded-full flex-shrink-0">{p.position}</div>
                            <div>
                                <p className="font-bold text-white text-sm md:text-base">{p.name}</p>
                                <p className="text-xs text-slate-400">Lvl {p.level}</p>
                            </div>
                        </div>
                        <div className="text-right pl-2">
                            <p className="font-black text-lg md:text-xl text-amber-400">{getOverall(p)}</p>
                            <p className="text-[10px] md:text-xs text-slate-500 font-bold uppercase tracking-tight">GES</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const ActiveTeamTrainingDisplay: React.FC<{ training: ActiveTeamTraining }> = ({ training }) => {
    const trainingDef = TEAM_TRAININGS.find(t => t.id === training.trainingId);
    const endTime = training.startTime + (trainingDef?.durationSeconds || 0) * 1000;
    const remainingSeconds = useCountdown(endTime);

    if (!trainingDef) return null;

    return (
        <div className="bg-slate-800/80 rounded-2xl p-6 md:p-8 border-2 border-dashed border-blue-500/30 text-center">
            <p className="text-xs md:text-sm font-bold text-slate-400 uppercase tracking-widest">Aktives Team-Training</p>
            <h3 className="text-xl md:text-3xl font-black text-white my-2">{trainingDef.name}</h3>
            <p className="text-4xl md:text-6xl font-black text-blue-400 tracking-widest my-4">{formatDuration(remainingSeconds)}</p>
            <p className="text-xs md:text-sm text-slate-400">Alle Spieler erhalten nach Abschluss Belohnungen.</p>
        </div>
    );
};

const TeamTraining: React.FC<{club: Club, player: Player, onStart: (trainingId: string) => void}> = ({ club, player, onStart }) => {
    const isManager = player.roles.includes(UserRole.MANAGER);
    const trainingInProgress = !!club.activeTeamTraining;

    if (trainingInProgress) {
        return <ActiveTeamTrainingDisplay training={club.activeTeamTraining!} />;
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            {TEAM_TRAININGS.map(t => (
                <div key={t.id} className="bg-slate-800/80 rounded-2xl p-4 md:p-6 border border-slate-700 shadow-lg flex flex-col">
                    <h3 className="text-lg md:text-xl font-black text-white">{t.name}</h3>
                    <p className="text-xs md:text-sm text-slate-400 mt-1 mb-4 h-10">{t.description}</p>
                    <div className="bg-slate-900/70 p-3 rounded-lg border border-slate-700/50 mb-6 space-y-1 text-sm">
                         <p className="font-bold text-emerald-400">+{t.reward.xp} XP für jeden Spieler</p>
                         <p className="font-bold text-blue-400">+{t.reward.tp} TP für jeden Spieler</p>
                    </div>
                    <div className="mt-auto">
                         <button 
                            onClick={() => onStart(t.id)}
                            disabled={!isManager || trainingInProgress}
                            className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg disabled:bg-slate-600 disabled:text-slate-400 disabled:cursor-not-allowed hover:bg-blue-500 transition-colors shadow-md active:scale-95 text-sm md:text-base">
                            {isManager ? `Starten (${formatDuration(t.durationSeconds)})` : 'Nur für Manager'}
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
};

// --- MAIN DASHBOARD COMPONENT (NOW RESPONSIVE) ---

type View = 'infrastructure' | 'squad' | 'training';

export const ClubDashboard: React.FC<{ club: Club | null; player: Player; onJoin: (clubId: string) => void; onUpgrade: (clubId: string, type: InfrastructureType) => void; availableClubs: Club[]; }> = ({ club, player, onJoin, onUpgrade, availableClubs }) => {
    const [view, setView] = useState<View>('infrastructure');
    const [squadPlayers, setSquadPlayers] = useState<Player[]>([]);

    useEffect(() => {
        if (club?.players) {
            const unsubscribe = dataService.listenToPlayers(club.players, setSquadPlayers);
            return () => unsubscribe();
        } else {
            setSquadPlayers([]);
        }
    }, [club]);

    const handleStartTeamTraining = (trainingId: string) => {
        if (club) dataService.startTeamTraining(club.id, trainingId);
    };

    // No Club View
    if (!club) {
        return (
            <div>
                <h2 className="text-2xl md:text-3xl font-black mb-4">Wähle deinen Verein</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
                    {availableClubs.map(c => (
                        <div key={c.id} className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700 flex flex-col justify-between shadow-lg hover:border-slate-600 transition-all">
                            <div>
                                <h3 className="text-xl font-bold">{c.name}</h3>
                                <p className="text-sm text-slate-400">{c.players?.length || 0} / 25 Spieler</p>
                            </div>
                            <button onClick={() => onJoin(c.id)} className="mt-4 bg-blue-600 text-white font-bold py-2 rounded-lg hover:bg-blue-500 transition-colors">
                                Beitreten
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // Main Club View
    return (
        <div className="space-y-6 md:space-y-8 animate-in fade-in duration-300">
            <header className="bg-slate-800/80 p-4 md:p-6 rounded-2xl shadow-lg border-slate-700 border">
                <h1 className="text-2xl md:text-4xl font-black text-white">{club.name}</h1>
                <div className="mt-2 md:mt-4 text-xl md:text-3xl font-bold text-emerald-400">
                    Budget: {(club.budget || 0).toLocaleString()} €
                </div>
            </header>

            <div className="flex gap-1 md:gap-2 p-1 md:p-2 bg-slate-800 border border-slate-700 rounded-full text-sm">
                <button onClick={() => setView('infrastructure')} className={`flex-1 text-center font-bold p-2 md:p-3 rounded-full transition-colors ${view === 'infrastructure' ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}>Infrastruktur</button>
                <button onClick={() => setView('squad')} className={`flex-1 text-center font-bold p-2 md:p-3 rounded-full transition-colors ${view === 'squad' ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}>Kader</button>
                <button onClick={() => setView('training')} className={`flex-1 text-center font-bold p-2 md:p-3 rounded-full transition-colors ${view === 'training' ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}>Training</button>
            </div>

            <div className="animate-in fade-in duration-500">
                {view === 'infrastructure' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
                        {(Object.keys(infrastructureInfo) as InfrastructureType[]).map(type => (
                            <InfrastructureCard key={type} type={type} club={club} onUpgrade={onUpgrade} />
                        ))}
                    </div>
                )}
                {view === 'squad' && <SquadList players={squadPlayers} />}
                {view === 'training' && <TeamTraining club={club} player={player} onStart={handleStartTeamTraining} />}
            </div>
        </div>
    );
};