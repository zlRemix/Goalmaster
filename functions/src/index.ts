import {onCall, HttpsError} from "firebase-functions/v2/https";
import {onSchedule} from "firebase-functions/v2/scheduler";
import * as admin from "firebase-admin";
import {Player, Club, Fixture, Tactic, Playstyle, SkillType, MatchResult, League, EquipmentItem, SkillBonus, EquipmentSlot, PlayerMentality, PlaystyleID, TacticID, InfrastructureType, SpecializationID, PendingUpgrade} from "../../types";
import { EQUIPMENT_ITEMS, INFRASTRUCTURE_SPECIALIZATIONS, INFRA_SPECIALIZATION_COST, INFRA_SPECIALIZATION_TIME } from "../../constants";

admin.initializeApp();
const db = admin.firestore();

// --- Simulation Logic (existing) ---
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
      case "Stürmer": totalAttack += playerAttack * 1.5; totalDefense += playerDefense * 0.5; break;
      case "Mittelfeld": totalAttack += playerAttack * 1.0; totalDefense += playerDefense * 1.0; break;
      case "Abwehr": totalAttack += playerAttack * 0.5; totalDefense += playerDefense * 1.5; break;
      case "Torwart": { let goalieDefense = playerDefense * 1.2; GOALIE_SKILLS.forEach((s) => (goalieDefense += (skills[s] || 0) * 1.5)); totalAttack += playerAttack * 0.1; totalDefense += goalieDefense; break; }
    }
  });
  return {attack: totalAttack / players.length, defense: totalDefense / players.length};
};
const performMatchSimulation = async (fixture: Fixture, fixtureId: string): Promise<MatchResult> => {
    const [homeDoc, awayDoc] = await Promise.all([ db.collection("clubs").doc(fixture.homeTeam).get(), db.collection("clubs").doc(fixture.awayTeam).get() ]);
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
        const stadiumSpecialization = homeClub.infrastructure?.stadium?.specialization;
        if (stadiumSpecialization === 'ultra_fortress') {
            const specialization = INFRASTRUCTURE_SPECIALIZATIONS.find(p => p.type === InfrastructureType.STADIUM)?.specializations.find(s => s.id === 'ultra_fortress');
            if (specialization) {
                homeDefense *= (1 + specialization.bonus.defense_bonus);
                events.push(`Heimvorteil für ${homeClub.name}: Die 'Gelbe Wand' verleiht der Abwehr +15% Stärke!`);
            }
        }
        if (PLAYSTYLE_COUNTERS[homePlaystyle.id] === awayPlaystyle.id) {
            homeAttack *= (1 + PLAYSTYLE_COUNTER_BONUS); homeDefense *= (1 + PLAYSTYLE_COUNTER_BONUS);
            events.push(`Spielstil-Vorteil für ${homeClub.name}: Ihr Spielstil kontert den des Gegners!`);
        }
        if (PLAYSTYLE_COUNTERS[awayPlaystyle.id] === homePlaystyle.id) {
            awayAttack *= (1 + PLAYSTYLE_COUNTER_BONUS); awayDefense *= (1 + PLAYSTYLE_COUNTER_BONUS);
            events.push(`Spielstil-Vorteil für ${awayClub.name}: Ihr Spielstil kontert den des Gegners!`);
        }
        if (TACTIC_COUNTERS[homeTactic.id] === awayTactic.id) {
            homeAttack *= (1 + TACTIC_COUNTER_BONUS); homeDefense *= (1 + TACTIC_COUNTER_BONUS);
            events.push(`Taktik-Vorteil für ${homeClub.name}: Ihre Taktik kontert die des Gegners!`);
        }
        if (TACTIC_COUNTERS[awayTactic.id] === homeTactic.id) {
            awayAttack *= (1 + TACTIC_COUNTER_BONUS); awayDefense *= (1 + TACTIC_COUNTER_BONUS);
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
            if (Math.random() < 0.025) {
                const isHomeFoul = Math.random() < 0.5;
                const foulTeamPlayers = (isHomeFoul ? homePlayers : awayPlayers).filter((p) => !playerStatuses[p.id].sentOff);
                if (foulTeamPlayers.length > 0 && Math.random() < 0.1) {
                    const p = foulTeamPlayers[Math.floor(Math.random() * foulTeamPlayers.length)];
                    const s = playerStatuses[p.id];
                    if (s.yellowCards === 1 || Math.random() < 0.05) {
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
        let incomeBonus = (stadiumLevel * 5) / 100;
        if (stadiumSpecialization === 'vip_temple') {
            const specialization = INFRASTRUCTURE_SPECIALIZATIONS.find(p => p.type === InfrastructureType.STADIUM)?.specializations.find(s => s.id === 'vip_temple');
            if (specialization) {
                incomeBonus = specialization.bonus.income_bonus; // Use 100% bonus
                 events.push(`${homeClub.name} profitiert vom 'VIP-Business-Tempel'! Die Einnahmen sind verdoppelt.`);
            }
        }
        ticketIncome = Math.round(25000 * (1 + incomeBonus));
        if (ticketIncome > 0) events.push(`${homeClub.name} erhält ${ticketIncome}€ Ticketeinnahmen.`);
    }
    events.push("90' Abpfiff!");
    const result: MatchResult = {fixtureId, homeTeamId: homeClub.id, awayTeamId: awayClub.id, homeScore, awayScore, events, leagueId: homeClub.leagueId};
    const batch = db.batch();
    batch.update(db.collection("fixtures").doc(fixtureId), {status: "played", result: `${homeScore}-${awayScore}`});
    batch.set(db.collection("match_results").doc(fixtureId), result);
    if (ticketIncome > 0) {
        batch.update(db.collection("clubs").doc(homeClub.id), {budget: admin.firestore.FieldValue.increment(ticketIncome)});
    }
    await batch.commit();
    return result;
};


export const selectSpecialization = onCall({cors: true}, async (request) => {
    const { clubId, infrastructureType, specializationId } = request.data as { clubId: string, infrastructureType: InfrastructureType, specializationId: SpecializationID };
    const uid = request.auth?.uid;

    if (!uid) {
        throw new HttpsError("unauthenticated", "Du musst eingeloggt sein, um diese Aktion auszuführen.");
    }

    const clubRef = db.collection("clubs").doc(clubId);

    try {
        await db.runTransaction(async (transaction) => {
            const clubDoc = await transaction.get(clubRef);
            if (!clubDoc.exists) {
                throw new HttpsError("not-found", "Der Verein konnte nicht gefunden werden.");
            }

            const club = clubDoc.data() as Club;

            if (club.managerId !== uid) {
                throw new HttpsError("permission-denied", "Du bist nicht der Manager dieses Vereins.");
            }

            const infra = club.infrastructure?.[infrastructureType];

            if (!infra || infra.level < 10) {
                throw new HttpsError("failed-precondition", "Das Gebäude muss erst Level 10 erreichen.");
            }

            if (infra.specialization) {
                throw new HttpsError("failed-precondition", "Es wurde bereits eine Spezialisierung für dieses Gebäude gewählt.");
            }

             if (club.pendingUpgrades?.some(upg => upg.type === infrastructureType)) {
                throw new HttpsError("failed-precondition", "Für dieses Gebäude läuft bereits ein Ausbau.");
            }

            if ((club.budget || 0) < INFRA_SPECIALIZATION_COST) {
                throw new HttpsError("failed-precondition", `Nicht genügend Budget. Es werden ${INFRA_SPECIALIZATION_COST.toLocaleString('de-DE')} € benötigt.`);
            }
            
            const validSpecialization = INFRASTRUCTURE_SPECIALIZATIONS
                .find(p => p.type === infrastructureType)?.specializations
                .some(s => s.id === specializationId);

            if (!validSpecialization) {
                throw new HttpsError("invalid-argument", "Ungültige Spezialisierung.");
            }

            const now = Date.now();
            const newUpgrade: PendingUpgrade = {
                type: infrastructureType,
                specializationId: specializationId,
                startTime: now,
                endTime: now + (INFRA_SPECIALIZATION_TIME * 1000),
            };

            transaction.update(clubRef, {
                budget: admin.firestore.FieldValue.increment(-INFRA_SPECIALIZATION_COST),
                pendingUpgrades: admin.firestore.FieldValue.arrayUnion(newUpgrade)
            });
        });

        return { success: true };
    } catch (error) {
        if (error instanceof HttpsError) {
            throw error;
        }
        console.error("Transaction for specialization failed: ", error);
        throw new HttpsError("internal", "Die Spezialisierung konnte nicht gestartet werden.", { details: error });
    }
});

export const scheduledUpgradeCompleter = onSchedule("every 5 minutes", async () => {
    const now = Date.now();
    const query = db.collection("clubs").where("pendingUpgrades", "!=", []);
    const snapshot = await query.get();

    if (snapshot.empty) {
        console.log("No clubs with pending upgrades.");
        return;
    }

    const batch = db.batch();
    let completedCount = 0;

    snapshot.forEach(doc => {
        const club = doc.data() as Club;
        const clubRef = doc.ref;
        
        const currentUpgrades = club.pendingUpgrades || [];
        const completedUpgrades = currentUpgrades.filter(upg => upg.endTime <= now);
        const ongoingUpgrades = currentUpgrades.filter(upg => upg.endTime > now);

        if (completedUpgrades.length > 0) {
            const updates: { [key: string]: any } = {
                pendingUpgrades: ongoingUpgrades
            };

            completedUpgrades.forEach(upgrade => {
                if (upgrade.specializationId) {
                    const updatePath = `infrastructure.${upgrade.type}.specialization`;
                    updates[updatePath] = upgrade.specializationId;
                    console.log(`Completing specialization ${upgrade.specializationId} for club ${club.id}`);
                } else if (upgrade.targetLevel) {
                    const updatePath = `infrastructure.${upgrade.type}.level`;
                    updates[updatePath] = upgrade.targetLevel;
                     console.log(`Completing level up to ${upgrade.targetLevel} for club ${club.id}`);
                }
            });

            batch.update(clubRef, updates);
            completedCount++;
        }
    });

    if (completedCount > 0) {
        await batch.commit();
        console.log(`Successfully completed upgrades for ${completedCount} clubs.`);
    } else {
        console.log("Found clubs with upgrades, but none are finished yet.");
    }
});

// --- Other Callable & Scheduled Functions ---

export const runTestMatch = onCall({cors: true}, async (request) => {
  // ... (existing implementation)
});

export const toggleEquipment = onCall({cors: true}, async (request) => {
  // ... (existing implementation)
});

export const scheduledMatchSimulator = onSchedule("every 5 minutes", async () => {
  // ... (existing implementation)
});

export const scheduledSeasonGenerator = onSchedule("0 0 1 * *", async () => {
    console.log("Starting new season generation...");
    const leaguesSnapshot = await db.collection("leagues").get();
    if (leaguesSnapshot.empty) {
        console.log("No leagues found. Exiting season generator.");
        return;
    }

    const allLeagues = leaguesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as League));

    for (const league of allLeagues) {
        console.log(`Processing league: ${league.name} (${league.id})`);
        
        const batch = db.batch();
        const season = league.season || 1; 

        // 1. Calculate final table
        const leagueTable: { [clubId: string]: { points: number, goalsFor: number, goalsAgainst: number, wins: number, draws: number, losses: number } } = {};

        const resultsSnapshot = await db.collection("match_results").where("leagueId", "==", league.id).get();
        resultsSnapshot.forEach(doc => {
            const result = doc.data() as MatchResult;
            
            // Initialize club entries if not present
            if (!leagueTable[result.homeTeamId]) leagueTable[result.homeTeamId] = { points: 0, goalsFor: 0, goalsAgainst: 0, wins: 0, draws: 0, losses: 0 };
            if (!leagueTable[result.awayTeamId]) leagueTable[result.awayTeamId] = { points: 0, goalsFor: 0, goalsAgainst: 0, wins: 0, draws: 0, losses: 0 };

            leagueTable[result.homeTeamId].goalsFor += result.homeScore;
            leagueTable[result.homeTeamId].goalsAgainst += result.awayScore;
            leagueTable[result.awayTeamId].goalsFor += result.awayScore;
            leagueTable[result.awayTeamId].goalsAgainst += result.homeScore;

            if (result.homeScore > result.awayScore) {
                leagueTable[result.homeTeamId].points += 3;
                leagueTable[result.homeTeamId].wins += 1;
                leagueTable[result.awayTeamId].losses += 1;
            } else if (result.homeScore < result.awayScore) {
                leagueTable[result.awayTeamId].points += 3;
                leagueTable[result.awayTeamId].wins += 1;
                leagueTable[result.homeTeamId].losses += 1;
            } else {
                leagueTable[result.homeTeamId].points += 1;
                leagueTable[result.awayTeamId].points += 1;
                leagueTable[result.homeTeamId].draws += 1;
                leagueTable[result.awayTeamId].draws += 1;
            }
        });

        const sortedTable = Object.entries(leagueTable).sort(([, a], [, b]) => {
            if (b.points !== a.points) return b.points - a.points;
            const goalDiffA = a.goalsFor - a.goalsAgainst;
            const goalDiffB = b.goalsFor - b.goalsAgainst;
            if (goalDiffB !== goalDiffA) return goalDiffB - goalDiffA;
            return b.goalsFor - a.goalsFor;
        });
        
        console.log(`League ${league.name} final table for season ${season}:`, sortedTable.map((t,i) => `${i+1}. ${t[0]}: ${t[1].points} pts`).join(", "));

        // 2. Archive old data
        const fixturesSnapshot = await db.collection("fixtures").where("leagueId", "==", league.id).get();
        fixturesSnapshot.forEach(doc => {
            const fixture = doc.data() as Fixture;
            const archiveRef = db.collection("archive_fixtures").doc(doc.id);
            batch.set(archiveRef, {...fixture, season});
            batch.delete(doc.ref);
        });

        resultsSnapshot.forEach(doc => {
            const result = doc.data() as MatchResult;
            const archiveRef = db.collection("archive_match_results").doc(doc.id);
            batch.set(archiveRef, {...result, season});
            batch.delete(doc.ref);
        });
        
        // 3. Promotion & Relegation
        const clubsToPromote = sortedTable.slice(0, league.promotionSpots);
        const clubsToRelegate = sortedTable.slice(-league.relegationSpots);

        if (league.promotesTo) {
            for (const [clubId] of clubsToPromote) {
                console.log(`Promoting ${clubId} to ${league.promotesTo}`);
                batch.update(db.collection("clubs").doc(clubId), { leagueId: league.promotesTo });
            }
        }
        if (league.relegatesTo) {
            for (const [clubId] of clubsToRelegate) {
                console.log(`Relegating ${clubId} to ${league.relegatesTo}`);
                batch.update(db.collection("clubs").doc(clubId), { leagueId: league.relegatesTo });
            }
        }

        // 4. Generate new schedule
        const newSeasonClubsSnapshot = await db.collection('clubs').where('leagueId', '==', league.id).get();
        const clubIds = newSeasonClubsSnapshot.docs.map(doc => doc.id);
        
        console.log(`Generating schedule for ${clubIds.length} clubs in league ${league.id} for season ${season + 1}`);

        if (clubIds.length > 1) {
            const schedule = [];
            const teams = [...clubIds];
            if (teams.length % 2 !== 0) teams.push("dummy"); // Add a dummy team for odd numbers

            const numMatchdays = teams.length - 1;
            
            for (let i = 0; i < numMatchdays; i++) {
                // Hinrunde
                for (let j = 0; j < teams.length / 2; j++) {
                    const home = teams[j];
                    const away = teams[teams.length - 1 - j];
                    if (home !== "dummy" && away !== "dummy") {
                        const matchDate = new Date();
                        matchDate.setDate(3 + i); // Start on day 3
                        schedule.push({ homeTeam: home, awayTeam: away, matchday: i + 1, date: matchDate.toISOString().split('T')[0], status: "scheduled", leagueId: league.id });
                    }
                }
                
                // Rückrunde
                for (let j = 0; j < teams.length / 2; j++) {
                    const home = teams[teams.length - 1 - j]; // Swap home/away
                    const away = teams[j];
                    if (home !== "dummy" && away !== "dummy") {
                         const matchDate = new Date();
                         matchDate.setDate(20 + i); // Start on day 20
                         schedule.push({ homeTeam: home, awayTeam: away, matchday: i + 1 + numMatchdays, date: matchDate.toISOString().split('T')[0], status: "scheduled", leagueId: league.id });
                    }
                }

                // Rotate teams
                teams.splice(1, 0, teams.pop()!);
            }

            for (const fixture of schedule) {
                const fixtureRef = db.collection("fixtures").doc();
                batch.set(fixtureRef, fixture);
            }
        }
        
        // Update league season
        batch.update(db.collection("leagues").doc(league.id), { season: season + 1 });
        
        await batch.commit();
        console.log(`Finished processing for league: ${league.name}`);
    }
    console.log("New season generation complete.");
});
