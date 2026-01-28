import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where, documentId, FieldPath } from 'firebase/firestore';
import { db as firestore } from '../services/firebase';
import { MatchResult, Player, Club } from '../types';
import { Trophy, ShieldCheck, Square } from 'lucide-react';
import ClubLogo from './ClubLogo';

interface LeagueLeaderboardsProps {
    leagueId: string;
    season: number;
}

interface PlayerStat {
    id: string;
    name: string;
    clubId: string;
    value: number;
}

// Helper to run queries on chunks of data to avoid the 30-item limit for 'in' queries
const queryInChunks = async <T extends { id: string }>(collectionName: string, field: string | FieldPath, ids: string[]): Promise<T[]> => {
    if (ids.length === 0) {
        return [];
    }
    const chunks: string[][] = [];
    for (let i = 0; i < ids.length; i += 30) {
        chunks.push(ids.slice(i, i + 30));
    }
    const chunkPromises = chunks.map(chunk => 
        getDocs(query(collection(firestore, collectionName), where(field, 'in', chunk)))
    );
    const chunkSnapshots = await Promise.all(chunkPromises);
    return chunkSnapshots.flatMap(snapshot => snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T)));
};


const LeaderboardCard: React.FC<{ title: string; icon: React.ReactNode; stats: PlayerStat[]; clubs: { [id: string]: Club } }> = ({ title, icon, stats, clubs }) => (
    <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 flex flex-col">
        <h3 className="font-bold text-white text-lg mb-3 flex items-center">
            {icon} {title}
        </h3>
        <ul className="space-y-2 flex-grow">
            {stats.slice(0, 5).map((stat, index) => (
                <li key={stat.id} className="flex items-center justify-between text-sm p-1.5 rounded-md bg-slate-900/30">
                    <div className="flex items-center truncate">
                        <span className="text-slate-400 w-6 text-center font-mono text-xs">{index + 1}.</span>
                        <span className="text-slate-200 truncate mr-2">{stat.name}</span>
                    </div>
                    <div className="flex items-center flex-shrink-0">
                        {clubs[stat.clubId] && <ClubLogo logo={clubs[stat.clubId].logo} size={20} />}
                        <span className="font-bold text-white ml-3 w-8 text-right">{stat.value}</span>
                    </div>
                </li>
            ))}
            {stats.length === 0 && <p className="text-slate-500 text-sm text-center py-4">No data available.</p>}
        </ul>
    </div>
);

