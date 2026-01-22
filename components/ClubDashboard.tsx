import React, { useState, useEffect } from 'react';
import { Club, Player, InfrastructureType, UserRole, ActiveTeamTraining } from '../types';
import { dataService } from '../services/dataService';
import { getSkillsForPosition } from '../utils';
import { INFRA_UPGRADE_COSTS, INFRA_UPGRADE_TIMES, INFRA_LEVEL_BENEFITS, TEAM_TRAININGS } from '../constants';

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
    stadium: { name: 'Stadion', icon: '🏟️', description: 'Erhöht die Einnahmen durch Ticketverkäufe und steigert das Prestige des Vereins.' },
    training_ground: { name: 'Trainingsgelände', icon: '🏋️', description: 'Verbessert die Effektivität aller Trainingseinheiten für die Spieler.' },
    medical_center: { name: 'Medizinisches Zentrum', icon: '⚕️', description: 'Verringert die Regenerationszeit nach Aktivitäten und reduziert Verletzungsrisiken.' },
    youth_academy: { name: 'Jugendakademie', icon: '👶', description: 'Generiert regelmäßig neue, talentierte Jugendspieler für den Verein.' },
    scouting_department: { name: 'Scouting-Abteilung', icon: ' scouting_department ', description: 'Verbessert die Qualität der Informationen über gegnerische Teams und potenzielle Transfers.' },
};

// --- CHILD COMPONENTS ---

