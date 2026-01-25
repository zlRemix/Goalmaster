import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, initializeFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: 'goalmaster-56078.firebaseapp.com',
  projectId: 'goalmaster-56078',
  storageBucket: 'goalmaster-56078.appspot.com',
  messagingSenderId: '201801683996',
  appId: '1:201801683996:web:225868c8954c8c87257bd9',
  measurementId: 'G-9JHEX5SRXP'
};

const app = initializeApp(firebaseConfig);
console.log("🔥🔥 VERBUNDENE PROJEKT-ID:", app.options.projectId);
const auth = getAuth(app);
const functions = getFunctions(app); 
const googleProvider = new GoogleAuthProvider();

let db;

if (import.meta.env.DEV) {
  // A) LOKAL (Firebase Studio): Nutze die Standard-Datenbank "(default)" als Testwiese
  console.log("🛠️ LOKAL: Nutze Standard-Datenbank (Test)");
  db = getFirestore(app); 

} else {
  // B) LIVE
  console.log("🚀 LIVE: Verbinde mit 'goalmaster-prod'");
  
  // WICHTIG: Der zweite Parameter ist der Name der Datenbank!
  // Das funktioniert in den neueren SDKs viel zuverlässiger als initializeFirestore
  db = getFirestore(app, "goalmaster-prod");
}


export { auth, db, functions, googleProvider, createUserWithEmailAndPassword, signInWithEmailAndPassword };