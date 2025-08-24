import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut,
  User as FirebaseUser 
} from 'firebase/auth';
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
  enableIndexedDbPersistence
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

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
        forceOwnership: true 
      });
      console.log('Firestore persistence enabled');
    } catch (err: any) {
      if (err.code === 'failed-precondition') {
        console.warn('Offline persistence can only be enabled in one tab at a time.');
      } else if (err.code === 'unimplemented') {
        console.warn('The current browser doesn\'t support all of the features required to enable persistence');
      } else {
        console.warn('Error enabling persistence:', err);
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

// Import types from models
import { 
  Expense,
  Income as ModelsIncome, 
  Debt as ModelsDebt,
  type FirebaseTimestamp,
  type TransactionType as ModelTransactionType,
  type BaseTransaction as ModelBaseTransaction
} from '../types/models';

// Types
export type TransactionType = 'incomes' | 'expenses' | 'debts';

export type { Expense };

// Map between model and firebase transaction types
const toFirebaseType = (type: ModelTransactionType): TransactionType => {
  switch (type) {
    case 'income': return 'incomes';
    case 'expense': return 'expenses';
    case 'debt': return 'debts';
  }
};

const toModelType = (type: TransactionType): ModelTransactionType => {
  switch (type) {
    case 'incomes': return 'income';
    case 'expenses': return 'expense';
    case 'debts': return 'debt';
  }
};

export interface BaseTransaction extends Omit<ModelBaseTransaction, 'type'> {
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

export interface Income extends BaseTransaction, Omit<ModelsIncome, 'type'> {
  type: 'income';
  category: 'salary' | 'bonus' | 'investment' | 'other';
}

export interface Debt extends Omit<ModelsDebt, 'type'>, BaseTransaction {
  type: 'debt';
  dueDate: Date | { seconds: number; nanoseconds: number };
  paid: boolean;
  installmentAmount?: number;
}

type Transaction = Income | Expense | Debt;

export { toFirebaseType, toModelType };

// Auth functions
export const signInWithGoogle = async (): Promise<FirebaseUser> => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const { user } = result;
    
    // Save/update user data in Firestore
    if (user) {
      const userRef = doc(db, 'users', user.uid);
      const userData = {
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
        lastLogin: Timestamp.now()
      };
      
await setDoc(userRef, userData, { merge: true });
    }
    
    return user;
  } catch (error) {
    console.error('Error signing in with Google:', error);
    throw error;
  }
};

export const logOut = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};

// Generic Firestore functions
const getCollectionRef = (userId: string, type: TransactionType) => 
  collection(db, 'users', userId, type);

// Transaction CRUD Operations
export const addTransaction = async <T extends Transaction>(
  userId: string,
  type: TransactionType,
  data: Omit<T, 'id' | 'createdAt' | 'updatedAt' | 'userId'>
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
  id: string
): Promise<T | null> => {
  try {
    const docRef = doc(db, 'users', userId, type, id);
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
  data: Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<void> => {
  try {
    const docRef = doc(db, 'users', userId, type, id);
    await setDoc(docRef, {
      ...data,
      updatedAt: Timestamp.now(),
    }, { merge: true });
  } catch (error) {
    console.error(`Error updating ${type}:`, error);
    throw error;
  }
};

export const deleteTransaction = async (
  userId: string,
  type: TransactionType,
  id: string
): Promise<void> => {
  try {
    const docRef = doc(db, 'users', userId, type, id);
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
    orderDirection?: 'asc' | 'desc';
    limitCount?: number;
    startAfterDoc?: QueryDocumentSnapshot<DocumentData>;
  } = {}
): Promise<{ data: T[]; lastVisible?: QueryDocumentSnapshot<DocumentData> }> => {
  try {
    let q = query(getCollectionRef(userId, type));
    
    // Apply filters if any
    if (options.filters) {
      options.filters.forEach(filter => {
        q = query(q, where(filter.field, filter.operator, filter.value));
      });
    }
    
    // Apply ordering
    if (options.orderByField) {
      q = query(q, orderBy(options.orderByField, options.orderDirection || 'desc'));
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
    
    const data = querySnapshot.docs.map(doc => ({
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
  month: Date = new Date()
): Promise<T[]> => {
  const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
  const endOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0);
  
  const { data } = await getTransactions<T>(userId, type, {
    filters: [
      { field: 'date', operator: '>=', value: startOfMonth },
      { field: 'date', operator: '<=', value: endOfMonth },
    ],
    orderByField: 'date',
    orderDirection: 'desc',
  });
  
  return data;
};

export const getUpcomingDebts = async (
  userId: string,
  limitCount: number = 5,
  startAfterDoc: any = null
): Promise<Debt[]> => {
  try {
    const now = Timestamp.now();
    let q = query(
      collection(db, 'users', userId, 'debts'),
      where('paid', '==', false),
      where('dueDate', '>=', now),
      orderBy('dueDate', 'asc'),
      limit(limitCount)
    );
    
    // Add startAfter if provided for pagination
    if (startAfterDoc) {
      q = query(q, startAfter(startAfterDoc));
    }
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Debt));
  } catch (error) {
    console.error('Error getting upcoming debts:', error);
    throw error;
  }
};

export const getAllDebts = async (userId: string): Promise<Debt[]> => {
  const { data } = await getTransactions<Debt>(userId, 'debts', {
    orderByField: 'dueDate',
    orderDirection: 'asc',
  });
  
  return data;
};

export const getRecentTransactions = async (
  userId: string,
  type: TransactionType,
  limitCount: number = 5
): Promise<Transaction[]> => {
  const { data } = await getTransactions<Transaction>(userId, type, {
    orderByField: 'date',
    orderDirection: 'desc',
    limitCount,
  });
  
  return data;
};
