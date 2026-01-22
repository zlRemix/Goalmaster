import React, { useState, useEffect } from 'react';
import { Player, Activity, ActiveActivity } from '../types';
import { ACTIVITIES } from '../constants';

// --- HELPER FUNCTIONS & HOOKS --- //

// CRITICAL FIX: This hook is now more robust against prop changes.
const useCountdown = (endTime: number) => {
  const calculateRemaining = () => Math.max(0, Math.floor((endTime - Date.now()) / 1000));
  const [totalSeconds, setTotalSeconds] = useState(calculateRemaining);

  // This effect re-calculates the countdown if the end time changes (e.g. due to db sync)
  useEffect(() => {
    setTotalSeconds(calculateRemaining());
  }, [endTime]);

  // This effect runs the timer itself
  useEffect(() => {
    const timer = setInterval(() => {
      setTotalSeconds(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [endTime]); // The interval should be reset if the target time changes

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
    const id = activity.id.toLowerCase();
    if (id.includes('training') || id.includes('drill')) return { icon: '💪', color: 'bg-orange-500', category: 'Training' };
    if (id.includes('tactic') || id.includes('analysis')) return { icon: '📋', color: 'bg-amber-500', category: 'Taktik' };
    if (id.includes('press') || id.includes('signing')) return { icon: '🎤', color: 'bg-purple-500', category: 'PR' };
    if (id.includes('bath') || id.includes('physio')) return { icon: '🧘', color: 'bg-cyan-500', category: 'Fitness' };
    if (id.includes('dinner') || id.includes('team')) return { icon: '🍕', color: 'bg-rose-500', category: 'Soziales' };
    return { icon: '⚽', color: 'bg-slate-500', category: 'Allgemein' };
}

// --- CHILD COMPONENTS --- //

const ActiveActivityStatus: React.FC<{ activeInstance: ActiveActivity, activityDef: Activity }> = ({ activeInstance, activityDef }) => {
    const remainingSeconds = useCountdown(activeInstance.startTime + activityDef.durationSeconds * 1000);
    const progress = Math.min(100, (activityDef.durationSeconds - remainingSeconds) / activityDef.durationSeconds * 100);
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
                     <p className="text-4xl font-black text-emerald-400 tracking-widest">{formatDuration(remainingSeconds)}</p>
                     <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">Verbleibende Zeit</p>
                </div>
            </div>
            <div className="h-4 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800 p-1 mt-6">
                <div className={`h-full ${color} rounded-full`} style={{ width: `${progress}%`, transition: 'width 1s linear' }} />
            </div>
        </div>
    );
};

const ResetCountdown: React.FC<{ nextResetTime: number }> = ({ nextResetTime }) => {
    const totalSeconds = useCountdown(nextResetTime || 0);
    const isFinished = totalSeconds <= 0;

    return (
        <div className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800 flex items-center gap-6">
            <div className="h-16 w-16 bg-blue-500/10 rounded-2xl flex items-center justify-center text-3xl border border-blue-500/20 shadow-lg"> ⏳ </div>
            <div className="flex-1">
                <h4 className="font-black text-white uppercase tracking-tight text-lg mb-1">Nächster Reset</h4>
                <p className="text-xs text-slate-500 leading-relaxed font-medium uppercase tracking-tight"> Aktivitäten werden stündlich zurückgesetzt. </p>
            </div>
            <div className="text-right">
                {isFinished ? (
                     <p className="text-xl font-black text-emerald-400">JETZT</p>
                ): (
                    <p className="text-2xl font-black text-blue-400 tracking-widest"> {formatDuration(totalSeconds)} </p>
                )}
                <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">Verbleibend</p>
            </div>
        </div>
    );
};


// --- MAIN COMPONENT --- //

export const Activities: React.FC<{ player: Player; onStart: (activityId: string) => void; }> = ({ player, onStart }) => {
    const activeInstance = player.activeActivities && player.activeActivities[0];
    const activeDef = activeInstance ? ACTIVITIES.find(a => a.id === activeInstance.activityId) : undefined;

    const availableActivities = ACTIVITIES.filter(act => !act.requiredRole || player.roles?.includes(act.requiredRole));
    const isActivityRunning = !!activeDef;

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            <header>
                <h2 className="text-3xl font-black">Profi-Alltag</h2>
                <p className="text-slate-400">Nutze jede Minute deines Tages für Karriere & Erfahrung.</p>
            </header>

            {isActivityRunning && activeDef && activeInstance && (
                <ActiveActivityStatus activeInstance={activeInstance} activityDef={activeDef} />
            )}
            
            {!isActivityRunning && <ResetCountdown nextResetTime={player.nextActivityReset || 0} />}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {availableActivities.map((activity) => {
                    const { icon, color, category } = getAppearanceAndCategory(activity);
                    const reward = (activity as any).reward || {tp: 0, xp: 0};
                    const isCompleted = player.completedActivityIds?.includes(activity.id);
                    const canStart = !isActivityRunning && !isCompleted;

                    return (
                        <div 
                          key={activity.id} 
                          className={`bg-slate-800 rounded-[2.5rem] p-8 border border-slate-700 flex flex-col justify-between shadow-2xl transition-all relative overflow-hidden group ${isCompleted ? 'opacity-40 grayscale' : ''}`}>
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
                                {isCompleted ? (
                                     <div className="w-full py-4 bg-slate-900/50 rounded-2xl text-center border border-slate-800">
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest"> Für diese Stunde erledigt </p>
                                    </div>
                                ) : (
                                    <button
                                        disabled={!canStart}
                                        onClick={() => onStart(activity.id)}
                                        className={`w-full py-4 rounded-2xl font-black transition-all transform active:scale-95 flex items-center justify-center gap-3 shadow-lg ${!canStart ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : `bg-emerald-600 hover:bg-emerald-500 text-white`}`}>
                                        <span className="text-sm uppercase tracking-tight">Einheit starten</span>
                                        <span className="text-[10px] opacity-70 font-mono">{formatDuration(activity.durationSeconds)}</span>
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