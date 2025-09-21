import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  User as FirebaseUser,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  addDoc,
  query,
  where,
  getDocs,
  Timestamp,
  doc,
  setDoc,
  deleteDoc,
  getDoc,
  orderBy,
  limit,
  startAfter,
  QueryDocumentSnapshot,
  DocumentData,
  enableIndexedDbPersistence,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Debug: Log Firebase config (remove in production)
console.log("Firebase Config:", {
  apiKey: firebaseConfig.apiKey ? "Present" : "Missing",
  authDomain: firebaseConfig.authDomain ? "Present" : "Missing",
  projectId: firebaseConfig.projectId ? "Present" : "Missing",
  appId: firebaseConfig.appId ? "Present" : "Missing",
});

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

// Initialize Firestore with recommended settings
export const db = (() => {
  // Use memory cache for better performance
  const db = getFirestore(app);

  // Enable persistence with error handling
  const enablePersistence = async () => {
    try {
      await enableIndexedDbPersistence(db, {
        forceOwnership: true,
      });
      console.log("Firestore persistence enabled");
    } catch (err: any) {
      if (err.code === "failed-precondition") {
        console.warn(
          "Offline persistence can only be enabled in one tab at a time.",
        );
      } else if (err.code === "unimplemented") {
        console.warn(
          "The current browser doesn't support all of the features required to enable persistence",
        );
      } else {
        console.warn("Error enabling persistence:", err);
      }
    }
  };

  // Enable persistence in development
  if (import.meta.env.DEV) {
    enablePersistence();
  }

  return db;
})();

export const googleProvider = new GoogleAuthProvider();

// Configure Google provider
googleProvider.setCustomParameters({
  prompt: "select_account",
});

// Import types from models
import {
  type Debt as ModelsDebt,
  type FirebaseTimestamp,
  type TransactionType as ModelTransactionType,
  type BaseTransaction as ModelBaseTransaction,
} from "../types/models";

// Types
export type TransactionType = "debts";

// Map between model and firebase transaction types
const toFirebaseType = (): TransactionType => {
  return "debts";
};

const toModelType = (): "debt" => {
  return "debt";
};

export interface BaseTransaction extends Omit<ModelBaseTransaction, "type"> {
  id?: string;
  amount: number;
  date: Date | FirebaseTimestamp;
  note?: string;
  category?: string;
  userId?: string;
  createdAt?: FirebaseTimestamp | Date;
  updatedAt?: FirebaseTimestamp | Date;
  type: ModelTransactionType;
}

export interface Debt extends Omit<ModelsDebt, "type">, BaseTransaction {
  type: "debt";
  dueDate: Date | { seconds: number; nanoseconds: number };
  paid: boolean;
  installmentAmount?: number;
}

type Transaction = Debt;

export { toFirebaseType, toModelType };

// Helper function to save user data to Firestore
const saveUserData = async (user: FirebaseUser) => {
  const userRef = doc(db, "users", user.uid);
  const userData = {
    uid: user.uid,
    displayName: user.displayName || user.email?.split("@")[0] || "User",
    email: user.email,
    photoURL: user.photoURL,
    lastLogin: Timestamp.now(),
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };

  await setDoc(userRef, userData, { merge: true });
  console.log("User data saved/updated in Firestore:", user.uid);
};

// Check for redirect result on page load
export const getGoogleRedirectResult =
  async (): Promise<FirebaseUser | null> => {
    try {
      const result = await getRedirectResult(auth);

      if (result && result.user) {
        console.log("Google redirect sign-in successful, user:", result.user);
        await saveUserData(result.user);

        return result.user;
      }

      return null;
    } catch (error: any) {
      console.error("Error getting redirect result:", error);
      throw new Error(error.message || "Failed to get redirect result");
    }
  };

// Auth functions
export const signInWithGoogle = async (): Promise<FirebaseUser> => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const { user } = result;

    await saveUserData(user);

    return user;
  } catch (error: any) {
    // If popup fails, try redirect as fallback
    if (
      error.code === "auth/popup-blocked" ||
      error.code === "auth/popup-closed-by-user"
    ) {
      console.log("Popup failed, trying redirect method...");
      try {
        await signInWithRedirect(auth, googleProvider);
        // The redirect will handle the rest, user will be redirected back
        throw new Error("Redirecting to Google sign-in...");
      } catch (redirectError: any) {
        console.error("Redirect also failed:", redirectError);
        throw new Error(
          "Both popup and redirect methods failed. Please check your browser settings.",
        );
      }
    }

    // Provide more specific error messages
    if (error.code === "auth/popup-closed-by-user") {
      throw new Error("Sign-in was cancelled. Please try again.");
    } else if (error.code === "auth/popup-blocked") {
      throw new Error(
        "Popup was blocked by your browser. Please allow popups for this site.",
      );
    } else if (error.code === "auth/network-request-failed") {
      throw new Error("Network error. Please check your internet connection.");
    } else if (error.code === "auth/unauthorized-domain") {
      throw new Error("This domain is not authorized for Google sign-in.");
    } else {
      throw new Error(error.message || "Failed to sign in with Google");
    }
  }
};

