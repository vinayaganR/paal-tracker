// Firebase Configuration with Local Offline Simulation Engine
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDummyKeyForLocalPreview1234567890",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "paal-vandi.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "paal-vandi",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "paal-vandi.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1234567890",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1234567890:web:abcdef123456"
};

let app = null;
let db = null;
let auth = null;
let isRealFirebase = false;

try {
  if (import.meta.env.VITE_FIREBASE_API_KEY && import.meta.env.VITE_FIREBASE_API_KEY !== "AIzaSyDummyKeyForLocalPreview1234567890") {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    db = getFirestore(app);
    auth = getAuth(app);
    isRealFirebase = true;
    console.log("🔥 Connected to live Firebase Firestore!");
  } else {
    console.log("⚡ Running in High-Speed Local Firestore Mode (Offline First). Add Firebase keys in .env when ready.");
  }
} catch (err) {
  console.warn("Firebase init note:", err.message);
}

export { app, db, auth, isRealFirebase, firebaseConfig };
