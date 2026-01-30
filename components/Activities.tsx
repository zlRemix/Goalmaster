import React, { ElementType, useEffect, useMemo, useState, useId, memo } from 'react';
import { Player, Activity, ActiveActivity, Club, SkillType } from '../types';
import { ACTIVITIES } from '../constants';
import { useCountdown, formatDuration } from '../hooks/useTimers';
import { dataService } from '../services/dataService';
import { TrainingCenter } from './TrainingCenter'; // Import TrainingCenter
import { 
  ClipboardList, Mic, Footprints, Pizza, Timer, 
  Star, Briefcase, Euro, ShieldCheck, Zap 
} from 'lucide-react';

type ActivityTab = 'career' | 'personal' | 'training';

const activityCategorization: Record<Activity['type'], { icon: ElementType; color: string; groupTitle: string; tab: ActivityTab }> = {
    training: { icon: Star, color: '#38BDF8', groupTitle: 'Training', tab: 'career' },
    tactic: { icon: ClipboardList, color: '#818CF8', groupTitle: 'Taktik & Analyse', tab: 'career' },
    fitness: { icon: Footprints, color: '#2DD4BF', groupTitle: 'Fitness & Kondition', tab: 'career' },
    pr: { icon: Mic, color: '#F472B6', groupTitle: 'Medien & PR', tab: 'career' },
    social: { icon: Pizza, color: '#FB7185', groupTitle: 'Team & Soziales', tab: 'career' },
    work: { icon: Briefcase, color: '#34D399', groupTitle: 'Arbeit & Finanzen', tab: 'personal' },
};

// --- UNTERKOMPONENTEN (Verhindern Hook-Fehler) ---

const ActivityGraphic: React.FC<{ type: Activity['type']; color: string }> = ({ type, color }) => {
    const rarityId = useId().replace(/:/g, ""); 
    const getPaths = () => {
        switch (type) {
            case 'training': return <g><rect x="40" y="75" width="70" height="10" rx="2" /><rect x="30" y="60" width="15" height="40" rx="4" /><rect x="105" y="60" width="15" height="40" rx="4" /></g>;
            case 'tactic': return <g><rect x="40" y="50" width="70" height="60" rx="4" strokeWidth="2" stroke="currentColor" fill="none" /><path d="M50 65L60 75M60 65L50 75" stroke="white" strokeWidth="3" /></g>;
            case 'fitness': return <g><path d="M35 100C35 90 50 85 70 85H105L115 105H35V100Z" /><path d="M40 70L50 60L60 75L80 50L95 70" stroke="white" strokeWidth="3" fill="none" /></g>;
            case 'pr': return <g><rect x="65" y="50" width="20" height="40" rx="10" /><rect x="70" y="90" width="10" height="30" /><path d="M55 75C55 85 65 95 75 95C85 95 95 85 95 75" stroke="currentColor" strokeWidth="4" fill="none" /></g>;
            case 'social': return <g><path d="M75 45L110 110H40L75 45Z" /><circle cx="75" cy="70" r="4" fill="white" fillOpacity="0.4" /></g>;
            case 'work': return <g><rect x="45" y="65" width="60" height="45" rx="4" /><path d="M60 65V55C60 50 65 45 75 45C85 45 90 50 90 55V65" stroke="currentColor" strokeWidth="4" fill="none" /></g>;
            default: return <circle cx="75" cy="80" r="30" />;
        }
    };
    return (
        <svg viewBox="0 0 150 160" className="w-full h-full">
            <defs>
                <linearGradient id={`grad_${rarityId}`} x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="white" stopOpacity="0.9" /><stop offset="100%" stopColor={color} /></linearGradient>
                <filter id={`glow_${rarityId}`}><feGaussianBlur stdDeviation="5" result="blur" /><feComposite in="SourceGraphic" in2="blur" operator="over" /></filter>
            </defs>
            <circle cx="75" cy="80" r="35" fill={color} fillOpacity="0.1" filter="blur(15px)" />
            <g fill={`url(#grad_${rarityId})`} filter={`url(#glow_${rarityId})`}>{getPaths()}</g>
        </svg>
    );
};

const ActiveActivityStatus: React.FC<{ activeInstance: ActiveActivity, activityDef: Activity, durationReduction: number }> = ({ activeInstance, activityDef, durationReduction }) => {
    const effectiveDurationSeconds = activityDef.durationSeconds * (1 - durationReduction);
    const totalDurationMs = effectiveDurationSeconds * 1000;
    const endTime = activeInstance.startTime + totalDurationMs;
    const remainingMs = useCountdown(endTime);
    const progress = Math.min(100, Math.max(0, ((totalDurationMs - remainingMs) / totalDurationMs) * 100));
    const remainingSeconds = Math.ceil(remainingMs / 1000);

    return (
        <div className="bg-slate-900 border-2 border-blue-500/50 rounded-[2.5rem] p-6 mb-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-slate-800">
                <div className="h-full bg-blue-500 shadow-[0_0_15px_#3b82f6]" style={{ width: `${progress}%`, transition: 'width 1s linear' }} />
            </div>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-5">
                    <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center border border-blue-500/20">
                        <Zap className="w-8 h-8 text-blue-400 animate-pulse" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Einheit läuft...</p>
                        <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">{activityDef.name}</h3>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-3xl font-black text-white tabular-nums">{formatDuration(remainingSeconds)}</p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase">Verbleibend</p>
                </div>
            </div>
        </div>
    );
};

// --- HAUPTKOMPONENTE ---

