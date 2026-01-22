import React from 'react';
import { Club, Player, InfrastructureType } from '../types';
import { INFRA_UPGRADE_COSTS, INFRA_UPGRADE_TIMES, INFRA_LEVEL_BENEFITS } from '../constants';

const formatDuration = (seconds: number) => {
    if (seconds < 0) seconds = 0;
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

const infrastructureInfo: Record<InfrastructureType, { name: string; icon: string; description: string; }> = {
    stadium: { name: 'Stadion', icon: '🏟️', description: 'Das Herz des Vereins. Ein größeres Stadion generiert mehr Einnahmen und zieht mehr Fans an.' },
    training_ground: { name: 'Trainingsgelände', icon: '🏋️', description: 'Moderne Trainingsanlagen sind der Schlüssel zur Spielerentwicklung und zur Effektivität des Trainings.' },
    medical_center: { name: 'Medizinisches Zentrum', icon: '⚕️', description: 'Eine gute medizinische Abteilung beschleunigt die Regeneration und beugt Verletzungen vor.' },
    youth_academy: { name: 'Jugendakademie', icon: '👶', description: 'Investiere in die Zukunft und bilde die nächsten Superstars in deiner eigenen Akademie aus.' },
    scouting_department: { name: 'Scouting-Abteilung', icon: ' scouting_department ', description: 'Finde unentdeckte Talente auf der ganzen Welt mit einem erstklassigen Scouting-Netzwerk.' },
};

const InfrastructureCard: React.FC<{ type: InfrastructureType; club: Club; onUpgrade: (clubId: string, type: InfrastructureType) => void; }> = ({ type, club, onUpgrade }) => {
    const info = infrastructureInfo[type];
    const currentLevel = club.infrastructure?.[type] || 0;
    const upgradeCost = currentLevel < INFRA_UPGRADE_COSTS.length ? INFRA_UPGRADE_COSTS[currentLevel] : null;
    const upgradeTime = currentLevel < INFRA_UPGRADE_TIMES.length ? INFRA_UPGRADE_TIMES[currentLevel] : null;
    const benefits = INFRA_LEVEL_BENEFITS[type] || [];
    const pendingUpgrade = club.pendingUpgrades?.find(upg => upg.type === type);

    return (
        <div className="bg-slate-800 rounded-3xl p-6 border border-slate-700 shadow-lg flex flex-col justify-between">
            <div>
                <div className="flex items-center gap-4 mb-4">
                    <div className="text-4xl">{info.icon}</div>
                    <div>
                        <h3 className="text-xl font-bold text-white">{info.name}</h3>
                        <p className="text-sm text-slate-400">Level {currentLevel}</p>
                    </div>
                </div>
                <p className="text-sm text-slate-400 mb-4 leading-relaxed">{info.description}</p>
                <ul className="text-xs text-slate-400 list-disc list-inside space-y-1 mb-6">
                    {benefits.map((benefit, i) => <li key={i} className={currentLevel > i ? 'text-emerald-400' : ''}>{benefit}</li>)}
                </ul>
            </div>
            <div className="mt-auto">
                {pendingUpgrade ? (
                    <div className="text-center bg-slate-700 p-4 rounded-xl">
                        <p className="text-sm font-bold text-amber-400">Upgrade auf Level {pendingUpgrade.level} läuft...</p>
                        <p className="text-xs text-slate-300">Verbleibend: {formatDuration(Math.max(0, (pendingUpgrade.endTime - Date.now()) / 1000))}</p>
                    </div>
                ) : upgradeCost !== null && upgradeTime !== null ? (
                    <button
                        disabled={club.budget < upgradeCost}
                        onClick={() => onUpgrade(club.id, type)}
                        className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl disabled:bg-slate-600 disabled:cursor-not-allowed hover:bg-emerald-500 transition-colors">
                        Upgrade auf Lvl {currentLevel + 1} ({upgradeCost.toLocaleString()}€)
                    </button>
                ) : <p className="text-center text-sm font-bold text-green-400">Maximales Level erreicht</p>}
            </div>
        </div>
    );
};

export const ClubDashboard: React.FC<{ club: Club | null; player: Player; onJoin: (clubId: string) => void; onUpgrade: (clubId: string, type: InfrastructureType) => void; availableClubs: Club[]; }> = ({ club, player, onJoin, onUpgrade, availableClubs }) => {
    if (!club) {
        return (
            <div>
                <h2 className="text-3xl font-black mb-4">Verein beitreten</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {availableClubs.map(c => (
                        <div key={c.id} className="bg-slate-800 p-6 rounded-2xl border border-slate-700 flex flex-col justify-between">
                            <div>
                                <h3 className="text-xl font-bold">{c.name}</h3>
                                <p className="text-sm text-slate-400">Manager: {c.managerName}</p>
                            </div>
                            <button onClick={() => onJoin(c.id)} className="mt-4 bg-blue-600 text-white font-bold py-2 rounded-lg hover:bg-blue-500 transition-colors">
                                Beitrittsanfrage senden
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <header className="bg-slate-800 p-8 rounded-3xl shadow-lg border-slate-700 border">
                <h1 className="text-4xl font-black text-white">{club.name}</h1>
                <p className="text-lg text-slate-400">Manager: {club.managerName}</p>
                <p className="text-2xl font-bold text-emerald-400 mt-2">Budget: {club.budget.toLocaleString()} €</p>
            </header>

            <section>
                <h2 className="text-3xl font-black mb-4">Infrastruktur</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {(Object.keys(infrastructureInfo) as InfrastructureType[]).map(type => (
                         <InfrastructureCard key={type} type={type} club={club} onUpgrade={onUpgrade} />
                    ))}
                </div>
            </section>
        </div>
    );
};