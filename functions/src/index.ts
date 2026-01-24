
import {onCall, HttpsError} from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { Player, Club, Fixture, Tactic, TacticID, SkillType, MatchResult, PlayerPosition } from "../../types";

admin.initializeApp();
const db = admin.firestore();

const TACTICS: Tactic[] = [
    {id: 'balanced', name: 'Ausgewogen', description: '...', attackBonus: 0, defenseBonus: 0},
    {id: 'offensive', name: 'Offensiv', description: '...', attackBonus: 0.15, defenseBonus: -0.10},
    {id: 'defensive', name: 'Defensiv', description: '...', attackBonus: -0.10, defenseBonus: 0.15},
    {id: 'counter', name: 'Konter', description: '...', attackBonus: -0.05, defenseBonus: 0.10},
    {id: 'gegenpressing', name: 'Gegenpressing', description: '...', attackBonus: 0.10, defenseBonus: -0.05}
];

const ALL_SKILLS: SkillType[] = ['pace', 'shot_power', 'finishing', 'dribbling', 'passing', 'vision', 'long_shots', 'heading', 'tackling', 'stamina', 'marking', 'interceptions', 'strength', 'aggression', 'positioning', 'communication', 'handling', 'reflexes', 'diving', 'kicking'];
const ATTACK_SKILLS: SkillType[] = ['pace', 'shot_power', 'finishing', 'dribbling', 'passing', 'vision', 'long_shots', 'heading', 'positioning'];
const DEFENSE_SKILLS: SkillType[] = ['tackling', 'stamina', 'marking', 'interceptions', 'strength', 'aggression', 'positioning', 'communication'];
const GOALIE_SKILLS: SkillType[] = ['handling', 'reflexes', 'diving', 'positioning', 'communication', 'kicking'];

// #region Bot-Erstellung
const BOT_CLUB_NAMES = ["FC Nordwind", "Stahlstadt 09", "Königsblaue Union", "Dynamo Metropole", "Hansa Küste", "Eintracht Gipfel", "Viktoria Talburg", "Fortuna Aue", "Arminia Waldhof", "Germania Raute", "Borussia Felsen", "SV Flotte Klinge", "TSV Adlerkralle", "1. FC Bärenstark", "SC Eisenhammer"];
const PLAYER_FIRST_NAMES = ["Lukas", "Finn", "Jonas", "Leon", "Ben", "Elias", "Paul", "Noah", "Felix", "Maximilian", "Jan", "Tom", "Nico"];
const PLAYER_LAST_NAMES = ["Müller", "Schmidt", "Schneider", "Fischer", "Weber", "Meyer", "Wagner", "Becker", "Schulz", "Hoffmann", "Schäfer", "Koch", "Bauer"];
const POSITIONS: PlayerPosition[] = ['Torwart', 'Abwehr', 'Mittelfeld', 'Stürmer'];

const getRandomItem = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const getRandomSkillValue = () => Math.floor(Math.random() * 50) + 20; // 20-69

