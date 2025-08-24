import { useState, useCallback } from 'react';
import { NavBar } from '../components/home/NavBar';
import { FloatingActionButton } from '../components/home/FloatingActionButton';
import { DebtSection } from '../components/home/DebtSection';
import { TransactionsSection } from '../components/home/TransactionsSection';
import BalanceCard from '../components/BalanceCard';
import { useBalanceCard } from '../hooks/useBalanceCard';
import { useDebts } from '../hooks/useDebts';
import { useTransactions } from '../hooks/useTransactions';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const [showMenu, setShowMenu] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  
  // Fetch data using separate hooks
  const { balance, loading: balanceLoading } = useBalanceCard();
  
  // Debts due this month
  const { 
    debts, 
    markAsPaid: markMonthlyDebtAsPaid,
    totalDebt: monthlyTotalDebt,
    loading: monthlyDebtsLoading 
  } = useDebts((debt) => {
    if (debt.paid) return false;
    const now = new Date();
    const dueDate = new Date(debt.dueDate.seconds * 1000);
    return (
      (dueDate.getMonth() === now.getMonth() && 
       dueDate.getFullYear() === now.getFullYear()) ||
      dueDate < now
    );
  });
  
  // Upcoming debts
  const { 
    debts: allDebts, 
    markAsPaid: markUpcomingDebtAsPaid,
    totalDebt: upcomingTotalDebt,
    loading: upcomingDebtsLoading
  } = useDebts((debt) => {
    if (debt.paid) return false;
    const now = new Date();
    const dueDate = new Date(debt.dueDate.seconds * 1000);
    return (
      dueDate > new Date(now.getFullYear(), now.getMonth() + 1, 0) ||
      dueDate.getFullYear() > now.getFullYear()
    );
  });

  
  const handleMarkAsPaid = useCallback(async (debtId: string) => {
    const success = await markMonthlyDebtAsPaid(debtId) || 
                   await markUpcomingDebtAsPaid(debtId);
    return !!success;
  }, [markMonthlyDebtAsPaid, markUpcomingDebtAsPaid]);
  
  const toggleMenu = useCallback(() => setShowMenu(prev => !prev), []);
  const navigateTo = useCallback((path: string) => navigate(path), [navigate]);
  
  const handleSignOut = useCallback(async () => {
    await signOut();
    navigate('/login');
  }, [signOut, navigate]);
  
  const loading = balanceLoading || monthlyDebtsLoading || upcomingDebtsLoading;
  const totalDebt = (monthlyTotalDebt || 0) + (upcomingTotalDebt || 0);
  
  // Calculate debt-to-income ratio using available data
  // For a more accurate ratio, consider adding a dedicated hook for incomes
  const debtToIncomeRatio = balance > 0 ? (totalDebt / balance) * 100 : 0;
  
  if (loading && !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar user={user} onSignOut={handleSignOut} />

      <main className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <BalanceCard 
            balance={balance}
            totalDebt={totalDebt}
            monthlyDebt={monthlyTotalDebt || 0}
            upcomingDebts={upcomingTotalDebt}
            debtToIncomeRatio={debtToIncomeRatio}
            loading={loading}
          />
          
          <div className="space-y-8">
            <DebtSection
              title="Debts Due This Month"
              debts={debts}
              loading={loading}
              onMarkAsPaid={handleMarkAsPaid}
              filterFn={(debt) => {
                if (debt.paid) return false;
                const now = new Date();
                const dueDate = new Date(debt.dueDate.seconds * 1000);
                return (
                  dueDate.getMonth() === now.getMonth() && 
                  dueDate.getFullYear() === now.getFullYear()
                );
              }}
            />
            
            <DebtSection
              title="Upcoming Debts"
              debts={allDebts}
              loading={loading}
              onMarkAsPaid={handleMarkAsPaid}
              filterFn={(debt) => {
                if (debt.paid) return false;
                const now = new Date();
                const dueDate = new Date(debt.dueDate.seconds * 1000);
                return (
                  dueDate > new Date(now.getFullYear(), now.getMonth() + 1, 0) ||
                  dueDate.getFullYear() > now.getFullYear()
                );
              }}
            />

          </div>
        </div>
      </main>

      <FloatingActionButton
        showMenu={showMenu}
        onToggleMenu={toggleMenu}
        onAddIncome={() => navigateTo('/add-income')}
        onAddExpense={() => navigateTo('/add-expense')}
        onAddDebt={() => navigateTo('/add-debt')}
      />
    </div>
  );
};

export default Home;
