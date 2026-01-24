import {onCall, HttpsError} from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

admin.initializeApp();

// HINWEIS: Die ursprüngliche Implementierung dieser Funktionen ging bei früheren, fehlgeschlagenen Operationen verloren.
// Dies sind leere Platzhalter, um sicherzustellen, dass das Projekt bereitgestellt werden kann.
// Die Funktionalität muss von einem Entwickler wiederhergestellt werden.

export const createLeague = onCall(() => {
  console.error('Die Funktion createLeague ist nicht implementiert.');
  throw new HttpsError('internal', 'Diese Funktion ist derzeit nicht verfügbar. Bitte wenden Sie sich an den Support.');
});

export const completeTeamTraining = onCall(() => {
  console.error('Die Funktion completeTeamTraining ist nicht implementiert.');
  throw new HttpsError('internal', 'Diese Funktion ist derzeit nicht verfügbar. Bitte wenden Sie sich an den Support.');
});
