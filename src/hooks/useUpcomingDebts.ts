import { useCallback } from 'react';
import { useAuth } from './useAuth';
import { getUpcomingDebts, updateTransaction } from '../lib/firebaseConfig';
import { FirebaseTimestamp, UIDebt } from '../types/models';

export const useUpcomingDebts = () => {
  const { user } = useAuth();

  const fetchUpcomingDebts = useCallback(async () => {
    if (!user?.uid) {
      console.log('No user UID available');
      return [];
    }
    
    try {
      console.log('Fetching upcoming debts for user:', user.uid);
      const now = new Date();
      const debtsData = await getUpcomingDebts(user.uid);
      console.log('Raw debts data from Firebase:', debtsData);
      
      const processedDebts = debtsData
        .filter((debt): debt is any => {
          const hasId = Boolean(debt?.id);
          if (!hasId) {
            console.log('Skipping debt without ID:', debt);
          }
          return hasId;
        })
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

          const processedDebt = {
            ...debt,
            id: debt.id,
            dueDate: convertToTimestamp(debt.dueDate as Date | FirebaseTimestamp),
            date: convertToTimestamp((debt as any).date || new Date()),
            paid: (debt as any).paid || false,
          } as UIDebt;
          
          console.log('Processed debt:', processedDebt);
          return processedDebt;
        })
        .filter(debt => {
          if (debt.paid) {
            console.log('Filtering out paid debt:', debt.id);
            return false;
          }
          const dueDate = new Date(debt.dueDate.seconds * 1000);
          const isUpcoming = dueDate > new Date(now.getFullYear(), now.getMonth() + 1, 0) ||
                           dueDate.getFullYear() > now.getFullYear();
          
          console.log(`Debt ${debt.id} - Due: ${dueDate.toISOString()}, Is upcoming: ${isUpcoming}`);
          return isUpcoming;
        });
      
      console.log('Final filtered upcoming debts:', processedDebts);
      return processedDebts;
    } catch (error) {
      console.error('Error fetching upcoming debts:', error);
      return [];
    }
  }, [user?.uid]);

  const markAsPaid = useCallback(async (debtId: string) => {
    if (!user?.uid) return false;
    
    try {
      await updateTransaction(user.uid, 'debts', debtId, { paid: true } as any);
      return true;
    } catch (error) {
      console.error('Error updating debt:', error);
      return false;
    }
  }, [user?.uid]);

  return {
    fetchUpcomingDebts,
    markAsPaid,
  };
};
