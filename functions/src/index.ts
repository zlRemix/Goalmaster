
import {onCall, HttpsError} from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { Player, Club, Fixture, Tactic, TacticID, SkillType, MatchResult, PlayerPosition } from "../../types";

admin.initializeApp();
const db = admin.firestore();

// In einem echten Monorepo wäre dies ein gemeinsames Paket.
const TACTICS: Tactic[] = [
    {id: 'balanced', name: 'Ausgewogen', description: '...', attackBonus: 0, defenseBonus: 0},
    {id: 'offensive', name: 'Offensiv', description: '...', attackBonus: 0.15, defenseBonus: -0.10},
    {id: 'defensive', name: 'Defensiv', description: '...', attackBonus: -0.10, defenseBonus: 0.15},
    {id: 'counter', name: 'Konter', description: '...', attackBonus: -0.05, defenseBonus: 0.10},
    {id: 'gegenpressing', name: 'Gegenpressing', description: '...', attackBonus: 0.10, defenseBonus: -0.05}
];

const ALL_SKILLS: SkillType[] = ['pace', 'shot_power', 'finishing', 'dribbling', 'passing', 'vision', 'long_shots', 'heading', 'tackling', 'stamina', 'marking', 'interceptions', 'strength', 'aggression', 'positioning', 'communication', 'handling', 'reflexes', 'diving', 'kicking'];
const ATTACK_SKILLS: SkillType[] = ['pace', 'shot_power', 'finishing', 'dribbling', 'passing', 'vision', 'long_shots', 'heading'];
const DEFENSE_SKILLS: SkillType[] = ['tackling', 'stamina', 'marking', 'interceptions', 'strength', 'aggression', 'positioning', 'communication'];
const GOALIE_SKILLS: SkillType[] = ['handling', 'reflexes', 'diving', 'positioning', 'communication', 'kicking'];

// #region Bot-Erstellung
const BOT_CLUB_NAMES = ["FC Nordwind", "Stahlstadt 09", "Königsblaue Union", "Dynamo Metropole", "Hansa Küste", "Eintracht Gipfel", "Viktoria Talburg", "Fortuna Aue", "Arminia Waldhof", "Germania Raute", "Borussia Felsen", "SV Flotte Klinge", "TSV Adlerkralle", "1. FC Bärenstark", "SC Eisenhammer"];
const PLAYER_FIRST_NAMES = ["Lukas", "Finn", "Jonas", "Leon", "Ben", "Elias", "Paul", "Noah", "Felix", "Maximilian", "Jan", "Tom", "Nico"];
const PLAYER_LAST_NAMES = ["Müller", "Schmidt", "Schneider", "Fischer", "Weber", "Meyer", "Wagner", "Becker", "Schulz", "Hoffmann", "Schäfer", "Koch", "Bauer"];
// **FIX**: Ensure positions match the PlayerPosition type from types.ts
const POSITIONS: PlayerPosition[] = ['Torwart', 'Abwehr', 'Mittelfeld', 'Stürmer'];

const getRandomItem = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const getRandomSkillValue = () => Math.floor(Math.random() * 50) + 20; // 20-69

const ensureBotClubsExist = async (): Promise<Club[]> => {
    const botClubsQuery = db.collection('clubs').where('ownerId', '==', 'bot_owner');
    let botClubsSnapshot = await botClubsQuery.get();

    if (botClubsSnapshot.size >= BOT_CLUB_NAMES.length) {
        console.log("Bot-Clubs existieren bereits. Lese sie aus der DB.");
        return botClubsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Club));
    }

    console.log("Bot-Clubs nicht gefunden. Erstelle sie jetzt...");
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

            const newPlayer: Omit<Player, 'id'> = {
                name: `${getRandomItem(PLAYER_FIRST_NAMES)} ${getRandomItem(PLAYER_LAST_NAMES)}`,
                position: getRandomItem(POSITIONS),
                clubId: clubRef.id,
                level: 1, experience: 0, trainingPoints: 0, roles: [], skills,
                activeActivities: [], completedActivityIds: [], nextActivityReset: 0
            };
            batch.set(playerRef, newPlayer);
        }

        const newClub: Club = {
            id: clubRef.id,
            name: clubName,
            managerId: 'bot_manager',
            ownerId: 'bot_owner',
            players: playerIds,
            budget: Math.floor(Math.random() * 50000) + 50000,
            infrastructure: { stadium: { level: 1 }, training_ground: { level: 1 }, medical_center: { level: 1 }, marketing_department: { level: 1 }, },
            pendingApplications: [], pendingUpgrades: [], activeTeamTraining: null,
        };
        batch.set(clubRef, newClub);
        createdBotClubs.push(newClub);
    }

    await batch.commit();
    console.log(`${createdBotClubs.length} Bot-Clubs erfolgreich erstellt und committed.`);
    return createdBotClubs;
};
// #endregion

