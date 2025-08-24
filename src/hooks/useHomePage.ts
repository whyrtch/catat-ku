import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './useAuth';
import { 
  getMonthlyTransactions, 
  getUpcomingDebts, 
  getAllDebts,
  updateTransaction,
  type Income, 
  type Expense,
  type Debt as FirestoreDebt
} from '../lib/firebaseConfig';
import { Timestamp } from 'firebase/firestore';

export interface UIDebt {
  id: string;
  amount: number;
  dueDate: { seconds: number; nanoseconds: number };
  paid: boolean;
  note: string;
  installmentAmount?: number;
}

interface HomePageState {
  loading: boolean;
  balance: number;
  totalDebt: number;
  debtToIncomeRatio: number;
  debts: UIDebt[];
  allDebts: UIDebt[];
  incomes: Income[];
  expenses: Expense[];
}

export const useHomePage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  
  const [state, setState] = useState<HomePageState>({
    loading: true,
    balance: 0,
    totalDebt: 0,
    debtToIncomeRatio: 0,
    debts: [],
    allDebts: [],
    incomes: [],
    expenses: [],
  });
  const [showMenu, setShowMenu] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login', { state: { from: '/home' } });
    }
  }, [authLoading, isAuthenticated, navigate]);

  const fetchData = useCallback(async () => {
    if (!user?.uid) {
      setState(prev => ({ ...prev, loading: false }));
      return;
    }

    try {
      setState(prev => ({ ...prev, loading: true }));
      
      const [incomes, expenses, upcomingDebtsResponse, allDebtsResponse] = await Promise.all([
        getMonthlyTransactions<Income>(user.uid, 'incomes'),
        getMonthlyTransactions<Expense>(user.uid, 'expenses'),
        getUpcomingDebts(user.uid, 5),
        getAllDebts(user.uid)
      ]);

      // Transform Firestore data to match our UI types
      const transformDebt = (debt: FirestoreDebt & { id: string }): UIDebt => {
        let dueDate: Date;
        if (debt.dueDate instanceof Date) {
          dueDate = debt.dueDate;
        } else if (debt.dueDate && typeof debt.dueDate === 'object') {
          const timestamp = debt.dueDate as Timestamp;
          dueDate = timestamp instanceof Timestamp 
            ? timestamp.toDate() 
            : new Date();
        } else {
          dueDate = new Date();
        }
        
        return {
          id: debt.id,
          amount: debt.amount,
          dueDate: {
            seconds: Math.floor(dueDate.getTime() / 1000),
            nanoseconds: 0
          },
          paid: Boolean(debt.paid),
          note: debt.note || '',
          ...(debt.installmentAmount && { installmentAmount: debt.installmentAmount })
        };
      };

      const transformedDebts = upcomingDebtsResponse
        .filter((debt): debt is FirestoreDebt & { id: string } => Boolean(debt.id))
        .map(transformDebt);

      // Calculate totals
      const totalIncome = incomes.reduce((sum, income) => sum + income.amount, 0);
      const totalExpense = expenses.reduce((sum, expense) => sum + expense.amount, 0);
      
      // Calculate salary income only for debt-to-income ratio
      const salaryIncome = incomes
        .filter(income => income?.category === 'salary')
        .reduce((sum, income) => sum + income.amount, 0);
      
      // Calculate balance (income - expenses - paid debts)
      const paidDebts = allDebtsResponse
        .filter(debt => debt.paid)
        .reduce((sum, debt) => sum + debt.amount, 0);
      
      const currentBalance = totalIncome - totalExpense - paidDebts;
      
      // Calculate debt-to-income ratio
      let ratio = 0;
      const totalDebt = transformedDebts
        .filter(debt => !debt.paid)
        .reduce((sum, debt) => sum + debt.amount, 0);
      
      if (salaryIncome > 0) {
        ratio = (totalDebt / salaryIncome) * 100;
      } else if (totalDebt > 0) {
        ratio = 100;
      }

      // Transform all debts
      const allDebtsTransformed = allDebtsResponse
        .filter((debt): debt is FirestoreDebt & { id: string } => Boolean(debt.id))
        .map(transformDebt);
      
      const today = new Date();
      
      // Filter for current month's debts
      const debtsThisMonth = allDebtsTransformed.filter(debt => {
        const dueDate = new Date(debt.dueDate.seconds * 1000);
        const isDueThisMonth = 
          dueDate.getMonth() === today.getMonth() &&
          dueDate.getFullYear() === today.getFullYear();
          
        const isUpcomingThisMonth = 
          dueDate >= today &&
          dueDate.getMonth() === today.getMonth() &&
          dueDate.getFullYear() === today.getFullYear();
          
        return (isDueThisMonth || isUpcomingThisMonth) && !debt.paid;
      });
      
      // Sort by due date (earliest first)
      debtsThisMonth.sort((a, b) => {
        const dateA = new Date(a.dueDate.seconds * 1000);
        const dateB = new Date(b.dueDate.seconds * 1000);
        return dateA.getTime() - dateB.getTime();
      });
      
      setState({
        loading: false,
        balance: currentBalance,
        totalDebt: allDebtsTransformed
          .filter(debt => !debt.paid)
          .reduce((sum, debt) => sum + debt.amount, 0),
        debtToIncomeRatio: ratio,
        debts: debtsThisMonth,
        allDebts: allDebtsTransformed,
        incomes,
        expenses,
      });
    } catch (error) {
      console.error('Error fetching data:', error);
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [user?.uid]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated, fetchData]);

  const handleSignOut = useCallback(async () => {
    try {
      // Import logOut here to avoid circular dependency
      const { logOut } = await import('../lib/firebaseConfig');
      await logOut();
      setState({
        loading: false,
        balance: 0,
        totalDebt: 0,
        debtToIncomeRatio: 0,
        debts: [],
        allDebts: [],
        incomes: [],
        expenses: [],
      });
      window.location.href = '/login';
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }, []);

  const handleMarkAsPaid = useCallback(async (debtId: string) => {
    if (!user?.uid) return;
    
    try {
      const debt = state.allDebts.find(d => d.id === debtId);
      if (!debt) return;
      
      await updateTransaction<FirestoreDebt>(user.uid, 'debts', debtId, { paid: true });
      
      const updateDebtState = (d: UIDebt) => d.id === debtId ? { ...d, paid: true } : d;
      
      setState(prev => ({
        ...prev,
        debts: prev.debts.map(updateDebtState),
        allDebts: prev.allDebts.map(updateDebtState),
        totalDebt: prev.totalDebt - debt.amount,
        balance: Math.max(0, prev.balance - debt.amount),
      }));
      
      const totalIncome = await calculateTotalIncome(user.uid);
      const remainingDebt = state.allDebts
        .filter(d => !d.paid && d.id !== debtId)
        .reduce((sum, d) => sum + d.amount, 0);
      
      setState(prev => ({
        ...prev,
        debtToIncomeRatio: totalIncome > 0 ? (remainingDebt / totalIncome) * 100 : 0
      }));
    } catch (error) {
      console.error('Error marking debt as paid:', error);
    }
  }, [state.allDebts, user?.uid]);

  const calculateTotalIncome = async (userId: string): Promise<number> => {
    try {
      const currentDate = new Date();
      const incomes = await getMonthlyTransactions<Income>(userId, 'incomes', currentDate);
      return incomes.reduce((sum, income) => sum + income.amount, 0);
    } catch (error) {
      console.error('Error calculating total income:', error);
      return 0;
    }
  };

  const toggleMenu = useCallback(() => {
    setShowMenu(prev => !prev);
  }, []);

  const navigateTo = useCallback((path: string) => {
    navigate(path);
    setShowMenu(false);
  }, [navigate]);

  return {
    ...state,
    authLoading,
    isAuthenticated,
    user,
    showMenu,
    toggleMenu,
    navigateTo,
    handleSignOut,
    handleMarkAsPaid,
    refetch: fetchData,
  };
};
