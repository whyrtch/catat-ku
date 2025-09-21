import { useState, useCallback } from 'react';
import { NavBar } from '../components/home/NavBar';
import { FloatingActionButton } from '../components/home/FloatingActionButton';
import { DebtSection } from '../components/home/DebtSection';
import { useDebts } from '../hooks/useDebts';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '../utils/format';

const Home = () => {
  const [showMenu, setShowMenu] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  
  // Debts due this month
  const { 
    debts, 
    markAsPaid: handleMarkAsPaid,
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
  const handleSignOut = useCallback(async () => {
    await signOut();
    navigate('/login');
  }, [signOut, navigate]);

  const toggleMenu = useCallback(() => {
    setShowMenu(prev => !prev);
  }, []);

  const handleAddDebt = useCallback(() => {
    navigate('/add-debt');
  }, [navigate]);

  if (!user) {
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
          <div className="bg-white rounded-lg shadow p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">My Debts</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Total Debt</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(monthlyTotalDebt + upcomingTotalDebt)}
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Due This Month</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(monthlyTotalDebt || 0)}
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Upcoming</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {formatCurrency(upcomingTotalDebt || 0)}
                </p>
              </div>
            </div>
          </div>
          
          <div className="space-y-8">
            <DebtSection
              title="Debts Due This Month"
              debts={debts}
              loading={monthlyDebtsLoading}
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
              loading={upcomingDebtsLoading}
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
        onAddDebt={handleAddDebt}
      />
    </div>
  );
};

export default Home;
