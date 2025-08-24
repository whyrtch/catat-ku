import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { getMonthlyTransactions, type Income, type Expense } from '../lib/firebaseConfig';

interface BalanceCardState {
  balance: number;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

export const useBalanceCard = (): BalanceCardState => {
  const { user } = useAuth();
  const [state, setState] = useState<Omit<BalanceCardState, 'refresh'>>({
    balance: 0,
    loading: true,
    error: null,
  });

  const fetchBalance = useCallback(async () => {
    if (!user?.uid) return;
    
    try {
      setState(prev => ({ ...prev, loading: true }));
      
      const [incomes, expenses] = await Promise.all([
        getMonthlyTransactions<Income>(user.uid, 'incomes'),
        getMonthlyTransactions<Expense>(user.uid, 'expenses')
      ]);

      const totalIncome = incomes.reduce((sum, income) => sum + Math.abs(income.amount || 0), 0);
      const totalExpense = expenses.reduce((sum, expense) => sum + Math.abs(expense.amount || 0), 0);
      
      // Calculate balance by adding all incomes and subtracting all expenses
      const balance = incomes.reduce((sum, income) => sum + (income.amount || 0), 0) +
                    expenses.reduce((sum, expense) => sum - Math.abs(expense.amount || 0), 0);
      
      setState({
        balance: balance,
        loading: false,
        error: null,
      });
    } catch (err) {
      setState({
        balance: 0,
        loading: false,
        error: err instanceof Error ? err : new Error('Failed to fetch balance'),
      });
    }
  }, [user?.uid]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  return {
    ...state,
    refresh: fetchBalance
  };
};
