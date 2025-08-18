import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { 
  logOut, 
  getMonthlyTransactions, 
  getUpcomingDebts, 
  getAllDebts,
  updateTransaction, 
  type Income, 
  type Expense,
  type Debt as FirestoreDebt
} from '../lib/firebaseConfig';
import { Timestamp } from 'firebase/firestore';
import BalanceCard from '../components/BalanceCard';
import DebtList from '../components/DebtList';
import TransactionList from '../components/TransactionList';
import { PlusIcon } from '@heroicons/react/24/outline';

// Local type that matches what the UI expects
interface UIDebt {
  id: string;
  amount: number;
  dueDate: { seconds: number; nanoseconds: number };
  paid: boolean;
  note: string;
  installmentAmount?: number;
}

const Home = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(0);
  const [totalDebt, setTotalDebt] = useState(0);
  const [debtToIncomeRatio, setDebtToIncomeRatio] = useState(0);
  const [debts, setDebts] = useState<UIDebt[]>([]);
  const [allDebts, setAllDebts] = useState<UIDebt[]>([]);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login', { state: { from: '/home' } });
    }
  }, [authLoading, isAuthenticated, navigate]);

  useEffect(() => {
    if (!user || !isAuthenticated) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        if (!user?.uid) return;
        
        const [incomes, expenses, upcomingDebtsResponse, allDebtsResponse] = await Promise.all([
          getMonthlyTransactions<Income>(user.uid, 'incomes'),
          getMonthlyTransactions<Expense>(user.uid, 'expenses'),
          getUpcomingDebts(user.uid, 5),
          getAllDebts(user.uid)
        ]);

        // Transform Firestore data to match our UI types
        const transformedDebts = upcomingDebtsResponse
          .filter((debt): debt is FirestoreDebt & { id: string } => Boolean(debt.id))
          .map(debt => {
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
          });

        setIncomes(incomes);
        setExpenses(expenses);
        
        // Calculate totals
        const totalIncome = incomes.reduce((sum: number, income: Income) => sum + income.amount, 0);
        const totalExpense = expenses.reduce((sum: number, expense: Expense) => sum + expense.amount, 0);
        
        // Calculate salary income only for debt-to-income ratio
        const salaryIncome = incomes
          .filter((income: Income) => income?.category === 'salary')
          .reduce((sum: number, income: Income) => sum + income.amount, 0);
        
        // Calculate balance (income - expenses)
        let currentBalance = totalIncome - totalExpense;
        
        // Ensure balance doesn't go below 0
        currentBalance = Math.max(0, currentBalance);
        
        // Calculate debt-to-income ratio (total debt / annual income)
        let ratio = 0;
        const totalDebt = transformedDebts
          .filter((debt: UIDebt) => !debt.paid)
          .reduce((sum: number, debt: UIDebt) => sum + debt.amount, 0);
        
        if (salaryIncome > 0) {
          // Calculate ratio as (total debt / monthly income) * 100
          ratio = (totalDebt / salaryIncome) * 100;
        } else if (totalDebt > 0) {
          // If there's debt but no income, set ratio to 100% to indicate critical status
          ratio = 100;
        }

        setBalance(currentBalance);
        // Still show total debt in the UI, but use monthly payments for the ratio
        setTotalDebt(transformedDebts
          .filter((debt: UIDebt) => !debt.paid)
          .reduce((sum: number, debt: UIDebt) => sum + debt.amount, 0));
        setDebtToIncomeRatio(ratio);
        
        // Transform all debts from the response
        const allDebtsTransformed = allDebtsResponse
          .filter((debt): debt is FirestoreDebt & { id: string } => Boolean(debt.id))
          .map(debt => {
            // Convert Firestore Timestamp to Date if needed
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
            
            // Create UIDebt object with proper types
            return {
              id: debt.id,
              amount: debt.amount,
              dueDate: {
                seconds: Math.floor(dueDate.getTime() / 1000),
                nanoseconds: 0 // Not used in the UI
              },
              paid: Boolean(debt.paid),
              note: debt.note || '',
              ...(debt.installmentAmount && { installmentAmount: debt.installmentAmount })
            } as UIDebt;
          });
        
        const today = new Date();
        
        // Filter for current month's debts
        const debtsThisMonth = allDebtsTransformed.filter(debt => {
          const dueDate = new Date(debt.dueDate.seconds * 1000);
          
          // Check if the debt is due in the current month and year, and not paid
          const isDueThisMonth = 
            dueDate.getMonth() === today.getMonth() &&
            dueDate.getFullYear() === today.getFullYear();
            
          // Also include upcoming debts that are due before the end of the current month
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
        
        setDebts(debtsThisMonth);
        setAllDebts(allDebtsTransformed);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, isAuthenticated, navigate]);

  const handleSignOut = async () => {
    try {
      await logOut();
      setBalance(0);
      setTotalDebt(0);
      setDebtToIncomeRatio(0);
      setDebts([]);
      window.location.href = '/login';
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleMarkAsPaid = async (debtId: string) => {
    if (!user) return;
    
    try {
      const debt = allDebts.find(d => d.id === debtId);
      if (!debt) return;
      
      await updateTransaction<FirestoreDebt>(user.uid, 'debts', debtId, { paid: true });
      
      const updateDebtState = (d: UIDebt) => d.id === debtId ? { ...d, paid: true } : d;
      
      setDebts(prevDebts => prevDebts.map(updateDebtState));
      setAllDebts(prevAllDebts => prevAllDebts.map(updateDebtState));
      
      const remainingDebt = allDebts
        .filter(d => !d.paid && d.id !== debtId)
        .reduce((sum: number, d: UIDebt) => sum + d.amount, 0);
      
      setTotalDebt(remainingDebt);
      setBalance(prev => Math.max(0, prev - debt.amount));
      
      const totalIncome = await calculateTotalIncome();
      setDebtToIncomeRatio(totalIncome > 0 ? (remainingDebt / totalIncome) * 100 : 0);
    } catch (error) {
      console.error('Error marking debt as paid:', error);
    }
  };
  
  const calculateTotalIncome = async (): Promise<number> => {
    if (!user) return 0;
    
    try {
      const currentDate = new Date();
      const incomes = await getMonthlyTransactions<Income>(user.uid, 'incomes', currentDate);
      return incomes.reduce((sum, income) => sum + income.amount, 0);
    } catch (error) {
      console.error('Error calculating total income:', error);
      return 0;
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">CatatKu</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                {user?.displayName || user?.email?.split('@')[0]}
              </span>
              <button
                onClick={handleSignOut}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <BalanceCard 
            balance={balance}
            totalDebt={totalDebt}
            debtToIncomeRatio={debtToIncomeRatio}
            loading={loading}
          />
          
          <div className="space-y-8">
            {/* Section 1: Unpaid Debts Due This Month */}
            <div className="bg-white p-6 rounded-lg shadow">
              <DebtList 
                title="Debts Due This Month"
                debts={debts.filter(debt => {
                  if (debt.paid) return false;
                  const now = new Date();
                  const dueDate = new Date(debt.dueDate.seconds * 1000);
                  return (
                    dueDate.getMonth() === now.getMonth() && 
                    dueDate.getFullYear() === now.getFullYear()
                  );
                })} 
                loading={loading} 
                onMarkAsPaid={handleMarkAsPaid}
              />
            </div>
            
            {/* Section 2: Future Unpaid Debts (Next Month and Beyond) */}
            <div className="bg-white p-6 rounded-lg shadow">
              <DebtList 
                title="Upcoming Debts"
                debts={allDebts.filter(debt => {
                  if (debt.paid) return false;
                  const now = new Date();
                  const dueDate = new Date(debt.dueDate.seconds * 1000);
                  return (
                    dueDate > new Date(now.getFullYear(), now.getMonth() + 1, 0) ||
                    dueDate.getFullYear() > now.getFullYear()
                  );
                })} 
                loading={loading} 
                onMarkAsPaid={handleMarkAsPaid}
              />
            </div>
            
            {/* Section 3: All Transactions */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900 mb-4">All Transactions</h3>
              <TransactionList
                transactions={[
                  ...incomes
                    .filter(income => income.id) // Filter out any incomes without an id
                    .map(income => ({
                      id: income.id as string, // We've filtered out undefined ids
                      type: 'income' as const,
                      amount: income.amount,
                      date: income.date,
                      category: income.category,
                      note: income.note || undefined
                    })),
                  ...expenses
                    .filter(expense => expense.id)
                    .map(expense => ({
                      id: expense.id as string,
                      type: 'expense' as const,
                      amount: expense.amount,
                      date: expense.date,
                      category: expense.category,
                      note: expense.note || undefined
                    })),
                  ...allDebts
                    .filter(debt => debt.id)
                    .map(debt => ({
                      id: debt.id as string,
                      type: 'debt' as const,
                      amount: debt.amount,
                      date: { seconds: debt.dueDate.seconds, nanoseconds: 0 },
                      note: debt.note || undefined,
                      paid: debt.paid
                    }))
                ].sort((a, b) => {
                  const getDate = (item: any) => {
                    if (!item.date) return 0;
                    if (typeof item.date === 'string') return new Date(item.date).getTime();
                    if ('seconds' in item.date) return item.date.seconds * 1000;
                    return item.date.getTime();
                  };
                  return getDate(b) - getDate(a); // Sort newest first
                })}
                loading={loading}
                onMarkAsPaid={handleMarkAsPaid}
              />
            </div>
          </div>
        </div>
      </main>

      {/* Floating Action Button */}
      <div ref={menuRef} className="fixed bottom-6 right-4 md:bottom-8 md:right-8 z-50">
        <div 
          className={`flex flex-col items-end space-y-3 transition-all duration-300 transform origin-bottom-right ${
            showMenu ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none'
          }`}
        >
          {/* Income Button */}
          <div 
            className={`transition-all duration-200 transform ${showMenu ? 'translate-y-0' : 'translate-y-4 opacity-0'}`} 
            style={{ transitionDelay: showMenu ? '100ms' : '0ms' }}
          >
            <button
              onClick={() => {
                setShowMenu(false);
                navigate('/add-income');
              }}
              className="group flex items-center justify-center w-14 h-14 bg-green-500 hover:bg-green-600 rounded-full text-white shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-400 transition-all duration-200"
              aria-label="Add income"
            >
              <div className="flex flex-col items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="text-xs font-medium mt-1">Income</span>
              </div>
            </button>
          </div>

          {/* Expense Button */}
          <div 
            className={`transition-all duration-200 transform ${showMenu ? 'translate-y-0' : 'translate-y-3 opacity-0'}`} 
            style={{ transitionDelay: showMenu ? '50ms' : '0ms' }}
          >
            <button
              onClick={() => {
                setShowMenu(false);
                navigate('/add-expense');
              }}
              className="group flex items-center justify-center w-14 h-14 bg-red-500 hover:bg-red-600 rounded-full text-white shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-400 transition-all duration-200"
              aria-label="Add expense"
            >
              <div className="flex flex-col items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
                <span className="text-xs font-medium mt-1">Expense</span>
              </div>
            </button>
          </div>

          {/* Debt Button */}
          <div 
            className={`transition-all duration-200 transform ${showMenu ? 'translate-y-0' : 'translate-y-2 opacity-0'}`}
            style={{ transitionDelay: showMenu ? '0ms' : '0ms' }}
          >
            <button
              onClick={() => {
                setShowMenu(false);
                navigate('/add-debt');
              }}
              className="group flex items-center justify-center w-14 h-14 bg-blue-500 hover:bg-blue-600 rounded-full text-white shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400 transition-all duration-200"
              aria-label="Add debt"
            >
              <div className="flex flex-col items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span className="text-xs font-medium mt-1">Debt</span>
              </div>
            </button>
          </div>
        </div>

        {/* Main FAB */}
        <button
          onClick={() => setShowMenu(!showMenu)}
          className={`mt-4 flex items-center justify-center w-16 h-16 bg-indigo-600 hover:bg-indigo-700 rounded-full text-white shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-300 transform ${showMenu ? 'rotate-45' : ''}`}
          aria-label={showMenu ? 'Close menu' : 'Add transaction'}
        >
          <PlusIcon className="h-8 w-8" />
        </button>
      </div>
    </div>
  );
};

export default Home;
