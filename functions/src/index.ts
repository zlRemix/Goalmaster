import {onCall, HttpsError} from "firebase-functions/v2/https";
import {onSchedule} from "firebase-functions/v2/scheduler";
import * as admin from "firebase-admin";
import {Player, Club, Fixture, Tactic, SkillType, MatchResult, League, EquipmentItem, SkillBonus, EQUIPMENT_ITEMS} from "../types";

admin.initializeApp();
const db = admin.firestore();

// --- Simulation Logic ---
const TACTICS: Tactic[] = [
  {id: "balanced", name: "Ausgewogen", description: "...", attackBonus: 0, defenseBonus: 0},
  {id: "offensive", name: "Offensiv", description: "...", attackBonus: 0.15, defenseBonus: -0.10},
  {id: "defensive", name: "Defensiv", description: "...", attackBonus: -0.10, defenseBonus: 0.15},
  {id: "counter", name: "Konter", description: "...", attackBonus: -0.05, defenseBonus: 0.10},
  {id: "gegenpressing", name: "Gegenpressing", description: "...", attackBonus: 0.10, defenseBonus: -0.05},
];
const ATTACK_SKILLS: SkillType[] = ["pace", "shot_power", "finishing", "dribbling", "passing", "vision", "long_shots", "heading", "positioning"];
const DEFENSE_SKILLS: SkillType[] = ["tackling", "stamina", "marking", "interceptions", "strength", "aggression", "positioning", "communication"];
const GOALIE_SKILLS: SkillType[] = ["handling", "reflexes", "diving", "positioning", "communication", "kicking"];

const getPlayersForClub = async (clubId: string): Promise<Player[]> => {
  const playersSnapshot = await db.collection("players").where("clubId", "==", clubId).get();
  if (playersSnapshot.empty) {
    return [];
  }
  return playersSnapshot.docs.map((doc) => ({id: doc.id, ...doc.data()} as Player));
};

const getPlayerSkillsWithBonuses = (player: Player): { [key in SkillType]?: number } => {
  const baseSkills = player.skills || {};
  const bonuses: SkillBonus = {};

  if (player.equipped) {
    for (const slot in player.equipped) {
      const itemId = player.equipped[slot as keyof typeof player.equipped];
      if (itemId) {
        const item = (EQUIPMENT_ITEMS as EquipmentItem[]).find((i) => i.id === itemId);
        if (item && item.bonus) {
          for (const skill in item.bonus) {
            const s = skill as SkillType;
            const b = item.bonus[s as keyof typeof item.bonus] as number;
            bonuses[s] = (bonuses[s] || 0) + b;
          }
        }
      }
    }
  }

  const finalSkills: { [key in SkillType]?: number } = {};
  const allSkillKeys = [...new Set([...Object.keys(baseSkills), ...Object.keys(bonuses)])] as SkillType[];

  for (const skill of allSkillKeys) {
    finalSkills[skill] = (baseSkills[skill] || 0) + (bonuses[skill] || 0);
  }

  return finalSkills;
};


const calculateTeamRating = (players: Player[]): { attack: number, defense: number } => {
  let totalAttack = 0;
  let totalDefense = 0;
  let playerCount = 0;

  players.forEach((player) => {
    const skills = getPlayerSkillsWithBonuses(player);
    if (!skills) {
      return;
    }
    playerCount++;
    let playerAttack = 0;
    let playerDefense = 0;
    ATTACK_SKILLS.forEach((s) => (playerAttack += skills[s] || 0));
    DEFENSE_SKILLS.forEach((s) => (playerDefense += skills[s] || 0));

    switch (player.position) {
      case "Stürmer":
        totalAttack += playerAttack * 1.5;
        totalDefense += playerDefense * 0.5;
        break;
      case "Mittelfeld":
        totalAttack += playerAttack * 1.0;
        totalDefense += playerDefense * 1.0;
        break;
      case "Abwehr":
        totalAttack += playerAttack * 0.5;
        totalDefense += playerDefense * 1.5;
        break;
      case "Torwart": {
        let goalieDefense = playerDefense * 1.2;
        GOALIE_SKILLS.forEach((s) => (goalieDefense += (skills[s] || 0) * 1.5));
        totalAttack += playerAttack * 0.1;
        totalDefense += goalieDefense;
        break;
      }
    }
  });

  const num = playerCount || 1;
  return {attack: totalAttack / num, defense: totalDefense / num};
};

