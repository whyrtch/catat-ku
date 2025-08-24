import { UIDebt } from '../../types/models';
import { DebtList } from '../DebtList';

interface DebtSectionProps {
  title: string;
  debts: UIDebt[];
  loading: boolean;
  onMarkAsPaid: (debtId: string) => void;
  filterFn?: (debt: UIDebt) => boolean;
  className?: string;
  totalAmount?: number;
}

export const DebtSection = ({
  title,
  debts,
  loading,
  onMarkAsPaid,
  filterFn = () => true,
  className = '',
}: DebtSectionProps) => {
  const filteredDebts = debts.filter(filterFn);
  const totalAmount = filteredDebts.reduce((sum, debt) => sum + debt.amount, 0);
  
  if (filteredDebts.length === 0 && !loading) {
    return null;
  }

  return (
    <div className={`bg-white p-6 rounded-lg shadow ${className}`}>
      <DebtList
        title={title}
        debts={filteredDebts}
        totalAmount={totalAmount}
        loading={loading}
        onMarkAsPaid={onMarkAsPaid}
      />
    </div>
  );
};
