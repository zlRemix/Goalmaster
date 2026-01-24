
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
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
const db = getFirestore(app);
const functions = getFunctions(app); // Initialize Functions
const googleProvider = new GoogleAuthProvider();

export { auth, db, functions, googleProvider, createUserWithEmailAndPassword, signInWithEmailAndPassword };
