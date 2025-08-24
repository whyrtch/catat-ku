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
  totalAmount?: number;
}

export const DebtList = ({
  debts = [],
  loading = false,
  title,
  className = '',
  onMarkAsPaid,
  totalAmount,
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
      {title && (
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
          {totalAmount !== undefined && (
            <span className="text-lg font-medium text-gray-900">
              {formatCurrency(totalAmount)}
            </span>
          )}
        </div>
      )}
      <div className="space-y-2">
        {debts.map((debt) => (
          <div
            key={debt.id}
            className={`p-4 rounded-lg border ${
              debt.paid 
                ? 'bg-gray-50 border-gray-200' 
                : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-md'
            } transition-all`}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-2">
                <p className={`text-lg font-semibold ${
                  debt.paid ? 'text-gray-500' : 'text-gray-900'
                }`}>
                  {formatCurrency(debt.amount)}
                  {debt.paid && <span className="ml-2 text-sm font-normal">(Paid)</span>}
                </p>
                {debt.installmentAmount && (
                  <span className="px-2 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-full">
                    {Math.ceil(debt.amount / debt.installmentAmount)}x • {formatCurrency(debt.installmentAmount)}/month
                  </span>
                )}
              </div>
              <div className="text-sm text-gray-600 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-xs font-medium text-gray-500">Due Date</p>
                    <p className="font-medium">
                      {debt.dueDate ? format(debt.dueDate instanceof Date ? debt.dueDate : new Date(debt.dueDate.seconds * 1000), 'MMM d, yyyy') : 'N/A'}
                    </p>
                  </div>
                  {debt.installmentAmount && (
                    <div>
                      <p className="text-xs font-medium text-gray-500">Installment</p>
                      <p className="font-medium">{formatCurrency(debt.installmentAmount)}</p>
                    </div>
                  )}
                </div>

                {debt.startDate && (
                  <div className="mt-2">
                    <p className="text-xs font-medium text-gray-500 mb-1">Payment Schedule</p>
                    <div className="space-y-1">
                      {Array.from({ length: Math.min(debt.tenor || 1, 3) }).map((_, index) => {
                        const start = debt.startDate ? 
                          (debt.startDate instanceof Date ? debt.startDate : new Date(debt.startDate.seconds * 1000)) : 
                          new Date();
                        const dueDate = addMonths(start, index);
                        
                        return (
                          <div key={index} className="flex justify-between text-sm">
                            <span className="text-gray-700">
                              {index === 0 ? 'First' : index === (debt.tenor || 1) - 1 ? 'Final' : `Installment ${index + 1}`}
                            </span>
                            <span className="font-medium">
                              {format(dueDate, 'MMM d')}
                            </span>
                          </div>
                        );
                      })}
                      {(debt.tenor || 0) > 3 && (
                        <div className="text-xs text-gray-500 italic">
                          +{(debt.tenor || 0) - 3} more installments
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {debt.note && (
                  <div className="mt-2 pt-2 border-t border-gray-100">
                    <p className="text-xs text-gray-500">Note</p>
                    <p className="text-sm text-gray-700">{debt.note}</p>
                  </div>
                )}
              </div>
            </div>
            {onMarkAsPaid && !debt.paid && (
              <div className="flex-shrink-0 ml-4">
                <button
                  onClick={() => onMarkAsPaid(debt.id)}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 whitespace-nowrap transition-colors"
                >
                  Mark as Paid
                </button>
              </div>
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
