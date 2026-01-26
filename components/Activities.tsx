import React, { ElementType, useEffect, useMemo, useState } from 'react';
import { Player, Activity, ActiveActivity, Club } from '../types';
import { ACTIVITIES } from '../constants';
import { useCountdown, formatDuration } from '../hooks/useTimers';
import { dataService } from '../services/dataService';
import { ClipboardList, Mic, Footprints, Pizza, File, Timer, DollarSign, PlusCircle, Star, Briefcase } from 'lucide-react';

type ActivityTab = 'career' | 'personal';

const activityCategorization: Record<Activity['type'], { icon: ElementType; color: string; category: string; groupTitle: string; groupIcon: ElementType; tab: ActivityTab }> = {
    training: { icon: Star, color: 'text-blue-400', category: 'Training', groupTitle: 'Training', groupIcon: Star, tab: 'career' },
    tactic: { icon: ClipboardList, color: 'text-indigo-400', category: 'Taktik', groupTitle: 'Taktik & Analyse', groupIcon: ClipboardList, tab: 'career' },
    fitness: { icon: Footprints, color: 'text-teal-400', category: 'Fitness', groupTitle: 'Fitness & Kondition', groupIcon: Footprints, tab: 'career' },
    pr: { icon: Mic, color: 'text-pink-400', category: 'PR', groupTitle: 'Medien & PR', groupIcon: Mic, tab: 'career' },
    social: { icon: Pizza, color: 'text-yellow-400', category: 'Soziales', groupTitle: 'Team & Soziales', groupIcon: Pizza, tab: 'career' },
    work: { icon: Briefcase, color: 'text-green-400', category: 'Arbeit', groupTitle: 'Arbeit & Finanzen', groupIcon: Briefcase, tab: 'personal' },
};

const getAppearance = (activityType: Activity['type']) => {
    return activityCategorization[activityType] || { icon: File, color: 'text-slate-500', category: 'Allgemein' };
}

const ActiveActivityStatus: React.FC<{ activeInstance: ActiveActivity, activityDef: Activity, durationReduction: number }> = ({ activeInstance, activityDef, durationReduction }) => {
    const effectiveDurationSeconds = activityDef.durationSeconds * (1 - durationReduction);
    const totalDurationMs = effectiveDurationSeconds * 1000;
    const endTime = activeInstance.startTime + totalDurationMs;
    const remainingMs = useCountdown(endTime);
    
    const progress = Math.min(100, Math.max(0, ((totalDurationMs - remainingMs) / totalDurationMs) * 100));
    const remainingSecondsForDisplay = Math.ceil(remainingMs / 1000);

    const { icon: Icon, color } = getAppearance(activityDef.type);

    return (
        <div className="bg-slate-800/80 rounded-2xl p-4 md:p-6 border-2 border-dashed border-blue-500/30">
            <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className={`p-3 bg-slate-900 rounded-xl border border-slate-700`}>
                    <Icon className={`h-8 w-8 md:h-10 md:w-10 ${color}`} />
                </div>
                <div className="flex-1 text-center sm:text-left">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Aktive Einheit</p>
                    <h3 className="text-lg md:text-2xl font-black text-white">{activityDef.name}</h3>
                </div>
                <div className="text-center bg-slate-900/50 p-3 rounded-lg w-full sm:w-auto">
                     <p className="text-2xl md:text-4xl font-black text-blue-400 tracking-widest tabular-nums">{formatDuration(remainingSecondsForDisplay)}</p>
                     <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">Verbleibend</p>
                </div>
            </div>
            <div className="h-3 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800 p-0.5 mt-4">
                <div className={`h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full`} style={{ width: `${progress}%`, transition: 'width 0.05s linear' }} />
            </div>
        </div>
    );
};

const ResetCountdown: React.FC<{ nextResetTime: number }> = ({ nextResetTime }) => {
    const remainingMs = useCountdown(nextResetTime || 0);
    const remainingSecondsForDisplay = Math.ceil(remainingMs / 1000);

    return (
        <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800 flex items-center gap-4">
            <div className="h-12 w-12 bg-blue-500/10 rounded-lg flex items-center justify-center border border-blue-500/20">
                <Timer className="h-6 w-6 text-blue-400" />
            </div>
            <div>
                <h4 className="font-bold text-white uppercase text-sm md:text-base">Nächster Reset</h4>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-tight">Stündliches Zurücksetzen der Aktivitäten</p>
            </div>
            <div className="ml-auto text-right">
                <p className="text-lg md:text-2xl font-black text-blue-400 tracking-widest tabular-nums">{formatDuration(remainingSecondsForDisplay)}</p>
            </div>
        </div>
    );
};

