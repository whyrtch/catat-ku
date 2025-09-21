import { useEffect, useRef, useCallback } from 'react';
import { formatCurrency, formatTransactionDate } from '../utils/format';

interface TransactionListProps {
  transactions: Array<{
    id?: string;
    amount: number;
    date: Date | { seconds: number; nanoseconds: number } | string | undefined;
    note?: string;
    paid?: boolean;
    dueDate?: Date | { seconds: number; nanoseconds: number } | string | undefined;
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
      {transactions.map((transaction, index) => (
        <div 
          ref={index === transactions.length - 1 ? lastTransactionElementRef : null}
          key={transaction.id || index} 
          className="p-4 rounded-lg bg-blue-50"
        >
          <div className="flex justify-between">
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <p className={`font-medium ${
                  transaction.paid ? 'text-gray-500' : 'text-blue-700'
                }`}>
                  {transaction.paid ? '✅' : '⏳'} {formatCurrency(transaction.amount)}
                </p>
                <span className="text-sm text-blue-600">
                  Debt
                </span>
              </div>
              {transaction.note && (
                <p className="text-sm text-gray-500">
                  {transaction.note}
                </p>
              )}
              {transaction.dueDate && (
                <p className="text-xs text-gray-400 mt-1">
                  Due: {formatTransactionDate(transaction.dueDate)}
                </p>
              )}
            </div>
            
            {onMarkAsPaid && transaction.id && !transaction.paid && (
              <button
                onClick={() => transaction.id && onMarkAsPaid(transaction.id)}
                className="ml-4 px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
              >
                Mark as Paid
              </button>
            )}
          </div>
        </div>
      ))}
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
