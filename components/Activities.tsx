import React, { useState, useEffect } from 'react';
import { Player, Activity, ActiveActivity } from '../types';
import { ACTIVITIES } from '../constants';

// --- HELPER FUNCTIONS --- //
const formatDuration = (totalSeconds: number) => {
    if (totalSeconds < 0) totalSeconds = 0;
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = Math.floor(totalSeconds % 60);
    return `${h > 0 ? h.toString().padStart(2, '0') + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

const getAppearanceAndCategory = (activity: Activity) => {
    const id = activity.id.toLowerCase();
    if (id.includes('training') || id.includes('drill')) return { icon: '💪', color: 'bg-orange-500', category: 'Training' };
    if (id.includes('tactic') || id.includes('analysis')) return { icon: '📋', color: 'bg-amber-500', category: 'Taktik' };
    if (id.includes('press') || id.includes('signing') || id.includes('sponsor')) return { icon: '🎤', color: 'bg-purple-500', category: 'PR' };
    if (id.includes('bath') || id.includes('physio')) return { icon: '🧘', color: 'bg-cyan-500', category: 'Fitness' };
    if (id.includes('dinner') || id.includes('team')) return { icon: '🍕', color: 'bg-rose-500', category: 'Soziales' };
    return { icon: '⚽', color: 'bg-slate-500', category: 'Allgemein' };
}

// --- CHILD COMPONENTS --- //

const ActiveActivityStatus: React.FC<{ activeInstance: ActiveActivity, activityDef: Activity }> = ({ activeInstance, activityDef }) => {
    const [remainingSeconds, setRemainingSeconds] = useState(0);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const update = () => {
            const elapsed = (Date.now() - activeInstance.startTime) / 1000;
            const remaining = Math.max(0, activityDef.durationSeconds - elapsed);
            const currentProgress = Math.min(100, (elapsed / activityDef.durationSeconds) * 100);
            setRemainingSeconds(remaining);
            setProgress(currentProgress);
        };

        update(); // Initial call
        const timer = setInterval(update, 1000);
        return () => clearInterval(timer);
    }, [activeInstance, activityDef]);

    const { icon, color } = getAppearanceAndCategory(activityDef);

    return (
        <div className="bg-slate-800 rounded-3xl p-6 border-4 border-dashed border-emerald-500/30 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="text-6xl p-4 bg-slate-900 rounded-3xl border border-slate-700 shadow-inner">{icon}</div>
                <div className="flex-1 text-center md:text-left">
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Aktive Einheit</p>
                    <h3 className="text-2xl font-black text-white">{activityDef.name}</h3>
                </div>
                <div className="text-center">
                     <p className="text-4xl font-black text-emerald-400 tracking-widest">{formatDuration(Math.ceil(remainingSeconds))}</p>
                     <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">Verbleibende Zeit</p>
                </div>
            </div>
            <div className="h-4 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800 p-1 mt-6">
                <div className={`h-full ${color} rounded-full transition-all duration-1000 ease-linear`} style={{ width: `${progress}%` }} />
            </div>
        </div>
    );
};

// --- MAIN COMPONENT --- //

export const Activities: React.FC<{ player: Player; onStart: (activityId: string) => void; }> = ({ player, onStart }) => {
    const activeActivityInstance = player.activeActivities && player.activeActivities[0];
    const activeActivityDef = activeActivityInstance ? ACTIVITIES.find(a => a.id === activeActivityInstance.activityId) : undefined;

    const availableActivities = ACTIVITIES.filter(act => !act.requiredRole || player.roles?.includes(act.requiredRole));
    const isActivityRunning = !!activeActivityDef;

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            <header>
                <h2 className="text-3xl font-black">Profi-Alltag</h2>
                <p className="text-slate-400">Nutze jede Minute deines Tages für Karriere & Erfahrung.</p>
            </header>

            {isActivityRunning && activeActivityDef && activeActivityInstance && (
                <ActiveActivityStatus activeInstance={activeActivityInstance} activityDef={activeActivityDef} />
            )}

            <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${isActivityRunning ? 'opacity-50 grayscale' : ''}`}>
                {availableActivities.map((activity) => {
                    const { icon, color, category } = getAppearanceAndCategory(activity);
                    const reward = (activity as any).reward || {tp: 0, xp: 0};

                    return (
                        <div 
                          key={activity.id} 
                          className={`bg-slate-800 rounded-[2.5rem] p-8 border border-slate-700 flex flex-col justify-between shadow-2xl transition-all relative overflow-hidden group`}>
                             <div className="absolute -right-6 -top-6 text-7xl opacity-5 group-hover:scale-110 transition-transform select-none"> {icon} </div>
                            <div>
                                <div className="flex justify-between items-start mb-6">
                                    <div className="text-4xl p-4 bg-slate-900 rounded-3xl border border-slate-700 shadow-inner"> {icon} </div>
                                    <div className="text-right">
                                        <p className="text-emerald-400 font-black text-xl">+{reward.tp} TP</p>
                                        <p className="text-blue-400 font-black text-xs">+{reward.xp} XP</p>
                                        <span className="text-[8px] bg-slate-900 px-2 py-0.5 rounded-full border border-slate-700 text-slate-500 font-black uppercase mt-1 inline-block"> {category} </span>
                                    </div>
                                </div>
                                <h3 className="text-xl font-black mb-2">{activity.name}</h3>
                                <p className="text-xs text-slate-400 mb-8 leading-relaxed font-medium"> {activity.description} </p>
                            </div>
                            <div className="mt-auto">
                                <button
                                    disabled={isActivityRunning}
                                    onClick={() => onStart(activity.id)}
                                    className={`w-full py-4 rounded-2xl font-black transition-all transform active:scale-95 flex items-center justify-center gap-3 shadow-lg ${isActivityRunning ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : `bg-emerald-600 hover:bg-emerald-500 text-white`}`}>
                                    <span className="text-sm uppercase tracking-tight">Einheit starten</span>
                                    <span className="text-[10px] opacity-70 font-mono">{formatDuration(activity.durationSeconds)}</span>
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};