export const logOut = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out:", error);
    throw error;
  }
};

// Generic Firestore functions
const getCollectionRef = (userId: string, type: TransactionType) =>
  collection(db, "users", userId, type);

// Transaction CRUD Operations
export const addTransaction = async <T extends Transaction>(
  userId: string,
  type: TransactionType,
  data: Omit<T, "id" | "createdAt" | "updatedAt" | "userId">,
): Promise<string> => {
  try {
    const timestamp = Timestamp.now();
    const docRef = await addDoc(getCollectionRef(userId, type), {
      ...data,
      userId, // Add userId to the document data
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    return docRef.id;
  } catch (error) {
    console.error(`Error adding ${type}:`, error);
    throw error;
  }
};

export const getTransaction = async <T extends Transaction>(
  userId: string,
  type: TransactionType,
  id: string,
): Promise<T | null> => {
  try {
    const docRef = doc(db, "users", userId, type, id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as T;
    }

    return null;
  } catch (error) {
    console.error(`Error getting ${type}:`, error);
    throw error;
  }
};

export const updateTransaction = async <T extends Transaction>(
  userId: string,
  type: TransactionType,
  id: string,
  data: Partial<Omit<T, "id" | "createdAt" | "updatedAt">>,
): Promise<void> => {
  try {
    const docRef = doc(db, "users", userId, type, id);

    await setDoc(
      docRef,
      {
        ...data,
        updatedAt: Timestamp.now(),
      },
      { merge: true },
    );
  } catch (error) {
    console.error(`Error updating ${type}:`, error);
    throw error;
  }
};

export const deleteTransaction = async (
  userId: string,
  type: TransactionType,
  id: string,
): Promise<void> => {
  try {
    const docRef = doc(db, "users", userId, type, id);

    await deleteDoc(docRef);
  } catch (error) {
    console.error(`Error deleting ${type}:`, error);
    throw error;
  }
};

// Query Functions
export const getTransactions = async <T extends Transaction>(
  userId: string,
  type: TransactionType,
  options: {
    filters?: { field: string; operator: any; value: any }[];
    orderByField?: string;
    orderDirection?: "asc" | "desc";
    limitCount?: number;
    startAfterDoc?: QueryDocumentSnapshot<DocumentData>;
  } = {},
): Promise<{
  data: T[];
  lastVisible?: QueryDocumentSnapshot<DocumentData>;
}> => {
  try {
    let q = query(getCollectionRef(userId, type));

    // Apply filters if any
    if (options.filters) {
      options.filters.forEach((filter) => {
        q = query(q, where(filter.field, filter.operator, filter.value));
      });
    }

    // Apply ordering
    if (options.orderByField) {
      q = query(
        q,
        orderBy(options.orderByField, options.orderDirection || "desc"),
      );
    }

    // Apply pagination
    if (options.limitCount) {
      q = query(q, limit(options.limitCount));
    }

    if (options.startAfterDoc) {
      q = query(q, startAfter(options.startAfterDoc));
    }

    const querySnapshot = await getDocs(q);
    const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];

    const data = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as T[];

    return { data, lastVisible };
  } catch (error) {
    console.error(`Error getting ${type}:`, error);
    throw error;
  }
};

// Specific Queries
export const getMonthlyTransactions = async <T extends Transaction>(
  userId: string,
  type: TransactionType,
  month: Date = new Date(),
): Promise<T[]> => {
  const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
  const endOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0);

  const { data } = await getTransactions<T>(userId, type, {
    filters: [
      { field: "date", operator: ">=", value: startOfMonth },
      { field: "date", operator: "<=", value: endOfMonth },
    ],
    orderByField: "date",
    orderDirection: "desc",
  });

  return data;
};

export const getUpcomingDebts = async (
  userId: string,
  limitCount: number = 5,
  startAfterDoc: any = null,
): Promise<Debt[]> => {
  try {
    const now = Timestamp.now();
    let q = query(
      collection(db, "users", userId, "debts"),
      where("paid", "==", false),
      where("dueDate", ">=", now),
      orderBy("dueDate", "asc"),
      limit(limitCount),
    );

    // Add startAfter if provided for pagination
    if (startAfterDoc) {
      q = query(q, startAfter(startAfterDoc));
    }

    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        }) as Debt,
    );
  } catch (error) {
    console.error("Error getting upcoming debts:", error);
    throw error;
  }
};

export const getAllDebts = async (userId: string): Promise<Debt[]> => {
  const { data } = await getTransactions<Debt>(userId, "debts", {
    orderByField: "dueDate",
    orderDirection: "asc",
  });

  return data;
};

export const getRecentTransactions = async (
  userId: string,
  type: TransactionType,
  limitCount: number = 5,
): Promise<Transaction[]> => {
  const { data } = await getTransactions<Transaction>(userId, type, {
    orderByField: "date",
    orderDirection: "desc",
    limitCount,
  });

  return data;
};
