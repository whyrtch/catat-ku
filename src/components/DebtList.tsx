import { format, addMonths } from 'date-fns';
import { formatCurrency } from '../utils/format';

interface Debt {
  id: string;
  amount: number;
  startDate?: { seconds: number; nanoseconds: number } | Date;
  dueDate: { seconds: number; nanoseconds: number } | Date;
  paid: boolean;
  note?: string;
  installmentAmount?: number;
  tenor?: number;
}

interface DebtListProps {
  debts: Debt[];
  loading?: boolean;
  onMarkAsPaid?: (debtId: string) => void;
  title?: string;
  className?: string;
}

export const DebtList = ({
  debts = [],
  loading = false,
  title,
  className = '',
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
    <div className={`space-y-4 ${className}`}>
      {title && <h3 className="text-lg font-medium text-gray-900">{title}</h3>}
      <div className="space-y-2">
        {debts.map((debt) => (
          <div
            key={debt.id}
            className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm hover:shadow transition-shadow"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-900">
                  {formatCurrency(debt.amount)}
                </p>
                {debt.installmentAmount && (
                  <span className="text-xs text-gray-500">
                    {Math.ceil(debt.amount / debt.installmentAmount)}x of {formatCurrency(debt.installmentAmount)}
                  </span>
                )}
              </div>
              <div className="text-sm text-gray-500 space-y-1">
                {debt.startDate && (
                  <div>
                    <p className="font-medium">Payment Schedule:</p>
                    {Array.from({ length: (debt.tenor || 1) }).map((_, index) => {
                      const start = debt.startDate ? 
                        (debt.startDate instanceof Date ? debt.startDate : new Date(debt.startDate.seconds * 1000)) : 
                        new Date();
                      const dueDate = addMonths(start, index);
                      const isFirst = index === 0;
                      const isLast = index === (debt.tenor || 1) - 1;
                      
                      return (
                        <div key={index} className="flex justify-between">
                          <span>
                            {isFirst ? 'Start: ' : isLast ? 'End: ' : `Installment ${index + 1}: `}
                            {format(dueDate, 'MMM d, yyyy')}
                          </span>
                          {debt.installmentAmount && (
                            <span className="font-medium">
                              {formatCurrency(debt.installmentAmount)}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
                {!debt.startDate && (
                  <p>
                    Due: {debt.dueDate instanceof Date 
                      ? format(debt.dueDate, 'MMM d, yyyy')
                      : format(new Date(debt.dueDate.seconds * 1000), 'MMM d, yyyy')}
                  </p>
                )}
              </div>
              {debt.note && (
                <p className="text-sm text-gray-500">{debt.note}</p>
              )}
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
