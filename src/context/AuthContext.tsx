import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  AuthError
} from 'firebase/auth';
import { doc, getDoc, getFirestore } from 'firebase/firestore';
import { auth, db } from '../firebase';

interface User {
  fullName: string;
  email: string;
  uid: string;
  role: 'admin' | 'user';
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserData = async (uid: string): Promise<{role: 'admin' | 'user', displayName: string}> => {
    try {
      const userDoc = await doc(db, 'users', uid);
      const docSnap = await getDoc(userDoc);
      
      if (docSnap.exists()) {
        const userData = docSnap.data();
        return {
          role: userData.role || 'user',
          displayName: userData.displayName || 'User'
        };
      } else {
        console.warn(`No user document found for UID: ${uid}. Using default values.`);
        return { role: 'user', displayName: 'User' };
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      return { role: 'user', displayName: 'User' };
    }
  };

  useEffect(() => {
    if (!auth) {
      console.warn("Auth not initialized. Skipping auth listeners.");
      setIsLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          const { role, displayName } = await fetchUserData(currentUser.uid);
          setUser({
            uid: currentUser.uid,
            email: currentUser.email || '',
            fullName: displayName,
            role
          });
        } catch (error) {
          console.error('Error setting user data:', error);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    if (!auth) {
      console.error("Authentication service unavailable.");
      return false;
    }
    
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const currentUser = userCredential.user;
      
      // Immediately fetch user data after successful login
      const role = (await fetchUserData(currentUser.uid)).role;
      setUser({
        uid: currentUser.uid,
        email: currentUser.email || '',
        fullName: currentUser.displayName || 'User',
        role
      });
      
      return true;
    } catch (error) {
      const authError = error as AuthError;
      console.error("Login failed:", authError.message);
      
      // Provide specific error messages for better user feedback
      let errorMessage = "Authentication failed. Please check your credentials.";
      
      if (authError.code === 'auth/user-not-found') {
        errorMessage = "No account found with this email address.";
      } else if (authError.code === 'auth/wrong-password') {
        errorMessage = "Incorrect password. Please try again.";
      } else if (authError.code === 'auth/invalid-email') {
        errorMessage = "Please enter a valid email address.";
      } else if (authError.code === 'auth/user-disabled') {
        errorMessage = "This account has been disabled.";
      }
      
      // You could add toast notification here if needed
      console.error("Login error:", errorMessage);
      return false;
    }
  };

  const logout = async () => {
    if (!auth) return;
    try {
      await signOut(auth);
      setUser(null);
    } catch (error) {
      console.error("Logout error", error);
    }
  };

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isAdmin,
      login,
      logout,
      isLoading
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
