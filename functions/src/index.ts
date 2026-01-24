import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import {TEAM_TRAININGS} from '../../constants';
// Wichtige Typen für unsere neue Funktion importieren
import {Club, Fixture} from '../../types'; 
// eslint-disable-next-line @typescript-eslint/no-var-requires
const cors = require('cors');
import express from 'express';
const app = express();

admin.initializeApp();

const db = admin.firestore();
const corsHandler = cors({origin: true});


export const createLeague = functions.https.onCall(async (data, context) => {
  // Schritt 1: Bestehende Vereine abrufen
  const clubsRef = db.collection('clubs');
  const clubsSnapshot = await clubsRef.get();
  const existingClubs = clubsSnapshot.docs.map((doc) => ({id: doc.id, ...doc.data()})) as Club[];

  const allClubs = [...existingClubs];
  const targetClubCount = 10;

  // Schritt 2: Bot-Vereine erstellen, falls erforderlich
  const neededBots = targetClubCount - allClubs.length;
  if (neededBots > 0) {
    const batch = db.batch();
    for (let i = 1; i <= neededBots; i++) {
      const botClubRef = db.collection('clubs').doc();
      const botName = `Bot Verein ${i}`;
      const newBotClub: Club = {
        id: botClubRef.id,
        name: botName,
        isBot: true, // Deutlich als Bot markieren
        managerId: 'bot_manager', 
        ownerId: 'bot_owner',
        players: [],
        budget: 50000, // Standardbudget
        infrastructure: {
          stadium: {level: 1},
          training_ground: {level: 1},
          medical_center: {level: 1},
          marketing_department: {level: 1},
        },
      };
      batch.set(botClubRef, newBotClub);
      allClubs.push(newBotClub);
    }
    await batch.commit();
  }

  // Schritt 3: Bestehenden Spielplan löschen
  const fixturesRef = db.collection('fixtures');
  const existingFixtures = await fixturesRef.get();
  if (!existingFixtures.empty) {
    const deleteBatch = db.batch();
    existingFixtures.docs.forEach((doc) => deleteBatch.delete(doc.ref));
    await deleteBatch.commit();
  }

  // Schritt 4: Neuen Spielplan (Hin- und Rückrunde) erstellen
  const newFixtures: Omit<Fixture, 'id'>[] = [];
  // Startdatum für die Liga (z.B. nächster Tag)
  const leagueStartDate = new Date();
  leagueStartDate.setDate(leagueStartDate.getDate() + 1);
  leagueStartDate.setHours(16, 0, 0, 0); // Feste Startzeit

  let matchDate = leagueStartDate.getTime();

  for (const homeTeam of allClubs) {
    for (const awayTeam of allClubs) {
      if (homeTeam.id === awayTeam.id) continue; // Kein Spiel gegen sich selbst

      newFixtures.push({
        homeTeam: homeTeam.id,
        awayTeam: awayTeam.id,
        date: matchDate,
      });

      // Datum für das nächste Spiel um 6 Stunden erhöhen
      matchDate += 6 * 60 * 60 * 1000;
    }
  }

  // Schritt 5: Neue Spiele in die Datenbank schreiben
  const fixturesBatch = db.batch();
  newFixtures.forEach((fixture) => {
    const fixtureRef = db.collection('fixtures').doc();
    fixturesBatch.set(fixtureRef, fixture);
  });
  await fixturesBatch.commit();

  return {success: true, message: `Liga mit ${allClubs.length} Vereinen und ${newFixtures.length} Spielen erstellt.`};
});


export const completeTeamTraining = functions.https.onRequest(async (req, res) => {
  corsHandler(req, res, async () => {
    if (req.method !== 'POST') {
      res.status(405).send('Method Not Allowed');
      return;
    }

    const {clubId} = req.body.data;
    const uid = req.body.data.uid;

    if (!uid) {
      res.status(401).send({error: 'Der Benutzer ist nicht authentifiziert.'});
      return;
    }

    const clubRef = db.collection('clubs').doc(clubId);
    const clubDoc = await clubRef.get();

    if (!clubDoc.exists) {
      res.status(404).send({error: 'Verein nicht gefunden.'});
      return;
    }

    const club = clubDoc.data();
    if (club?.managerId !== uid) {
      res.status(403).send({error: 'Nur der Manager kann das Training abschließen.'});
      return;
    }

    const training = club?.activeTeamTraining;
    if (!training) {
      res.status(412).send({error: 'Kein aktives Teamtraining gefunden.'});
      return;
    }

    const trainingDef = TEAM_TRAININGS.find((t) => t.id === training.trainingId);
    if (!trainingDef) {
      res.status(500).send({error: 'Teamtraining-Definition nicht gefunden.'});
      return;
    }

    const batch = db.batch();

    const playerIds = club?.players || [];
    if (playerIds.length > 0) {
      const playersQuery = db.collection('players').where(admin.firestore.FieldPath.documentId(), 'in', playerIds);
      const playersSnapshot = await playersQuery.get();

      playersSnapshot.forEach((playerDoc) => {
        const xpGain = trainingDef.reward.xp || 0;
        const tpGain = trainingDef.reward.tp || 0;

        batch.update(playerDoc.ref, {
          experience: admin.firestore.FieldValue.increment(xpGain),
          trainingPoints: admin.firestore.FieldValue.increment(tpGain),
        });
      });
    }

    batch.update(clubRef, {activeTeamTraining: null});

    await batch.commit();

    res.status(200).send({data: {success: true}});
  });
});

// Der Start-Block muss bleiben:
if (process.env.PORT) {
  const port = parseInt(process.env.PORT) || 8080;
  app.listen(port, () => {
    console.log(`🚀 Server läuft auf Port ${port}`);
  });
}
