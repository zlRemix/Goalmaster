import React, { useState, useEffect, useMemo } from 'react';
import { Club, Player, PlayerPosition } from '../types';
import { dataService } from '../services/dataService';
import { getSkillsForPosition } from '../utils';
import { MAX_CLUB_PLAYERS } from '../constants';
import { Check, X, Plus, Minus, Ban, Info, Rocket, Users, Shield, Hand, Mail } from 'lucide-react';
import { TacticSelection } from './TacticSelection';
import { MentalitySelection } from './MentalitySelection';

// --- HILFSKOMPONENTEN ---

const PositionIcon: React.FC<{ position: PlayerPosition, className?: string }> = ({ position, className = 'w-5 h-5' }) => {
    const icons: Record<PlayerPosition, React.ElementType> = {
        'Stürmer': Rocket,
        'Mittelfeld': Users,
        'Abwehr': Shield,
        'Torwart': Hand,
    };
    const Icon = icons[position];
    return Icon ? <Icon className={className} /> : null;
};

const getOverall = (p: Player) => {
    const relevantSkills = getSkillsForPosition(p.position);
    if (!p.skills || relevantSkills.length === 0) return 0;
    const totalSkill = relevantSkills.reduce((sum, s) => sum + (p.skills[s] || 0), 0);
    return Math.round(totalSkill / relevantSkills.length);
};

const PlayerCard: React.FC<{ 
    player: Player; 
    children: React.ReactNode; 
    isClubPlayer?: boolean; 
    club?: Club 
}> = ({ player, children, isClubPlayer, club }) => (
    <div className="bg-slate-900 border border-slate-800 rounded-[2rem] overflow-hidden transition-all hover:border-slate-700 shadow-xl group">
        {/* Obere Sektion: Basis-Infos */}
        <div className="flex items-center justify-between p-4 gap-4 bg-gradient-to-b from-white/[0.02] to-transparent">
            <div className="flex items-center gap-4 min-w-0">
                <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center border border-white/5 shrink-0 group-hover:scale-105 transition-transform">
                    <PositionIcon position={player.position} className="w-6 h-6 text-blue-400" />
                </div>
                <div className="min-w-0">
                    <h4 className="font-black text-white italic uppercase tracking-tighter truncate text-lg leading-tight">
                        {player.name}
                    </h4>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                        Level {player.level}
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-6 shrink-0">
                <div className="text-right">
                    <p className="text-3xl font-black text-blue-400 italic leading-none tabular-nums">
                        {getOverall(player)}
                    </p>
                    <p className="text-[8px] font-black text-slate-600 uppercase text-center">GES</p>
                </div>
                <div className="min-w-[120px] flex justify-end">
                    {children}
                </div>
            </div>
        </div>

        {/* Untere Sektion: Mentalität (Segmented Control Design) */}
        {isClubPlayer && club && (
            <div className="px-4 pb-4 pt-2 bg-slate-950/40 border-t border-white/5">
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-1 h-3 bg-blue-500 rounded-full" />
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Individuelle Mentalität</span>
                    </div>
                    <div className="bg-slate-900/50 rounded-2xl p-1 border border-white/[0.02]">
                         <MentalitySelection player={player} />
                    </div>
                </div>
            </div>
        )}
    </div>
);

// --- HAUPTKOMPONENTE ---

interface ClubManagementProps {
  club: Club;
}

