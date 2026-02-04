import {onCall, HttpsError} from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import {Player, Club, SkillType, PlayerPosition} from "../../types";
import {TEAM_TRAININGS} from "../../constants";

const db = admin.firestore();

const getPlayersForClub = async (clubId: string): Promise<Player[]> => {
  const playersSnapshot = await db.collection("players").where("clubId", "==", clubId).get();
  return playersSnapshot.docs.map((doc) => ({id: doc.id, ...doc.data()} as Player));
};

export const completeTraining = onCall({cors: true}, async (request) => {
  const {clubId} = request.data;
  const uid = request.auth?.uid;

  if (!uid) {
    throw new HttpsError("unauthenticated", "Du musst eingeloggt sein, um diese Aktion auszuführen.");
  }

  const clubRef = db.collection("clubs").doc(clubId);
  const clubDoc = await clubRef.get();

  if (!clubDoc.exists) {
    throw new HttpsError("not-found", "Der Verein konnte nicht gefunden werden.");
  }

  const club = clubDoc.data() as Club;
  const activeTraining = club.activeTeamTraining;

  if (!activeTraining) {
    throw new HttpsError("failed-precondition", "Kein aktives Training gefunden.");
  }

  const training = TEAM_TRAININGS.find((t) => t.id === activeTraining.trainingId);

  if (!training) {
    console.error(`Training with id ${activeTraining.trainingId} not found for club ${club.id}`);
    await clubRef.update({activeTeamTraining: null});
    throw new HttpsError("internal", "Trainings-Definition nicht gefunden.");
  }

  const endTime = activeTraining.startTime + (training.durationSeconds * 1000);

  if (Date.now() < endTime) {
    throw new HttpsError("failed-precondition", "Das Training ist noch nicht abgeschlossen.");
  }

  const players = await getPlayersForClub(club.id);
  const batch = db.batch();

  players.forEach((player) => {
    const playerRef = db.collection("players").doc(player.id);
    const updates: { [key: string]: any } = {};

    if (training.reward.xp) {
      updates.experience = admin.firestore.FieldValue.increment(training.reward.xp);
    }

    const skillBonuses = training.reward.skills;
    if (skillBonuses) {
      if (skillBonuses.all) {
        for (const skill in skillBonuses.all) {
          if (Object.prototype.hasOwnProperty.call(skillBonuses.all, skill)) {
            const increment = skillBonuses.all[skill as SkillType] || 0;
            updates[`skills.${skill}`] = admin.firestore.FieldValue.increment(increment);
          }
        }
      }
      const positionSkills = skillBonuses[player.position as PlayerPosition];
      if (positionSkills) {
        for (const skill in positionSkills) {
          if (Object.prototype.hasOwnProperty.call(positionSkills, skill)) {
            const increment = positionSkills[skill as SkillType] || 0;
            updates[`skills.${skill}`] = admin.firestore.FieldValue.increment(increment);
          }
        }
      }
    }
    batch.update(playerRef, updates);
  });

  batch.update(clubRef, {activeTeamTraining: null});

  await batch.commit();

  return {success: true};
});
