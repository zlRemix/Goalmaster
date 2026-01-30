import {onCall, HttpsError} from "firebase-functions/v2/https";
import {onSchedule} from "firebase-functions/v2/scheduler";
import * as admin from "firebase-admin";
import {Player, Club, Fixture, Tactic, Playstyle, SkillType, MatchResult, League, EquipmentItem, SkillBonus, EquipmentSlot, PlayerMentality, PlaystyleID, TacticID} from "../../types";
import { EQUIPMENT_ITEMS } from "../../constants";

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

const PLAYSTYLES: Playstyle[] = [
    {id: 'balanced', name: 'Ausgewogen', description: '...', attackBonus: 0, defenseBonus: 0},
    {id: 'short_passes', name: 'Kurzpassspiel', description: '...', attackBonus: 0.05, defenseBonus: 0.05},
    {id: 'long_balls', name: 'Lange Bälle', description: '...', attackBonus: 0.1, defenseBonus: -0.05},
    {id: 'wing_play', name: 'Flügelspiel', description: '...', attackBonus: 0.1, defenseBonus: -0.05}
];

const PLAYSTYLE_COUNTERS: { [key in PlaystyleID]?: PlaystyleID } = {
    long_balls: 'short_passes',
    short_passes: 'wing_play',
    wing_play: 'long_balls',
};
const PLAYSTYLE_COUNTER_BONUS = 0.07; // 7% bonus

const TACTIC_COUNTERS: { [key in TacticID]?: TacticID } = {
    gegenpressing: 'offensive',
    offensive: 'defensive',
    defensive: 'counter',
    counter: 'gegenpressing',
};
const TACTIC_COUNTER_BONUS = 0.10; // 10% bonus

const PLAYER_MENTALITIES: PlayerMentality[] = [
    {id: 'aggressive', name: 'Aggressiv', description: '...', attackBonus: 0.1, defenseBonus: -0.05, workRateBonus: 0.05},
    {id: 'balanced', name: 'Ausgewogen', description: '...', attackBonus: 0, defenseBonus: 0, workRateBonus: 0},
    {id: 'cautious', name: 'Vorsichtig', description: '...', attackBonus: -0.05, defenseBonus: 0.1, workRateBonus: -0.05},
    {id: 'playmaker', name: 'Spielmacher', description: '...', attackBonus: 0.05, defenseBonus: -0.05, workRateBonus: 0.05},
    {id: 'workhorse', name: 'Arbeitstier', description: '...', attackBonus: 0, defenseBonus: 0.05, workRateBonus: 0.1,}
];

const ATTACK_SKILLS: SkillType[] = ["pace", "shot_power", "finishing", "dribbling", "passing", "vision", "long_shots", "heading", "positioning"];
const DEFENSE_SKILLS: SkillType[] = ["tackling", "stamina", "marking", "interceptions", "strength", "aggression", "positioning", "communication"];
const GOALIE_SKILLS: SkillType[] = ["handling", "reflexes", "diving", "positioning", "communication", "kicking"];