const getPlayersForClub = async (clubId: string): Promise<Player[]> => {
    const playersSnapshot = await db.collection('players').where('clubId', '==', clubId).get();
    if (playersSnapshot.empty) {
        return [];
    }
    return playersSnapshot.docs.map((doc) => doc.data() as Player);
};

const calculateTeamRating = (players: Player[]): { attack: number, defense: number } => {
    let attack = 0;
    let defense = 0;

    players.forEach((player) => {
        if (!player.skills) return;
        for (const skill of ATTACK_SKILLS) {
            attack += player.skills[skill] || 0;
        }
        for (const skill of DEFENSE_SKILLS) {
            defense += player.skills[skill] || 0;
        }
        if (player.position === 'Torwart') {
            for (const skill of GOALIE_SKILLS) {
                defense += (player.skills[skill] || 0) * 1.5;
            }
        }
    });

    const numPlayers = players.length || 1;
    return {
        attack: attack / numPlayers,
        defense: defense / numPlayers
    };
};

export const simulateMatch = onCall(async (request) => {
    const {fixtureId} = request.data;
    if (!fixtureId) {
        throw new HttpsError('invalid-argument', 'Die Funktion muss mit einer "fixtureId" aufgerufen werden.');
    }

    try {
        const fixtureRef = db.collection('fixtures').doc(fixtureId);
        const fixtureDoc = await fixtureRef.get();

        if (!fixtureDoc.exists) {
            throw new HttpsError('not-found', `Spiel mit ID ${fixtureId} nicht gefunden.`);
        }
        const fixture = fixtureDoc.data() as Fixture;

        if (fixture.status === 'played') {
            throw new HttpsError('failed-precondition', 'Dieses Spiel wurde bereits gespielt.');
        }

        const [homeClubDoc, awayClubDoc] = await Promise.all([
            db.collection('clubs').doc(fixture.homeTeam).get(),
            db.collection('clubs').doc(fixture.awayTeam).get()
        ]);

        if (!homeClubDoc.exists || !awayClubDoc.exists) {
            throw new HttpsError('not-found', 'Einer oder beide Vereine konnten nicht gefunden werden.');
        }

        const homeClub = homeClubDoc.data() as Club;
        const awayClub = awayClubDoc.data() as Club;

        const [homePlayers, awayPlayers] = await Promise.all([
            getPlayersForClub(homeClub.id),
            getPlayersForClub(awayClub.id)
        ]);

        if (homePlayers.length < 1 || awayPlayers.length < 1) {
            throw new HttpsError('failed-precondition', 'Eines oder beide Teams haben nicht genügend Spieler.');
        }

        const homeBaseRating = calculateTeamRating(homePlayers);
        const awayBaseRating = calculateTeamRating(awayPlayers);

        const homeTactic = TACTICS.find((t) => t.id === (homeClub.activeTacticId || 'balanced')) || TACTICS[0];
        const awayTactic = TACTICS.find((t) => t.id === (awayClub.activeTacticId || 'balanced')) || TACTICS[0];

        const homeFinalAttack = homeBaseRating.attack * (1 + homeTactic.attackBonus);
        const homeFinalDefense = homeBaseRating.defense * (1 + homeTactic.defenseBonus);
        const awayFinalAttack = awayBaseRating.attack * (1 + awayTactic.attackBonus);
        const awayFinalDefense = awayBaseRating.defense * (1 + awayTactic.defenseBonus);

        let homeScore = 0;
        let awayScore = 0;
        const events: string[] = [];
        const GOAL_PROBABILITY_MODIFIER = 0.025;

        for (let minute = 1; minute <= 90; minute++) {
            const homeAttackStrength = homeFinalAttack / awayFinalDefense;
            if (Math.random() < homeAttackStrength * GOAL_PROBABILITY_MODIFIER) {
                homeScore++;
                const scorer = homePlayers[Math.floor(Math.random() * homePlayers.length)];
                const event = `${minute}' Tor für ${homeClub.name}! Torschütze: ${scorer.name}.`;
                events.push(event);
            }

            const awayAttackStrength = awayFinalAttack / homeFinalDefense;
            if (Math.random() < awayAttackStrength * GOAL_PROBABILITY_MODIFIER) {
                awayScore++;
                const scorer = awayPlayers[Math.floor(Math.random() * awayPlayers.length)];
                const event = `${minute}' Tor für ${awayClub.name}! Torschütze: ${scorer.name}.`;
                events.push(event);
            }
        }

        events.push("90' Abpfiff!");

        const matchResult: MatchResult = {
            fixtureId,
            homeTeamId: homeClub.id,
            awayTeamId: awayClub.id,
            homeScore,
            awayScore,
            events
        };

        const batch = db.batch();

        batch.update(fixtureRef, {
            status: 'played',
            result: `${homeScore}-${awayScore}`
        });

        const resultRef = db.collection('match_results').doc(fixtureId);
        batch.set(resultRef, matchResult);

        await batch.commit();

        return {success: true, message: "Spiel erfolgreich simuliert.", result: matchResult};

    } catch (error) {
        console.error("Fehler bei der Spielsimulation:", error);
        if (error instanceof HttpsError) {
            throw error;
        }
        throw new HttpsError('internal', 'Ein unerwarteter Fehler ist bei der Spielsimulation aufgetreten.');
    }
});

