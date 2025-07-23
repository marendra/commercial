import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyDgKu5pmmDtkYq2SmD7ib4ObyDn17Tz4r4",
  authDomain: "commercial-medco.firebaseapp.com",
  projectId: "commercial-medco",
  storageBucket: "commercial-medco.firebasestorage.app",
  messagingSenderId: "822210331244",
  appId: "1:822210331244:web:3f341db02b3a5c09820e49",
  measurementId: "G-ZFDTCX158Z"
};

const app  = initializeApp(firebaseConfig)
export const auth  = getAuth(app)
export const storage = getStorage(app);
export const db = getFirestore(app)
