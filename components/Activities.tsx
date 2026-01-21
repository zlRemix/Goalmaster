
import React, { useState, useEffect } from 'react';
import { Player } from '../types';

interface ActivityDefinition {
  id: string;
  title: string;
  description: string;
  icon: string;
  durationSeconds: number;
  tpReward: number;
  xpReward: number;
  color: string;
  category: string;
}

const DAILY_ACTIVITIES: ActivityDefinition[] = [
  {
    id: 'video_analysis',
    title: 'Gegner-Analyse',
    description: 'Analysiere die Laufwege der gegnerischen Abwehr.',
    icon: '📺',
    durationSeconds: 30,
    tpReward: 6,
    xpReward: 15,
    color: 'bg-blue-500',
    category: 'Analyse'
  },
  {
    id: 'mobility_drill',
    title: 'Mobilitäts-Zirkel',
    description: 'Dehnübungen zur Vorbeugung von Verletzungen.',
    icon: '🧘',
    durationSeconds: 45,
    tpReward: 8,
    xpReward: 20,
    color: 'bg-emerald-500',
    category: 'Fitness'
  },
  {
    id: 'physio',
    title: 'Physiotherapie',
    description: 'Lockern der Muskulatur nach hoher Belastung.',
    icon: '💆',
    durationSeconds: 120,
    tpReward: 20,
    xpReward: 50,
    color: 'bg-emerald-600',
    category: 'Fitness'
  },
  {
    id: 'tactics_meeting',
    title: 'Taktik-Briefing',
    description: 'Besprechung der neuen Eckball-Varianten.',
    icon: '📋',
    durationSeconds: 180,
    tpReward: 35,
    xpReward: 90,
    color: 'bg-amber-500',
    category: 'Taktik'
  },
  {
    id: 'press_conference',
    title: 'Pressekonferenz',
    description: 'Stell dich den Fragen der Journalisten vor dem Derby.',
    icon: '🎤',
    durationSeconds: 240,
    tpReward: 45,
    xpReward: 120,
    color: 'bg-purple-500',
    category: 'PR'
  },
  {
    id: 'fan_signing',
    title: 'Autogrammstunde',
    description: 'Stärke die Bindung zu deinen treuesten Fans.',
    icon: '✍️',
    durationSeconds: 90,
    tpReward: 15,
    xpReward: 40,
    color: 'bg-purple-400',
    category: 'PR'
  },
  {
    id: 'ice_bath',
    title: 'Eisbad-Session',
    description: 'Optimale Regeneration nach einer harten Einheit.',
    icon: '🧊',
    durationSeconds: 60,
    tpReward: 12,
    xpReward: 30,
    color: 'bg-cyan-500',
    category: 'Fitness'
  },
  {
    id: 'sponsor_shoot',
    title: 'Sponsoren-Shooting',
    description: 'Aufnahmen für die neue Werbekampagne des Vereins.',
    icon: '📸',
    durationSeconds: 300,
    tpReward: 60,
    xpReward: 180,
    color: 'bg-indigo-500',
    category: 'PR'
  },
  {
    id: 'individual_training',
    title: 'Einzeltraining',
    description: 'Intensive Sonderschicht mit dem Co-Trainer.',
    icon: '⚽',
    durationSeconds: 420,
    tpReward: 85,
    xpReward: 250,
    color: 'bg-orange-500',
    category: 'Taktik'
  },
  {
    id: 'team_dinner',
    title: 'Team-Abend',
    description: 'Gemeinsames Abendessen zur Stärkung des Teamgeists.',
    icon: '🍕',
    durationSeconds: 600,
    tpReward: 120,
    xpReward: 400,
    color: 'bg-rose-500',
    category: 'Soziales'
  }
];

interface ActivitiesProps {
  player: Player;
  onComplete: (id: string, tp: number) => void;
}

