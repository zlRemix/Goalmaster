
import {onCall, HttpsError} from "firebase-functions/v2/https";
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
    throw new HttpsError("failed-precondition", "Nicht genügend Spieler.");
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
  const {clubIds, leagueName} = request.data;

  if (!Array.isArray(clubIds) || clubIds.length < 2 || clubIds.length > 10) {
    throw new HttpsError("invalid-argument", "Die Vereins-IDs sind ungültig (2-10 Vereine erforderlich).");
  }
  if (!leagueName || typeof leagueName !== "string" || leagueName.trim().length === 0) {
    throw new HttpsError("invalid-argument", "Ein gültiger Name für die Liga ist erforderlich.");
  }

  try {
    console.log(`[createLeague] Starting for league: "${leagueName}" with ${clubIds.length} clubs.`);
    const leaguesRef = db.collection("leagues");
    const querySnapshot = await leaguesRef.where("name", "==", leagueName).limit(1).get();

    let leagueId: string;
    let newSeason: number;
    const leagueRef = querySnapshot.empty ? leaguesRef.doc() : querySnapshot.docs[0].ref;

    if (querySnapshot.empty) {
      newSeason = 1;
      leagueId = leagueRef.id;
      const newLeague: League = {id: leagueId, name: leagueName, clubIds, season: newSeason};
      await leagueRef.set(newLeague);
      console.log(`[createLeague] New league created with ID: ${leagueId}. Season: 1.`);
    } else {
      const existingLeague = querySnapshot.docs[0].data() as League;
      leagueId = existingLeague.id;
      newSeason = (existingLeague.season || 0) + 1;
      await leagueRef.update({season: newSeason, clubIds});
      console.log(`[createLeague] Existing league ${leagueId} updated to season: ${newSeason}.`);
    }

    const teams = [...clubIds];
    if (teams.length % 2 !== 0) {
      teams.push("dummy");
    }

    const numRounds = teams.length - 1;
    const fixtures: Omit<Fixture, "id">[] = [];

    for (let round = 0; round < numRounds; round++) {
      for (let i = 0; i < teams.length / 2; i++) {
        const home = teams[i];
        const away = teams[teams.length - 1 - i];
        if (home !== "dummy" && away !== "dummy") {
          fixtures.push({
            homeTeam: home,
            awayTeam: away,
            date: Date.now() + round * 7 * 24 * 60 * 60 * 1000,
            status: "scheduled",
            leagueId: leagueId,
            season: newSeason,
          });
        }
      }
      const lastTeam = teams.pop();
      if (lastTeam) {
        teams.splice(1, 0, lastTeam);
      }
    }

    console.log(`[createLeague] Generated ${fixtures.length} fixtures for season ${newSeason}.`);

    const batch = db.batch();
    fixtures.forEach((fixture) => {
      const fixtureRef = db.collection("fixtures").doc();
      batch.set(fixtureRef, fixture);
    });
    await batch.commit();

    console.log("[createLeague] Successfully committed fixtures to Firestore.");
    return {success: true, message: `Saison ${newSeason} für '${leagueName}' wurde mit ${fixtures.length} Spielen erfolgreich erstellt.`};
  } catch (error) {
    console.error("[createLeague] FATAL ERROR:", error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError("internal", "Ein unerwarteter Serverfehler ist aufgetreten.");
  }
});

export const simulateLeagueMatches = onCall({cors: true}, async () => {
  try {
    const snapshot = await db.collection("fixtures").where("status", "==", "scheduled").get();
    if (snapshot.empty) {
      return {success: true, message: "Keine Spiele zum Simulieren gefunden."};
    }
    const promises = snapshot.docs.map((doc) => performMatchSimulation(doc.data() as Fixture, doc.id));
    await Promise.all(promises);
    return {success: true, message: `${promises.length} Spiele wurden erfolgreich simuliert.`};
  } catch (error) {
    console.error("FATAL ERROR in simulateLeagueMatches:", error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError("internal", "Ein Fehler ist bei der Simulation der Ligaspiele aufgetreten.");
  }
});