const ensureBotClubsExist = async (): Promise<Club[]> => {
    const botClubsQuery = db.collection('clubs').where('ownerId', '==', 'bot_owner');
    let botClubsSnapshot = await botClubsQuery.get();

    if (botClubsSnapshot.size >= BOT_CLUB_NAMES.length) {
        return botClubsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Club));
    }

    const batch = db.batch();
    const createdBotClubs: Club[] = [];

    for (const clubName of BOT_CLUB_NAMES) {
        const clubRef = db.collection('clubs').doc();
        const playerIds: string[] = [];
        for (let i = 0; i < 20; i++) {
            const playerRef = db.collection('players').doc();
            playerIds.push(playerRef.id);
            const skills: { [key in SkillType]?: number } = {};
            ALL_SKILLS.forEach(skill => skills[skill] = getRandomSkillValue());
            const newPlayer: Omit<Player, 'id'> = { name: `${getRandomItem(PLAYER_FIRST_NAMES)} ${getRandomItem(PLAYER_LAST_NAMES)}`, position: getRandomItem(POSITIONS), clubId: clubRef.id, level: 1, experience: 0, trainingPoints: 0, roles: [], skills, activeActivities: [], completedActivityIds: [], nextActivityReset: 0 };
            batch.set(playerRef, newPlayer);
        }

        const newClub: Club = { id: clubRef.id, name: clubName, managerId: 'bot_manager', ownerId: 'bot_owner', players: playerIds, budget: Math.floor(Math.random() * 50000) + 50000, infrastructure: { stadium: { level: 1 }, training_ground: { level: 1 }, medical_center: { level: 1 }, marketing_department: { level: 1 }, }, pendingApplications: [], pendingUpgrades: [], activeTeamTraining: null, };
        batch.set(clubRef, newClub);
        createdBotClubs.push(newClub);
    }

    await batch.commit();
    return createdBotClubs;
};
// #endregion

const getPlayersForClub = async (clubId: string): Promise<Player[]> => {
    const playersSnapshot = await db.collection('players').where('clubId', '==', clubId).get();
    if (playersSnapshot.empty) return [];
    return playersSnapshot.docs.map((doc) => ({id: doc.id, ...doc.data() } as Player));
};

const calculateTeamRating = (players: Player[]): { attack: number, defense: number } => {
    let totalAttack = 0;
    let totalDefense = 0;
    let playerContributionCount = 0;

    players.forEach((player) => {
        if (!player.skills) return;
        playerContributionCount++;

        let playerAttack = 0;
        let playerDefense = 0;

        ATTACK_SKILLS.forEach(skill => playerAttack += player.skills[skill] || 0);
        DEFENSE_SKILLS.forEach(skill => playerDefense += player.skills[skill] || 0);

        switch(player.position) {
            case 'Stürmer':
                totalAttack += playerAttack * 1.5; 
                totalDefense += playerDefense * 0.5;
                break;
            case 'Mittelfeld':
                totalAttack += playerAttack * 1.0;
                totalDefense += playerDefense * 1.0;
                break;
            case 'Abwehr':
                totalAttack += playerAttack * 0.5;
                totalDefense += playerDefense * 1.5;
                break;
            case 'Torwart':
                totalAttack += playerAttack * 0.1;
                let goalieDefense = playerDefense * 1.2;
                GOALIE_SKILLS.forEach(skill => goalieDefense += (player.skills[skill] || 0) * 1.5);
                totalDefense += goalieDefense;
                break;
        }
    });

    const numPlayers = playerContributionCount || 1;
    return {
        attack: totalAttack / numPlayers,
        defense: totalDefense / numPlayers
    };
};


