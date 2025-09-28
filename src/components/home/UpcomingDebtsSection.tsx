import { useState, useEffect } from 'react';
import { UIDebt } from '../../types/models';
import { DebtList } from '../DebtList';
import { useUpcomingDebts } from '../../hooks/useUpcomingDebts';

interface UpcomingDebtsSectionProps {
  className?: string;
  onTotalChange?: (total: number) => void;
}

export const UpcomingDebtsSection = ({
  className = '',
  onTotalChange,
}: UpcomingDebtsSectionProps) => {
  const [debts, setDebts] = useState<UIDebt[]>([]);
  const [loading, setLoading] = useState(true);
  const { fetchUpcomingDebts, markAsPaid } = useUpcomingDebts();

  useEffect(() => {
    console.log('UpcomingDebtsSection: Component mounted or fetchUpcomingDebts changed');
    const loadDebts = async () => {
      setLoading(true);
      console.log('Loading upcoming debts...');
      try {
        const upcomingDebts = await fetchUpcomingDebts();
        console.log('Received upcoming debts:', upcomingDebts);
        setDebts(upcomingDebts);
        const total = upcomingDebts.reduce((sum, debt) => sum + debt.amount, 0);
        console.log('Calculated total amount:', total);
        onTotalChange?.(total);
      } catch (error) {
        console.error('Failed to load upcoming debts:', error);
        onTotalChange?.(0);
      } finally {
        console.log('Finished loading debts, setting loading to false');
        setLoading(false);
      }
    };

    loadDebts();
  }, [fetchUpcomingDebts, onTotalChange]);

  const handleMarkAsPaid = async (debtId: string) => {
    const success = await markAsPaid(debtId);
    if (success) {
      setDebts(prevDebts => {
        const updatedDebts = prevDebts.filter(debt => debt.id !== debtId);
        const total = updatedDebts.reduce((sum, debt) => sum + debt.amount, 0);
        onTotalChange?.(total);
        return updatedDebts;
      });
      return true;
    }
    return false;
  };

  const totalAmount = debts.reduce((sum, debt) => sum + debt.amount, 0);

  if (loading) {
    return (
      <div className={`animate-pulse bg-gray-100 rounded-lg p-6 ${className}`}>
        <div className="h-6 w-1/3 bg-gray-200 rounded mb-4"></div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (debts.length === 0 && !loading) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <h2 className="text-lg font-medium text-gray-900 mb-4">Upcoming Debts</h2>
        <p className="text-gray-500 text-center py-4">No upcoming debts</p>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow overflow-hidden ${className}`}>
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-gray-900">Upcoming Debts</h2>
          <span className="text-sm font-medium text-yellow-600">
            Total: {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(totalAmount)}
          </span>
        </div>
        <DebtList 
          debts={debts} 
          onMarkAsPaid={handleMarkAsPaid} 
        />
      </div>
    </div>
  );
};
