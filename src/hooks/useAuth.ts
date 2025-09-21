import { useEffect, useState, useCallback } from "react";
import {
  User,
  onAuthStateChanged,
  signOut as firebaseSignOut,
} from "firebase/auth";

import { auth, getGoogleRedirectResult } from "../lib/firebaseConfig";

// Simple in-memory cache for auth state
let authStateChecked = false;
let cachedUser: User | null = null;
const authListeners: Array<(user: User | null) => void> = [];

const notifyAuthListeners = (user: User | null) => {
  cachedUser = user;
  authListeners.forEach((listener) => listener(user));
};

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(cachedUser);
  const [loading, setLoading] = useState(!authStateChecked);

  useEffect(() => {
    // Check for redirect result first
    const checkRedirectResult = async () => {
      try {
        const redirectUser = await getGoogleRedirectResult();

        if (redirectUser) {
          notifyAuthListeners(redirectUser);
          setUser(redirectUser);
          setLoading(false);

          return;
        }
      } catch (error) {
        console.error("Error checking redirect result:", error);
      }
    };

    // Add listener
    const handleAuthChange = (user: User | null) => {
      setUser(user);
      if (loading) setLoading(false);
    };

    authListeners.push(handleAuthChange);

    // Check for redirect result
    checkRedirectResult();

    // Set up the auth state observer
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      authStateChecked = true;
      notifyAuthListeners(user);
      setLoading(false);
    });

    return () => {
      // Clean up the listener
      const index = authListeners.indexOf(handleAuthChange);

      if (index > -1) {
        authListeners.splice(index, 1);
      }
      // Unsubscribe from the auth state observer
      unsubscribe();
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
    signOut,
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
    displayName: user?.displayName || user?.email?.split("@")[0] || "User",
  };
};