const performMatchSimulation = async (fixture: Fixture, fixtureId: string): Promise<MatchResult> => {
    const [homeDoc, awayDoc] = await Promise.all([
        db.collection("clubs").doc(fixture.homeTeam).get(),
        db.collection("clubs").doc(fixture.awayTeam).get(),
    ]);

    if (!homeDoc.exists || !awayDoc.exists) {
        throw new HttpsError("not-found", "Verein nicht gefunden.");
    }

    const homeClub = {id: homeDoc.id, ...homeDoc.data()} as Club;
    const awayClub = {id: awayDoc.id, ...awayDoc.data()} as Club;

    const [homePlayers, awayPlayers] = await Promise.all([
        getPlayersForClub(homeClub.id),
        getPlayersForClub(awayClub.id),
    ]);

    const events: string[] = [];
    let homeScore = 0;
    let awayScore = 0;
    let ticketIncome = 0;

    if (homePlayers.length === 0) {
        homeScore = 0;
        awayScore = 3;
        events.push(`0' Spielabbruch. ${homeClub.name} konnte keine Spieler aufstellen.`);
    } else if (awayPlayers.length === 0) {
        homeScore = 3;
        awayScore = 0;
        events.push(`0' Spielabbruch. ${awayClub.name} konnte keine Spieler aufstellen.`);
    } else {
        const homeRating = calculateTeamRating(homePlayers);
        const awayRating = calculateTeamRating(awayPlayers);
        const homeTactic = TACTICS.find((t) => t.id === (homeClub.activeTacticId || "balanced")) || TACTICS[0];
        const awayTactic = TACTICS.find((t) => t.id === (awayClub.activeTacticId || "balanced")) || TACTICS[0];

        let homeAttack = homeRating.attack * (1 + homeTactic.attackBonus);
        let homeDefense = homeRating.defense * (1 + homeTactic.defenseBonus);
        let awayAttack = awayRating.attack * (1 + awayTactic.attackBonus);
        let awayDefense = awayRating.defense * (1 + awayTactic.defenseBonus);

        const playerStatuses: { [playerId: string]: { yellowCards: number, sentOff: boolean } } = {};
        [...homePlayers, ...awayPlayers].forEach((p) => {
            playerStatuses[p.id] = { yellowCards: 0, sentOff: false };
        });

        for (let minute = 1; minute <= 90; minute++) {
            // Goal scoring logic
            if (Math.random() < homeAttack / (homeAttack + awayDefense) * 0.035) {
                homeScore++;
                const scoringPlayer = homePlayers[Math.floor(Math.random() * homePlayers.length)];
                events.push(`${minute}' Tor für ${homeClub.name}! Torschütze: ${scoringPlayer.name} [${scoringPlayer.id}].`);
            }
            if (Math.random() < awayAttack / (awayAttack + homeDefense) * 0.035) {
                awayScore++;
                const scoringPlayer = awayPlayers[Math.floor(Math.random() * awayPlayers.length)];
                events.push(`${minute}' Tor für ${awayClub.name}! Torschütze: ${scoringPlayer.name} [${scoringPlayer.id}].`);
            }

            const FOUL_PROBABILITY_PER_MINUTE = 0.025;
            const CARD_PROBABILITY_PER_FOUL = 0.1;
            const RED_CARD_PROBABILITY_PER_CARD = 0.05;

            if (Math.random() < FOUL_PROBABILITY_PER_MINUTE) {
                const isHomeFoul = Math.random() < 0.5;
                const foulTeamPlayers = (isHomeFoul ? homePlayers : awayPlayers).filter((p) => !playerStatuses[p.id].sentOff);
                const foulTeamClub = isHomeFoul ? homeClub : awayClub;

                if (foulTeamPlayers.length > 0 && Math.random() < CARD_PROBABILITY_PER_FOUL) {
                    const playerToCard = foulTeamPlayers[Math.floor(Math.random() * foulTeamPlayers.length)];
                    const status = playerStatuses[playerToCard.id];

                    if (status.yellowCards === 1 || Math.random() < RED_CARD_PROBABILITY_PER_CARD) {
                        if (!status.sentOff) {
                            status.sentOff = true;
                            if (status.yellowCards === 1) {
                                events.push(`${minute}' Gelb-Rote Karte für ${playerToCard.name} [${playerToCard.id}] (${foulTeamClub.name}).`);
                            } else {
                                events.push(`${minute}' Rote Karte für ${playerToCard.name} [${playerToCard.id}] (${foulTeamClub.name}).`);
                            }

                            if (isHomeFoul) {
                                homeAttack *= 0.9;
                                homeDefense *= 0.9;
                            } else {
                                awayAttack *= 0.9;
                                awayDefense *= 0.9;
                            }
                        }
                    } else {
                        status.yellowCards = 1;
                        events.push(`${minute}' Gelbe Karte für ${playerToCard.name} [${playerToCard.id}] (${foulTeamClub.name}).`);
                    }
                }
            }
        }
        
        const baseIncome = 25000;
        const stadiumLevel = homeClub.infrastructure?.stadium?.level || 0;
        const stadiumBonus = stadiumLevel > 0 ? (stadiumLevel * 5) / 100 : 0;
        ticketIncome = Math.round(baseIncome * (1 + stadiumBonus));

        if (ticketIncome > 0) {
            events.push(`Der Verein ${homeClub.name} erhält ${ticketIncome}€ an Ticketeinnahmen.`);
        }
    }

    events.push("90' Abpfiff!");

    const result: MatchResult = {fixtureId, homeTeamId: homeClub.id, awayTeamId: awayClub.id, homeScore, awayScore, events};
    const batch = db.batch();

    batch.update(db.collection("fixtures").doc(fixtureId), {status: "played", result: `${homeScore}-${awayScore}`});
    batch.set(db.collection("match_results").doc(fixtureId), result);

    if (ticketIncome > 0) {
        const homeClubRef = db.collection("clubs").doc(homeClub.id);
        batch.update(homeClubRef, {budget: admin.firestore.FieldValue.increment(ticketIncome)});
    }

    await batch.commit();
    return result;
};