export const Activities: React.FC<{ player: Player; onStart: (activityId: string) => void; onComplete: (activityId: string) => void; onReset: () => void; }> = ({ player, onStart, onComplete, onReset }) => {
    const [club, setClub] = useState<Club | null>(null);
    const [activeTab, setActiveTab] = useState<ActivityTab>('career');

    useEffect(() => {
        if (!player.clubId) { setClub(null); return; }
        const unsubscribe = dataService.listenToClub(player.clubId, setClub);
        return () => unsubscribe();
    }, [player.clubId]);

    const activeInstance = player.activeActivities?.[0];
    const activeDef = activeInstance ? ACTIVITIES.find(a => a.id === activeInstance.activityId) : undefined;

    const medicalCenterLevel = club?.infrastructure?.medical_center?.level || 0;
    const durationReduction = medicalCenterLevel > 0 ? (medicalCenterLevel * 3) / 100 : 0;
    const trainingGroundLevel = club?.infrastructure?.training_ground?.level || 0;
    const tpBonusPercentage = trainingGroundLevel > 0 ? (trainingGroundLevel * 2) / 100 : 0;
    const marketingDeptLevel = club?.infrastructure?.marketing_department?.level || 0;
    const prBonusPercentage = marketingDeptLevel > 0 ? (marketingDeptLevel * 5) / 100 : 0;

    useEffect(() => {
        if (!activeInstance || !activeDef) return;
        const effectiveDurationSeconds = activeDef.durationSeconds * (1 - durationReduction);
        const endTime = activeInstance.startTime + (effectiveDurationSeconds * 1000);
        const remainingTime = endTime - Date.now();
        if (remainingTime <= 0) { onComplete(activeDef.id); return; }
        const timer = setTimeout(() => onComplete(activeDef.id), remainingTime);
        return () => clearTimeout(timer);
    }, [activeInstance?.activityId, onComplete, durationReduction]);

    useEffect(() => {
        if (!player.nextActivityReset) return;
        const remainingTime = player.nextActivityReset - Date.now();
        if (remainingTime <= 0) { onReset(); return; }
        const timer = setTimeout(() => onReset(), remainingTime);
        return () => clearTimeout(timer);
    }, [player.nextActivityReset, onReset]);

    const groupedActivities = useMemo(() => 
        ACTIVITIES.reduce((acc, activity) => {
            const type = activity.type;
            if (!acc[type]) acc[type] = [];
            acc[type].push(activity);
            return acc;
        }, {} as Record<Activity['type'], Activity[]>)
    , []);

    const isActivityRunning = !!activeDef;

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            <header>
                <h2 className="text-2xl md:text-3xl font-black text-white">Profi-Alltag</h2>
                <p className="text-slate-400 mt-1">Nutze jede Minute deines Tages für Karriere & Erfahrung.</p>
            </header>

            {isActivityRunning && activeDef && activeInstance && (
                <ActiveActivityStatus activeInstance={activeInstance} activityDef={activeDef} durationReduction={durationReduction} />
            )}
            
            {!isActivityRunning && <ResetCountdown nextResetTime={player.nextActivityReset || 0} /> }

            <div className="border-b-2 border-slate-800">
                <div className="flex space-x-2">
                    <button
                        onClick={() => setActiveTab('career')}
                        className={`px-6 py-3 font-bold text-sm uppercase tracking-wider transition-colors ${activeTab === 'career' ? 'border-b-2 border-blue-500 text-white' : 'text-slate-400 hover:text-white border-b-2 border-transparent'}`}
                    >
                        Karriere
                    </button>
                    <button
                        onClick={() => setActiveTab('personal')}
                        className={`px-6 py-3 font-bold text-sm uppercase tracking-wider transition-colors ${activeTab === 'personal' ? 'border-b-2 border-blue-500 text-white' : 'text-slate-400 hover:text-white border-b-2 border-transparent'}`}
                    >
                        Arbeiten
                    </button>
                </div>
            </div>

            {Object.entries(activityCategorization)
                .filter(([_, config]) => config.tab === activeTab)
                .map(([type, {groupTitle, groupIcon: GroupIcon}]) => {
                    const activitiesForType = groupedActivities[type as Activity['type']];
                    if (!activitiesForType || activitiesForType.length === 0) return null;

                    return (
                        <div key={type} className="space-y-4">
                            <h3 className="text-xl font-bold text-white flex items-center gap-3">
                                <GroupIcon className="w-6 h-6 text-slate-400" />
                                <span>{groupTitle}</span>
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
                                {activitiesForType.map((activity) => {
                                    const { icon: Icon, color, category } = getAppearance(activity.type);
                                    const { tp = 0, xp = 0, budgetGain = 0, euro = 0 } = activity.reward || {};
                                    
                                    const isCompleted = player.completedActivityIds?.includes(activity.id);
                                    const canPerformRole = !activity.requiredRole || player.roles?.includes(activity.requiredRole);
                                    const canStart = !isActivityRunning && !isCompleted && canPerformRole;
                                    const effectiveDurationSeconds = Math.round(activity.durationSeconds * (1 - durationReduction));

                                    let finalTp = tp;
                                    let bonusTp = 0;
                                    if (activity.type === 'training' && tpBonusPercentage > 0) {
                                        bonusTp = tp * tpBonusPercentage;
                                        finalTp = tp + bonusTp;
                                    }

                                    let finalBudget = budgetGain;
                                    if ((activity.type === 'pr' || activity.type === 'social') && prBonusPercentage > 0) {
                                        finalBudget = Math.round(budgetGain * (1 + prBonusPercentage));
                                    }

                                    return (
                                        <div key={activity.id} className={`bg-slate-800/80 rounded-2xl p-4 border border-slate-700 flex flex-col justify-between shadow-md transition-all relative overflow-hidden group ${!canStart ? 'opacity-40 grayscale' : 'hover:border-blue-500/50'}`}>
                                            <div>
                                                <div className="flex justify-between items-start mb-2">
                                                    <div className={`p-2 bg-slate-900 rounded-xl border border-slate-700`}><Icon className={`w-6 h-6 ${color}`} /></div>
                                                    <div className="text-right">
                                                        {euro > 0 && <p className="text-green-400 font-bold text-xs">+{euro} €</p>}
                                                        {finalTp > 0 && (
                                                            <div className="flex items-center justify-end gap-1 text-yellow-400 font-bold text-base">
                                                                +{finalTp.toFixed(1)} TP
                                                                {bonusTp > 0 && <PlusCircle className="w-3 h-3 text-yellow-500/50" title={`Bonus: +${bonusTp.toFixed(2)} TP`} />}
                                                            </div>
                                                        )}
                                                        {xp > 0 && <p className="text-blue-400 font-bold text-xs">+{xp} XP</p>}
                                                        {finalBudget > 0 && <p className="text-green-500 font-bold text-xs">+{finalBudget} Club-€</p>}
                                                    </div>
                                                </div>
                                                <h3 className="text-base font-black mb-1 text-white">{activity.name}</h3>
                                                <span className="text-[10px] bg-slate-900 px-2 py-1 rounded-full border border-slate-700 text-slate-400 font-bold uppercase">{category}</span>
                                                <p className="text-xs text-slate-400 mt-2 mb-4 leading-normal font-medium">{activity.description}</p>
                                            </div>
                                            <div className="mt-auto">
                                                {isCompleted ? (
                                                    <div className="w-full py-2 bg-slate-900/50 rounded-xl text-center border border-slate-800">
                                                        <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Erledigt</p>
                                                    </div>
                                                ) : (
                                                    <button
                                                        disabled={!canStart}
                                                        onClick={() => onStart(activity.id)}
                                                        className={`w-full py-2 rounded-xl font-bold transition-all transform active:scale-95 flex items-center justify-center gap-3 shadow-lg ${!canStart ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500 text-white'}`}>
                                                        <span className="text-xs uppercase tracking-tight">Starten</span>
                                                        <span className="text-[10px] opacity-70 font-mono">({formatDuration(effectiveDurationSeconds)})</span>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )
            })
        }
        </div>
    );
};