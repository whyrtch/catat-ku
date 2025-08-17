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

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  useEffect(() => {
    if (!user || !isAuthenticated) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch all data in parallel
        if (!user?.uid) return;
        
        const [incomes, expenses, upcomingDebtsResponse, allDebtsResponse] = await Promise.all([
          getMonthlyTransactions<Income>(user.uid, 'incomes'),
          getMonthlyTransactions<Expense>(user.uid, 'expenses'),
          getUpcomingDebts(user.uid, 5), // Get next 5 upcoming debts
          getAllDebts(user.uid) // Get all debts
        ]);

        // Transform Firestore data to match our UI types
        const transformedDebts = upcomingDebtsResponse
          .filter((debt): debt is FirestoreDebt & { id: string } => Boolean(debt.id))
          .map(debt => {
            // Handle different possible dueDate formats
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
                nanoseconds: 0 // Not used in the UI
              },
              paid: Boolean(debt.paid),
              note: debt.note || '',
              ...(debt.installmentAmount && { installmentAmount: debt.installmentAmount })
            };
          });

        // Log all transactions for debugging
        console.log('Incomes:', incomes);
        console.log('Expenses:', expenses);
        console.log('Debts:', transformedDebts);
        
        // Calculate totals
        const totalIncome = incomes.reduce((sum: number, income: Income) => sum + income.amount, 0);
        const totalExpense = expenses.reduce((sum: number, expense: Expense) => sum + expense.amount, 0);
        
        // Calculate salary income only for debt-to-income ratio
        const salaryIncome = incomes
          .filter((income: Income) => income?.category === 'salary')
          .reduce((sum: number, income: Income) => sum + income.amount, 0);
        
        console.log('Total Income:', totalIncome, 'Salary Income:', salaryIncome, 'Total Expense:', totalExpense);
        
        // Calculate balance (income - expenses)
        let currentBalance = totalIncome - totalExpense;
        
        // Calculate total monthly payments for unpaid debts
        const currentMonthlyDebtPayments = transformedDebts
          .filter((debt: UIDebt) => !debt.paid)
          .reduce((sum: number, debt: UIDebt) => {
            // Use installment amount if available, otherwise use debt amount
            const monthlyPayment = debt.installmentAmount || (debt.amount / 12); // Default to 1 year if no installment
            return sum + monthlyPayment;
          }, 0);
        
        // If balance is negative, add 1/12th of the negative balance to monthly payments
        const effectiveMonthlyDebt = currentBalance < 0 
          ? currentMonthlyDebtPayments + (Math.abs(currentBalance) / 12)
          : currentMonthlyDebtPayments;
        
        // Ensure balance doesn't go below 0
        currentBalance = Math.max(0, currentBalance);
        
        // Calculate debt-to-income ratio (monthly payments / monthly salary income)
        let ratio = 0;
        if (salaryIncome > 0) {
          ratio = (effectiveMonthlyDebt / salaryIncome) * 100;
          console.log('Debt-to-Income Calculation:', {
            salaryIncome,
            monthlyDebt: effectiveMonthlyDebt,
            ratio,
            currentBalance,
            totalDebt: transformedDebts
              .filter((debt: UIDebt) => !debt.paid)
              .reduce((sum: number, debt: UIDebt) => sum + debt.amount, 0)
          });
        } else if (effectiveMonthlyDebt > 0) {
          // If there's debt but no income, set ratio to 100% to indicate critical status
          ratio = 100;
          console.log('No income but has debt:', { effectiveMonthlyDebt, ratio });
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
        
        // Debug: Log all debts for inspection
        console.log('All debts:', allDebtsTransformed.map(d => ({
          id: d.id,
          amount: d.amount,
          dueDate: new Date(d.dueDate.seconds * 1000).toISOString(),
          paid: d.paid,
          note: d.note
        })));

        const today = new Date();
        console.log('Current date:', today.toISOString());
        
        // Filter for current month's debts
        const debtsThisMonth = allDebtsTransformed.filter(debt => {
          const dueDate = new Date(debt.dueDate.seconds * 1000);
          
          // Debug log for each debt being checked
          console.log(`Checking debt ${debt.id}:`, {
            dueDate: dueDate.toISOString(),
            currentMonth: today.getMonth(),
            dueDateMonth: dueDate.getMonth(),
            currentYear: today.getFullYear(),
            dueDateYear: dueDate.getFullYear(),
            isPaid: debt.paid,
            isDueThisMonth: dueDate.getMonth() === today.getMonth() && dueDate.getFullYear() === today.getFullYear(),
            isUpcomingThisMonth: dueDate >= today && dueDate.getMonth() === today.getMonth() && dueDate.getFullYear() === today.getFullYear()
          });
          
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
        
        console.log('Filtered debts this month:', debtsThisMonth);
        
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
      // Sign out from Firebase
      await logOut();
      
      // Reset all local state
      setBalance(0);
      setTotalDebt(0);
      setDebtToIncomeRatio(0);
      setDebts([]);
      
      // Navigate to login page with a full page reload to ensure clean state
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
      
      // Update the debt in the database
      await updateTransaction<FirestoreDebt>(user.uid, 'debts', debtId, { paid: true });
      
      // Update local state
      const updateDebtState = (d: UIDebt) => d.id === debtId ? { ...d, paid: true } : d;
      
      setDebts(prevDebts => prevDebts.map(updateDebtState));
      setAllDebts(prevAllDebts => prevAllDebts.map(updateDebtState));
      
      // Calculate remaining debt amount
      const remainingDebt = allDebts
        .filter(d => !d.paid && d.id !== debtId)
        .reduce((sum: number, d: UIDebt) => sum + d.amount, 0);
      
      // Update total debt and reduce balance
      setTotalDebt(remainingDebt);
      setBalance(prev => Math.max(0, prev - debt.amount));
      
      // Update debt-to-income ratio
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
            <div className="bg-white p-6 rounded-lg shadow">
              <DebtList 
                title="Due This Month"
                debts={debts} 
                loading={loading} 
                onMarkAsPaid={handleMarkAsPaid}
              />
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow">
              <DebtList 
                title="All Debts"
                debts={allDebts} 
                loading={loading} 
                onMarkAsPaid={handleMarkAsPaid}
              />
            </div>
          </div>
        </div>

        {/* Enhanced Floating Action Button with Menu */}
        <div ref={menuRef} className="fixed bottom-6 right-4 md:bottom-8 md:right-8 z-50 flex flex-col items-end space-y-3">
          {/* Menu Items */}
          <div 
            className={`flex flex-col items-end space-y-3 transition-all duration-300 transform origin-bottom-right ${
              showMenu ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none'
            }`}
          >
            {/* Income Button */}
            <div className={`transition-all duration-200 transform ${showMenu ? 'translate-y-0' : 'translate-y-4 opacity-0'}`} style={{ transitionDelay: showMenu ? '100ms' : '0ms' }}>
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
            <div className={`transition-all duration-200 transform ${showMenu ? 'translate-y-0' : 'translate-y-3 opacity-0'}`} style={{ transitionDelay: showMenu ? '50ms' : '0ms' }}>
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
            <div className={`transition-all duration-200 transform ${showMenu ? 'translate-y-0' : 'translate-y-2 opacity-0'}`}>
              <button
                onClick={() => {
                  setShowMenu(false);
                  navigate('/add-debt');
                }}
                className="group flex items-center justify-center w-14 h-14 bg-yellow-500 hover:bg-yellow-600 rounded-full text-white shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-400 transition-all duration-200"
                aria-label="Add debt"
              >
                <div className="flex flex-col items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-xs font-medium mt-1">Debt</span>
                </div>
              </button>
            </div>
          </div>

          {/* Main FAB Button */}
          <button
            onClick={() => setShowMenu(!showMenu)}
            className={`flex items-center justify-center w-16 h-16 bg-blue-600 hover:bg-blue-700 rounded-full text-white shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300 ${showMenu ? 'rotate-45' : ''}`}
            aria-label={showMenu ? 'Close menu' : 'Add transaction'}
          >
            <PlusIcon className={`w-8 h-8 transition-transform duration-300 ${showMenu ? 'rotate-90' : ''}`} />
          </button>
        </div>
      </main>
    </div>
  );
};

export default Home;