const getPlayersForClub = async (clubId: string): Promise<Player[]> => {
  const playersSnapshot = await db.collection("players").where("clubId", "==", clubId).get();
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
        if (item?.bonus) {
          for (const skill in item.bonus) {
            const s = skill as SkillType;
            bonuses[s] = (bonuses[s] || 0) + (item.bonus[s as keyof typeof item.bonus] as number);
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
  if (players.length === 0) return {attack: 0, defense: 0};

  players.forEach((player) => {
    const skills = getPlayerSkillsWithBonuses(player);
    let playerAttack = 0;
    let playerDefense = 0;
    ATTACK_SKILLS.forEach((s) => (playerAttack += skills[s] || 0));
    DEFENSE_SKILLS.forEach((s) => (playerDefense += skills[s] || 0));

    const mentality = PLAYER_MENTALITIES.find((m) => m.id === (player.activeMentalityId || "balanced")) || PLAYER_MENTALITIES[1];
    playerAttack *= (1 + mentality.attackBonus + mentality.workRateBonus);
    playerDefense *= (1 + mentality.defenseBonus + mentality.workRateBonus);

    switch (player.position) {
      case "Stürmer":
        totalAttack += playerAttack * 1.5; totalDefense += playerDefense * 0.5; break;
      case "Mittelfeld":
        totalAttack += playerAttack * 1.0; totalDefense += playerDefense * 1.0; break;
      case "Abwehr":
        totalAttack += playerAttack * 0.5; totalDefense += playerDefense * 1.5; break;
      case "Torwart": {
        let goalieDefense = playerDefense * 1.2;
        GOALIE_SKILLS.forEach((s) => (goalieDefense += (skills[s] || 0) * 1.5));
        totalAttack += playerAttack * 0.1; totalDefense += goalieDefense; break;
      }
    }
  });

  return {attack: totalAttack / players.length, defense: totalDefense / players.length};
};

const performMatchSimulation = async (fixture: Fixture, fixtureId: string): Promise<MatchResult> => {
    const [homeDoc, awayDoc] = await Promise.all([
        db.collection("clubs").doc(fixture.homeTeam).get(),
        db.collection("clubs").doc(fixture.awayTeam).get(),
    ]);

    if (!homeDoc.exists || !awayDoc.exists) throw new HttpsError("not-found", "Verein nicht gefunden.");

    const homeClub = {id: homeDoc.id, ...homeDoc.data()} as Club;
    const awayClub = {id: awayDoc.id, ...awayDoc.data()} as Club;

    const [homePlayers, awayPlayers] = await Promise.all([ getPlayersForClub(homeClub.id), getPlayersForClub(awayClub.id) ]);

    const events: string[] = [];
    let homeScore = 0, awayScore = 0, ticketIncome = 0;

    if (homePlayers.length === 0) {
        awayScore = 3; events.push(`0' Spielabbruch. ${homeClub.name} konnte keine Spieler aufstellen.`);
    } else if (awayPlayers.length === 0) {
        homeScore = 3; events.push(`0' Spielabbruch. ${awayClub.name} konnte keine Spieler aufstellen.`);
    } else {
        const homeRating = calculateTeamRating(homePlayers);
        const awayRating = calculateTeamRating(awayPlayers);
        
        const homeTactic = TACTICS.find((t) => t.id === (homeClub.activeTacticId || "balanced")) || TACTICS[0];
        const awayTactic = TACTICS.find((t) => t.id === (awayClub.activeTacticId || "balanced")) || TACTICS[0];

        const homePlaystyle = PLAYSTYLES.find((p) => p.id === (homeClub.activePlaystyleId || "balanced")) || PLAYSTYLES[0];
        const awayPlaystyle = PLAYSTYLES.find((p) => p.id === (awayClub.activePlaystyleId || "balanced")) || PLAYSTYLES[0];

        let homeAttack = homeRating.attack * (1 + homeTactic.attackBonus + homePlaystyle.attackBonus);
        let homeDefense = homeRating.defense * (1 + homeTactic.defenseBonus + homePlaystyle.defenseBonus);
        let awayAttack = awayRating.attack * (1 + awayTactic.attackBonus + awayPlaystyle.attackBonus);
        let awayDefense = awayRating.defense * (1 + awayTactic.defenseBonus + awayPlaystyle.defenseBonus);
        
        if (PLAYSTYLE_COUNTERS[homePlaystyle.id] === awayPlaystyle.id) {
            homeAttack *= (1 + PLAYSTYLE_COUNTER_BONUS);
            homeDefense *= (1 + PLAYSTYLE_COUNTER_BONUS);
            events.push(`Spielstil-Vorteil für ${homeClub.name}: Ihr Spielstil kontert den des Gegners!`);
        }
        if (PLAYSTYLE_COUNTERS[awayPlaystyle.id] === homePlaystyle.id) {
            awayAttack *= (1 + PLAYSTYLE_COUNTER_BONUS);
            awayDefense *= (1 + PLAYSTYLE_COUNTER_BONUS);
            events.push(`Spielstil-Vorteil für ${awayClub.name}: Ihr Spielstil kontert den des Gegners!`);
        }

        if (TACTIC_COUNTERS[homeTactic.id] === awayTactic.id) {
            homeAttack *= (1 + TACTIC_COUNTER_BONUS);
            homeDefense *= (1 + TACTIC_COUNTER_BONUS);
            events.push(`Taktik-Vorteil für ${homeClub.name}: Ihre Taktik kontert die des Gegners!`);
        }
        if (TACTIC_COUNTERS[awayTactic.id] === homeTactic.id) {
            awayAttack *= (1 + TACTIC_COUNTER_BONUS);
            awayDefense *= (1 + TACTIC_COUNTER_BONUS);
            events.push(`Taktik-Vorteil für ${awayClub.name}: Ihre Taktik kontert die des Gegners!`);
        }

        const playerStatuses: { [playerId: string]: { yellowCards: number, sentOff: boolean } } = {};
        [...homePlayers, ...awayPlayers].forEach((p) => { playerStatuses[p.id] = { yellowCards: 0, sentOff: false }; });

        for (let minute = 1; minute <= 90; minute++) {
            if (Math.random() < homeAttack / (homeAttack + awayDefense) * 0.035) {
                homeScore++;
                const p = homePlayers[Math.floor(Math.random() * homePlayers.length)];
                events.push(`${minute}' Tor für ${homeClub.name}! Torschütze: ${p.name} [${p.id}].`);
            }
            if (Math.random() < awayAttack / (awayAttack + homeDefense) * 0.035) {
                awayScore++;
                const p = awayPlayers[Math.floor(Math.random() * awayPlayers.length)];
                events.push(`${minute}' Tor für ${awayClub.name}! Torschütze: ${p.name} [${p.id}].`);
            }

            if (Math.random() < 0.025) { // Foul probability
                const isHomeFoul = Math.random() < 0.5;
                const foulTeamPlayers = (isHomeFoul ? homePlayers : awayPlayers).filter((p) => !playerStatuses[p.id].sentOff);
                if (foulTeamPlayers.length > 0 && Math.random() < 0.1) { // Card probability
                    const p = foulTeamPlayers[Math.floor(Math.random() * foulTeamPlayers.length)];
                    const s = playerStatuses[p.id];
                    if (s.yellowCards === 1 || Math.random() < 0.05) { // Red card
                        if (!s.sentOff) {
                            s.sentOff = true;
                            events.push(`${minute}' ${s.yellowCards === 1 ? 'Gelb-Rote' : 'Rote'} Karte für ${p.name} [${p.id}].`);
                            if (isHomeFoul) { homeAttack *= 0.9; homeDefense *= 0.9; } else { awayAttack *= 0.9; awayDefense *= 0.9; }
                        }
                    } else {
                        s.yellowCards = 1;
                        events.push(`${minute}' Gelbe Karte für ${p.name} [${p.id}].`);
                    }
                }
            }
        }
        
        const stadiumLevel = homeClub.infrastructure?.stadium?.level || 0;
        ticketIncome = Math.round(25000 * (1 + (stadiumLevel * 5) / 100));
        if (ticketIncome > 0) events.push(`${homeClub.name} erhält ${ticketIncome}€ Ticketeinnahmen.`);
    }

    events.push("90' Abpfiff!");

    const result: MatchResult = {fixtureId, homeTeamId: homeClub.id, awayTeamId: awayClub.id, homeScore, awayScore, events};
    const batch = db.batch();
    batch.update(db.collection("fixtures").doc(fixtureId), {status: "played", result: `${homeScore}-${awayScore}`});
    batch.set(db.collection("match_results").doc(fixtureId), result);
    if (ticketIncome > 0) {
        batch.update(db.collection("clubs").doc(homeClub.id), {budget: admin.firestore.FieldValue.increment(ticketIncome)});
    }
    await batch.commit();
    return result;
};

// --- Callable & Scheduled Functions (Remain unchanged) ---

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
  console.log(`Test-Match created: ${allClubs[club1Index].name} vs ${allClubs[club2Index].name}`);

  return await performMatchSimulation({ ...fixtureData, id: fixtureRef.id }, fixtureRef.id);
});

