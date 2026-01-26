import React, { ElementType, useEffect, useState } from 'react';
import { Player, Activity, ActiveActivity, Club } from '../types';
import { ACTIVITIES } from '../constants';
import { useCountdown, formatDuration } from '../hooks/useTimers';
import { dataService } from '../services/dataService';
import { BrainCircuit, ClipboardList, Mic, Footprints, Pizza, File, Timer, DollarSign, PlusCircle } from 'lucide-react';

const getAppearanceAndCategory = (activity: Activity): { icon: ElementType; color: string; category: string } => {
    const id = activity.type;
    if (id === 'training') return { icon: BrainCircuit, color: 'text-orange-400', category: 'Training' };
    if (id === 'tactic') return { icon: ClipboardList, color: 'text-amber-400', category: 'Taktik' };
    if (id === 'pr') return { icon: Mic, color: 'text-purple-400', category: 'PR' };
    if (id === 'fitness') return { icon: Footprints, color: 'text-cyan-400', category: 'Fitness' };
    if (id === 'social') return { icon: Pizza, color: 'text-rose-400', category: 'Soziales' };
    return { icon: File, color: 'text-slate-400', category: 'Allgemein' };
}

// --- CHILD COMPONENTS --- //

const ActiveActivityStatus: React.FC<{ activeInstance: ActiveActivity, activityDef: Activity, durationReduction: number }> = ({ activeInstance, activityDef, durationReduction }) => {
    const effectiveDurationSeconds = activityDef.durationSeconds * (1 - durationReduction);
    const totalDurationMs = effectiveDurationSeconds * 1000;
    const endTime = activeInstance.startTime + totalDurationMs;
    const remainingMs = useCountdown(endTime);
    
    const progress = Math.min(100, Math.max(0, ((totalDurationMs - remainingMs) / totalDurationMs) * 100));
    const remainingSecondsForDisplay = Math.ceil(remainingMs / 1000);

    const { icon: Icon, color } = getAppearanceAndCategory(activityDef);

    return (
        <div className="bg-slate-800/80 rounded-2xl p-4 md:p-6 border-2 border-dashed border-emerald-500/30">
            <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className={`${color.replace("text-", "bg-")}/10 p-3 bg-slate-900 rounded-xl border border-slate-700`}>
                    <Icon className={`h-8 w-8 md:h-10 md:w-10 ${color}`} />
                </div>
                <div className="flex-1 text-center sm:text-left">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Aktive Einheit</p>
                    <h3 className="text-lg md:text-2xl font-black text-white">{activityDef.name}</h3>
                </div>
                <div className="text-center bg-slate-900/50 p-3 rounded-lg w-full sm:w-auto">
                     <p className="text-2xl md:text-4xl font-black text-emerald-400 tracking-widest tabular-nums">{formatDuration(remainingSecondsForDisplay)}</p>
                     <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">Verbleibend</p>
                </div>
            </div>
            <div className="h-3 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800 p-0.5 mt-4">
                <div className={`h-full ${color.replace("text-", "bg-")} rounded-full`} style={{ width: `${progress}%`, transition: 'width 0.05s linear' }} />
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
                <p className="text-xs text-slate-500 font-medium uppercase tracking-tight">Stündliches Zurücksetzen</p>
            </div>
            <div className="ml-auto text-right">
                <p className="text-lg md:text-2xl font-black text-blue-400 tracking-widest tabular-nums">{formatDuration(remainingSecondsForDisplay)}</p>
            </div>
        </div>
    );
};

// --- MAIN COMPONENT (NOW SELF-SUFFICIENT) --- //

