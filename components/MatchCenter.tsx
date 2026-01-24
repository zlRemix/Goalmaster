
import { Club, Fixture, MatchResult, LeagueStanding } from '../types';
import { geminiService } from '../services/geminiService';
import React, { useState, useEffect, useMemo } from 'react';
import { useCountdown, formatDuration } from '../hooks/useTimers';
import { ClipboardList, Mic } from 'lucide-react';

interface MatchCenterProps {
  clubs: Club[];
  fixtures: Fixture[];
  lastMatch: MatchResult | null;
  onSimulate: (fixtureId: string) => void;
  onReset: () => void;
  onViewClub: (clubId: string) => void;
}

export const MatchCenter: React.FC<MatchCenterProps> = ({ clubs, fixtures, lastMatch, onSimulate, onReset, onViewClub }) => {
  const [analysisText, setAnalysisText] = useState<string>('');
  const [viewMode, setViewMode] = useState<'table' | 'schedule'>('table');
  
  const nextFixture = useMemo(() => fixtures.find(f => f.status === 'scheduled'), [fixtures]);
  const countdownMs = useCountdown(nextFixture ? new Date(nextFixture.date).getTime() : 0);
  const countdownSeconds = Math.floor(countdownMs / 1000);

  const isCurrentlySimulatingMatch = nextFixture ? countdownMs <= 0 : false;

  // Calculate Standings
  const standings = useMemo(() => {
    const map: Record<string, LeagueStanding> = {};
    clubs.forEach(c => {
      map[c.id] = { clubId: c.id, clubName: c.name, clubLogo: c.logo, played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0 };
    });

    fixtures.filter(f => f.status === 'played').forEach(f => {
       const [homeScore, awayScore] = f.result!.split('-').map(Number);
      const home = map[f.homeTeam];
      const away = map[f.awayTeam];
      if (home && away) {
        home.played++;
        away.played++;
        home.goalsFor += homeScore;
        home.goalsAgainst += awayScore;
        away.goalsFor += awayScore;
        away.goalsAgainst += homeScore;

        if (homeScore > awayScore) { home.won++; home.points += 3; away.lost++; }
        else if (homeScore < awayScore) { away.won++; away.points += 3; home.lost++; }
        else { home.drawn++; away.drawn++; home.points += 1; away.points += 1; }
      }
    });

    return Object.values(map).sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      return (b.goalsFor - b.goalsAgainst) - (a.goalsFor - a.goalsAgainst);
    });
  }, [clubs, fixtures]);

  // Group fixtures by date (matchday)
  const groupedFixtures = useMemo(() => {
    const groups: Record<string, Fixture[]> = {};
    fixtures.forEach(f => {
      if (!groups[f.date]) groups[f.date] = [];
      groups[f.date].push(f);
    });
    return Object.entries(groups).sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime());
  }, [fixtures]);

  useEffect(() => {
    if (lastMatch && analysisText === '') { // Only fetch if analysisText is empty
      const homeClub = clubs.find(c => c.id === lastMatch.homeTeamId);
      const awayClub = clubs.find(c => c.id === lastMatch.awayTeamId);
      if (!homeClub || !awayClub) return;

      const fetchAnalysis = async () => {
        const text = await geminiService.generateMatchCommentary(
          homeClub.name,
          awayClub.name,
          `${lastMatch.homeScore}:${lastMatch.awayScore}`,
          lastMatch.events
        );
        setAnalysisText(text);
      };
      fetchAnalysis();
    }
  }, [lastMatch, clubs, analysisText]);

  if (lastMatch) {
    const homeClub = clubs.find(c => c.id === lastMatch.homeTeamId);
    const awayClub = clubs.find(c => c.id === lastMatch.awayTeamId);
    
    if (!homeClub || !awayClub) return <p>Lade Spieldaten...</p>;

    return (
      <div className="space-y-8 animate-in zoom-in-95 duration-500 pb-12">
        <div className="bg-gradient-to-br from-emerald-950 to-slate-900 p-12 rounded-[3rem] border-4 border-emerald-500/20 text-center shadow-2xl relative">
          <button onClick={() => { setAnalysisText(''); onReset(); }} className="absolute top-6 right-8 text-slate-400 hover:text-white transition-colors bg-slate-800/50 px-4 py-2 rounded-xl text-xs font-bold">ZURÜCK ZUR LIGA</button>
          
          <div className="flex flex-col md:flex-row items-center justify-center gap-12 md:gap-24">
            <button onClick={() => onViewClub(homeClub.id)} className="text-center group transition-transform hover:scale-105">
              <div className="w-24 h-24 md:w-32 md:h-32 bg-slate-800 rounded-full flex items-center justify-center text-6xl border-4 border-slate-700 mb-4 shadow-xl mx-auto group-hover:border-emerald-500/50">{homeClub.logo}</div>
              <h3 className="text-xl md:text-2xl font-black">{homeClub.name}</h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">Kader ansehen</p>
            </button>
            <div className="text-center">
              <div className="text-6xl md:text-8xl font-black tracking-tighter text-white tabular-nums drop-shadow-2xl">{lastMatch.homeScore} : {lastMatch.awayScore}</div>
              <p className="text-emerald-400 font-bold tracking-widest uppercase text-sm mt-2">Endergebnis</p>
            </div>
            <button onClick={() => onViewClub(awayClub.id)} className="text-center group transition-transform hover:scale-105">
              <div className="w-24 h-24 md:w-32 md:h-32 bg-slate-800 rounded-full flex items-center justify-center text-6xl border-4 border-slate-700 mb-4 shadow-xl mx-auto group-hover:border-emerald-500/50">{awayClub.logo}</div>
              <h3 className="text-xl md:text-2xl font-black">{awayClub.name}</h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">Kader ansehen</p>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-slate-800 rounded-3xl p-8 border border-slate-700 shadow-xl">
            <h4 className="text-xl font-bold mb-6 flex items-center gap-2"><ClipboardList className="h-6 w-6 text-slate-400" /> Spielbericht</h4>
            <div className="space-y-4">
              {lastMatch.events.map((evt, i) => (
                <div key={i} className="flex gap-4 items-start pb-4 border-b border-slate-700/50 last:border-0">
                   <span className="text-emerald-500 font-mono font-bold">{Math.floor(Math.random() * 90) + 1}'</span>
                   <p className="text-slate-300 text-sm leading-relaxed">{evt}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-slate-800 rounded-3xl p-8 border border-slate-700 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 text-7xl select-none"><Mic className="w-24 h-24" /></div>
            <h4 className="text-xl font-bold mb-6 text-emerald-400 flex items-center gap-2"><Mic className="h-6 w-6"/> Spielanalyse</h4>
            <div className="text-slate-200 italic leading-relaxed whitespace-pre-line text-sm md:text-base">
              {analysisText || "Generiere Analyse..."}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tight">Liga-Zentrale</h2>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Saison 1 / {fixtures.length} Spiele gesamt</p>
        </div>
        <div className="flex items-center gap-2 bg-slate-800 p-1 rounded-2xl border border-slate-700 shadow-inner">
           <button 
             onClick={() => setViewMode('table')}
             className={`px-6 py-2 rounded-xl text-xs font-black uppercase transition-all ${viewMode === 'table' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
           >
             Tabelle
           </button>
           <button 
             onClick={() => setViewMode('schedule')}
             className={`px-6 py-2 rounded-xl text-xs font-black uppercase transition-all ${viewMode === 'schedule' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
           >
             Spielplan
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-slate-800 rounded-[2.5rem] border border-slate-700 shadow-2xl overflow-hidden min-h-[500px]">
          {viewMode === 'table' ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] uppercase font-black text-slate-500 bg-slate-900/50">
                    <th className="px-6 py-4 text-center">Pos</th>
                    <th className="px-6 py-4">Verein</th>
                    <th className="px-4 py-4 text-center">Sp</th>
                    <th className="px-4 py-4 text-center">Diff</th>
                    <th className="px-6 py-4 text-center">Pkt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {standings.map((s, idx) => (
                    <tr key={s.clubId} onClick={() => onViewClub(s.clubId)} className={`group cursor-pointer hover:bg-slate-700/30 transition-colors ${idx === 0 ? 'bg-emerald-500/5' : ''}`}>
                      <td className="px-6 py-4 font-mono font-bold text-center">
                        <span className={idx < 3 ? 'text-emerald-500' : 'text-slate-400'}>{idx + 1}</span>
                      </td>
                      <td className="px-6 py-4 flex items-center gap-3">
                        <span className="text-xl">{s.clubLogo}</span>
                        <span className="font-bold group-hover:text-emerald-400 transition-colors">{s.clubName}</span>
                      </td>
                      <td className="px-4 py-4 text-center font-mono">{s.played}</td>
                      <td className="px-4 py-4 text-center font-mono text-slate-400">{s.goalsFor - s.goalsAgainst}</td>
                      <td className="px-6 py-4 text-center font-black text-emerald-400">{s.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-6 space-y-8 max-h-[650px] overflow-y-auto">
              {groupedFixtures.map(([date, matches], roundIdx) => (
                <div key={date} className="space-y-3">
                  <div className="flex items-center gap-4 mb-2">
                    <h4 className="text-xs font-black uppercase text-emerald-500 tracking-widest whitespace-nowrap">Spieltag {roundIdx + 1}</h4>
                    <div className="h-[1px] w-full bg-slate-700/50"></div>
                    <span className="text-[10px] text-slate-500 font-mono whitespace-nowrap">{new Date(date).toLocaleDateString('de-DE')}</span>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {matches.map(f => {
                      const home = clubs.find(c => c.id === f.homeTeam);
                      const away = clubs.find(c => c.id === f.awayTeam);
                      return (
                        <div key={f.id} className="flex items-center justify-between bg-slate-900/40 p-3 rounded-xl border border-slate-800/50 hover:bg-slate-700/20 transition-all">
                          <div className="flex-1 flex items-center justify-end gap-3 text-right">
                             <span className="text-xs font-bold text-slate-300 truncate max-w-[80px] sm:max-w-none">{home?.name}</span>
                             <span className="text-xl">{home?.logo}</span>
                          </div>
                          <div className="mx-4 min-w-[60px] text-center">
                             {f.status === 'played' ? (
                               <span className="font-mono font-black text-white bg-slate-950 px-2 py-0.5 rounded border border-slate-800">{f.result}</span>
                             ) : (
                               <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">12:00</span>
                             )}
                          </div>
                          <div className="flex-1 flex items-center justify-start gap-3">
                             <span className="text-xl">{away?.logo}</span>
                             <span className="text-xs font-bold text-slate-300 truncate max-w-[80px] sm:max-w-none">{away?.name}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-slate-800 rounded-[2.5rem] border border-slate-700 p-8 shadow-2xl relative overflow-hidden group">
            <div className="absolute -right-10 -top-10 text-9xl text-slate-700/10 group-hover:rotate-12 transition-transform select-none">VS</div>
            <h3 className="text-xs font-black uppercase text-slate-500 mb-6 tracking-widest border-b border-slate-700 pb-2">Kommender Spieltag</h3>
            
            {nextFixture ? (
              <>
                <div className="space-y-4 mb-8">
                  {/* Highlight only one representative match for the next matchday card */}
                  <div className="flex items-center justify-between gap-4">
                    <button onClick={() => onViewClub(nextFixture.homeTeam)} className="text-center flex-1 hover:scale-105 transition-transform">
                      <div className="text-4xl mb-2">{clubs.find(c => c.id === nextFixture.homeTeam)?.logo}</div>
                      <p className="text-xs font-bold line-clamp-1">{clubs.find(c => c.id === nextFixture.homeTeam)?.name}</p>
                    </button>
                    <div className="bg-slate-950 px-4 py-1 rounded-full border border-slate-700 text-[10px] font-black italic">TOP-SPIEL</div>
                    <button onClick={() => onViewClub(nextFixture.awayTeam)} className="text-center flex-1 hover:scale-105 transition-transform">
                      <div className="text-4xl mb-2">{clubs.find(c => c.id === nextFixture.awayTeam)?.logo}</div>
                      <p className="text-xs font-bold line-clamp-1">{clubs.find(c => c.id === nextFixture.awayTeam)?.name}</p>
                    </button>
                  </div>
                  <div className="text-center text-[10px] text-slate-500 font-black uppercase">...und 4 weitere Partien</div>
                </div>

                <div className="space-y-4">
                  <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-700 text-center">
                    <p className="text-[10px] text-slate-500 font-black uppercase mb-1 tracking-widest">Anstoß</p>
                    <p className="font-bold text-white">
                      {new Date(nextFixture.date).toLocaleDateString('de-DE')} - 12:00 Uhr
                    </p>
                  </div>

                  {isCurrentlySimulatingMatch ? (
                    <div className="bg-emerald-500/10 p-4 rounded-2xl border border-emerald-500/20 text-center animate-pulse">
                      <p className="text-[10px] text-emerald-500 font-black uppercase mb-1">Status</p>
                      <p className="text-xs font-bold text-emerald-400">Spieltag läuft...</p>
                    </div>
                  ) : (
                    <div className="bg-amber-500/10 p-4 rounded-2xl border border-amber-500/20 text-center">
                      <p className="text-[10px] text-amber-500 font-black uppercase mb-1">Countdown</p>
                      <p className="text-2xl font-mono font-black text-amber-500">{formatDuration(countdownSeconds)}</p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <p className="text-center text-slate-500 py-10 font-bold uppercase text-xs">Saison beendet</p>
            )}
          </div>

          <div className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800 text-[10px] text-slate-500 leading-relaxed uppercase font-bold tracking-widest">
            Alle Teams spielen gleichzeitig. Die Tabelle aktualisiert sich nach Abpfiff aller Begegnungen automatisch.
          </div>
        </div>
      </div>
    </div>
  );
};