export const ClubManagement: React.FC<ClubManagementProps> = ({ club }) => {
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = dataService.listenToAllPlayers((players) => {
      setAllPlayers(players);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const { clubPlayers, applicants, freeAgents } = useMemo(() => {
      const clubPlayerIds = new Set(club.players || []);
      const applicantIds = new Set(club.pendingApplications || []);
      
      const clubPlayers: Player[] = [];
      const applicants: Player[] = [];
      const freeAgents: Player[] = [];

      allPlayers.forEach(p => {
          if(clubPlayerIds.has(p.id)) {
              clubPlayers.push(p);
          } else if (applicantIds.has(p.id)) {
              applicants.push(p);
          } else if (!p.clubId) {
              freeAgents.push(p);
          }
      });

      return { clubPlayers, applicants, freeAgents };
  }, [allPlayers, club]);

  const handleAccept = (playerId: string) => dataService.acceptApplication(club.id, playerId).catch(e => console.error(e));
  const handleReject = (playerId: string) => dataService.rejectApplication(club.id, playerId).catch(e => console.error(e));
  const handleInvite = (playerId: string) => dataService.invitePlayer(club.id, playerId).catch(e => console.error(e));
  const handleCancelInvite = (playerId: string) => dataService.cancelInvitation(playerId).catch(e => console.error(e));

  const isClubFull = (club.players?.length || 0) >= MAX_CLUB_PLAYERS;

  if (loading) {
    return (
        <div className="flex flex-col items-center justify-center p-20 space-y-4">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-black text-slate-500 uppercase tracking-widest italic">Lade Management-Daten...</p>
        </div>
    );
  }

  return (
    <div className="space-y-12 animate-in fade-in duration-500 pb-20">
      <TacticSelection club={club} />

      {/* SEKTION: MEIN KADER */}
      <section className="space-y-4">
        <div className="flex items-center gap-4 px-2">
            <h3 className="text-xl md:text-2xl font-black text-white italic uppercase tracking-tighter shrink-0">Mein Kader</h3>
            <div className="h-[1px] w-full bg-gradient-to-r from-slate-800 to-transparent" />
            <span className="text-[10px] font-black text-slate-500 uppercase shrink-0">{clubPlayers.length} / {MAX_CLUB_PLAYERS}</span>
        </div>
        
        {clubPlayers.length > 0 ? (
            <div className="grid grid-cols-1 gap-3">
                {clubPlayers.map(player => (
                    <PlayerCard key={player.id} player={player} isClubPlayer={true} club={club}>
                        <div className="flex items-center gap-2 text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20">
                            <Check className="w-3 h-3" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Kader</span>
                        </div>
                    </PlayerCard>
                ))}
            </div>
        ) : (
            <div className="text-center py-10 bg-slate-900/50 rounded-[2rem] border-2 border-dashed border-slate-800">
                 <p className="text-slate-600 font-black uppercase italic tracking-widest">Kader leer</p>
            </div>
        )}
      </section>

      {/* SEKTION: BEWERBUNGEN */}
      <section className="space-y-4">
        <div className="flex items-center gap-4 px-2">
            <h3 className="text-xl md:text-2xl font-black text-white italic uppercase tracking-tighter shrink-0">Bewerbungen</h3>
            <div className="h-[1px] w-full bg-gradient-to-r from-slate-800 to-transparent" />
            <span className={`text-[10px] font-black uppercase shrink-0 ${applicants.length > 0 ? 'text-blue-400' : 'text-slate-500'}`}>{applicants.length} Neu</span>
        </div>

        {applicants.length > 0 ? (
          <div className="grid grid-cols-1 gap-3">
            {applicants.map(player => (
              <PlayerCard key={player.id} player={player}>
                {!isClubFull ? (
                    <div className="flex gap-2">
                        <button onClick={() => handleAccept(player.id)} className="bg-emerald-500 hover:bg-emerald-400 text-white font-black uppercase text-[10px] py-2 px-4 rounded-xl transition-all active:scale-95 flex items-center gap-2 shadow-lg shadow-emerald-900/20">
                            <Check className="h-3 w-3" /> Annehmen
                        </button>
                        <button onClick={() => handleReject(player.id)} className="bg-slate-800 hover:bg-rose-500 text-white font-black uppercase text-[10px] py-2 px-4 rounded-xl transition-all active:scale-95 flex items-center gap-2">
                            <X className="h-3 w-3" /> Ablehnen
                        </button>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 text-rose-500 font-black uppercase text-[10px] bg-rose-500/10 px-4 py-2 rounded-xl border border-rose-500/20 italic">
                        <Ban className="h-3 w-3"/> Voll
                    </div>
                )}
              </PlayerCard>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 bg-slate-900/50 rounded-[2rem] border-2 border-dashed border-slate-800">
            <p className="text-slate-600 font-black uppercase italic tracking-widest">Keine Bewerbungen</p>
          </div>
        )}
      </section>

      {/* SEKTION: TRANSFERMARKT */}
      <section className="space-y-4">
        <div className="flex items-center gap-4 px-2">
            <h3 className="text-xl md:text-2xl font-black text-white italic uppercase tracking-tighter shrink-0">Transfermarkt</h3>
            <div className="h-[1px] w-full bg-gradient-to-r from-slate-800 to-transparent" />
            <span className="text-[10px] font-black text-slate-500 uppercase shrink-0">{freeAgents.length} Verfügbar</span>
        </div>

         {freeAgents.length > 0 ? (
            <div className="grid grid-cols-1 gap-3">
                {freeAgents.map(player => {
                    const isInvited = player.pendingClubInvitation === club.id;
                    const isOccupied = !!player.pendingClubInvitation && !isInvited;

                    return (
                    <PlayerCard key={player.id} player={player}>
                        {isInvited ? (
                        <button onClick={() => handleCancelInvite(player.id)} className="bg-amber-500/10 hover:bg-amber-500 text-amber-500 hover:text-white border border-amber-500/20 font-black uppercase text-[10px] py-2 px-4 rounded-xl transition-all w-full flex items-center justify-center gap-2">
                            <Minus className="h-3 w-3" /> Zurückziehen
                        </button>
                        ) : isOccupied ? (
                        <div className="flex items-center gap-2 text-slate-500 font-black uppercase text-[10px] italic bg-slate-950 px-4 py-2 rounded-xl border border-white/5">
                            <Mail className="h-3 w-3"/> Eingeladen
                        </div>
                        ) : isClubFull ? (
                        <div className="flex items-center gap-2 text-rose-500 font-black uppercase text-[10px] italic bg-rose-500/10 px-4 py-2 rounded-xl border border-rose-500/20">
                            <Ban className="h-3 w-3"/> Voll
                        </div>
                        ) : (
                        <button onClick={() => handleInvite(player.id)} className="bg-blue-600 hover:bg-blue-500 text-white font-black uppercase text-[10px] py-2 px-6 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20 w-full">
                            <Plus className="h-3 w-3" /> Einladen
                        </button>
                        )}
                    </PlayerCard>
                    );
                })}
            </div>
         ) : (
            <div className="text-center py-10 bg-slate-900/50 rounded-[2rem] border-2 border-dashed border-slate-800">
                <p className="text-slate-600 font-black uppercase italic tracking-widest">Keine freien Spieler</p>
            </div>
         )}
      </section>
    </div>
  );
};