export const Activities: React.FC<{ player: Player; onStart: (activityId: string) => void; onComplete: (activityId: string) => void; onReset: () => void; }> = ({ player, onStart, onComplete, onReset }) => {
    const [club, setClub] = useState<Club | null>(null);

    // This effect makes the component self-sufficient. It fetches its own club data.
    useEffect(() => {
        if (!player.clubId) {
            setClub(null);
            return;
        }
        const unsubscribe = dataService.listenToClub(player.clubId, (fetchedClub) => {
            setClub(fetchedClub);
        });
        // Cleanup listener on component unmount
        return () => unsubscribe();
    }, [player.clubId]);

    const activeInstance = player.activeActivities?.[0];
    const activeDef = activeInstance ? ACTIVITIES.find(a => a.id === activeInstance.activityId) : undefined;

    // Bonus calculations are now reliable because the component controls its own data
    const medicalCenterLevel = club?.infrastructure?.medical_center?.level || 0;
    const durationReduction = medicalCenterLevel > 0 ? (medicalCenterLevel * 3) / 100 : 0;

    const trainingGroundLevel = club?.infrastructure?.training_ground?.level || 0;
    const tpBonusPercentage = trainingGroundLevel > 0 ? (trainingGroundLevel * 2) / 100 : 0;
    
    const marketingDeptLevel = club?.infrastructure?.marketing_department?.level || 0;
    const prBonusPercentage = marketingDeptLevel > 0 ? (marketingDeptLevel * 5) / 100 : 0;

    // Activity completion timer
    useEffect(() => {
        if (!activeInstance || !activeDef) return;
        const effectiveDurationSeconds = activeDef.durationSeconds * (1 - durationReduction);
        const endTime = activeInstance.startTime + (effectiveDurationSeconds * 1000);
        const remainingTime = endTime - Date.now();
        if (remainingTime <= 0) { onComplete(activeDef.id); return; }
        const timer = setTimeout(() => onComplete(activeDef.id), remainingTime);
        return () => clearTimeout(timer);
    }, [activeInstance?.activityId, onComplete, durationReduction]);

    // Hourly reset timer
    useEffect(() => {
        if (!player.nextActivityReset) return;
        const remainingTime = player.nextActivityReset - Date.now();
        if (remainingTime <= 0) { onReset(); return; }
        const timer = setTimeout(() => onReset(), remainingTime);
        return () => clearTimeout(timer);
    }, [player.nextActivityReset, onReset]);

    const availableActivities = ACTIVITIES;
    const isActivityRunning = !!activeDef;

    return (
        <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-20">
            <header>
                <h2 className="text-2xl md:text-3xl font-black">Profi-Alltag</h2>
                <p className="text-slate-400 mt-1">Nutze jede Minute deines Tages für Karriere & Erfahrung.</p>
            </header>

            {isActivityRunning && activeDef && activeInstance && (
                <ActiveActivityStatus activeInstance={activeInstance} activityDef={activeDef} durationReduction={durationReduction} />
            )}
            
            {!isActivityRunning && <ResetCountdown nextResetTime={player.nextActivityReset || 0} /> }

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
                {availableActivities.map((activity) => {
                    const { icon: Icon, category } = getAppearanceAndCategory(activity as Activity);
                    const { tp = 0, xp = 0, budgetGain = 0 } = activity.reward || {};
                    
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
                        <div key={activity.id} className={`bg-slate-800/80 rounded-3xl p-6 border border-slate-700 flex flex-col justify-between shadow-lg transition-all relative overflow-hidden group ${!canStart ? 'opacity-40 grayscale' : ''}`}>
                            <div className="absolute -right-4 -top-4 opacity-5 group-hover:scale-110 transition-transform select-none">
                                <Icon className="w-24 h-24" />
                            </div>
                            <div>
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-slate-900 rounded-2xl border border-slate-700 shadow-inner"><Icon className="w-8 h-8" /></div>
                                    <div className="text-right space-y-1">
                                        {finalTp > 0 && (
                                            <div className="flex items-center justify-end gap-2">
                                                <p className="text-emerald-400 font-bold text-lg">+{finalTp.toFixed(2)} TP</p>
                                                {bonusTp > 0 && <PlusCircle className="w-4 h-4 text-emerald-500/50" title={`Bonus: +${bonusTp.toFixed(2)} TP`} />}
                                            </div>
                                        )}
                                        {xp > 0 && <p className="text-blue-400 font-bold text-xs">+{xp} XP</p>}
                                        {finalBudget > 0 && <p className="text-yellow-400 font-bold text-xs">+{finalBudget} €</p>}
                                    </div>
                                </div>
                                <h3 className="text-lg font-black mb-1 text-white">{activity.name}</h3>
                                <span className="text-[10px] bg-slate-900 px-2 py-0.5 rounded-full border border-slate-700 text-slate-500 font-black uppercase">{category}</span>
                                <p className="text-xs text-slate-400 mt-3 mb-6 leading-relaxed font-medium">{activity.description}</p>
                            </div>
                            <div className="mt-auto">
                                {isCompleted ? (
                                     <div className="w-full py-3 bg-slate-900/50 rounded-xl text-center border border-slate-800">
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Erledigt</p>
                                    </div>
                                ) : (
                                    <button
                                        disabled={!canStart}
                                        onClick={() => onStart(activity.id)}
                                        className={`w-full py-3 rounded-xl font-bold transition-all transform active:scale-95 flex items-center justify-center gap-3 shadow-lg ${!canStart ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-500 text-white'}`}>
                                        <span className="text-sm uppercase tracking-tight">Starten</span>
                                        <span className="text-xs opacity-70 font-mono">({formatDuration(effectiveDurationSeconds)})</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};