const performMatchSimulation = async (fixture: Fixture, fixtureId: string): Promise<MatchResult> => {
    const [homeClubDoc, awayClubDoc] = await Promise.all([
        db.collection('clubs').doc(fixture.homeTeam).get(),
        db.collection('clubs').doc(fixture.awayTeam).get()
    ]);

    if (!homeClubDoc.exists || !awayClubDoc.exists) {
        throw new HttpsError('not-found', `Einer oder beide Vereine für das Spiel ${fixtureId} konnten nicht gefunden werden.`);
    }

    const homeClub = {id: homeClubDoc.id, ...homeClubDoc.data()} as Club;
    const awayClub = {id: awayClubDoc.id, ...awayClubDoc.data()} as Club;

    const [homePlayers, awayPlayers] = await Promise.all([
        getPlayersForClub(homeClub.id),
        getPlayersForClub(awayClub.id)
    ]);

    if (homePlayers.length < 11 || awayPlayers.length < 11) {
        throw new HttpsError('failed-precondition', `Spiel ${fixtureId}: Eines oder beide Teams haben nicht genügend Spieler (mind. 11).`);
    }

    const homeBaseRating = calculateTeamRating(homePlayers.slice(0, 11));
    const awayBaseRating = calculateTeamRating(awayPlayers.slice(0, 11));

    const homeTactic = TACTICS.find((t) => t.id === (homeClub.activeTacticId || 'balanced')) || TACTICS[0];
    const awayTactic = TACTICS.find((t) => t.id === (awayClub.activeTacticId || 'balanced')) || TACTICS[0];

    const homeFinalAttack = homeBaseRating.attack * (1 + homeTactic.attackBonus);
    const homeFinalDefense = homeBaseRating.defense * (1 + homeTactic.defenseBonus);
    const awayFinalAttack = awayBaseRating.attack * (1 + awayTactic.attackBonus);
    const awayFinalDefense = awayBaseRating.defense * (1 + awayTactic.defenseBonus);

    let homeScore = 0;
    let awayScore = 0;
    const events: string[] = [];
    const GOAL_PROBABILITY_MODIFIER = 0.025; // Weiterhin ein feintuning-parameter

    for (let minute = 1; minute <= 90; minute++) {
        const homeAttackChance = homeFinalAttack / (homeFinalAttack + awayFinalDefense);
        if (Math.random() < homeAttackChance * GOAL_PROBABILITY_MODIFIER) {
            homeScore++;
            const scorer = homePlayers[Math.floor(Math.random() * homePlayers.length)];
            events.push(`${minute}' Tor für ${homeClub.name}! Torschütze: ${scorer.name}.`);
        }

        const awayAttackChance = awayFinalAttack / (awayFinalAttack + homeFinalDefense);
        if (Math.random() < awayAttackChance * GOAL_PROBABILITY_MODIFIER) {
            awayScore++;
            const scorer = awayPlayers[Math.floor(Math.random() * awayPlayers.length)];
            events.push(`${minute}' Tor für ${awayClub.name}! Torschütze: ${scorer.name}.`);
        }
    }

    events.push("90' Abpfiff!");

    const matchResult: MatchResult = { fixtureId, homeTeamId: homeClub.id, awayTeamId: awayClub.id, homeScore, awayScore, events };
    const batch = db.batch();
    batch.update(db.collection('fixtures').doc(fixtureId), { status: 'played', result: `${homeScore}-${awayScore}` });
    batch.set(db.collection('match_results').doc(fixtureId), matchResult);
    await batch.commit();

    return matchResult;
};


export const simulateMatch = onCall(async (request) => {
    const {fixtureId} = request.data;
    if (!fixtureId) {
        throw new HttpsError('invalid-argument', 'Die Funktion muss mit einer "fixtureId" aufgerufen werden.');
    }

    try {
        const fixtureRef = db.collection('fixtures').doc(fixtureId);
        const fixtureDoc = await fixtureRef.get();
        if (!fixtureDoc.exists) throw new HttpsError('not-found', `Spiel mit ID ${fixtureId} nicht gefunden.`);
        
        const fixture = fixtureDoc.data() as Fixture;
        if (fixture.status === 'played') throw new HttpsError('failed-precondition', 'Dieses Spiel wurde bereits gespielt.');

        const result = await performMatchSimulation(fixture, fixtureId);

        return {success: true, message: "Spiel erfolgreich simuliert.", result };

    } catch (error) {
        console.error("Fehler bei der Spielsimulation:", error);
        if (error instanceof HttpsError) throw error;
        throw new HttpsError('internal', 'Ein unerwarteter Fehler ist bei der Spielsimulation aufgetreten.');
    }
});

