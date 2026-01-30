import React, { useState, useEffect, useMemo } from 'react';
import { Club, Player, PlayerPosition } from '../types';
import { dataService } from '../services/dataService';
import { getSkillsForPosition } from '../utils';
import { MAX_CLUB_PLAYERS } from '../constants';
import { Check, X, Plus, Minus, Ban, Info, Rocket, Users, Shield, Hand } from 'lucide-react';
import { TacticSelection } from './TacticSelection';
import { MentalitySelection } from './MentalitySelection';

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

const PlayerCard: React.FC<{ player: Player; children: React.ReactNode, isClubPlayer?: boolean, club?: Club }> = ({ player, children, isClubPlayer, club }) => (
    <div className="bg-slate-900/50 rounded-lg border border-slate-700/50">
        <div className="grid grid-cols-[auto,1fr,auto] items-center p-2 md:p-3 gap-3">
            <div className="w-7 h-7 md:w-8 md:h-8 flex items-center justify-center bg-slate-700 rounded-full flex-shrink-0">
                <PositionIcon position={player.position} className="w-4 h-4 md:w-5 md:h-5 text-slate-300" />
            </div>
            <div>
                <p className="font-bold text-white text-sm md:text-base">{player.name}</p>
                <p className="text-xs text-slate-400">Level {player.level}</p>
            </div>
            <div className="flex items-center gap-2 md:gap-4">
                <div className="text-right w-12">
                    <p className="font-black text-base md:text-xl text-yellow-400">{getOverall(player)}</p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase">GES</p>
                </div>
                <div className="w-48 text-right">
                    {children}
                </div>
            </div>
        </div>
        {isClubPlayer && club && (
            <div className="p-3 border-t border-slate-700/50">
                 <MentalitySelection player={player} />
            </div>
        )}
    </div>
);


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
    return <div className="text-center p-10"><p className="text-lg font-bold text-slate-400 animate-pulse">Lade Spielerdaten...</p></div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <TacticSelection club={club} />

    <section>
        <h3 className="text-xl md:text-2xl font-black mb-4">Mein Kader ({clubPlayers.length}/{MAX_CLUB_PLAYERS})</h3>
        {clubPlayers.length > 0 ? (
            <div className="space-y-3">
                {clubPlayers.map(player => (
                    <PlayerCard key={player.id} player={player} isClubPlayer={true} club={club}>
                        <></>
                    </PlayerCard>
                ))}
            </div>
        ) : (
            <div className="text-center py-6 bg-slate-800/50 rounded-lg border border-dashed border-slate-700">
                 <p className="text-slate-400 font-semibold">Dein Kader ist leer.</p>
            </div>
        )}
    </section>

      <section>
        <h3 className="text-xl md:text-2xl font-black mb-4">Eingegangene Bewerbungen ({applicants.length})</h3>
        {applicants.length > 0 ? (
          <div className="space-y-3">
            {applicants.map(player => (
              <PlayerCard key={player.id} player={player}>
                {!isClubFull ? (
                    <div className="flex gap-2 justify-end">
                        <button onClick={() => handleAccept(player.id)} className="flex items-center justify-center gap-1.5 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-3 rounded-lg text-xs transition-colors"> <Check className="h-4 w-4" /> Annehmen</button>
                        <button onClick={() => handleReject(player.id)} className="flex items-center justify-center gap-1.5 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-3 rounded-lg text-xs transition-colors"><X className="h-4 w-4" /> Ablehnen</button>
                    </div>
                ) : (
                    <div className="flex items-center justify-end gap-2 text-red-500 font-bold text-sm px-4"><Ban className="h-4 w-4"/> Kader voll</div>
                )}
              </PlayerCard>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 bg-slate-800/50 rounded-lg border border-dashed border-slate-700">
            <p className="text-slate-400 font-semibold">Aktuell liegen keine Bewerbungen vor.</p>
          </div>
        )}
      </section>

      <section>
        <h3 className="text-xl md:text-2xl font-black mb-4">Vereinslose Spieler ({freeAgents.length})</h3>
         {freeAgents.length > 0 ? (
            <div className="space-y-3">
                {freeAgents.map(player => {
                    const hasBeenInvitedByThisClub = player.pendingClubInvitation === club.id;
                    const hasOtherInvite = !!player.pendingClubInvitation && player.pendingClubInvitation !== club.id;

                    return (
                    <PlayerCard key={player.id} player={player}>
                        {hasBeenInvitedByThisClub ? (
                        <button onClick={() => handleCancelInvite(player.id)} className="w-full flex items-center justify-center gap-1.5 bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-3 rounded-lg text-xs transition-colors"><Minus className="h-4 w-4" /> Zurückziehen</button>
                        ) : hasOtherInvite ? (
                        <div className="flex items-center justify-end gap-2 text-slate-500 font-bold text-xs px-4"><Info className="h-4 w-4"/> Hat andere Einladung</div>
                        ) : isClubFull ? (
                        <div className="flex items-center justify-end gap-2 text-red-500 font-bold text-sm px-4"><Ban className="h-4 w-4"/> Kader voll</div>
                        ) : (
                        <button onClick={() => handleInvite(player.id)} className="w-full flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-3 rounded-lg text-xs transition-colors"><Plus className="h-4 w-4" /> Einladen</button>
                        )}
                    </PlayerCard>
                    );
                })}
            </div>
         ) : (
            <div className="text-center py-6 bg-slate-800/50 rounded-lg border border-dashed border-slate-700">
                <p className="text-slate-400 font-semibold">Keine vereinslosen Spieler gefunden.</p>
            </div>
         )}
      </section>
    </div>
  );
};