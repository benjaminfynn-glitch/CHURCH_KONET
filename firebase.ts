// Firebase
import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDuG16WHQCFJ1cQR9dpPFwrSWFLQk6cLE",
  authDomain: "church-konet.firebaseapp.com",
  projectId: "church-konet",
  storageBucket: "church-konet.appspot.com",
  messagingSenderId: "317305373118",

  // IMPORTANT: Replace this with the REAL APP ID from Firebase console
  appId: "1:317305373118:web:5c8c7e66a3d0ffa367b9ef",

  measurementId: "G-F7TYLTETG3",
};

// Prevent double initialization
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];

export const db = getFirestore(app);
export const auth = getAuth(app);
