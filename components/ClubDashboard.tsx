
import React, { useState, useEffect, useMemo } from 'react';
import { Club, Player, PendingUpgrade } from '../types';
import { INFRA_UPGRADE_COSTS, INFRA_LEVEL_BENEFITS } from '../constants';

interface ClubDashboardProps {
  club: Club | null;
  player: Player;
  onUpgrade: (clubId: string, type: keyof Club['infrastructure']) => void;
  onTeamTraining: (clubId: string) => void;
  onJoin: (clubId: string) => void;
  availableClubs: Club[];
}

export const ClubDashboard: React.FC<ClubDashboardProps> = ({ club, player, onUpgrade, onTeamTraining, onJoin, availableClubs }) => {
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [expandedInfra, setExpandedInfra] = useState<string | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const isMyClub = club ? player.clubId === club.id : false;
  const isPlayerRole = player.roles.includes('player' as any);

  const squad = useMemo(() => {
    if (!club) return [];
    const names = ["Müller", "Schmidt", "Schneider", "Fischer", "Weber", "Meyer", "Wagner", "Becker", "Schulz", "Hoffmann", "Schäfer", "Koch", "Bauer", "Richter", "Klein", "Wolf", "Schröder", "Neumann", "Schwarz", "Zimmermann"];
    const firstNames = ["Lukas", "Max", "Julian", "Leon", "Finn", "Paul", "Jonas", "Erik", "Nico", "Tim", "Kevin", "Dennis", "Marco", "Sven", "Felix"];
    const maxSquadSize = 5;
    const aiCount = (isMyClub && isPlayerRole) ? maxSquadSize - 1 : maxSquadSize;
    const aiPlayers = [];
    const positions = ["TW", "AW", "MF", "ST", "AW"];
    for (let i = 0; i < aiCount; i++) {
      const nameIdx = (club.id.charCodeAt(i % club.id.length) + i) % names.length;
      const firstNameIdx = (club.id.charCodeAt((i + 1) % club.id.length) + i) % firstNames.length;
      const baseRating = 12 + (club.infrastructure.youthAcademy * 0.5);
      const ratingVariance = (club.id.charCodeAt(i % club.id.length) % 6) - 2;
      aiPlayers.push({
        name: `${firstNames[firstNameIdx].charAt(0)}. ${names[nameIdx]}`,
        pos: positions[i % positions.length],
        rating: Math.floor(Math.min(20, baseRating + ratingVariance)),
        isUser: false
      });
    }
    return aiPlayers;
  }, [club, isMyClub, isPlayerRole]);

  const formatRemainingTime = (ms: number) => {
    if (ms <= 0) return "00:00:00";
    const days = Math.floor(ms / (24 * 3600000));
    const h = Math.floor((ms % (24 * 3600000)) / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    
    if (days > 0) return `${days}d ${h}h ${m}m`;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (!club) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="text-center py-12">
          <h2 className="text-3xl font-black mb-2">Verein suchen</h2>
          <p className="text-slate-500">Du bist aktuell vereinslos. Wähle einen Verein, um deine Karriere zu starten!</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {availableClubs.map(c => {
            const isFull = c.players.length >= 5;
            return (
              <div key={c.id} className={`bg-slate-800 p-8 rounded-[2rem] border border-slate-700 flex items-center justify-between group transition-all ${!isFull ? 'hover:border-emerald-500/50' : 'opacity-75'}`}>
                <div className="flex items-center gap-6">
                  <div className="text-5xl">{c.logo}</div>
                  <div>
                    <h3 className="text-xl font-bold">{c.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs text-slate-500">Manager: {c.managerName}</p>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${isFull ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-slate-900 text-slate-400 border border-slate-700'}`}>
                        {c.players.length}/5 Spieler
                      </span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => onJoin(c.id)} 
                  disabled={isFull}
                  className={`px-6 py-3 rounded-xl font-black text-xs uppercase transition-all shadow-lg ${isFull ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-500 text-white'}`}
                >
                  {isFull ? 'Voll' : 'Beitreten'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  const isManager = club.managerId === player.id;
  const infraItems = [
    { key: 'stadium' as const, label: 'Stadion', icon: '🏟️', description: 'Heimspiel-Einnahmen.', benefits: INFRA_LEVEL_BENEFITS.stadium },
    { key: 'trainingGround' as const, label: 'Trainingszentrum', icon: '⚽', description: 'TP-Bonus pro Einheit.', benefits: INFRA_LEVEL_BENEFITS.trainingGround },
    { key: 'medicalCenter' as const, label: 'Physiotherapie', icon: '🏥', description: 'Regeneration.', benefits: INFRA_LEVEL_BENEFITS.medicalCenter },
    { key: 'youthAcademy' as const, label: 'Jugendschmiede', icon: '🎓', description: 'XP-Bonus pro Training.', benefits: INFRA_LEVEL_BENEFITS.youthAcademy },
    { key: 'marketingOffice' as const, label: 'Marketing', icon: '📢', description: 'Tägliche Einnahmen.', benefits: INFRA_LEVEL_BENEFITS.marketingOffice },
  ];

  const BASE_COOLDOWN_MS = 14400000;
  const reductionMap = [0, 0, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.4, 0.45, 0.5];
  const currentMedicalLevel = club.infrastructure.medicalCenter;
  const reduction = reductionMap[currentMedicalLevel] || 0;
  const COOLDOWN_MS = BASE_COOLDOWN_MS * (1 - reduction);

  const lastTraining = club.lastTeamTraining || 0;
  const nextTraining = lastTraining + COOLDOWN_MS;
  const canTrainTeam = currentTime >= nextTraining;
  const remainingCooldown = Math.max(0, nextTraining - currentTime);

  const MAX_LEVEL = 10;

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      <header className="bg-gradient-to-br from-slate-800 to-slate-900 p-8 rounded-[2.5rem] border border-slate-700 shadow-2xl relative overflow-hidden">
        {!isMyClub && <div className="absolute top-4 right-4 bg-slate-900/80 px-4 py-1 rounded-full border border-slate-700 text-[10px] font-black uppercase text-slate-500">Fremdansicht</div>}
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
          <div className="h-32 w-32 bg-slate-900 rounded-full flex items-center justify-center text-6xl shadow-inner border-4 border-slate-700"><span>{club.logo}</span></div>
          <div className="text-center md:text-left flex-1">
            <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
              <h2 className="text-4xl font-black tracking-tight">{club.name}</h2>
              {isManager && <span className="bg-amber-500/10 text-amber-500 text-[10px] font-black px-2 py-0.5 rounded border border-amber-500/20 uppercase">Manager</span>}
            </div>
            <p className="text-slate-400 font-medium">Vereinsführung: <span className="text-white font-bold">{club.managerName}</span></p>
            <div className="mt-6 flex flex-wrap gap-3 justify-center md:justify-start">
              <div className="bg-slate-950/80 px-4 py-2 rounded-xl border border-slate-800 flex items-center gap-2">
                <span className="text-emerald-500">💰</span>
                <p className="text-lg font-mono text-emerald-400">{club.budget.toLocaleString()} €</p>
              </div>
              <div className="bg-slate-950/80 px-4 py-2 rounded-xl border border-slate-800 flex items-center gap-2">
                <span className="text-slate-500">👥</span>
                <p className="text-lg font-mono text-white">{club.players.length}/5 Kader</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-2xl font-black uppercase tracking-tight flex items-center gap-3 text-slate-200">
            <span className="p-2 bg-slate-800 rounded-xl">🏗️</span> Infrastruktur & Ausbau
          </h3>
          <div className="grid grid-cols-1 gap-4">
            {infraItems.map((item) => {
              const currentLevel = club.infrastructure[item.key as keyof typeof club.infrastructure];
              const cost = INFRA_UPGRADE_COSTS[currentLevel];
              const isExpanded = expandedInfra === item.key;
              const pendingUpgrade = club.pendingUpgrades?.find(u => u.type === item.key);
              
              const progressPercent = pendingUpgrade 
                ? Math.min(100, Math.max(0, ((currentTime - pendingUpgrade.startTime) / (pendingUpgrade.endTime - pendingUpgrade.startTime)) * 100))
                : 0;

              return (
                <div key={item.key} className={`bg-slate-800 rounded-3xl border border-slate-700 overflow-hidden transition-all duration-300 ${isExpanded ? 'ring-2 ring-emerald-500/50' : ''}`}>
                  <div className="p-5 flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1 cursor-pointer" onClick={() => setExpandedInfra(isExpanded ? null : item.key)}>
                      <div className="text-3xl p-3 bg-slate-900 rounded-2xl border border-slate-700 shadow-inner group-hover:scale-110 transition-transform">{item.icon}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-black text-lg text-white">{item.label}</h4>
                          {pendingUpgrade && <span className="text-[10px] font-black text-amber-500 animate-pulse bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">IM BAU</span>}
                        </div>
                        <div className="flex items-center gap-2">
                           <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded">Level {currentLevel}</span>
                           <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{item.description}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      {isManager && currentLevel < MAX_LEVEL && !pendingUpgrade && (
                        <div className="flex flex-col items-end">
                          <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Ausbau: {cost.toLocaleString()} €</p>
                          <button onClick={() => onUpgrade(club.id, item.key)} disabled={club.budget < cost} className="bg-emerald-600 hover:bg-emerald-500 px-4 py-2 rounded-xl text-white font-black text-xs disabled:opacity-50 transition-all flex items-center gap-2">
                            <span>UPGRADE</span>
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
                          </button>
                        </div>
                      )}

                      {pendingUpgrade && (
                        <div className="flex flex-col items-end min-w-[120px]">
                          <p className="text-[9px] font-black text-amber-500 uppercase mb-1">Fertig in: {formatRemainingTime(pendingUpgrade.endTime - currentTime)}</p>
                          <div className="w-full h-4 bg-slate-950 rounded-lg overflow-hidden border border-slate-700 p-0.5 relative">
                            <div 
                              className="h-full bg-gradient-to-r from-amber-600 to-amber-400 transition-all duration-1000 rounded-sm"
                              style={{ width: `${progressPercent}%` }}
                            />
                            {/* Animated stripes for construction feel */}
                            <div className="absolute inset-0 opacity-20 pointer-events-none bg-[length:20px_20px] bg-[linear-gradient(45deg,rgba(0,0,0,1)_25%,transparent_25%,transparent_50%,rgba(0,0,0,1)_50%,rgba(0,0,0,1)_75%,transparent_75%,transparent)] animate-[scroll_1s_linear_infinite]" />
                          </div>
                        </div>
                      )}

                      <button onClick={() => setExpandedInfra(isExpanded ? null : item.key)} className={`p-2 rounded-lg transition-colors ${isExpanded ? 'bg-emerald-500/20 text-emerald-500' : 'bg-slate-900 text-slate-500 hover:text-white'}`}>
                        <svg className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-5 pb-6 pt-2 border-t border-slate-700/50 bg-slate-900/30 animate-in slide-in-from-top-4 duration-300">
                      <div className="grid grid-cols-1 gap-2">
                        {item.benefits.map((b) => {
                          const isLevelReached = currentLevel >= b.level;
                          const isNextLevel = currentLevel + 1 === b.level;
                          return (
                            <div key={b.level} className={`flex items-center justify-between p-3 rounded-xl border ${
                              isLevelReached 
                                ? 'bg-emerald-500/5 border-emerald-500/20' 
                                : isNextLevel 
                                  ? 'bg-slate-800 border-amber-500/30' 
                                  : 'bg-slate-950/50 border-slate-800 opacity-40'
                            }`}>
                              <div className="flex items-center gap-4">
                                <span className={`text-[10px] font-black w-6 h-6 rounded flex items-center justify-center ${isLevelReached ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-500'}`}>
                                  {b.level}
                                </span>
                                <span className={`text-xs font-bold ${isLevelReached ? 'text-slate-100' : 'text-slate-500'}`}>
                                  {b.benefit}
                                </span>
                              </div>
                              {isLevelReached && <span className="text-emerald-500">✓</span>}
                              {isNextLevel && isManager && (
                                <span className="text-[9px] font-black text-amber-500 uppercase animate-pulse">
                                  {pendingUpgrade ? 'Baut gerade...' : 'Nächster Schritt'}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {isMyClub && (
            <section className="bg-slate-800 rounded-[2.5rem] border border-slate-700 p-8 shadow-xl">
              <h3 className="text-xl font-black uppercase mb-4 flex items-center gap-3">
                <span className="p-2 bg-emerald-500/10 rounded-lg">🚀</span> Team-Training
              </h3>
              {canTrainTeam ? (
                <button onClick={() => onTeamTraining(club.id)} className="w-full py-5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl shadow-xl shadow-emerald-900/20 transition-all transform active:scale-[0.98]">
                  JETZT EINHEIT STARTEN (+25 TP für alle)
                </button>
              ) : (
                <div className="bg-slate-900/80 p-6 rounded-2xl text-center border border-slate-800">
                  <p className="text-[10px] text-slate-500 font-black uppercase mb-1 tracking-widest">Nächste Einheit möglich in</p>
                  <p className="text-3xl font-mono font-black text-amber-500 tracking-tighter">{formatRemainingTime(remainingCooldown)}</p>
                </div>
              )}
              <div className="flex items-center justify-between mt-4 bg-slate-950/50 px-4 py-2 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 font-black uppercase">Medical Center Bonus:</span>
                <span className="text-[10px] text-emerald-500 font-black">-{Math.round(reduction * 100)}% Wartezeit</span>
              </div>
            </section>
          )}
        </div>

        <div className="space-y-6">
          <h3 className="text-2xl font-black uppercase tracking-tight flex items-center gap-3 text-slate-200">
            <span className="p-2 bg-slate-800 rounded-xl">👥</span> Kader-Übersicht
          </h3>
          <div className="bg-slate-800 rounded-[2.5rem] p-6 border border-slate-700 shadow-2xl space-y-3">
             {isMyClub && isPlayerRole && (
               <div className="bg-emerald-600/10 p-5 rounded-3xl border border-emerald-500/30 flex items-center justify-between shadow-lg">
                  <div className="flex items-center gap-4">
                    <img src={player.avatar} className="w-12 h-12 rounded-2xl border-2 border-emerald-500/30 shadow-md" />
                    <div>
                      <p className="font-black text-base text-white">{player.name} <span className="text-[10px] text-emerald-400 opacity-70 ml-1">(DU)</span></p>
                      <p className="text-[10px] text-emerald-400 font-black uppercase tracking-widest">{player.position}</p>
                    </div>
                  </div>
                  <div className="bg-slate-950 px-4 py-2 rounded-xl border border-slate-800 text-sm font-black text-emerald-500 shadow-inner">
                    GES {(player.skills && Object.values(player.skills).length > 0) ? Math.floor(Object.values(player.skills).reduce((a, b) => a + (b || 0), 0) / Object.values(player.skills).length) : 20}
                  </div>
               </div>
             )}

             <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                {squad.map((p, i) => (
                  <div key={i} className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800 flex items-center justify-between hover:bg-slate-800/80 transition-all group cursor-default">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-slate-950 rounded-xl flex items-center justify-center text-xs font-black text-slate-500 group-hover:text-emerald-400 transition-colors border border-slate-800">{p.pos}</div>
                      <p className="font-bold text-slate-300 group-hover:text-white transition-colors">{p.name}</p>
                    </div>
                    <div className="flex items-center gap-4">
                       <div className="h-2 w-16 bg-slate-950 rounded-full overflow-hidden hidden sm:block border border-slate-800">
                          <div className="h-full bg-slate-500/30 group-hover:bg-emerald-500/40 transition-all" style={{ width: `${(p.rating/20)*100}%` }} />
                       </div>
                       <span className="text-xs font-mono font-black text-slate-500 group-hover:text-emerald-500 bg-slate-950 px-3 py-1 rounded-lg border border-slate-800 transition-all">{p.rating}</span>
                    </div>
                  </div>
                ))}
             </div>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes scroll {
          from { background-position: 0 0; }
          to { background-position: 40px 0; }
        }
      `}</style>
    </div>
  );
};
