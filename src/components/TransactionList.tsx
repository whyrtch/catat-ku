import { formatCurrency, formatTransactionDate } from '../utils/format';

interface TransactionListProps {
  transactions: Array<{
    id: string;
    type: 'income' | 'expense' | 'debt';
    amount: number;
    date: Date | { seconds: number; nanoseconds: number } | string | undefined;
    category?: string;
    note?: string;
    paid?: boolean;
  }>;
  loading: boolean;
  onMarkAsPaid?: (id: string) => void;
}

const TransactionList = ({ transactions, loading, onMarkAsPaid }: TransactionListProps) => {
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No transactions found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {transactions.map((transaction) => {
        const isIncome = transaction.type === 'income';
        const isExpense = transaction.type === 'expense';
        const isDebt = transaction.type === 'debt';
        
        return (
          <div 
            key={`${transaction.type}-${transaction.id}`} 
            className={`p-4 border rounded-lg ${
              isIncome ? 'bg-green-50' : 
              isExpense ? 'bg-red-50' : 
              'bg-blue-50'
            }`}
          >
            <div className="flex justify-between">
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <p className={`font-medium ${
                    isIncome ? 'text-green-700' : 
                    isExpense ? 'text-red-700' : 
                    transaction.paid ? 'text-gray-500' : 'text-blue-700'
                  }`}>
                    {isIncome ? '↑' : isExpense ? '↓' : transaction.paid ? '✅' : '⏳'} 
                    {' '}
                    {formatCurrency(transaction.amount)}
                  </p>
                  <span className={`text-sm ${
                    isIncome ? 'text-green-600' : 
                    isExpense ? 'text-red-600' : 'text-blue-600'
                  }`}>
                    {isIncome ? 'Income' : isExpense ? 'Expense' : 'Debt'}
                  </span>
                </div>
                <p className="text-sm text-gray-500">
                  {formatTransactionDate(transaction.date)}
                  {transaction.category && ` • ${transaction.category.charAt(0).toUpperCase() + transaction.category.slice(1)}`}
                </p>
              </div>
              {isDebt && !transaction.paid && onMarkAsPaid && (
                <div className="flex items-center ml-4">
                  <button
                    onClick={() => onMarkAsPaid(transaction.id)}
                    className="px-3 py-1 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 whitespace-nowrap"
                  >
                    Mark as Paid
                  </button>
                </div>
              )}
            </div>
            {transaction.note && (
              <p className="mt-2 text-sm text-gray-600">{transaction.note}</p>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default TransactionList;