const InfrastructureCard: React.FC<{ type: InfrastructureType; club: Club; onUpgrade: (clubId: string, type: InfrastructureType) => void; }> = ({ type, club, onUpgrade }) => {
    const info = infrastructureInfo[type];
    const currentLevel = club.infrastructure?.[type]?.level || 0;
    const upgradeCost = currentLevel < INFRA_UPGRADE_COSTS.length ? INFRA_UPGRADE_COSTS[currentLevel] : null;
    const benefits = INFRA_LEVEL_BENEFITS[type] || [];
    const nextBenefit = currentLevel < benefits.length ? benefits[currentLevel] : "Voll ausgebaut";
    const pendingUpgrade = club.pendingUpgrades?.find(upg => upg.type === type);

    return (
        <div className="bg-slate-800 rounded-3xl p-6 border border-slate-700 shadow-xl flex flex-col justify-between transition-all hover:border-slate-600">
            <div>
                <div className="flex items-center gap-4 mb-4">
                    <div className="text-5xl opacity-80">{info.icon}</div>
                    <div>
                        <h3 className="text-xl font-black text-white">{info.name}</h3>
                        <p className="text-sm font-bold text-amber-400">Level {currentLevel}</p>
                    </div>
                </div>
                <p className="text-xs text-slate-400 mb-4 h-12">{info.description}</p>
                <div className="bg-slate-900/70 p-3 rounded-lg border border-slate-700/50 mb-6">
                    <p className="text-xs text-slate-400 font-semibold">Nächstes Level:</p>
                    <p className="text-sm font-bold text-emerald-400">{nextBenefit}</p>
                </div>
            </div>
            <div className="mt-auto">
                {pendingUpgrade ? (
                    <div className="text-center bg-slate-700 p-4 rounded-xl">
                        <p className="text-sm font-bold text-amber-400">Upgrade auf Level {pendingUpgrade.targetLevel} läuft...</p>
                    </div>
                ) : upgradeCost !== null ? (
                    <button
                        disabled={(club.budget || 0) < upgradeCost}
                        onClick={() => onUpgrade(club.id, type)}
                        className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl disabled:bg-slate-600 disabled:cursor-not-allowed hover:bg-emerald-500 transition-colors shadow-lg active:scale-95">
                        Upgrade für {upgradeCost.toLocaleString()} €
                    </button>
                ) : <p className="text-center text-sm font-bold text-green-400">Maximales Level</p>}
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
        <div className="bg-slate-800 rounded-3xl p-6 border border-slate-700">
            <h3 className="text-2xl font-black mb-4">Mannschaftskader ({players.length})</h3>
            <div className="space-y-2">
                {players.sort((a,b) => getOverall(b) - getOverall(a)).map(p => (
                    <div key={p.id} className="flex justify-between items-center bg-slate-900/50 p-3 rounded-lg border border-slate-700/50">
                        <div className="flex items-center gap-4">
                            <div className="font-bold text-slate-400 text-sm w-8 h-8 flex items-center justify-center bg-slate-700 rounded-full">{p.position}</div>
                            <p className="font-bold text-white">{p.name}</p>
                            <p className="text-xs text-slate-400">Lvl {p.level}</p>
                        </div>
                        <div className="text-right">
                            <p className="font-black text-xl text-amber-400">{getOverall(p)}</p>
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-tight">GES</p>
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
        <div className="bg-slate-800 rounded-3xl p-8 border-4 border-dashed border-blue-500/30 text-center">
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Aktives Team-Training</p>
            <h3 className="text-3xl font-black text-white my-2">{trainingDef.name}</h3>
            <p className="text-6xl font-black text-blue-400 tracking-widest my-4">{formatDuration(remainingSeconds)}</p>
            <p className="text-slate-400">Alle Spieler im Kader erhalten nach Abschluss Belohnungen.</p>
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {TEAM_TRAININGS.map(t => (
                <div key={t.id} className="bg-slate-800 rounded-3xl p-6 border border-slate-700 shadow-xl flex flex-col">
                    <h3 className="text-xl font-black text-white">{t.name}</h3>
                    <p className="text-xs text-slate-400 mt-1 mb-4 h-10">{t.description}</p>
                    <div className="bg-slate-900/70 p-3 rounded-lg border border-slate-700/50 mb-6 space-y-1">
                         <p className="text-sm font-bold text-emerald-400">+{t.reward.xp} XP für jeden Spieler</p>
                         <p className="text-sm font-bold text-blue-400">+{t.reward.tp} TP für jeden Spieler</p>
                    </div>
                    <div className="mt-auto">
                         <button 
                            onClick={() => onStart(t.id)}
                            disabled={!isManager || trainingInProgress}
                            className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl disabled:bg-slate-600 disabled:text-slate-400 disabled:cursor-not-allowed hover:bg-blue-500 transition-colors shadow-lg active:scale-95">
                            {isManager ? `Training starten (${formatDuration(t.durationSeconds)})` : 'Nur für Manager'}
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
};

// --- MAIN DASHBOARD COMPONENT ---

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
        if (!club) return;
        dataService.startTeamTraining(club.id, trainingId);
    };

    // No Club View
    if (!club) {
        return (
            <div>
                <h2 className="text-3xl font-black mb-4">Wähle deinen Verein</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {availableClubs.map(c => (
                        <div key={c.id} className="bg-slate-800 p-6 rounded-2xl border border-slate-700 flex flex-col justify-between shadow-lg hover:border-slate-600 transition-all">
                            <div>
                                <h3 className="text-xl font-bold">{c.name}</h3>
                                <p className="text-sm text-slate-400">{c.players?.length || 0} / 25 Spieler</p>
                            </div>
                            <button onClick={() => onJoin(c.id)} className="mt-4 bg-blue-600 text-white font-bold py-2 rounded-lg hover:bg-blue-500 transition-colors">
                                Verein beitreten
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // Main Club View
    return (
        <div className="space-y-8 animate-in fade-in duration-300">
            <header className="bg-slate-800 p-8 rounded-3xl shadow-lg border-slate-700 border">
                <h1 className="text-4xl font-black text-white">{club.name}</h1>
                <div className="mt-4 text-3xl font-bold text-emerald-400">
                    Budget: {(club.budget || 0).toLocaleString()} €
                </div>
            </header>

            <div className="flex gap-2 p-2 bg-slate-800 border border-slate-700 rounded-full">
                <button onClick={() => setView('infrastructure')} className={`flex-1 text-center font-bold p-3 rounded-full transition-colors ${view === 'infrastructure' ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}>Infrastruktur</button>
                <button onClick={() => setView('squad')} className={`flex-1 text-center font-bold p-3 rounded-full transition-colors ${view === 'squad' ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}>Kader</button>
                <button onClick={() => setView('training')} className={`flex-1 text-center font-bold p-3 rounded-full transition-colors ${view === 'training' ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}>Team-Training</button>
            </div>

            <div className="animate-in fade-in duration-500">
                {view === 'infrastructure' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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