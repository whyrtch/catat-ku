import { useEffect, useRef, useCallback } from 'react';
import { formatCurrency, formatTransactionDate } from '../utils/format';

interface TransactionListProps {
  transactions: Array<{
    id?: string;  // Made optional to match the Income type
    type: 'income' | 'expense' | 'debt';
    amount: number;
    date: Date | { seconds: number; nanoseconds: number } | string | undefined;
    category?: string;
    note?: string;
    paid?: boolean;
  }>;
  loading: boolean;
  onMarkAsPaid?: (id: string) => void;
  hasMore?: boolean;
  onLoadMore?: () => void;
}

const TransactionList = ({ 
  transactions, 
  loading, 
  onMarkAsPaid, 
  hasMore = false, 
  onLoadMore = () => {} 
}: TransactionListProps) => {
  const observer = useRef<IntersectionObserver>();
  const lastTransactionElementRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (loading) return;
      
      if (observer.current) {
        observer.current.disconnect();
      }
      
      observer.current = new IntersectionObserver(
        (entries) => {
          if (entries[0]?.isIntersecting && hasMore) {
            onLoadMore();
          }
        },
        { threshold: 0.1 }
      );
      
      if (node) {
        observer.current.observe(node);
      }
      
      return () => {
        if (observer.current) {
          observer.current.disconnect();
        }
      };
    },
    [loading, hasMore, onLoadMore]
  );

  if (loading && transactions.length === 0) {
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
      <div className="text-center py-8 text-gray-500">
        No transactions found
      </div>
    );
  }

  useEffect(() => {
    return () => {
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, []);

  return (
    <div className="space-y-4">
      {transactions.map((transaction, index) => {
        const isIncome = transaction.type === 'income';
        const isExpense = transaction.type === 'expense';
        const isDebt = transaction.type === 'debt';
        
        return (
          <div 
            ref={index === transactions.length - 1 ? lastTransactionElementRef : null}
            key={transaction.id || index} 
            className={`p-4 rounded-lg ${
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
              {isDebt && !transaction.paid && onMarkAsPaid && transaction.id && (
                <div className="flex items-center ml-4">
                  <button
                    onClick={() => transaction.id && onMarkAsPaid(transaction.id)}
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
      {loading && (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}
      {hasMore && !loading && (
        <div className="mt-4 text-center">
          <button
            onClick={onLoadMore}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Load More
          </button>
        </div>
      )}
      
      {!hasMore && transactions.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No transactions found</p>
        </div>
      )}
    </div>
  );
};

export default TransactionList;
