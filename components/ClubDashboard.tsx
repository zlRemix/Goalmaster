import React, { useState, useEffect } from 'react';
import { Club, Player, InfrastructureType, UserRole, ActiveTeamTraining, View } from '../types';
import { dataService } from '../services/dataService';
import { getSkillsForPosition } from '../utils';
import { INFRA_UPGRADE_COSTS, INFRA_UPGRADE_TIMES, INFRA_LEVEL_BENEFITS, TEAM_TRAININGS, MAX_CLUB_PLAYERS } from '../constants';
import { ClubManagement } from './ClubManagement'; // Import ClubManagement

// --- HOOKS ---
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

// --- HELPERS ---
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

// --- DATA ---
const infrastructureInfo: Record<InfrastructureType, { name: string; icon: string; description: string; }> = {
    [InfrastructureType.STADIUM]: { name: 'Stadion', icon: '🏟️', description: 'Erhöht die Ticketeinnahmen bei Heimspielen.' },
    [InfrastructureType.TRAINING_GROUND]: { name: 'Trainingsgelände', icon: '🏋️', description: 'Verbessert die Effektivität des Trainings (TP-Gewinn).' },
    [InfrastructureType.YOUTH_ACADEMY]: { name: 'Jugendakademie', icon: '🧒', description: 'Scoutet regelmäßig neue, vielversprechende Talente.' },
    [InfrastructureType.SCOUTING_NETWORK]: { name: 'Scouting-Netzwerk', icon: '📡', description: 'Verbessert die Genauigkeit von Spieler-Scouting-Berichten.' },
};

// --- SUB-COMPONENTS ---

