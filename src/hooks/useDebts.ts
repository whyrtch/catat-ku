import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { getUpcomingDebts, updateTransaction, type Debt } from '../lib/firebaseConfig';

interface FirebaseTimestamp {
  seconds: number;
  nanoseconds: number;
}

type UIDebt = Omit<Debt, 'dueDate' | 'date'> & {
  id: string;
  dueDate: FirebaseTimestamp;
  date: FirebaseTimestamp;
  paid: boolean;
};

export const useDebts = (filterFn?: (debt: UIDebt) => boolean) => {
  const { user } = useAuth();
  const [debts, setDebts] = useState<UIDebt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchDebts = useCallback(async () => {
    if (!user?.uid) return;
    
    try {
      setLoading(true);
      const debtsData = await getUpcomingDebts(user.uid);
      
const transformedDebts = debtsData
        .filter((debt): debt is Debt & { id: string } => Boolean(debt?.id))
        .map(debt => {
          // Convert dates to FirebaseTimestamp format if they're Date objects
          const convertToTimestamp = (date: Date | FirebaseTimestamp): FirebaseTimestamp => {
            if (date instanceof Date) {
              return {
                seconds: Math.floor(date.getTime() / 1000),
                nanoseconds: 0
              };
            }
            return date as FirebaseTimestamp;
          };

          return {
            ...debt,
            id: debt.id,
            dueDate: convertToTimestamp(debt.dueDate as Date | FirebaseTimestamp),
            date: convertToTimestamp((debt as any).date || new Date()),
            paid: (debt as any).paid || false,
          } as UIDebt;
        });

      setDebts(transformedDebts);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch debts'));
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  const markAsPaid = useCallback(async (debtId: string) => {
    if (!user?.uid) return false;
    
    try {
      await updateTransaction(user.uid, 'debts', debtId, { paid: true } as any);
      setDebts(prevDebts => 
        prevDebts.map(debt => 
          debt.id === debtId ? { ...debt, paid: true } : debt
        )
      );
      return true;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update debt'));
      return false;
    }
  }, [user?.uid]);

  useEffect(() => {
    fetchDebts();
  }, [fetchDebts]);

  const filteredDebts = filterFn ? debts.filter(filterFn) : debts;
  const totalDebt = filteredDebts
    .filter(debt => !debt.paid)
    .reduce((sum, debt) => sum + debt.amount, 0);

  return {
    debts: filteredDebts,
    totalDebt,
    loading,
    error,
    refresh: fetchDebts,
    markAsPaid,
  };
};
