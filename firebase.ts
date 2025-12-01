// Firebase
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDuG16WHQCFJ1cQR9dpPFwrSWFLQk6cLE",
  authDomain: "church-konet.firebaseapp.com",
  projectId: "church-konet",
  storageBucket: "church-konet.firebasestorage.app",
  messagingSenderId: "317305373118",
  appId: "317305373118:web:5c8c7e66a30dffa367b9ef",
  measurementId: "G-F7TYLTETG3",
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
