import { UIDebt } from '../../types/models';
import { DebtList } from '../DebtList';

interface DueDebtsSectionProps {
  debts: UIDebt[];
  loading: boolean;
  onMarkAsPaid: (debtId: string) => Promise<boolean>;
  className?: string;
}

export const DueDebtsSection = ({
  debts,
  loading,
  onMarkAsPaid,
  className = '',
}: DueDebtsSectionProps) => {
  const now = new Date();
  
  const filteredDebts = debts.filter(debt => {
    if (debt.paid) return false;
    const dueDate = new Date(debt.dueDate.seconds * 1000);
    return (
      dueDate.getMonth() === now.getMonth() &&
      dueDate.getFullYear() === now.getFullYear()
    );
  });

  const totalAmount = filteredDebts.reduce((sum, debt) => sum + debt.amount, 0);

  if (loading && debts.length === 0) {
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

  if (filteredDebts.length === 0 && !loading) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <h2 className="text-lg font-medium text-gray-900 mb-4">Debts Due This Month</h2>
        <p className="text-gray-500 text-center py-4">No debts due this month</p>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow overflow-hidden ${className}`}>
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-gray-900">Debts Due This Month</h2>
          <span className="text-sm font-medium text-red-600">
            Total: {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(totalAmount)}
          </span>
        </div>
        <DebtList 
          debts={filteredDebts} 
          onMarkAsPaid={onMarkAsPaid} 
        />
      </div>
    </div>
  );
};