const LeagueLeaderboards: React.FC<LeagueLeaderboardsProps> = ({ leagueId, season }) => {
    const [playerStats, setPlayerStats] = useState<{ [id: string]: { name: string; clubId: string; goals: number; yellow: number; red: number; } }>({});
    const [goalieStats, setGoalieStats] = useState<{ [id: string]: { name: string; clubId: string; cleanSheets: number; } }>({});
    const [clubs, setClubs] = useState<{ [id: string]: Club }>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLeaderboardData = async () => {
            setLoading(true);

            const fixturesQuery = query(collection(firestore, 'fixtures'), where('leagueId', '==', leagueId), where('season', '==', season), where('status', '==', 'played'));
            const fixturesSnapshot = await getDocs(fixturesQuery);
            const fixtureIds = fixturesSnapshot.docs.map(doc => doc.id);

            if (fixtureIds.length === 0) {
                setLoading(false);
                return;
            }
            
            const allMatchResults = await queryInChunks<MatchResult & { id: string }>('match_results', documentId(), fixtureIds);

            const allClubIds = Array.from(new Set(allMatchResults.flatMap(r => [r.homeTeamId, r.awayTeamId])));

            const [allPlayers, allClubs] = await Promise.all([
                queryInChunks<Player>('players', 'clubId', allClubIds),
                queryInChunks<Club & { id: string }>('clubs', documentId(), allClubIds)
            ]);

            const tempClubs: { [id: string]: Club } = {};
            allClubs.forEach(c => tempClubs[c.id] = c);
            setClubs(tempClubs);

            const playerMap: { [id: string]: Player } = {};
            allPlayers.forEach(p => playerMap[p.id] = p);

            const tempPlayerStats: { [id: string]: { name: string; clubId: string; goals: number; yellow: number; red: number; } } = {};
            const tempGoalieStats: { [id: string]: { name: string; clubId: string; cleanSheets: number; } } = {};

            const getStat = (id: string) => {
                if (!tempPlayerStats[id]) {
                    const player = playerMap[id];
                    tempPlayerStats[id] = { name: player?.name || 'Unknown', clubId: player?.clubId || '', goals: 0, yellow: 0, red: 0 };
                }
                return tempPlayerStats[id];
            };

            for (const result of allMatchResults) {
                for (const event of result.events) {
                    const goalMatch = event.match(/Torschütze: (.*?) \[(.*?)\]/);
                    if (goalMatch && playerMap[goalMatch[2]]) getStat(goalMatch[2]).goals++;

                    const cardMatch = event.match(/(Gelbe|Rote|Gelb-Rote) Karte für (.*?) \[(.*?)\]/);
                    if (cardMatch && playerMap[cardMatch[3]]) {
                        const type = cardMatch[1];
                        const id = cardMatch[3];
                        if (type === 'Gelbe') getStat(id).yellow++;
                        else if (type === 'Rote' || type === 'Gelb-Rote') getStat(id).red++;
                    }
                }

                if (result.awayScore === 0) {
                    const homeGoalie = allPlayers.find(p => p.clubId === result.homeTeamId && p.position === 'Torwart');
                    if (homeGoalie) {
                        if (!tempGoalieStats[homeGoalie.id]) tempGoalieStats[homeGoalie.id] = { name: homeGoalie.name, clubId: homeGoalie.clubId, cleanSheets: 0 };
                        tempGoalieStats[homeGoalie.id].cleanSheets++;
                    }
                }
                if (result.homeScore === 0) {
                    const awayGoalie = allPlayers.find(p => p.clubId === result.awayTeamId && p.position === 'Torwart');
                    if (awayGoalie) {
                        if (!tempGoalieStats[awayGoalie.id]) tempGoalieStats[awayGoalie.id] = { name: awayGoalie.name, clubId: awayGoalie.clubId, cleanSheets: 0 };
                        tempGoalieStats[awayGoalie.id].cleanSheets++;
                    }
                }
            }

            setPlayerStats(tempPlayerStats);
            setGoalieStats(tempGoalieStats);
            setLoading(false);
        };

        fetchLeaderboardData().catch(error => {
            console.error("Error fetching leaderboards:", error);
            setLoading(false);
        });
    }, [leagueId, season]);

    const toSortedArray = (stats: any, key: string) => Object.entries(stats)
        .map(([id, stat]: [string, any]) => ({ id, name: stat.name, clubId: stat.clubId, value: stat[key] }))
        .filter(s => s.value > 0)
        .sort((a, b) => b.value - a.value);

    if (loading) {
        return <div className="text-center p-6 text-slate-400 font-semibold">Lade Bestenlisten...</div>;
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <LeaderboardCard title="Torschützen" icon={<Trophy size={18} className="mr-2 text-yellow-400"/>} stats={toSortedArray(playerStats, 'goals')} clubs={clubs} />
            <LeaderboardCard title="Weiße Westen" icon={<ShieldCheck size={18} className="mr-2 text-green-400"/>} stats={toSortedArray(goalieStats, 'cleanSheets')} clubs={clubs} />
            <LeaderboardCard title="Gelbe Karten" icon={<Square size={16} className="mr-2.5 text-yellow-500 fill-current"/>} stats={toSortedArray(playerStats, 'yellow')} clubs={clubs} />
            <LeaderboardCard title="Rote Karten" icon={<Square size={16} className="mr-2.5 text-red-500 fill-current"/>} stats={toSortedArray(playerStats, 'red')} clubs={clubs} />
        </div>
    );
};

export default LeagueLeaderboards;
