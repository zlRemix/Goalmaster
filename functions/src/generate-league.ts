
import * as admin from "firebase-admin";
import { Club, Fixture, League } from "../../types";

// Initialisieren Sie die Firebase-Admin-App
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  databaseURL: "https://goalmaster-56078.firebaseio.com"
});

const db = admin.firestore();

const createLeagueAndFixtures = async () => {
  const leagueName = "Meister-Liga";
  const season = 1;

  console.log('--- Aufräum-Phase startet ---');
  const oldLeaguesQuery = await db.collection('leagues').where('name', '==', leagueName).get();
  if (!oldLeaguesQuery.empty) {
    for (const doc of oldLeaguesQuery.docs) {
        const oldLeagueId = doc.id;
        console.log(`Alte Liga gefunden (ID: ${oldLeagueId}). Lösche zugehörige Spiele...`);
        const oldFixturesQuery = await db.collection('fixtures').where('leagueId', '==', oldLeagueId).get();
        if (!oldFixturesQuery.empty) {
            const deleteBatch = db.batch();
            oldFixturesQuery.docs.forEach(fixtureDoc => deleteBatch.delete(fixtureDoc.ref));
            await deleteBatch.commit();
            console.log(`${oldFixturesQuery.size} alte Spiele gelöscht.`);
        }
        await doc.ref.delete();
        console.log(`Alte Liga (ID: ${oldLeagueId}) gelöscht.`);
    }
  } else {
      console.log('Keine alte Liga zum Aufräumen gefunden.');
  }
  console.log('--- Aufräum-Phase beendet ---');


  console.log("Lese alle Vereine aus der Datenbank...");
  const clubsSnapshot = await db.collection("clubs").limit(10).get(); // HIER DIE ÄNDERUNG: Limit auf 10
  if (clubsSnapshot.empty) {
    console.error("Keine Vereine in der Datenbank gefunden.");
    return;
  }
  
  const clubIds = clubsSnapshot.docs.map(doc => doc.id);
  console.log(`Gefundene Vereine (Limitiert auf 10): ${clubIds.join(", ")}`);

  console.log(`Erstelle neue Liga: "${leagueName}"`);
  const leagueRef = db.collection("leagues").doc();
  const leagueId = leagueRef.id;
  const newLeague: League = { id: leagueId, name: leagueName, clubIds, season };
  await leagueRef.set(newLeague);
  console.log(`Neue Liga erstellt mit ID: ${leagueId}`);
  

  // Erstellen des Spielplans (Hin- und Rückrunde)
  const teams = [...clubIds];
  if (teams.length % 2 !== 0) {
    teams.push("dummy"); // "dummy" für spielfreie Tage bei ungerader Anzahl
  }

  const fixtures: Omit<Fixture, "id">[] = [];
  const numTeams = teams.length;

  // Hinrunde
  for (let round = 0; round < numTeams - 1; round++) {
    for (let i = 0; i < numTeams / 2; i++) {
      const home = teams[i];
      const away = teams[numTeams - 1 - i];
      if (home !== "dummy" && away !== "dummy") {
        fixtures.push({
          homeTeam: home,
          awayTeam: away,
          date: admin.firestore.Timestamp.now().toMillis() + round * 7 * 24 * 60 * 60 * 1000,
          status: "scheduled",
          leagueId: leagueId,
          season: season,
        });
      }
    }
    // Rotiere die Teams für den nächsten Spieltag
    teams.splice(1, 0, teams.pop()!);
  }
  
  // Rückrunde (gleiche Paarungen, aber Heimrecht getauscht)
  const halfwayPoint = fixtures.length;
  for (let i = 0; i < halfwayPoint; i++) {
      const hinrundeFixture = fixtures[i];
      fixtures.push({
          homeTeam: hinrundeFixture.awayTeam,
          awayTeam: hinrundeFixture.homeTeam,
          date: hinrundeFixture.date + halfwayPoint * 7 * 24 * 60 * 60 * 1000,
          status: "scheduled",
          leagueId: leagueId,
          season: season,
      });
  }

  console.log(`Erstelle ${fixtures.length} Spiele für die Saison ${season}.`);

  const batch = db.batch();
  fixtures.forEach(fixture => {
    const fixtureRef = db.collection("fixtures").doc();
    batch.set(fixtureRef, fixture);
  });

  await batch.commit();
  console.log("Alle Spiele wurden erfolgreich in die Datenbank geschrieben.");
};

createLeagueAndFixtures()
  .then(() => console.log("Skript erfolgreich beendet."))
  .catch(error => console.error("Ein Fehler ist aufgetreten:", error));