// --- Callable Functions ---

export const runTestMatch = onCall({cors: true}, async (request) => {
  const allClubsSnapshot = await db.collection("clubs").get();
  const allClubs = allClubsSnapshot.docs.map((doc) => ({id: doc.id, ...doc.data()}) as Club);
  if (allClubs.length < 2) {
    throw new HttpsError("failed-precondition", "Nicht genügend Vereine für ein Test-Match vorhanden.");
  }

  const club1Index = Math.floor(Math.random() * allClubs.length);
  let club2Index = Math.floor(Math.random() * allClubs.length);
  while (club1Index === club2Index) {
    club2Index = Math.floor(Math.random() * allClubs.length);
  }

  const fixtureData = {
    homeTeam: allClubs[club1Index].id,
    awayTeam: allClubs[club2Index].id,
    date: Date.now(),
    status: "scheduled" as const,
    leagueId: "test-league",
    season: 0,
  };

  const fixtureRef = await db.collection("fixtures").add(fixtureData);
  const fixture: Fixture = {
    ...fixtureData,
    id: fixtureRef.id,
  };

  console.log(`Test-Match created: ${allClubs[club1Index].name} vs ${allClubs[club2Index].name}`);

  return await performMatchSimulation(fixture, fixtureRef.id);
});

export const toggleEquipment = onCall({cors: true}, async (request) => {
  const {itemId, slot} = request.data;
  const uid = request.auth?.uid;

  if (!uid) {
    throw new HttpsError("unauthenticated", "You must be logged in.");
  }
  if (!itemId || !slot) {
    throw new HttpsError("invalid-argument", "Missing itemId or slot.");
  }

  const playerRef = db.collection("players").doc(uid);
  const playerDoc = await playerRef.get();

  if (!playerDoc.exists) {
    throw new HttpsError("not-found", "Player not found.");
  }

  const player = playerDoc.data() as Player;

  if (!player.equipment?.includes(itemId)) {
    throw new HttpsError("permission-denied", "Player does not own this item.");
  }

  const equipped = player.equipped || {};

  if (equipped[slot] === itemId) {
    delete equipped[slot];
  } else {
    equipped[slot] = itemId;
  }

  await playerRef.update({equipped});

  return {success: true, equipped};
});


// --- Scheduled Functions ---

export const scheduledMatchSimulator = onSchedule("every 5 minutes", async (event) => {
  console.log("Scheduled function run: Checking for games to simulate...");

  try {
    const now = Date.now();
    const querySnapshot = await db.collection("fixtures")
        .where("status", "==", "scheduled")
        .where("date", "<=", now)
        .get();

    if (querySnapshot.empty) {
      console.log("No games found to simulate at this time.");
      return;
    }

    console.log(`Found ${querySnapshot.size} games to simulate.`);

    const simulationPromises = querySnapshot.docs.map((doc) => {
      const fixture = doc.data() as Fixture;
      try {
        return performMatchSimulation(fixture, doc.id);
      } catch (error) {
        console.error(`Error starting simulation for fixture ${doc.id}:`, error);
        return db.collection("fixtures").doc(doc.id).update({status: "error"});
      }
    });

    await Promise.all(simulationPromises);
    console.log(`Successfully processed ${querySnapshot.size} scheduled games.`);
  } catch (error) {
    console.error("FATAL ERROR in scheduledMatchSimulator:", error);
  }
});

