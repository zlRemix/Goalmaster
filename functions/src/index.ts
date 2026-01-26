
import {onCall, HttpsError} from "firebase-functions/v2/https";
import {onSchedule} from "firebase-functions/v2/scheduler";
import * as admin from "firebase-admin";
import {Player, Club, Fixture, Tactic, SkillType, MatchResult, League} from "../../types";

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
  return {...player.skills || {}};
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
  const [homeDoc, awayDoc] = await Promise.all([db.collection("clubs").doc(fixture.homeTeam).get(), db.collection("clubs").doc(fixture.awayTeam).get()]);
  if (!homeDoc.exists || !awayDoc.exists) {
    throw new HttpsError("not-found", "Verein nicht gefunden.");
  }
  const homeClub = {id: homeDoc.id, ...homeDoc.data()} as Club;
  const awayClub = {id: awayDoc.id, ...awayDoc.data()} as Club;
  const [homePlayers, awayPlayers] = await Promise.all([getPlayersForClub(homeClub.id), getPlayersForClub(awayClub.id)]);
  if (homePlayers.length < 11 || awayPlayers.length < 11) {
    // Not enough players, declare forfait
    const homeScore = homePlayers.length < 11 ? 0 : 3;
    const awayScore = awayPlayers.length < 11 ? 0 : 3;
    const events = [`90' Spielabbruch. ${homePlayers.length < 11 ? homeClub.name : awayClub.name} konnte keine 11 Spieler aufstellen.`];
    const result: MatchResult = {fixtureId, homeTeamId: homeClub.id, awayTeamId: awayClub.id, homeScore, awayScore, events};
    const batch = db.batch();
    batch.update(db.collection("fixtures").doc(fixtureId), {status: "played", result: `${homeScore}-${awayScore}`});
    batch.set(db.collection("match_results").doc(fixtureId), result);
    await batch.commit();
    return result;
  }
  const homeRating = calculateTeamRating(homePlayers.slice(0, 11));
  const awayRating = calculateTeamRating(awayPlayers.slice(0, 11));
  const homeTactic = TACTICS.find((t) => t.id === (homeClub.activeTacticId || "balanced")) || TACTICS[0];
  const awayTactic = TACTICS.find((t) => t.id === (awayClub.activeTacticId || "balanced")) || TACTICS[0];
  const homeAttack = homeRating.attack * (1 + homeTactic.attackBonus);
  const homeDefense = homeRating.defense * (1 + homeTactic.defenseBonus);
  const awayAttack = awayRating.attack * (1 + awayTactic.attackBonus);
  const awayDefense = awayRating.defense * (1 + awayTactic.defenseBonus);
  let homeScore = 0;
  let awayScore = 0;
  const events: string[] = [];

  for (let minute = 1; minute <= 90; minute++) {
    if (Math.random() < homeAttack / (homeAttack + awayDefense) * 0.025) {
      homeScore++;
      events.push(`${minute}' Tor für ${homeClub.name}!`);
    }
    if (Math.random() < awayAttack / (awayAttack + homeDefense) * 0.025) {
      awayScore++;
      events.push(`${minute}' Tor für ${awayClub.name}!`);
    }
  }
  events.push("90' Abpfiff!");
  const result: MatchResult = {fixtureId, homeTeamId: homeClub.id, awayTeamId: awayClub.id, homeScore, awayScore, events};
  const batch = db.batch();
  batch.update(db.collection("fixtures").doc(fixtureId), {status: "played", result: `${homeScore}-${awayScore}`});
  batch.set(db.collection("match_results").doc(fixtureId), result);
  await batch.commit();
  return result;
};

// --- Callable Functions ---

export const createLeague = onCall({cors: true}, async (request) => {
  // ... (Die createLeague Funktion bleibt unverändert)
});

export const simulateLeagueMatches = onCall({cors: true}, async () => {
  // ... (Die simulateLeagueMatches Funktion bleibt unverändert)
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
      // Wrap in a try-catch to prevent one failed simulation from stopping others
      try {
        return performMatchSimulation(fixture, doc.id);
      } catch (error) {
        console.error(`Error starting simulation for fixture ${doc.id}:`, error);
        // Update the fixture to an error status to avoid retrying indefinitely
        return db.collection("fixtures").doc(doc.id).update({status: "error"});
      }
    });

    await Promise.all(simulationPromises);
    console.log(`Successfully processed ${querySnapshot.size} scheduled games.`);
  } catch (error) {
    console.error("FATAL ERROR in scheduledMatchSimulator:", error);
  }
});
