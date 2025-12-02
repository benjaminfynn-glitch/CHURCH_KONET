// firebase.ts (root)

// Firebase SDK
import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Firebase config MUST come from Vite environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Debug log for local + Vercel
console.log("🔥 Loaded Firebase Project:", import.meta.env.VITE_FIREBASE_PROJECT_ID);

// Safety warning
if (!firebaseConfig.apiKey) {
  console.warn("⚠️ Firebase config missing. Check .env.local or Vercel env vars!");
}

// Prevent double initialization
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];

// Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
