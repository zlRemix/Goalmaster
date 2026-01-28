
import React, { useState, useEffect, useMemo } from 'react';
import { Fixture, Club } from '../types';
import { db } from '../services/firebase';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import ClubLogo from './ClubLogo';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { ChevronsRight } from 'lucide-react';

interface NextMatchdayProps {
    club: Club | null;
    allClubs: Club[];
}

const NextMatchday: React.FC<NextMatchdayProps> = ({ club, allClubs }) => {
    const [nextFixture, setNextFixture] = useState<Fixture | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!club) {
            setLoading(false);
            return;
        }

        setLoading(true);
        const now = new Date();

        const qHome = query(
            collection(db, 'fixtures'),
            where('homeTeam', '==', club.id),
            where('status', '==', 'scheduled'),
            where('date', '>=', now.getTime()),
            orderBy('date', 'asc'),
            limit(1)
        );

        const qAway = query(
            collection(db, 'fixtures'),
            where('awayTeam', '==', club.id),
            where('status', '==', 'scheduled'),
            where('date', '>=', now.getTime()),
            orderBy('date', 'asc'),
            limit(1)
        );

        const unsubHome = onSnapshot(qHome, (homeSnap) => {
            const homeFixture = homeSnap.empty ? null : { id: homeSnap.docs[0].id, ...homeSnap.docs[0].data() } as Fixture;

            const unsubAway = onSnapshot(qAway, (awaySnap) => {
                const awayFixture = awaySnap.empty ? null : { id: awaySnap.docs[0].id, ...awaySnap.docs[0].data() } as Fixture;

                if (!homeFixture && !awayFixture) {
                    setNextFixture(null);
                } else if (homeFixture && !awayFixture) {
                    setNextFixture(homeFixture);
                } else if (!homeFixture && awayFixture) {
                    setNextFixture(awayFixture);
                } else if (homeFixture && awayFixture) {
                    setNextFixture(homeFixture.date < awayFixture.date ? homeFixture : awayFixture);
                }
                setLoading(false);
            });
            return () => unsubAway();
        });

        return () => unsubHome();

    }, [club]);

    const opponent = useMemo(() => {
        if (!nextFixture || !club) return null;
        const opponentId = nextFixture.homeTeam === club.id ? nextFixture.awayTeam : nextFixture.homeTeam;
        return allClubs.find(c => c.id === opponentId) || null;
    }, [nextFixture, club, allClubs]);


    if (loading) {
        return (
             <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700 text-center">
                <p className="text-slate-400 animate-pulse">Lade nächsten Spieltag...</p>
            </div>
        );
    }

    if (!club || !nextFixture || !opponent) {
        return null; 
    }

    const matchDate = new Date(nextFixture.date);
    const isHomeGame = nextFixture.homeTeam === club.id;

    return (
        <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700">
             <header className="mb-4">
                <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-3">
                    <ChevronsRight className="w-7 h-7 text-yellow-400" />
                    <span>Nächster Spieltag</span>
                </h2>
                <p className="text-slate-400 mt-1 text-sm">Dein nächstes Spiel in der Liga.</p>
            </header>
            <div className="flex items-center justify-between">
                <div className="flex flex-col items-center text-center w-1/3">
                    <ClubLogo logo={isHomeGame ? club.logo : opponent.logo} size={48}/>
                    <span className="font-bold text-white mt-2 text-sm truncate">{isHomeGame ? club.name : opponent.name}</span>
                </div>

                <div className="text-center px-2">
                    <p className="font-mono text-slate-400 text-sm">Spieltag {nextFixture.matchday}</p>
                    <p className="font-black text-yellow-400 text-2xl my-1">VS</p>
                    <p className="font-semibold text-sm text-slate-300 whitespace-nowrap">
                        {format(matchDate, 'dd.MM.yy - HH:mm', { locale: de })}h
                    </p>
                </div>

                 <div className="flex flex-col items-center text-center w-1/3">
                    <ClubLogo logo={isHomeGame ? opponent.logo : club.logo} size={48}/>
                    <span className="font-bold text-white mt-2 text-sm truncate">{isHomeGame ? opponent.name : club.name}</span>
                </div>
            </div>
        </div>
    );
};

export default NextMatchday;
