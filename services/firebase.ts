import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, initializeFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: 'goalmaster-56078.firebaseapp.com',
  projectId: 'goalmaster-56078',
  storageBucket: 'goalmaster-56078.appspot.com',
  messagingSenderId: '201801683996',
  appId: '1:201801683996:web:225868c8954c8c87257bd9',
  measurementId: 'G-9JHEX5SRXP'
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const functions = getFunctions(app); 
const googleProvider = new GoogleAuthProvider();

let db;

if (import.meta.env.DEV) {
  // A) LOKAL (Firebase Studio): Nutze die Standard-Datenbank "(default)" als Testwiese
  console.log("🛠️ LOKAL: Nutze Standard-Datenbank (Test)");
  db = getFirestore(app); 

} else {
  // B) LIVE (App Hosting): Nutze die spezielle "goalmaster-prod" Datenbank
// B) LIVE (App Hosting): Nutze die spezielle "goalmaster-prod" Datenbank
console.log("🚀 LIVE: Verbinde mit 'goalmaster-prod'");
  
// Wir nutzen "as any", um den TypeScript-Fehler zu unterdrücken
db = initializeFirestore(app, {
  databaseId: 'goalmaster-prod' 
} as any);
}

export { auth, db, functions, googleProvider, createUserWithEmailAndPassword, signInWithEmailAndPassword };