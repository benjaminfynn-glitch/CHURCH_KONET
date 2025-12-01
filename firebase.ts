// Firebase
import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDuG16WHQCFJ1cQR9dpPFwrSWFLQkc6LE",
  authDomain: "church-konet.firebaseapp.com",
  projectId: "church-konet",
  storageBucket: "church-konet.firebasestorage.app",
  messagingSenderId: "317305373118",
  appId: "1:317305373118:web:5c8c7e66a30dffa367b9ef",
  measurementId: "G-F7TYLTETG3",
};

// Prevent double initialization
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);
