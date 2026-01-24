import React, { useMemo } from 'react';
import { Fixture, Club } from '../types';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import LeagueTable from './LeagueTable';
import ClubLogo from './ClubLogo'; // Import ClubLogo

interface LeagueViewProps {
  fixtures: Fixture[];
  allClubs: Club[];
}

const LeagueView: React.FC<LeagueViewProps> = ({ fixtures, allClubs }) => {

  const clubsById = useMemo(() => 
    Object.fromEntries(allClubs.map(club => [club.id, club])),
    [allClubs]
  );

  const sortedFixtures = useMemo(() => 
    [...fixtures].sort((a, b) => a.date - b.date),
    [fixtures]
  );

  const isLoading = fixtures.length > 0 && (allClubs.length === 0 || !clubsById[fixtures[0].homeTeam] || !clubsById[fixtures[0].awayTeam]);

  return (
    <div className="space-y-12">
        <LeagueTable fixtures={fixtures} allClubs={allClubs} />

        <div>
            <header>
                <h2 className="text-2xl md:text-3xl font-black">Spielplan</h2>
                <p className="text-slate-400 text-sm md:text-base">Kommende und vergangene Spiele der Liga.</p>
            </header>

            {fixtures.length === 0 && !isLoading ? (
                <div className="mt-4 bg-slate-800/80 p-8 rounded-2xl border border-amber-500/30 text-center">
                    <h3 className="text-lg font-bold text-amber-400">Kein Spielplan gefunden</h3>
                    <p className="text-slate-400 mt-2 text-sm">Es wurde noch kein Spielplan für die Liga erstellt. Gehe zur Liga-Verwaltung, um eine neue Liga zu generieren.</p>
                </div>
            ) : isLoading ? (
                <div className="mt-4 bg-slate-800/80 p-8 rounded-2xl text-center">
                    <h3 className="text-lg font-bold text-emerald-400 animate-pulse">Lade Spieldaten...</h3>
                </div>
            ) : (
                <div className="mt-4 bg-slate-800/80 rounded-2xl border border-slate-700 shadow-lg">
                    <ul className="divide-y divide-slate-700">
                    {sortedFixtures.map((fixture) => {
                        const homeTeam = clubsById[fixture.homeTeam];
                        const awayTeam = clubsById[fixture.awayTeam];
                        
                        if (!homeTeam || !awayTeam) {
                            return (
                                <li key={fixture.id} className="p-4 flex items-center justify-between animate-pulse">
                                    <div className="h-4 bg-slate-700 rounded w-1/3"></div>
                                    <div className="h-4 bg-slate-700 rounded w-1/4"></div>
                                </li>
                            );
                        }

                        const matchDate = new Date(fixture.date);
                        const isHomeTeamBot = homeTeam.ownerId === 'bot_owner';
                        const isAwayTeamBot = awayTeam.ownerId === 'bot_owner';

                        return (
                        <li key={fixture.id} className="p-4 flex items-center justify-between hover:bg-slate-800 transition-colors">
                            <div className="flex items-center gap-4 flex-1">
                                <span className="font-bold text-sm text-slate-400 w-28 text-right">
                                    {format(matchDate, 'dd.MM.yy', { locale: de })} - {format(matchDate, 'HH:mm')}h
                                </span>
                                <div className="flex items-center justify-center flex-1 text-center">
                                    <div className={`font-bold text-base text-right flex-1 flex items-center justify-end gap-3 ${isHomeTeamBot ? 'text-slate-500' : 'text-white'}`}>
                                        <span>{homeTeam.name}</span>
                                        <ClubLogo logo={homeTeam.logo} size={28} />
                                    </div>
                                    <span className="font-black text-amber-400 mx-4">VS</span>
                                    <div className={`font-bold text-base text-left flex-1 flex items-center justify-start gap-3 ${isAwayTeamBot ? 'text-slate-500' : 'text-white'}`}>
                                        <ClubLogo logo={awayTeam.logo} size={28} />
                                        <span>{awayTeam.name}</span>
                                    </div>
                                </div>
                            </div>
                            {fixture.result && (
                            <div className="w-24 text-center">
                                <span className="bg-slate-700 px-3 py-1 rounded-lg text-white font-mono font-bold">{fixture.result}</span>
                            </div>
                            )}
                        </li>
                        );
                    })}
                    </ul>
                </div>
            )}
        </div>
    </div>
    );
};

export default LeagueView;
