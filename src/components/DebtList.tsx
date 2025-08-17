import { format } from 'date-fns';
import { formatCurrency } from '../utils/format';

interface Debt {
  id: string;
  amount: number;
  dueDate: { seconds: number; nanoseconds: number };
  paid: boolean;
  note?: string;
}

interface DebtListProps {
  debts: Debt[];
  loading?: boolean;
  onMarkAsPaid?: (debtId: string) => void;
}

export const DebtList = ({
  debts = [],
  loading = false,
  onMarkAsPaid,
}: DebtListProps) => {
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-16 bg-gray-100 rounded-lg animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (debts.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No debts due this month</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-medium text-gray-900">Due This Month</h3>
      <div className="space-y-2">
        {debts.map((debt) => (
          <div
            key={debt.id}
            className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm hover:shadow transition-shadow"
          >
            <div>
              <p className="font-medium">
                {formatCurrency(debt.amount)}
                {debt.note && (
                  <span className="ml-2 text-sm text-gray-500">
                    {debt.note}
                  </span>
                )}
              </p>
              <p className="text-sm text-gray-500">
                Due {format(new Date(debt.dueDate.seconds * 1000), 'MMM d, yyyy')}
              </p>
            </div>
            {!debt.paid && onMarkAsPaid && (
              <button
                onClick={() => onMarkAsPaid(debt.id)}
                className="px-3 py-1 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Mark as Paid
              </button>
            )}
            {debt.paid && (
              <span className="px-2 py-1 text-xs font-medium text-green-800 bg-green-100 rounded-full">
                Paid
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default DebtList;
