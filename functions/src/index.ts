import {onCall, HttpsError, CallableRequest} from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

admin.initializeApp();

const db = admin.firestore();

interface ApplyToClubData {
  clubId: string;
}

interface AcceptApplicationData {
  clubId: string;
  playerId: string;
}

export const applyToClub = onCall({cors: ['https://3002-firebase-goalmaster-1769022012493.cluster-lu4mup47g5gm4rtyvhzpwbfadi.cloudworkstations.dev']}, async (request: CallableRequest<ApplyToClubData>) => {
  const {data, auth} = request;

  if (!auth) {
    throw new HttpsError(
        'unauthenticated',
        'The function must be called ' +
      'while authenticated.'
    );
  }

  const uid = auth.uid;
  const {clubId} = data;

  if (!clubId) {
    throw new HttpsError(
        'invalid-argument',
        'The function must be called with a \'clubId\'.'
    );
  }

  try {
    const clubRef = db.collection('clubs').doc(clubId);
    const clubDoc = await clubRef.get();

    if (!clubDoc.exists) {
      throw new HttpsError('not-found', 'Club does not exist.');
    }

    await clubRef.update({
      pendingApplications: admin.firestore.FieldValue.arrayUnion(uid),
    });

    return {success: true, message: 'Application submitted successfully.'};
  } catch (error) {
    console.error('Error applying to club:', error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError('internal', 'An internal error occurred.');
  }
});

export const acceptApplication = onCall({cors: ['https://3002-firebase-goalmaster-1769022012493.cluster-lu4mup47g5gm4rtyvhzpwbfadi.cloudworkstations.dev']}, async (request: CallableRequest<AcceptApplicationData>) => {
  const {data, auth} = request;

  if (!auth) {
    throw new HttpsError(
        'unauthenticated',
        'The function must be called while authenticated.'
    );
  }

  const {clubId, playerId} = data;

  if (!clubId || !playerId) {
    throw new HttpsError(
        'invalid-argument',
        'The function must be called with \'clubId\' and \'playerId\'.'
    );
  }

  const clubRef = db.collection('clubs').doc(clubId);
  const playerRef = db.collection('players').doc(playerId);

  try {
    const clubDoc = await clubRef.get();
    if (!clubDoc.exists) {
      throw new HttpsError('not-found', 'Club does not exist.');
    }

    const clubData = clubDoc.data();
    if (!clubData) {
      throw new HttpsError('internal', 'The club document has no data.');
    }

    // Fallback logic for authorization
    const isOwner = clubData.ownerId === auth.uid;
    const isManager = clubData.managerId === auth.uid;

    console.log('Auth UID:', auth.uid);
    console.log('Club Owner ID:', clubData.ownerId);
    console.log('Club Manager ID:', clubData.managerId);

    if (!isOwner && !isManager) {
      throw new HttpsError(
          'permission-denied',
          'Only the club owner or manager can accept applications.'
      );
    }

    const batch = db.batch();

    batch.update(clubRef, {
      players: admin.firestore.FieldValue.arrayUnion(playerId),
      pendingApplications: admin.firestore.FieldValue.arrayRemove(playerId),
    });

    batch.update(playerRef, {
      clubId: clubId,
    });

    await batch.commit();

    return {success: true, message: 'Player accepted into the club.'};
  } catch (error) {
    console.error('Error accepting application:', error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError(
        'internal',
        'An internal error occurred ' +
      'while accepting the application.'
    );
  }
});
