import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";

// Firebase configuration - using the same values from .env
const firebaseConfig = {
  apiKey: "AIzaSyDuG16WHQCErJ1CqR9dpPFwrSWFLQkc6LE",
  authDomain: "church-konet.firebaseapp.com",
  projectId: "church-konet",
  storageBucket: "church-konet.firebasestorage.app",
  messagingSenderId: "317305373118",
  appId: "1:317305373118:web:5c8c7e66a30dffa367b9ef"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Predefined users
const predefinedUsers = [
  {
    email: "admin@church.org",
    password: "admin123",
    role: "admin",
    fullName: "Church Administrator"
  },
  {
    email: "user@church.org", 
    password: "user123",
    role: "user",
    fullName: "Regular User"
  }
];

async function setupUsers() {
  console.log("Setting up predefined users...");

  for (const userData of predefinedUsers) {
    try {
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        userData.email, 
        userData.password
      );
      
      const { uid } = userCredential.user;
      
      // Set user document in Firestore with role
      await setDoc(doc(db, "users", uid), {
        email: userData.email,
        fullName: userData.fullName,
        role: userData.role,
        createdAt: new Date().toISOString()
      });
      
      console.log(`✅ Created user: ${userData.email} with role: ${userData.role}`);
      
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        console.log(`⚠️ User ${userData.email} already exists, skipping...`);
      } else {
        console.error(`❌ Error creating user ${userData.email}:`, error.message);
      }
    }
  }
  
  console.log("Setup complete!");
  process.exit(0);
}

// Run the setup
setupUsers();