const generateNewSeason = async () => {
  const leagueName = "Meister-Liga";

  const latestSeasonQuery = await db.collection("leagues")
      .where("name", "==", leagueName)
      .orderBy("season", "desc")
      .limit(1)
      .get();

  let season: number;
  let clubIds: string[];

  if (!latestSeasonQuery.empty) {
    const latestSeasonDoc = latestSeasonQuery.docs[0];
    const latestLeague = latestSeasonDoc.data() as League;
    
    season = (latestLeague.season || 0) + 1;
    clubIds = latestLeague.clubIds; // Use the same clubs
    console.log(`Bestehende Liga "${leagueName}" gefunden. Erstelle Saison ${season}...`);

  } else {
    console.log(`Liga "${leagueName}" nicht gefunden. Erstelle neue Liga mit Saison 1...`);
    season = 1;
    
    console.log("Lese Vereine aus der Datenbank...");
    const clubsSnapshot = await db.collection("clubs").limit(10).get();
    if (clubsSnapshot.empty) {
      console.error("Keine Vereine in der Datenbank gefunden.");
      return;
    }
    clubIds = clubsSnapshot.docs.map((doc) => doc.id);
    console.log(`Gefundene Vereine (Limitiert auf 10): ${clubIds.join(", ")}`);
  }

  const leagueRef = db.collection("leagues").doc();
  const newLeague: League = {
    id: leagueRef.id, 
    name: leagueName, 
    clubIds, 
    season
  };
  await leagueRef.set(newLeague);
  console.log(`Neue Liga-Saison erstellt mit ID: ${newLeague.id}`);

  const teams = [...clubIds];
  if (teams.length % 2 !== 0) {
    teams.push("dummy");
  }

  const fixtures: Omit<Fixture, "id">[] = [];
  const numTeams = teams.length;
  const numMatchdays = numTeams - 1;

  const now = new Date();
  const startDateHinrunde = new Date(now.getFullYear(), now.getMonth(), 3, 12, 0, 0, 0);
  console.log(`Hinrundenstart ist am ${startDateHinrunde.toLocaleString('de-DE')}`);

  // Hinrunde
  console.log("Erstelle Hinrunden-Spielplan...");
  for (let round = 0; round < numMatchdays; round++) {
    const matchday = round + 1;
    const matchDate = new Date(startDateHinrunde.getTime());
    matchDate.setDate(matchDate.getDate() + round);

    for (let i = 0; i < numTeams / 2; i++) {
      const home = teams[i];
      const away = teams[numTeams - 1 - i];
      if (home !== "dummy" && away !== "dummy") {
        fixtures.push({
          homeTeam: home,
          awayTeam: away,
          date: matchDate.getTime(),
          status: "scheduled",
          leagueId: newLeague.id, // Use the new ID
          season: season,
          matchday: matchday,
        });
      }
    }
    teams.splice(1, 0, teams.pop()!);
  }

  const startDateRueckrunde = new Date(now.getFullYear(), now.getMonth(), 20, 12, 0, 0, 0);
  console.log(`Rückrundenstart ist am ${startDateRueckrunde.toLocaleString('de-DE')}`);
  console.log("Erstelle Rückrunden-Spielplan...");

  const hinrundeFixtures = fixtures.slice(0, (numMatchdays * (numTeams / 2)));
  for (const hinrundeFixture of hinrundeFixtures) {
    const matchdayOffset = hinrundeFixture.matchday ? hinrundeFixture.matchday -1 : 0;
    const rueckrundeMatchday = (hinrundeFixture.matchday || 0) + numMatchdays;
    const rueckrundeDate = new Date(startDateRueckrunde.getTime());
    rueckrundeDate.setDate(rueckrundeDate.getDate() + matchdayOffset);

    fixtures.push({
      homeTeam: hinrundeFixture.awayTeam,
      awayTeam: hinrundeFixture.homeTeam,
      date: rueckrundeDate.getTime(),
      status: "scheduled",
      leagueId: newLeague.id, // Use the new ID
      season: season,
      matchday: rueckrundeMatchday,
    });
  }

  console.log(`Erstelle ${fixtures.length} Spiele für die Saison ${season}.`);

  const batch = db.batch();
  fixtures.forEach((fixture) => {
    const fixtureRef = db.collection("fixtures").doc();
    batch.set(fixtureRef, fixture);
  });

  await batch.commit();
  console.log("Alle Spiele für die neue Saison wurden erfolgreich in die Datenbank geschrieben.");
};

export const scheduledSeasonGenerator = onSchedule("0 0 1 * *", async () => {
  console.log("Scheduled function run: Generating new season...");
  await generateNewSeason();
});
