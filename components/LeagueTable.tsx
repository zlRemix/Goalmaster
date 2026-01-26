import React from 'react';
import { Club, Fixture, ClubLogoData } from '../types';
import ClubLogo from './ClubLogo';

interface LeagueTableProps {
  fixtures: Fixture[];
  allClubs: Club[];
}

interface TeamStats {
  id: string;
  name: string;
  logo?: ClubLogoData;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  isBot: boolean;
}

const LeagueTable: React.FC<LeagueTableProps> = ({ fixtures, allClubs }) => {
  const stats: Record<string, TeamStats> = {};

  allClubs.forEach(club => {
    stats[club.id] = {
      id: club.id,
      name: club.name,
      logo: club.logo,
      played: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      points: 0,
      isBot: club.ownerId === 'bot_owner',
    };
  });

  fixtures.forEach(fixture => {
    if (!fixture.result) return;

    const [homeGoals, awayGoals] = fixture.result.split('-').map(Number);
    const homeTeamId = fixture.homeTeam;
    const awayTeamId = fixture.awayTeam;

    if (!stats[homeTeamId] || !stats[awayTeamId]) return;

    stats[homeTeamId].played += 1;
    stats[awayTeamId].played += 1;
    stats[homeTeamId].goalsFor += homeGoals;
    stats[awayTeamId].goalsFor += awayGoals;
    stats[homeTeamId].goalsAgainst += awayGoals;
    stats[awayTeamId].goalsAgainst += homeGoals;

    if (homeGoals > awayGoals) {
      stats[homeTeamId].wins += 1;
      stats[homeTeamId].points += 3;
      stats[awayTeamId].losses += 1;
    } else if (awayGoals > homeGoals) {
      stats[awayTeamId].wins += 1;
      stats[awayTeamId].points += 3;
      stats[homeTeamId].losses += 1;
    } else {
      stats[homeTeamId].draws += 1;
      stats[awayTeamId].draws += 1;
      stats[homeTeamId].points += 1;
      stats[awayTeamId].points += 1;
    }
  });

  const sortedTable = Object.values(stats)
    .map(team => ({
      ...team,
      goalDifference: team.goalsFor - team.goalsAgainst,
    }))
    .sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
      if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
      return a.name.localeCompare(b.name);
    });

  return (
    <div className="mb-8">
        <header>
            <h2 className="text-2xl md:text-3xl font-black">Ligatabelle</h2>
            <p className="text-slate-400 text-sm md:text-base">Aktueller Stand der Liga.</p>
        </header>
        <div className="mt-4 bg-slate-800/80 rounded-2xl border border-slate-700 shadow-lg overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-700 text-left">
            <thead className="bg-slate-900/50">
                <tr>
                <th scope="col" className="px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider text-center">#</th>
                <th scope="col" className="px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Club</th>
                <th scope="col" className="px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider text-center">Sp</th>
                <th scope="col" className="px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider text-center">S</th>
                <th scope="col" className="px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider text-center">U</th>
                <th scope="col" className="px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider text-center">N</th>
                <th scope="col" className="px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider text-center">Tore</th>
                <th scope="col" className="px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider text-center">TD</th>
                <th scope="col" className="px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider text-center">Pkt</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
                {sortedTable.map((team, index) => (
                <tr key={team.id} className="hover:bg-slate-800 transition-colors">
                    <td className="px-4 py-3 text-sm text-slate-400 font-bold text-center">{index + 1}</td>
                    <td className={`px-6 py-3 text-sm font-semibold whitespace-nowrap ${team.isBot ? 'text-slate-500' : 'text-white'}`}>
                        <div className="flex items-center gap-3">
                            <ClubLogo logo={team.logo} size={24} />
                            <span>{team.name}</span>
                        </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-300 font-mono text-center">{team.played}</td>
                    <td className="px-4 py-3 text-sm text-green-400 font-mono text-center">{team.wins}</td>
                    <td className="px-4 py-3 text-sm text-yellow-400 font-mono text-center">{team.draws}</td>
                    <td className="px-4 py-3 text-sm text-red-400 font-mono text-center">{team.losses}</td>
                    <td className="px-4 py-3 text-sm text-slate-300 font-mono text-center">{`${team.goalsFor}:${team.goalsAgainst}`}</td>
                    <td className="px-4 py-3 text-sm text-slate-300 font-mono text-center">{team.goalDifference > 0 ? `+${team.goalDifference}` : team.goalDifference}</td>
                    <td className="px-4 py-3 text-sm text-white font-black text-center text-base">{team.points}</td>
                </tr>
                ))}
            </tbody>
            </table>
        </div>
    </div>
  );
};

export default LeagueTable;
