import React, { useState, useEffect } from 'react';
import { Player, Activity, ActiveActivity, UserRole } from '../types';
import { ACTIVITIES } from '../constants';

// --- HOOKS & HELPERS --- //
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
    if (totalSeconds < 0) totalSeconds = 0;
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = Math.floor(totalSeconds % 60);
    return `${h > 0 ? h.toString().padStart(2, '0') + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

const getAppearanceAndCategory = (activity: Activity) => {
    const id = activity.type;
    if (id === 'training') return { icon: '💪', color: 'bg-orange-500', category: 'Training' };
    if (id === 'tactic') return { icon: '📋', color: 'bg-amber-500', category: 'Taktik' };
    if (id === 'pr') return { icon: '🎤', color: 'bg-purple-500', category: 'PR' };
    if (id === 'fitness') return { icon: '🧘', color: 'bg-cyan-500', category: 'Fitness' };
    if (id === 'social') return { icon: '🍕', color: 'bg-rose-500', category: 'Soziales' };
    return { icon: '⚽', color: 'bg-slate-500', category: 'Allgemein' };
}

// --- CHILD COMPONENTS (NOW RESPONSIVE) --- //

const ActiveActivityStatus: React.FC<{ activeInstance: ActiveActivity, activityDef: Activity }> = ({ activeInstance, activityDef }) => {
    const remainingSeconds = useCountdown(activeInstance.startTime + activityDef.durationSeconds * 1000);
    const progress = Math.min(100, (activityDef.durationSeconds - remainingSeconds) / activityDef.durationSeconds * 100);
    const { icon, color } = getAppearanceAndCategory(activityDef);

    return (
        <div className="bg-slate-800/80 rounded-2xl p-4 md:p-6 border-2 border-dashed border-emerald-500/30">
            <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="text-4xl md:text-5xl p-3 bg-slate-900 rounded-xl border border-slate-700">{icon}</div>
                <div className="flex-1 text-center sm:text-left">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Aktive Einheit</p>
                    <h3 className="text-lg md:text-2xl font-black text-white">{activityDef.name}</h3>
                </div>
                <div className="text-center bg-slate-900/50 p-3 rounded-lg w-full sm:w-auto">
                     <p className="text-2xl md:text-4xl font-black text-emerald-400 tracking-widest">{formatDuration(remainingSeconds)}</p>
                     <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">Verbleibend</p>
                </div>
            </div>
            <div className="h-3 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800 p-0.5 mt-4">
                <div className={`h-full ${color} rounded-full`} style={{ width: `${progress}%`, transition: 'width 1s linear' }} />
            </div>
        </div>
    );
};

const ResetCountdown: React.FC<{ nextResetTime: number }> = ({ nextResetTime }) => {
    const totalSeconds = useCountdown(nextResetTime || 0);

    return (
        <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800 flex items-center gap-4">
            <div className="h-12 w-12 bg-blue-500/10 rounded-lg flex items-center justify-center text-2xl border border-blue-500/20">⏳</div>
            <div>
                <h4 className="font-bold text-white uppercase text-sm md:text-base">Nächster Reset</h4>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-tight">Stündliches Zurücksetzen</p>
            </div>
            <div className="ml-auto text-right">
                <p className="text-lg md:text-2xl font-black text-blue-400 tracking-widest">{formatDuration(totalSeconds)}</p>
            </div>
        </div>
    );
};


// --- MAIN COMPONENT (NOW RESPONSIVE) --- //

export const Activities: React.FC<{ player: Player; onStart: (activityId: string) => void; }> = ({ player, onStart }) => {
    const activeInstance = player.activeActivities?.[0];
    const activeDef = activeInstance ? ACTIVITIES.find(a => a.id === activeInstance.activityId) : undefined;

    const availableActivities = ACTIVITIES.filter(act => !act.requiredRole || player.roles?.includes(act.requiredRole));
    const isActivityRunning = !!activeDef;

    return (
        <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-20">
            <header>
                <h2 className="text-2xl md:text-3xl font-black">Profi-Alltag</h2>
                <p className="text-slate-400 mt-1">Nutze jede Minute deines Tages für Karriere & Erfahrung.</p>
            </header>

            {isActivityRunning && activeDef && activeInstance && (
                <ActiveActivityStatus activeInstance={activeInstance} activityDef={activeDef} />
            )}
            
            {!isActivityRunning && <ResetCountdown nextResetTime={player.nextActivityReset || 0} />}

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
                {availableActivities.map((activity) => {
                    const { icon, color, category } = getAppearanceAndCategory(activity);
                    const reward = activity.reward || {tp: 0, xp: 0};
                    const isCompleted = player.completedActivityIds?.includes(activity.id);
                    const canStart = !isActivityRunning && !isCompleted;

                    return (
                        <div key={activity.id} className={`bg-slate-800/80 rounded-3xl p-6 border border-slate-700 flex flex-col justify-between shadow-lg transition-all relative overflow-hidden group ${isCompleted ? 'opacity-40 grayscale' : ''}`}>
                             <div className="absolute -right-4 -top-4 text-6xl opacity-5 group-hover:scale-110 transition-transform select-none">{icon}</div>
                            <div>
                                <div className="flex justify-between items-start mb-4">
                                    <div className="text-3xl p-3 bg-slate-900 rounded-2xl border border-slate-700 shadow-inner">{icon}</div>
                                    <div className="text-right">
                                        <p className="text-emerald-400 font-bold text-lg">+{reward.tp} TP</p>
                                        <p className="text-blue-400 font-bold text-xs">+{reward.xp} XP</p>
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
                                        <span className="text-xs opacity-70 font-mono">({formatDuration(activity.durationSeconds)})</span>
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