import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import {TEAM_TRAININGS} from '../../constants';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const cors = require('cors');

admin.initializeApp();

const db = admin.firestore();
const corsHandler = cors({origin: true});

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