export const simulateLeagueMatches = onCall(async () => {
    try {
        const scheduledFixturesQuery = db.collection('fixtures').where('status', '==', 'scheduled');
        const snapshot = await scheduledFixturesQuery.get();

        if (snapshot.empty) {
            return { success: true, message: "Keine ausstehenden Spiele zum Simulieren gefunden." };
        }

        const simulationPromises = snapshot.docs.map(doc => 
            performMatchSimulation(doc.data() as Fixture, doc.id).catch(e => ({ error: e.message, fixtureId: doc.id }))
        );

        const results = await Promise.allSettled(simulationPromises);

        let successCount = 0;
        let errorCount = 0;
        results.forEach(res => {
            if (res.status === 'fulfilled' && !(res.value as any).error) {
                successCount++;
            } else {
                errorCount++;
            }
        });

        return { success: true, message: `Alle Ligaspiele simuliert. ${successCount} erfolgreich, ${errorCount} fehlgeschlagen.` };

    } catch (error) {
        console.error("Fehler bei der Simulation der Ligaspiele:", error);
        if (error instanceof HttpsError) throw error;
        throw new HttpsError('internal', 'Ein unerwarteter Fehler ist bei der Simulation der Ligaspiele aufgetreten.');
    }
});


export const createLeague = onCall(async () => {
    const LEAGUE_SIZE = 10; 

    try {
        const playerClubsQuery = db.collection('clubs').where('ownerId', '!=', 'bot_owner');
        const playerClubsSnapshot = await playerClubsQuery.get();
        const playerClubs = playerClubsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Club));

        const botClubs = await ensureBotClubsExist();
        let leagueClubs = playerClubs;
        const neededBots = LEAGUE_SIZE - playerClubs.length;
        let botsAdded = 0;

        if (neededBots > 0) {
            const availableBots = botClubs.slice(0, neededBots);
            leagueClubs = [...playerClubs, ...availableBots];
            botsAdded = availableBots.length;
        }
        leagueClubs = leagueClubs.slice(0, LEAGUE_SIZE);

        if (leagueClubs.length < 2) {
             throw new HttpsError('failed-precondition', `Nicht genügend Vereine für eine Liga. Mindestens 2 benötigt, aber nur ${leagueClubs.length} gefunden.`);
        }

        const leagueBatch = db.batch();

        // Alten Spielplan & Ergebnisse löschen
        const [oldFixtures, oldResults] = await Promise.all([db.collection('fixtures').get(), db.collection('match_results').get()]);
        oldFixtures.forEach(doc => leagueBatch.delete(doc.ref));
        oldResults.forEach(doc => leagueBatch.delete(doc.ref));

        // Neuen Spielplan erstellen
        const teams = leagueClubs.map(c => c.id);
        const fixtures: Omit<Fixture, 'id'>[] = [];
        const startDate = Date.now();
        const dayInMillis = 24 * 60 * 60 * 1000;
        let matchDate = startDate;
        
        for (let i = 0; i < teams.length; i++) {
            for (let j = i + 1; j < teams.length; j++) {
                fixtures.push({ homeTeam: teams[i], awayTeam: teams[j], status: 'scheduled', date: matchDate });
                fixtures.push({ homeTeam: teams[j], awayTeam: teams[i], status: 'scheduled', date: matchDate + (12 * 60 * 60 * 1000) }); // Rückspiel 12h später
                matchDate += dayInMillis;
            }
        }

        fixtures.forEach(fixture => {
            const fixtureRef = db.collection('fixtures').doc();
            leagueBatch.set(fixtureRef, fixture);
        });

        await leagueBatch.commit();

        return { success: true, message: `Liga mit ${leagueClubs.length} Teams (inkl. ${botsAdded} Bots) erfolgreich erstellt.` };

    } catch (error) {
        console.error("Fehler beim Erstellen der Liga:", error);
        if (error instanceof HttpsError) throw error;
        throw new HttpsError('internal', 'Ein unerwarteter Fehler ist beim Erstellen der Liga aufgetreten.');
    }
});


export const completeTeamTraining = onCall(() => {
  console.error('Die Funktion completeTeamTraining ist nicht implementiert.');
  throw new HttpsError('internal', 'Diese Funktion ist derzeit nicht verfügbar. Bitte wenden Sie sich an den Support.');
});
