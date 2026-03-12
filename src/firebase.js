// src/firebase.js
import { initializeApp }              from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore }                from 'firebase/firestore';

const firebaseConfig = {
  apiKey:            "AIzaSyA-EcyqqQGm_o1LH85nzljXmT6X2DhTXWA",
  authDomain:        "dibsonai.firebaseapp.com",
  projectId:         "dibsonai",
  storageBucket:     "dibsonai.firebasestorage.app",
  messagingSenderId: "32265647057",
  appId:             "1:32265647057:web:86436d2de86dac3ff9a6f0",
};

const app = initializeApp(firebaseConfig);

export const auth           = getAuth(app);
export const db             = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// Request read-only access to Google Calendar
googleProvider.addScope('https://www.googleapis.com/auth/calendar.readonly');
