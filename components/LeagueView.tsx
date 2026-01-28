
import React, { useState, useMemo, useEffect } from 'react';
import { Fixture, Club, League, MatchResult } from '../types';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { db } from '../services/firebase';
import { collection, query, where, onSnapshot, orderBy, doc, getDoc } from 'firebase/firestore';
import LeagueTable from './LeagueTable';
import ClubLogo from './ClubLogo';
import MatchReport from './MatchReport';
import LeagueLeaderboards from './LeagueLeaderboards';

interface GroupedLeagues {
    [name: string]: League[];
}

const LeagueView: React.FC = () => {
    const [allLeagues, setAllLeagues] = useState<League[]>([]);
    const [selectedLeagueName, setSelectedLeagueName] = useState<string | null>(null);
    const [selectedSeason, setSelectedSeason] = useState<number | null>(null);
    const [fixtures, setFixtures] = useState<Fixture[]>([]);
    const [allClubs, setAllClubs] = useState<Club[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'table' | 'fixtures' | 'stats'>('table');
    const [selectedReport, setSelectedReport] = useState<MatchResult | null>(null);
    const [loadingReport, setLoadingReport] = useState(false);

    useEffect(() => {
        setLoading(true);
        const q = query(collection(db, 'leagues'), orderBy('season', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedLeagues = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as League));
            setAllLeagues(fetchedLeagues);
            setLoading(false);
        }, (err) => {
            console.error("Error fetching leagues: ", err);
            setError("Ligen konnten nicht geladen werden.");
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        const q = collection(db, 'clubs');
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setAllClubs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Club)));
        });
        return () => unsubscribe();
    }, []);

    const groupedLeagues = useMemo(() => {
        return allLeagues.reduce((acc, league) => {
            if (!acc[league.name]) {
                acc[league.name] = [];
            }
            acc[league.name].push(league);
            return acc;
        }, {} as GroupedLeagues);
    }, [allLeagues]);

    useEffect(() => {
        if (!selectedLeagueName && Object.keys(groupedLeagues).length > 0) {
            const defaultLeagueName = Object.keys(groupedLeagues)[0];
            setSelectedLeagueName(defaultLeagueName);
            setSelectedSeason(groupedLeagues[defaultLeagueName][0].season);
        }
    }, [groupedLeagues]);

    const selectedLeague = useMemo(() => {
        if (!selectedLeagueName || selectedSeason === null) return null;
        return allLeagues.find(l => l.name === selectedLeagueName && l.season === selectedSeason) || null;
    }, [allLeagues, selectedLeagueName, selectedSeason]);

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

    const handleFixtureClick = async (fixtureId: string) => {
        setLoadingReport(true);
        try {
            const reportDoc = await getDoc(doc(db, 'match_results', fixtureId));
            if (reportDoc.exists()) {
                setSelectedReport(reportDoc.data() as MatchResult);
            } else {
                console.error("No match report found for this fixture.");
                // Optionally, show an error to the user
            }
        } catch (error) {
            console.error("Error fetching match report: ", error);
        }
        setLoadingReport(false);
    };

    if (loading) {
        return <div className="text-center p-8 text-white animate-pulse">Lade Ligen...</div>;
    }

    if (error) {
        return <div className="text-center p-8 text-red-400 bg-red-500/10 rounded-lg">{error}</div>;
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
             {selectedReport && clubsById[selectedReport.homeTeamId] && clubsById[selectedReport.awayTeamId] && (
                <MatchReport 
                    report={selectedReport} 
                    homeClub={clubsById[selectedReport.homeTeamId]}
                    awayClub={clubsById[selectedReport.awayTeamId]}
                    onClose={() => setSelectedReport(null)} 
                />
            )}

            {Object.keys(groupedLeagues).length === 0 ? (
                <div className="bg-slate-800/80 p-8 rounded-2xl border border-yellow-500/30 text-center">
                    <h3 className="text-lg font-bold text-yellow-400">Keine Ligen gefunden</h3>
                    <p className="text-slate-400 mt-2 text-sm">Gehe zur Liga-Verwaltung, um eine neue Liga zu erstellen.</p>
                </div>
            ) : (
                <>
                    <div className="flex items-center gap-4">
                        <select
                            value={selectedLeagueName || ''}
                            onChange={e => {
                                setSelectedLeagueName(e.target.value);
                                setSelectedSeason(groupedLeagues[e.target.value][0].season);
                            }}
                            className="bg-slate-900/80 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-blue-500 focus:border-blue-500 flex-grow font-semibold"
                        >
                            {Object.keys(groupedLeagues).map(name => <option key={name} value={name}>{name}</option>)}
                        </select>
                        {selectedLeagueName && (
                            <select
                                value={selectedSeason || ''}
                                onChange={e => setSelectedSeason(Number(e.target.value))}
                                className="bg-slate-900/80 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-blue-500 focus:border-blue-500 font-semibold"
                            >
                                {groupedLeagues[selectedLeagueName].map(l => <option key={l.season} value={l.season}>Saison {l.season}</option>)}
                            </select>
                        )}
                    </div>

                    {!selectedLeague ? (
                        <div className="mt-4 text-center p-8">
                            <p className="text-slate-400">Bitte wähle eine Liga und Saison aus.</p>
                        </div>
                    ) : (
                        <div>
                            <div className="mb-4 border-b border-slate-700">
                                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                                    <button
                                        onClick={() => setActiveTab('table')}
                                        className={`${activeTab === 'table' ? 'border-yellow-400 text-yellow-400' : 'border-transparent text-slate-400 hover:text-white hover:border-slate-500'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
                                    >
                                        Tabelle
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('fixtures')}
                                        className={`${activeTab === 'fixtures' ? 'border-yellow-400 text-yellow-400' : 'border-transparent text-slate-400 hover:text-white hover:border-slate-500'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
                                    >
                                        Spielplan
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('stats')}
                                        className={`${activeTab === 'stats' ? 'border-yellow-400 text-yellow-400' : 'border-transparent text-slate-400 hover:text-white hover:border-slate-500'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
                                    >
                                        Statistiken
                                    </button>
                                </nav>
                            </div>

                            {activeTab === 'table' && (
                                <LeagueTable fixtures={fixtures} allClubs={leagueClubs} />
                            )}

                            {activeTab === 'fixtures' && (
                                <div>
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
                                                            {(dayFixtures as Fixture[]).map((fixture) => {
                                                                const homeTeam = clubsById[fixture.homeTeam];
                                                                const awayTeam = clubsById[fixture.awayTeam];

                                                                if (!homeTeam || !awayTeam) return null;

                                                                const matchDate = new Date(fixture.date);
                                                                const isPlayed = fixture.status === 'played';

                                                                return (
                                                                    <li key={fixture.id} 
                                                                        className={`p-4 flex items-center justify-between transition-colors ${isPlayed ? 'hover:bg-slate-800 cursor-pointer' : ''}`}
                                                                        onClick={isPlayed ? () => handleFixtureClick(fixture.id) : undefined}
                                                                    >
                                                                        <div className="flex items-center gap-4 flex-1">
                                                                            <span className="font-semibold text-sm text-slate-400 w-32 text-right">
                                                                                {format(matchDate, 'dd.MM.yy - HH:mm', { locale: de })}h
                                                                            </span>
                                                                            <div className="flex items-center justify-center flex-1 text-center">
                                                                                <div className={`font-bold text-base text-right flex-1 flex items-center justify-end gap-3 text-white`}>
                                                                                    <span>{homeTeam.name}</span>
                                                                                    <ClubLogo logo={homeTeam.logo} size={28} />
                                                                                </div>
                                                                                {isPlayed && fixture.result ? (
                                                                                    <span className="bg-slate-900/80 border border-slate-700 px-3 py-1 rounded-lg text-white font-mono font-bold text-lg mx-4 w-24 text-center">
                                                                                        {loadingReport && selectedReport?.fixtureId === fixture.id ? '...' : fixture.result}
                                                                                    </span>
                                                                                ) : (
                                                                                    <span className="font-black text-yellow-400 mx-4">VS</span>
                                                                                )}
                                                                                <div className={`font-bold text-base text-left flex-1 flex items-center justify-start gap-3 text-white`}>
                                                                                    <ClubLogo logo={awayTeam.logo} size={28} />
                                                                                    <span>{awayTeam.name}</span>
                                                                                </div>
                                                                            </div>
                                                                        </div>
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
                            )}
                            {activeTab === 'stats' && selectedLeague && (
                                <LeagueLeaderboards leagueId={selectedLeague.id} season={selectedLeague.season} />
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default LeagueView;