const InfrastructureCard: React.FC<{ type: InfrastructureType; club: Club; onUpgrade: (clubId: string, type: InfrastructureType) => void; }> = ({ type, club, onUpgrade }) => {
    const info = infrastructureInfo[type];
    const currentLevel = club.infrastructure?.[type]?.level || 0;
    const upgradeCost = currentLevel < 10 ? INFRA_UPGRADE_COSTS[currentLevel] : null;
    const upgradeTime = currentLevel < 10 ? INFRA_UPGRADE_TIMES[currentLevel] : null;
    const pendingUpgrade = club.pendingUpgrades?.find(upg => upg.type === type);
    const remainingTime = useCountdown(pendingUpgrade?.endTime || 0);
    const benefits = INFRA_LEVEL_BENEFITS[type] || [];
    const currentBenefit = currentLevel > 0 ? benefits[currentLevel - 1] : "Keine Boni";
    const nextBenefit = currentLevel < benefits.length ? benefits[currentLevel] : "Voll ausgebaut";

    return (
        <div className="bg-slate-800/80 rounded-2xl p-4 md:p-5 border border-slate-700 shadow-lg flex flex-col justify-between transition-all hover:border-slate-600/80">
            <div>
                 <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="text-4xl opacity-80 pt-1">{info.icon}</div>
                    <div className="flex-1 text-right">
                        <h3 className="text-lg font-black text-white">{info.name}</h3>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{info.description}</p>
                    </div>
                </div>
                <div className="mb-5">
                    <div className="flex justify-between items-end mb-1">
                        <span className="text-xs font-bold text-amber-400 uppercase">Level {currentLevel} / 10</span>
                        {pendingUpgrade && <span className="text-xs font-bold text-cyan-400 animate-pulse">Upgrade läuft...</span>}
                    </div>
                    <div className="h-2.5 w-full bg-slate-900 rounded-full border border-slate-800 p-0.5">
                        <div className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full" style={{ width: `${currentLevel * 10}%` }}></div>
                    </div>
                </div>
                <div className="space-y-3 text-xs">
                   <div className="p-3 bg-slate-900/70 rounded-lg border border-slate-700/50">
                        <p className="font-semibold text-slate-400 mb-1">Aktueller Bonus:</p>
                        <p className="font-bold text-emerald-300">{currentBenefit}</p>
                    </div>
                     <div className="p-3 bg-slate-900/70 rounded-lg border border-slate-700/50">
                        <p className="font-semibold text-slate-400 mb-1">Bonus auf Level {currentLevel + 1}:</p>
                        <p className="font-bold text-cyan-300">{nextBenefit}</p>
                    </div>
                </div>
            </div>
            <div className="mt-5 pt-4 border-t border-slate-700/80">
                {pendingUpgrade ? (
                     <div className="text-center bg-slate-700/80 p-3 rounded-lg border border-slate-600">
                        <p className="text-sm font-bold text-slate-300">Verbleibende Zeit:</p>
                        <p className="text-xl font-black text-amber-400 tracking-wider">{formatDuration(remainingTime)}</p>
                     </div>
                ) : upgradeCost !== null && upgradeTime !== null ? (
                    <div className="flex flex-col gap-2">
                         <div className="grid grid-cols-2 gap-2 text-center">
                             <div className="bg-slate-900/70 p-2 rounded-md border border-slate-700/50">
                                <p className="text-[10px] font-bold text-slate-400 uppercase">Kosten</p>
                                <p className="text-sm font-semibold text-white">{upgradeCost.toLocaleString()} €</p>
                             </div>
                             <div className="bg-slate-900/70 p-2 rounded-md border border-slate-700/50">
                                <p className="text-[10px] font-bold text-slate-400 uppercase">Dauer</p>
                                <p className="text-sm font-semibold text-white">{formatDuration(upgradeTime)}</p>
                             </div>
                         </div>
                        <button
                            disabled={(club.budget || 0) < upgradeCost}
                            onClick={() => onUpgrade(club.id, type)}
                            className="w-full bg-emerald-600 text-white font-bold py-3 rounded-lg text-sm md:text-base disabled:bg-slate-600 disabled:text-slate-500 disabled:cursor-not-allowed hover:bg-emerald-500 transition-colors shadow-md active:scale-95">
                            Upgrade starten
                        </button>
                    </div>
                ) : (
                     <div className="text-center bg-emerald-900/50 p-3 rounded-lg border border-emerald-700">
                         <p className="text-sm font-bold text-emerald-300">Maximales Level erreicht</p>
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
        <div className="bg-slate-800/80 rounded-2xl p-4 md:p-6 border border-slate-700">
            <h3 className="text-xl md:text-2xl font-black mb-4">Kader ({players.length} / {MAX_CLUB_PLAYERS})</h3>
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

// --- MAIN DASHBOARD COMPONENT ---

type ClubNavView = 'infrastructure' | 'squad' | 'training' | 'management';

interface ClubDashboardProps {
    club: Club | null;
    player: Player;
    onUpgrade: (clubId: string, type: InfrastructureType) => void;
    setView: (view: View) => void;
}

export const ClubDashboard: React.FC<ClubDashboardProps> = ({ club, player, onUpgrade, setView }) => {
    const [clubNav, setClubNav] = useState<ClubNavView>('infrastructure');
    const [squadPlayers, setSquadPlayers] = useState<Player[]>([]);
    const isManager = player.roles.includes(UserRole.MANAGER);

    useEffect(() => {
        if (club?.players) {
            const unsubscribe = dataService.listenToPlayers(club.players, setSquadPlayers);
            return () => unsubscribe();
        } else {
            setSquadPlayers([]);
        }
    }, [club]);
    
    useEffect(() => {
      if (!isManager && clubNav === 'management') setClubNav('infrastructure');
    }, [isManager, clubNav]);

    const handleStartTeamTraining = (trainingId: string) => {
        if (club) dataService.startTeamTraining(club.id, trainingId);
    };

    // No Club View
    if (!club) {
        return (
            <div className="text-center p-10 bg-slate-800/80 rounded-2xl border border-slate-700">
                <h2 className="text-2xl font-bold mb-2">Du bist vereinslos</h2>
                <p className="text-slate-400 mb-6">Suche nach einem Verein, um deine Karriere voranzutreiben.</p>
                <button 
                    onClick={() => setView('club-search')} 
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-8 rounded-lg transition-colors shadow-lg">
                    Verein suchen
                </button>
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
                <button onClick={() => setClubNav('infrastructure')} className={`flex-1 text-center font-bold p-2 md:p-3 rounded-full transition-colors ${clubNav === 'infrastructure' ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}>Infrastruktur</button>
                <button onClick={() => setClubNav('squad')} className={`flex-1 text-center font-bold p-2 md:p-3 rounded-full transition-colors ${clubNav === 'squad' ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}>Kader</button>
                <button onClick={() => setClubNav('training')} className={`flex-1 text-center font-bold p-2 md:p-3 rounded-full transition-colors ${clubNav === 'training' ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}>Training</button>
                {isManager && (
                    <button onClick={() => setClubNav('management')} className={`flex-1 text-center font-bold p-2 md:p-3 rounded-full transition-colors ${clubNav === 'management' ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}>Management</button>
                )}
            </div>

            <div className="animate-in fade-in duration-500">
                {clubNav === 'infrastructure' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
                        {(Object.keys(infrastructureInfo) as InfrastructureType[]).map(type => (
                            <InfrastructureCard key={type} type={type} club={club} onUpgrade={onUpgrade} />
                        ))}
                    </div>
                )}
                {clubNav === 'squad' && <SquadList players={squadPlayers} />}
                {clubNav === 'training' && <TeamTraining club={club} player={player} onStart={handleStartTeamTraining} />}
                {clubNav === 'management' && isManager && <ClubManagement club={club} />}
            </div>
        </div>
    );
};