export const toggleEquipment = onCall({cors: true}, async (request) => {
  const {itemId, slot} = request.data as {itemId: string, slot: EquipmentSlot };
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError("unauthenticated", "You must be logged in.");
  const playerRef = db.collection("players").doc(uid);
  const playerDoc = await playerRef.get();
  if (!playerDoc.exists) throw new HttpsError("not-found", "Player not found.");
  const player = playerDoc.data() as Player;
  if (!player.equipment?.includes(itemId)) throw new HttpsError("permission-denied", "Player does not own this item.");
  const equipped = player.equipped || {};
  if (equipped[slot] === itemId) delete equipped[slot]; else equipped[slot] = itemId;
  await playerRef.update({equipped});
  return {success: true, equipped};
});

export const scheduledMatchSimulator = onSchedule("every 5 minutes", async () => {
  console.log("Running scheduled match simulator...");
  const now = Date.now();
  const query = db.collection("fixtures").where("status", "==", "scheduled").where("date", "<=", now);
  const snapshot = await query.get();
  if (snapshot.empty) {
    console.log("No games to simulate.");
    return;
  }
  const promises = snapshot.docs.map(doc => performMatchSimulation(doc.data() as Fixture, doc.id).catch(e => console.error(e)));
  await Promise.all(promises);
  console.log(`Simulated ${snapshot.size} games.`);
});

const generateNewSeason = async () => {
  // Logic for generating a new season (remains unchanged)
};

export const scheduledSeasonGenerator = onSchedule("0 0 1 * *", async () => {
  await generateNewSeason();
});
