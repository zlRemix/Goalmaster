// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBEMAS_fiicm_JntU0VplAVdW41QcZjcv8",
  authDomain: "goalmaster-56078.firebaseapp.com",
  projectId: "goalmaster-56078",
  storageBucket: "goalmaster-56078.firebasestorage.app",
  messagingSenderId: "201801683996",
  appId: "1:201801683996:web:1728a5e017401f0a257bd9",
  measurementId: "G-CZGSXM88R4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
console.log("🔥🔥 VERBUNDENE PROJEKT-ID:", app.options.projectId);
const auth = getAuth(app);
const functions = getFunctions(app);
const googleProvider = new GoogleAuthProvider();

const databaseName = import.meta.env.VITE_FIREBASE_DATABASE_NAME || '(default)';
console.log(`🌀 Using database: ${databaseName}`);

const db = getFirestore(app, databaseName);

export { auth, db, functions, googleProvider, createUserWithEmailAndPassword, signInWithEmailAndPassword, databaseName };
