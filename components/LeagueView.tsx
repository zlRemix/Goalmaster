import React, { useState, useMemo, useEffect } from 'react';
import { Fixture, Club, League } from '../types';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { db } from '../services/firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import LeagueTable from './LeagueTable';
import ClubLogo from './ClubLogo';

const LeagueView: React.FC = () => {
  const [leagues, setLeagues] = useState<League[]>([]);
  const [selectedLeagueId, setSelectedLeagueId] = useState<string | null>(null);
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [allClubs, setAllClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, 'leagues'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedLeagues = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as League));
      setLeagues(fetchedLeagues);
      setLoading(false);
    }, (err) => {
      console.error("Error fetching leagues: ", err);
      setError("Ligen konnten nicht geladen werden.");
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!selectedLeagueId && leagues.length > 0) {
      setSelectedLeagueId(leagues[0].id);
    }
  }, [leagues]);

  useEffect(() => {
    const q = collection(db, 'clubs');
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setAllClubs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Club)));
    });
    return () => unsubscribe();
  }, []);

  const selectedLeague = useMemo(() => 
    leagues.find(l => l.id === selectedLeagueId)
  , [leagues, selectedLeagueId]);

  useEffect(() => {
    if (!selectedLeague) {
      setFixtures([]);
      return;
    }

    const q = query(
      collection(db, 'fixtures'),
      where('leagueId', '==', selectedLeague.id),
      where('season', '==', selectedLeague.season),
      orderBy('matchday', 'asc'),
      orderBy('date', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedFixtures = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Fixture));
      setFixtures(fetchedFixtures);
    });

    return () => unsubscribe();
  }, [selectedLeague]);

  const leagueClubs = useMemo(() => 
    selectedLeague ? allClubs.filter(club => selectedLeague.clubIds.includes(club.id)) : [],
    [allClubs, selectedLeague]
  );

  const clubsById = useMemo(() => 
    Object.fromEntries(allClubs.map(club => [club.id, club])),
    [allClubs]
  );

  const groupedFixtures = useMemo(() => {
    return fixtures.reduce((acc, fixture) => {
        const matchday = fixture.matchday || 0;
        if (!acc[matchday]) {
            acc[matchday] = [];
        }
        acc[matchday].push(fixture);
        return acc;
    }, {} as { [key: number]: Fixture[] });
  }, [fixtures]);

  if (loading) {
    return <div className="text-center p-8 text-white animate-pulse">Lade Ligen...</div>;
  }

  if (error) {
    return <div className="text-center p-8 text-red-400 bg-red-500/10 rounded-lg">{error}</div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {leagues.length === 0 ? (
        <div className="bg-slate-800/80 p-8 rounded-2xl border border-yellow-500/30 text-center">
           <h3 className="text-lg font-bold text-yellow-400">Keine Ligen gefunden</h3>
           <p className="text-slate-400 mt-2 text-sm">Gehe zur Liga-Verwaltung, um eine neue Liga zu erstellen.</p>
       </div>
      ) : (
        <>
          <div className="flex items-center gap-4">
              <label htmlFor="league-select" className="text-lg font-bold text-white">Liga:</label>
              <select 
                id="league-select"
                value={selectedLeagueId || ''}
                onChange={e => setSelectedLeagueId(e.target.value)}
                className="bg-slate-900/80 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-blue-500 focus:border-blue-500 flex-grow font-semibold"
              >
                {leagues.map(l => <option key={l.id} value={l.id}>{l.name} - Saison {l.season}</option>)}
              </select>
          </div>

          {!selectedLeague ? (
            <div className="mt-4 text-center p-8">
              <p className="text-slate-400">Bitte wähle eine Liga aus.</p>
            </div>
          ) : (
            <>
              <LeagueTable fixtures={fixtures} allClubs={leagueClubs} />

              <div>
                  <header>
                      <h2 className="text-2xl md:text-3xl font-black text-white">Spielplan (Saison {selectedLeague.season})</h2>
                      <p className="text-slate-400 text-sm md:text-base">Kommende und vergangene Spiele der Liga.</p>
                  </header>

                  {fixtures.length === 0 ? (
                      <div className="mt-4 bg-slate-800/80 p-8 rounded-2xl border border-dashed border-slate-700 text-center">
                          <h3 className="text-lg font-bold text-slate-300">Kein Spielplan gefunden</h3>
                          <p className="text-slate-400 mt-2 text-sm">Für die ausgewählte Saison existiert kein Spielplan.</p>
                      </div>
                  ) : (
                      <div className="mt-6 space-y-6">
                        {Object.entries(groupedFixtures).map(([matchday, dayFixtures]) => (
                            <div key={matchday}>
                                <h3 className="text-xl font-bold text-yellow-400 mb-3 ml-1">Spieltag {matchday}</h3>
                                <div className="bg-slate-800/80 rounded-2xl border border-slate-700 shadow-lg">
                                    <ul className="divide-y divide-slate-700">
                                    {dayFixtures.map((fixture) => {
                                        const homeTeam = clubsById[fixture.homeTeam];
                                        const awayTeam = clubsById[fixture.awayTeam];
                                        
                                        if (!homeTeam || !awayTeam) return null;

                                        const matchDate = new Date(fixture.date);

                                        return (
                                        <li key={fixture.id} className="p-4 flex items-center justify-between hover:bg-slate-800 transition-colors">
                                            <div className="flex items-center gap-4 flex-1">
                                                <span className="font-semibold text-sm text-slate-400 w-32 text-right">
                                                    {format(matchDate, 'dd.MM.yy - HH:mm', { locale: de })}h
                                                </span>
                                                <div className="flex items-center justify-center flex-1 text-center">
                                                    <div className={`font-bold text-base text-right flex-1 flex items-center justify-end gap-3 text-white`}>
                                                        <span>{homeTeam.name}</span>
                                                        <ClubLogo logo={homeTeam.logo} size={28} />
                                                    </div>
                                                    <span className="font-black text-yellow-400 mx-4">VS</span>
                                                    <div className={`font-bold text-base text-left flex-1 flex items-center justify-start gap-3 text-white`}>
                                                        <ClubLogo logo={awayTeam.logo} size={28} />
                                                        <span>{awayTeam.name}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            {fixture.result && (
                                            <div className="w-24 text-center">
                                                <span className="bg-slate-900/80 border border-slate-700 px-3 py-1 rounded-lg text-white font-mono font-bold text-lg">{fixture.result}</span>
                                            </div>
                                            )}
                                        </li>
                                        );
                                    })}
                                    </ul>
                                </div>
                            </div>
                        ))}
                      </div>
                  )}
              </div>
            </>
          )}
        </>
      )}
    </div>
    );
};

export default LeagueView;