export const Activities: React.FC<ActivitiesProps> = ({ player, onComplete }) => {
  const [activeActivityId, setActiveActivityId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 10000);
    return () => clearInterval(timer);
  }, []);

  const getStatus = (id: string) => {
    if (!player.lastActivities) return 'available';
    const lastTimestamp = player.lastActivities[id];
    if (!lastTimestamp) return 'available';
    
    const now = new Date(currentTime);
    const last = new Date(lastTimestamp);

    const isSameHour = 
      now.getFullYear() === last.getFullYear() &&
      now.getMonth() === last.getMonth() &&
      now.getDate() === last.getDate() &&
      now.getHours() === last.getHours();

    if (isSameHour) {
      const nextHour = new Date(currentTime);
      nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0);
      const remainingMinutes = Math.ceil((nextHour.getTime() - currentTime) / 60000);
      return { status: 'cooldown', remainingMinutes };
    }
    
    return 'available';
  };

  useEffect(() => {
    let interval: any;
    if (activeActivityId) {
      const activity = DAILY_ACTIVITIES.find(a => a.id === activeActivityId)!;
      const step = 100 / (activity.durationSeconds * 10); 

      interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            onComplete(activeActivityId, activity.tpReward);
            setActiveActivityId(null);
            setProgress(0);
            return 100;
          }
          return prev + step;
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [activeActivityId, onComplete]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const startActivity = (id: string) => {
    const status = getStatus(id);
    if (status === 'available' && !activeActivityId) {
      setActiveActivityId(id);
      setProgress(0);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black">Profi-Alltag</h2>
          <p className="text-slate-400">Nutze jede Minute deines Tages für Karriere & Erfahrung.</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Nächster Reset</p>
          <p className="text-emerald-500 font-mono font-bold text-sm">
            in {60 - new Date(currentTime).getMinutes()} Min.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {DAILY_ACTIVITIES.map((activity) => {
          const status = getStatus(activity.id);
          const isAvailable = status === 'available';
          const isActive = activeActivityId === activity.id;
          const isLockedByOther = activeActivityId !== null && !isActive;

          const remainingSeconds = isActive 
            ? Math.ceil(activity.durationSeconds * (1 - progress / 100)) 
            : activity.durationSeconds;

          return (
            <div 
              key={activity.id} 
              className={`bg-slate-800 rounded-[2.5rem] p-8 border border-slate-700 flex flex-col justify-between shadow-2xl transition-all relative overflow-hidden group ${
                !isAvailable ? 'opacity-50 grayscale bg-slate-900/50' : ''
              }`}
            >
              <div className="absolute -right-6 -top-6 text-7xl opacity-5 group-hover:scale-110 transition-transform select-none">
                {activity.icon}
              </div>

              <div>
                <div className="flex justify-between items-start mb-6">
                  <div className="text-4xl p-4 bg-slate-900 rounded-3xl border border-slate-700 shadow-inner">
                    {activity.icon}
                  </div>
                  <div className="text-right">
                    <p className="text-emerald-400 font-black text-xl">+{activity.tpReward} TP</p>
                    <p className="text-blue-400 font-black text-xs">+{activity.xpReward} XP</p>
                    <span className="text-[8px] bg-slate-900 px-2 py-0.5 rounded-full border border-slate-700 text-slate-500 font-black uppercase mt-1 inline-block">
                      {activity.category}
                    </span>
                  </div>
                </div>
                <h3 className="text-xl font-black mb-2">{activity.title}</h3>
                <p className="text-xs text-slate-400 mb-8 leading-relaxed font-medium">
                  {activity.description}
                </p>
              </div>

              <div className="mt-auto">
                {isActive ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center px-1">
                       <p className="text-[10px] text-slate-500 font-black tracking-widest uppercase">Einheit läuft</p>
                       <p className="text-xs font-mono text-emerald-400 font-black">{formatTime(remainingSeconds)}</p>
                    </div>
                    <div className="h-2.5 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800 p-0.5">
                      <div 
                        className={`h-full ${activity.color} rounded-full transition-all duration-100 ease-linear shadow-[0_0_15px_rgba(16,185,129,0.2)]`}
                        style={{ width: `${progress}%` }} 
                      />
                    </div>
                  </div>
                ) : typeof status === 'object' ? (
                  <div className="w-full py-4 bg-slate-900/50 rounded-2xl text-center border border-slate-800">
                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
                      Reset um { (new Date(currentTime).getHours() + 1) % 24 }:00 Uhr
                    </p>
                  </div>
                ) : (
                  <button
                    disabled={isLockedByOther}
                    onClick={() => startActivity(activity.id)}
                    className={`w-full py-4 rounded-2xl font-black transition-all transform active:scale-95 flex items-center justify-center gap-3 shadow-lg ${
                      isLockedByOther 
                      ? 'bg-slate-700 text-slate-500 cursor-not-allowed opacity-50' 
                      : `bg-emerald-600 hover:bg-emerald-500 text-white`
                    }`}
                  >
                    <span className="text-sm uppercase tracking-tight">Einheit starten</span>
                    <span className="text-[10px] opacity-70 font-mono">{formatTime(activity.durationSeconds)}</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-slate-900/50 p-8 rounded-[2rem] border border-slate-800 flex items-center gap-8">
        <div className="h-16 w-16 bg-blue-500/10 rounded-2xl flex items-center justify-center text-3xl border border-blue-500/20 shadow-lg">
          📈
        </div>
        <div className="flex-1">
          <h4 className="font-black text-white uppercase tracking-tight text-lg mb-1">Karriere-Turbo</h4>
          <p className="text-xs text-slate-500 leading-relaxed font-medium uppercase tracking-tight">
            Aktivitäten sind die beste Quelle für <strong>Karriere-XP</strong>. Jedes Level-Up schenkt dir massenhaft <strong>TP</strong>, die du sofort in deine Skills investieren kannst. Maximiere deinen Tag!
          </p>
        </div>
      </div>
    </div>
  );
};
