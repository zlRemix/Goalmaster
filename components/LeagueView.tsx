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
import { Trophy, Calendar, BarChart3, ChevronRight } from 'lucide-react';

interface GroupedLeagues {
    [name: string]: League[];
}

export const LeagueView: React.FC = () => {
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

    // Initial Data Fetch
    useEffect(() => {
        setLoading(true);
        const q = query(collection(db, 'leagues'), orderBy('season', 'desc'));
        return onSnapshot(q, (snapshot) => {
            const fetchedLeagues = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as League));
            setAllLeagues(fetchedLeagues);
            setLoading(false);
        }, (err) => {
            setError("Ligen konnten nicht geladen werden.");
            setLoading(false);
        });
    }, []);

    useEffect(() => {
        return onSnapshot(collection(db, 'clubs'), (snapshot) => {
            setAllClubs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Club)));
        });
    }, []);

    const groupedLeagues = useMemo(() => {
        return allLeagues.reduce((acc, league) => {
            if (!acc[league.name]) acc[league.name] = [];
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
    }, [groupedLeagues, selectedLeagueName]);

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
        return onSnapshot(q, (snapshot) => {
            setFixtures(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Fixture)));
        });
    }, [selectedLeague]);

    const leagueClubs = useMemo(() =>
        selectedLeague ? allClubs.filter(club => club.leagueId === selectedLeague.id) : [],
        [allClubs, selectedLeague]
    );

    const clubsById = useMemo(() =>
        Object.fromEntries(allClubs.map(club => [club.id, club])),
        [allClubs]
    );

    const groupedFixtures = useMemo(() => {
        return fixtures.reduce((acc, fixture) => {
            const matchday = fixture.matchday || 0;
            if (!acc[matchday]) acc[matchday] = [];
            acc[matchday].push(fixture);
            return acc;
        }, {} as { [key: number]: Fixture[] });
    }, [fixtures]);

    const handleFixtureClick = async (fixtureId: string) => {
        setLoadingReport(true);
        try {
            const reportDoc = await getDoc(doc(db, 'match_results', fixtureId));
            if (reportDoc.exists()) setSelectedReport(reportDoc.data() as MatchResult);
        } catch (error) {
            console.error("Error fetching match report: ", error);
        }
        setLoadingReport(false);
    };

    if (loading) return <div className="text-center p-20 font-black italic uppercase text-slate-500 animate-pulse tracking-widest">Lade Arena...</div>;

    return (
        <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-20">
            {selectedReport && clubsById[selectedReport.homeTeamId] && clubsById[selectedReport.awayTeamId] && (
                <MatchReport 
                    report={selectedReport} 
                    homeClub={clubsById[selectedReport.homeTeamId]}
                    awayClub={clubsById[selectedReport.awayTeamId]}
                    onClose={() => setSelectedReport(null)} 
                />
            )}

            {/* HEADER & SELECTORS */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-slate-900/50 p-6 rounded-[2.5rem] border border-slate-800 shadow-2xl">
                <div className="space-y-1">
                    <h2 className="text-3xl md:text-5xl font-black text-white italic uppercase tracking-tighter">League Center</h2>
                    <p className="text-slate-500 text-sm font-bold uppercase tracking-[0.2em]">Saisonale Wettbewerbe & Ergebnisse</p>
                </div>

                <div className="flex flex-wrap gap-3 w-full md:w-auto">
                    <select
                        value={selectedLeagueName || ''}
                        onChange={e => {
                            setSelectedLeagueName(e.target.value);
                            setSelectedSeason(groupedLeagues[e.target.value][0].season);
                        }}
                        className="bg-slate-950 border border-white/5 rounded-2xl px-5 py-3 text-white font-black italic uppercase text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none appearance-none cursor-pointer pr-10 shadow-inner min-w-[180px]"
                    >
                        {Object.keys(groupedLeagues).map(name => <option key={name} value={name}>{name}</option>)}
                    </select>

                    <select
                        value={selectedSeason || ''}
                        onChange={e => setSelectedSeason(Number(e.target.value))}
                        className="bg-slate-950 border border-white/5 rounded-2xl px-5 py-3 text-white font-black italic uppercase text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none appearance-none cursor-pointer pr-10 shadow-inner"
                    >
                        {selectedLeagueName && groupedLeagues[selectedLeagueName].map(l => (
                            <option key={l.season} value={l.season}>Season {l.season}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* TAB NAVIGATION */}
            <div className="flex gap-2 p-1.5 bg-slate-950 rounded-[1.5rem] border border-slate-800 w-fit">
                {[
                    { id: 'table', label: 'Tabelle', icon: Trophy },
                    { id: 'fixtures', label: 'Spielplan', icon: Calendar },
                    { id: 'stats', label: 'Stats', icon: BarChart3 },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`px-6 py-2.5 rounded-xl font-black uppercase text-xs tracking-widest transition-all flex items-center gap-2 ${
                            activeTab === tab.id 
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' 
                                : 'text-slate-500 hover:text-white hover:bg-slate-900'
                        }`}
                    >
                        <tab.icon className="w-3.5 h-3.5" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* MAIN CONTENT AREA */}
            <div className="animate-in slide-in-from-bottom-4 duration-500">
                {activeTab === 'table' && selectedLeague && (
                    <div className="bg-slate-900/50 rounded-[2.5rem] border border-slate-800 p-2 md:p-6 shadow-2xl">
                        <LeagueTable fixtures={fixtures} allClubs={leagueClubs} />
                    </div>
                )}

                {activeTab === 'fixtures' && (
                    <div className="space-y-10">
                        {Object.entries(groupedFixtures).length === 0 ? (
                            <div className="py-20 text-center bg-slate-900/50 rounded-[3rem] border-2 border-dashed border-slate-800">
                                <p className="text-slate-600 font-black uppercase italic tracking-widest">Kein Spielplan verfügbar</p>
                            </div>
                        ) : (
                            Object.entries(groupedFixtures).map(([matchday, dayFixtures]) => (
                                <div key={matchday} className="space-y-4">
                                    <div className="flex items-center gap-4 px-4">
                                        <h3 className="text-xl font-black text-white italic uppercase tracking-tighter shrink-0">Matchday {matchday}</h3>
                                        <div className="h-[1px] w-full bg-gradient-to-r from-slate-800 to-transparent" />
                                    </div>
                                    
                                    <div className="grid grid-cols-1 gap-3">
                                        {(dayFixtures as Fixture[]).map((fixture) => {
                                            const homeTeam = clubsById[fixture.homeTeam];
                                            const awayTeam = clubsById[fixture.awayTeam];
                                            if (!homeTeam || !awayTeam) return null;
                                            const isPlayed = fixture.status === 'played';

                                            return (
                                                <div 
                                                    key={fixture.id} 
                                                    onClick={isPlayed ? () => handleFixtureClick(fixture.id) : undefined}
                                                    className={`group relative bg-slate-900 border border-slate-800 rounded-3xl p-4 transition-all ${
                                                        isPlayed ? 'hover:border-blue-500/50 hover:bg-slate-800 cursor-pointer shadow-xl' : 'opacity-80'
                                                    }`}
                                                >
                                                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                                                        {/* Match Info */}
                                                        <div className="flex flex-col items-center md:items-start shrink-0 min-w-[120px]">
                                                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-slate-950 px-3 py-1 rounded-full border border-white/5">
                                                                {format(new Date(fixture.date), 'dd.MM.yy • HH:mm', { locale: de })}h
                                                            </span>
                                                        </div>

                                                        {/* Arena Matchup */}
                                                        <div className="flex-1 flex items-center justify-center gap-4 md:gap-8 w-full">
                                                            {/* Home */}
                                                            <div className="flex-1 flex items-center justify-end gap-3 text-right">
                                                                <span className="font-black text-white italic uppercase tracking-tight text-sm md:text-base hidden sm:block truncate">
                                                                    {homeTeam.name}
                                                                </span>
                                                                <div className="shrink-0 group-hover:scale-110 transition-transform">
                                                                    <ClubLogo logo={homeTeam.logo} size={36} />
                                                                </div>
                                                            </div>

                                                            {/* Score or VS */}
                                                            <div className="shrink-0 flex flex-col items-center">
                                                                {isPlayed && fixture.result ? (
                                                                    <div className="bg-slate-950 px-5 py-2 rounded-2xl border border-white/10 shadow-inner group-hover:border-blue-500/50 transition-colors">
                                                                        <span className="font-black text-2xl text-white italic tabular-nums tracking-tighter">
                                                                            {fixture.result}
                                                                        </span>
                                                                    </div>
                                                                ) : (
                                                                    <div className="bg-slate-950 px-4 py-1.5 rounded-xl border border-white/5">
                                                                        <span className="text-xs font-black text-blue-500 tracking-widest uppercase">VS</span>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {/* Away */}
                                                            <div className="flex-1 flex items-center justify-start gap-3 text-left">
                                                                <div className="shrink-0 group-hover:scale-110 transition-transform">
                                                                    <ClubLogo logo={awayTeam.logo} size={36} />
                                                                </div>
                                                                <span className="font-black text-white italic uppercase tracking-tight text-sm md:text-base hidden sm:block truncate">
                                                                    {awayTeam.name}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {/* Details Arrow */}
                                                        {isPlayed && (
                                                            <div className="hidden md:flex items-center text-slate-600 group-hover:text-blue-400 transition-colors px-2">
                                                                <ChevronRight className="w-5 h-5" />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {activeTab === 'stats' && selectedLeague && (
                    <div className="animate-in fade-in slide-in-from-bottom-2">
                        <LeagueLeaderboards leagueId={selectedLeague.id} season={selectedLeague.season} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default LeagueView;