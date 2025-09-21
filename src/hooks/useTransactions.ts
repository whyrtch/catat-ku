import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { collection, query, where, orderBy, limit, startAfter, getDocs, DocumentData } from 'firebase/firestore';
import { db } from '../lib/firebaseConfig';

export interface Transaction {
  id: string;
  amount: number;
  type: 'debt';
  status: 'pending' | 'completed' | 'failed';
  note?: string;
  date: { seconds: number; nanoseconds: number };
  dueDate: { seconds: number; nanoseconds: number };
  userId: string;
  paid: boolean;
  createdAt: { seconds: number; nanoseconds: number };
  updatedAt: { seconds: number; nanoseconds: number };
  installmentAmount?: number;
}

interface UseTransactionsResult {
  transactions: Transaction[];
  loading: boolean;
  error: Error | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
}

const PAGE_SIZE = 10;

export const useTransactions = (): UseTransactionsResult => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastVisible, setLastVisible] = useState<DocumentData | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const fetchTransactions = useCallback(async (loadMore = false) => {
    if (!user?.uid) return;

    try {
      if (!loadMore) {
        setLoading(true);
        setTransactions([]);
      }

      let q = query(
        collection(db, 'debts'),
        where('userId', '==', user.uid),
        orderBy('dueDate', 'asc'),
        limit(PAGE_SIZE)
      );

      if (loadMore && lastVisible) {
        q = query(q, startAfter(lastVisible));
      }

      const querySnapshot = await getDocs(q);
      const newTransactions = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Transaction[];

      setTransactions(prev => loadMore 
        ? [...prev, ...newTransactions]
        : newTransactions
      );
      
      setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1]);
      setHasMore(newTransactions.length === PAGE_SIZE);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch transactions'));
    } finally {
      setLoading(false);
    }
  }, [user?.uid, lastVisible]);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    await fetchTransactions(true);
  }, [loading, hasMore, fetchTransactions]);

  const refresh = useCallback(async () => {
    setLastVisible(null);
    await fetchTransactions(false);
  }, [fetchTransactions]);

  useEffect(() => {
    fetchTransactions(false);
  }, [fetchTransactions]);

  return {
    transactions,
    loading,
    error,
    hasMore,
    loadMore,
    refresh
  };
};