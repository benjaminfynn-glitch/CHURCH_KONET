import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  AuthError
} from 'firebase/auth';
import { doc, getDoc, onSnapshot, setDoc, serverTimestamp, getFirestore } from 'firebase/firestore';
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

  // Ensure Firestore user document exists and is up to date
  const ensureUserProfile = async (firebaseUser: any): Promise<{role: 'admin' | 'user', displayName: string}> => {
    const userRef = doc(db, 'users', firebaseUser.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      // NEW USER → CREATE PROFILE
      console.log('Creating new user profile for:', firebaseUser.uid);
      await setDoc(userRef, {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        fullName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
        role: 'user',
        isActive: true,
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
      });
      return {
        role: 'user',
        displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User'
      };
    } else {
      // EXISTING USER → UPDATE LOGIN TIME
      console.log('Updating existing user profile for:', firebaseUser.uid);
      await setDoc(
        userRef,
        {
          lastLogin: serverTimestamp(),
        },
        { merge: true }
      );

      const userData = userSnap.data();
      return {
        role: userData.role || 'user',
        displayName: userData.fullName || 'User'
      };
    }
  };

  useEffect(() => {
    if (!auth) {
      console.warn("Auth not initialized. Skipping auth listeners.");
      setIsLoading(false);
      return;
    }

    let userProfileUnsubscribe: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        // Clean up previous subscription
        if (userProfileUnsubscribe) {
          userProfileUnsubscribe();
        }

        try {
          // Ensure user profile exists first
          await ensureUserProfile(currentUser);

          // Set up real-time subscription to user profile
          const userDocRef = doc(db, 'users', currentUser.uid);
          userProfileUnsubscribe = onSnapshot(userDocRef, (docSnap) => {
            try {
              let role: 'admin' | 'user' = 'user';
              let displayName = 'User';

              if (docSnap.exists()) {
                const userData = docSnap.data();
                role = userData.role || 'user';
                displayName = userData.fullName || 'User';
              }

              setUser({
                uid: currentUser.uid,
                email: currentUser.email || '',
                fullName: displayName,
                role
              });
              setIsLoading(false);
            } catch (error) {
              console.error('Error in user profile snapshot:', error);
              setUser(null);
              setIsLoading(false);
            }
          }, (error) => {
            console.error('User profile subscription error:', error);
            setUser(null);
            setIsLoading(false);
          });
        } catch (error) {
          console.error('Error ensuring user profile:', error);
          setUser(null);
          setIsLoading(false);
        }
      } else {
        // Clean up subscription when user logs out
        if (userProfileUnsubscribe) {
          userProfileUnsubscribe();
          userProfileUnsubscribe = null;
        }
        setUser(null);
        setIsLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (userProfileUnsubscribe) {
        userProfileUnsubscribe();
      }
    };
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    if (!auth) {
      console.error("Authentication service unavailable.");
      return false;
    }
    
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const currentUser = userCredential.user;
      
      // Ensure user profile exists and get user data
      const { role, displayName } = await ensureUserProfile(currentUser);
      setUser({
        uid: currentUser.uid,
        email: currentUser.email || '',
        fullName: displayName,
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
