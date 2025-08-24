import { useHomePage } from '../hooks/useHomePage';
import { NavBar } from '../components/home/NavBar';
import { FloatingActionButton } from '../components/home/FloatingActionButton';
import { DebtSection } from '../components/home/DebtSection';
import { TransactionsSection } from '../components/home/TransactionsSection';
import BalanceCard from '../components/BalanceCard';

const Home = () => {
  const {
    loading,
    balance,
    totalDebt,
    debtToIncomeRatio,
    debts,
    allDebts,
    incomes,
    expenses,
    user,
    showMenu,
    toggleMenu,
    navigateTo,
    handleSignOut,
    handleMarkAsPaid,
  } = useHomePage();

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
            
            <TransactionsSection
              incomes={incomes}
              expenses={expenses}
              allDebts={allDebts}
              loading={loading}
              onMarkAsPaid={handleMarkAsPaid}
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
