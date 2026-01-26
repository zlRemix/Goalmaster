
import * as admin from "firebase-admin";
import {Club, Fixture, League} from "../../types";

// Initialisieren Sie die Firebase-Admin-App
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  databaseURL: "https://goalmaster-56078.firebaseio.com",
});

const db = admin.firestore();

const createLeagueAndFixtures = async () => {
  const leagueName = "Meister-Liga";
  const season = 1;

  console.log("--- Aufräum-Phase startet ---");
  const oldLeaguesQuery = await db.collection("leagues").where("name", "==", leagueName).get();
  if (!oldLeaguesQuery.empty) {
    for (const doc of oldLeaguesQuery.docs) {
      const oldLeagueId = doc.id;
      console.log(`Alte Liga gefunden (ID: ${oldLeagueId}). Lösche zugehörige Spiele...`);
      const oldFixturesQuery = await db.collection("fixtures").where("leagueId", "==", oldLeagueId).get();
      if (!oldFixturesQuery.empty) {
        const deleteBatch = db.batch();
        oldFixturesQuery.docs.forEach((fixtureDoc) => deleteBatch.delete(fixtureDoc.ref));
        await deleteBatch.commit();
        console.log(`${oldFixturesQuery.size} alte Spiele gelöscht.`);
      }
      await doc.ref.delete();
      console.log(`Alte Liga (ID: ${oldLeagueId}) gelöscht.`);
    }
  } else {
    console.log("Keine alte Liga zum Aufräumen gefunden.");
  }
  console.log("--- Aufräum-Phase beendet ---");


  console.log("Lese alle Vereine aus der Datenbank...");
  const clubsSnapshot = await db.collection("clubs").limit(10).get();
  if (clubsSnapshot.empty) {
    console.error("Keine Vereine in der Datenbank gefunden.");
    return;
  }

  const clubIds = clubsSnapshot.docs.map((doc) => doc.id);
  console.log(`Gefundene Vereine (Limitiert auf 10): ${clubIds.join(", ")}`);

  console.log(`Erstelle neue Liga: "${leagueName}"`);
  const leagueRef = db.collection("leagues").doc();
  const leagueId = leagueRef.id;
  const newLeague: League = {id: leagueId, name: leagueName, clubIds, season};
  await leagueRef.set(newLeague);
  console.log(`Neue Liga erstellt mit ID: ${leagueId}`);

  const teams = [...clubIds];
  if (teams.length % 2 !== 0) {
    teams.push("dummy");
  }

  const fixtures: Omit<Fixture, "id">[] = [];
  const numTeams = teams.length;
  const numMatchdaysHinrunde = numTeams - 1;

  // Startdatum: Nächster Samstag, 12:00 Uhr
  const startDate = new Date();
  startDate.setDate(startDate.getDate() + (6 - startDate.getDay() + 7) % 7);
  startDate.setHours(12, 0, 0, 0);

  console.log(`Saisonstart ist am ${startDate.toLocaleString('de-DE')}`);

  // Hinrunde
  console.log("Erstelle Hinrunden-Spielplan...");
  for (let round = 0; round < numMatchdaysHinrunde; round++) {
    const matchday = round + 1;
    const matchDate = new Date(startDate.getTime());
    matchDate.setDate(matchDate.getDate() + round * 7); // Jede Woche ein Spieltag

    for (let i = 0; i < numTeams / 2; i++) {
      const home = teams[i];
      const away = teams[numTeams - 1 - i];
      if (home !== "dummy" && away !== "dummy") {
        fixtures.push({
          homeTeam: home,
          awayTeam: away,
          date: matchDate.getTime(),
          status: "scheduled",
          leagueId: leagueId,
          season: season,
          matchday: matchday,
        });
      }
    }
    // Rotiere die Teams für den nächsten Spieltag
    teams.splice(1, 0, teams.pop()!);
  }

  // Rückrunde (gleiche Paarungen, aber Heimrecht getauscht)
  console.log("Erstelle Rückrunden-Spielplan...");
  const hinrundeFixtures = [...fixtures];
  const rueckrundeOffsetInWeeks = numMatchdaysHinrunde;

  for (const hinrundeFixture of hinrundeFixtures) {
    const rueckrundeMatchday = (hinrundeFixture.matchday ?? 0) + numMatchdaysHinrunde;
    const rueckrundeDate = new Date(startDate.getTime());
    rueckrundeDate.setDate(rueckrundeDate.getDate() + (rueckrundeMatchday - 1) * 7);

    fixtures.push({
      homeTeam: hinrundeFixture.awayTeam,
      awayTeam: hinrundeFixture.homeTeam,
      date: rueckrundeDate.getTime(),
      status: "scheduled",
      leagueId: leagueId,
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
  console.log("Alle Spiele wurden erfolgreich in die Datenbank geschrieben.");
};

createLeagueAndFixtures()
    .then(() => console.log("Skript erfolgreich beendet."))
    .catch((error) => console.error("Ein Fehler ist aufgetreten:", error));
