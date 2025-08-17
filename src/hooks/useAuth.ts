import { useEffect, useState, useCallback } from 'react';
import { User, onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { auth } from '../lib/firebaseConfig';

// Simple in-memory cache for auth state
let authStateChecked = false;
let cachedUser: User | null = null;
const authListeners: Array<(user: User | null) => void> = [];

const notifyAuthListeners = (user: User | null) => {
  cachedUser = user;
  authListeners.forEach(listener => listener(user));
};

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(cachedUser);
  const [loading, setLoading] = useState(!authStateChecked);

  useEffect(() => {
    // Add listener
    const handleAuthChange = (user: User | null) => {
      setUser(user);
      if (loading) setLoading(false);
    };
    
    authListeners.push(handleAuthChange);
    
    // Initial check if we haven't checked auth state yet
    if (!authStateChecked) {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        authStateChecked = true;
        notifyAuthListeners(user);
        unsubscribe();
      });
    }

    return () => {
      const index = authListeners.indexOf(handleAuthChange);
      if (index > -1) {
        authListeners.splice(index, 1);
      }
    };
  }, [loading]);

  const signOut = useCallback(async () => {
    await firebaseSignOut(auth);
    notifyAuthListeners(null);
  }, []);

  return { 
    user, 
    loading, 
    isAuthenticated: !!user,
    signOut 
  };
};

export const useProtectedRoute = () => {
  const { user, loading, isAuthenticated, signOut } = useAuth();
  
  return {
    user,
    loading,
    isAuthenticated,
    signOut,
    userId: user?.uid || null,
    userEmail: user?.email || null,
    displayName: user?.displayName || user?.email?.split('@')[0] || 'User'
  };
};