export const createLeague = onCall(async () => {
    const LEAGUE_SIZE = 10; 

    try {
        // Schritt 1: Rufe alle Spieler-Clubs ab.
        const playerClubsQuery = db.collection('clubs').where('ownerId', '!=', 'bot_owner');
        const playerClubsSnapshot = await playerClubsQuery.get();
        const playerClubs = playerClubsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Club));
        console.log(`${playerClubs.length} Spieler-Clubs gefunden.`);

        // Schritt 2: Stelle sicher, dass Bot-Clubs existieren und erhalte sie.
        const botClubs = await ensureBotClubsExist();

        // Schritt 3: Liga mit Bots auffüllen, falls nötig.
        let leagueClubs = playerClubs;
        const neededBots = LEAGUE_SIZE - playerClubs.length;
        
        let botsAdded = 0;
        if (neededBots > 0) {
            const availableBots = botClubs.slice(0, neededBots);
            leagueClubs = [...playerClubs, ...availableBots];
            botsAdded = availableBots.length;
        }
        leagueClubs = leagueClubs.slice(0, LEAGUE_SIZE);
        console.log(`Liga wird mit ${playerClubs.length} Spieler-Clubs und ${botsAdded} Bot-Clubs erstellt.`);

        if (leagueClubs.length < 2) {
             throw new HttpsError('failed-precondition', `Nicht genügend Vereine für eine Liga. Es werden mindestens 2 benötigt, aber es konnte(n) nur ${leagueClubs.length} gefunden werden (inkl. Bots).`);
        }

        const leagueBatch = db.batch();

        // Schritt 4: Alten Spielplan löschen.
        const oldFixturesSnapshot = await db.collection('fixtures').get();
        if (!oldFixturesSnapshot.empty) {
            console.log(`Lösche ${oldFixturesSnapshot.size} alte Spiele.`);
            oldFixturesSnapshot.forEach(doc => leagueBatch.delete(doc.ref));
        }

        // Schritt 5: Neuen Spielplan erstellen (Round Robin).
        const teams = leagueClubs.map(c => c.id);
        const fixtures: Omit<Fixture, 'id'>[] = [];
        
        for (let i = 0; i < teams.length; i++) {
            for (let j = i + 1; j < teams.length; j++) {
                 // **FIX**: Use Date.now() to provide a number, matching the Fixture type.
                fixtures.push({ homeTeam: teams[i], awayTeam: teams[j], status: 'scheduled', date: Date.now() });
                fixtures.push({ homeTeam: teams[j], awayTeam: teams[i], status: 'scheduled', date: Date.now() });
            }
        }
        console.log(`Erstelle ${fixtures.length} neue Spiele für ${leagueClubs.length} Teams.`);

        fixtures.forEach(fixture => {
            const fixtureRef = db.collection('fixtures').doc();
            leagueBatch.set(fixtureRef, fixture);
        });

        await leagueBatch.commit();

        return { success: true, message: `Spielplan mit ${leagueClubs.length} Teams (inkl. ${botsAdded} Bots) erfolgreich erstellt.` };

    } catch (error) {
        console.error("Fehler beim Erstellen der Liga:", error);
        if (error instanceof HttpsError) {
            throw error;
        }
        throw new HttpsError('internal', 'Ein unerwarteter Fehler ist beim Erstellen der Liga aufgetreten.');
    }
});


export const completeTeamTraining = onCall(() => {
  console.error('Die Funktion completeTeamTraining ist nicht implementiert.');
  throw new HttpsError('internal', 'Diese Funktion ist derzeit nicht verfügbar. Bitte wenden Sie sich an den Support.');
});