export const Activities: React.FC<{ player: Player; onStart: (activityId: string) => void; onComplete: (activityId: string) => void; onReset: () => void; onTrain: (skill: SkillType) => void; }> = memo(({ player, onStart, onComplete, onReset, onTrain }) => {
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
    const tpBonusPercentage = (club?.infrastructure?.training_ground?.level || 0) * 0.02;

    // Timer-Logik für Abschluss
    useEffect(() => {
        if (!activeInstance || !activeDef) return;
        const effectiveDuration = activeDef.durationSeconds * (1 - durationReduction);
        const endTime = activeInstance.startTime + (effectiveDuration * 1000);
        const remaining = endTime - Date.now();
        if (remaining <= 0) { onComplete(activeDef.id); return; }
        const timer = setTimeout(() => onComplete(activeDef.id), remaining);
        return () => clearTimeout(timer);
    }, [activeInstance?.activityId, onComplete, durationReduction]);

    // Timer-Logik für Reset
    useEffect(() => {
        if (!player.nextActivityReset) return;
        const remaining = player.nextActivityReset - Date.now();
        if (remaining <= 0) { onReset(); return; }
        const timer = setTimeout(() => onReset(), remaining);
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

    return (
        <div className="space-y-8 pb-24 px-2">
            <header className="flex justify-between items-center">
                <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">Profi-Alltag</h2>
                <div className="flex items-center gap-2 bg-slate-900/50 px-4 py-2 rounded-xl border border-slate-800">
                    <Timer className="w-4 h-4 text-slate-500" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Reset: {formatDuration(Math.ceil((player.nextActivityReset! - Date.now()) / 1000))}
                    </span>
                </div>
            </header>

            {/* GROSSER AKTIVER TIMER */}
            {activeDef && activeInstance && (
                <ActiveActivityStatus activeInstance={activeInstance} activityDef={activeDef} durationReduction={durationReduction} />
            )}

            {/* TABS */}
            <div className="flex gap-2 p-1 bg-slate-950/50 rounded-2xl border border-slate-800 w-fit">
                 {(['career', 'training', 'personal'] as const).map((tab) => (
                    <button key={tab} onClick={() => setActiveTab(tab)} className={`px-8 py-2.5 rounded-xl font-black uppercase text-xs transition-all ${activeTab === tab ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>
                        {tab === 'career' ? 'Karriere' : tab === 'training' ? 'Trainingscenter' : 'Arbeiten'}
                    </button>
                ))}
            </div>

            {/* TRAINING CENTER */}
            {activeTab === 'training' && (
                <TrainingCenter player={player} onTrain={onTrain} />
            )}

            {/* AKTIVITÄTS-LISTEN */}
            {activeTab !== 'training' && Object.entries(activityCategorization)
                .filter(([_, config]) => config.tab === activeTab)
                .map(([type, config]) => {
                    const activities = groupedActivities[type as Activity['type']];
                    if (!activities) return null;
                    return (
                        <div key={type} className="space-y-4">
                            <h3 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] flex items-center gap-4">
                                {config.groupTitle} <span className="h-[1px] flex-1 bg-slate-800/50" />
                            </h3>
                            <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                                {activities.map((activity) => {
                                    const isCompleted = player.completedActivityIds?.includes(activity.id);
                                    const canStart = !activeDef && !isCompleted;
                                    const finalTp = activity.type === 'training' ? (activity.reward?.tp || 0) * (1 + tpBonusPercentage) : (activity.reward?.tp || 0);

                                    return (
                                        <div key={activity.id} className={`relative flex flex-col w-[175px] bg-slate-900 border-2 border-slate-800 rounded-[2.5rem] p-3 transition-all duration-300 ${isCompleted ? 'opacity-40 grayscale' : 'hover:border-slate-600 hover:-translate-y-1'}`}>
                                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex gap-1 z-10">
                                                {finalTp > 0 && <div className="bg-slate-800 px-2 py-1 rounded-lg border border-slate-700 flex items-center gap-1 shadow-lg"><Zap className="w-3 h-3 text-yellow-400" /><span className="text-[10px] font-black text-white">+{finalTp.toFixed(1)}</span></div>}
                                                {activity.reward?.euro && <div className="bg-slate-800 px-2 py-1 rounded-lg border border-slate-700 flex items-center gap-1 shadow-lg"><Euro className="w-3 h-3 text-emerald-400" /><span className="text-[10px] font-black text-white">+{activity.reward.euro}</span></div>}
                                            </div>
                                            <div className="mt-4 mb-2 text-center h-10 flex items-center justify-center px-1"><h4 className="text-[11px] font-black text-white leading-tight uppercase italic tracking-tighter">{activity.name}</h4></div>
                                            <div className="relative h-24 w-full bg-slate-950/50 rounded-2xl flex items-center justify-center border border-white/5 mb-3 overflow-hidden shadow-inner">
                                                <ActivityGraphic type={activity.type} color={config.color} />
                                                <div className="absolute bottom-1.5 inset-x-0 text-center">
                                                    <span className="text-[8px] font-bold text-slate-500 uppercase tracking-tighter">{formatDuration(activity.durationSeconds * (1 - durationReduction))}</span>
                                                </div>
                                            </div>
                                            <button onClick={() => onStart(activity.id)} disabled={!canStart} className={`w-full py-2.5 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all ${isCompleted ? 'bg-slate-800 text-slate-600' : canStart ? 'bg-blue-600 text-white hover:bg-blue-500 shadow-md' : 'bg-slate-800 text-slate-700'}`}>
                                                {isCompleted ? <ShieldCheck className="w-4 h-4 mx-auto" /> : 'Starten'}
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
        </div>
    );
});