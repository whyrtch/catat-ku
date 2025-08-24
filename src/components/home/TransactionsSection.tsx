import { useState, useMemo, useCallback } from 'react';
import { format } from 'date-fns';
import { Transaction } from '../../types/models';
import { MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/24/outline';

interface TransactionsSectionProps {
  transactions: Transaction[];
  loading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  onMarkAsPaid?: (debtId: string) => void;
  className?: string;
}

const getTransactionDate = (date: Date | { seconds: number }): Date => {
  if (!date) return new Date();
  return date instanceof Date ? date : new Date(date.seconds * 1000);
};

export const TransactionsSection = ({
  transactions,
  loading,
  hasMore,
  onLoadMore,
  onMarkAsPaid,
  className = '',
}: TransactionsSectionProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showTypeFilter, setShowTypeFilter] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState<Set<Transaction['type']>>(
    new Set(['income', 'expense', 'debt'])
  );

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Filter transactions based on search query and selected types
  const filteredTransactions = useMemo(() => {
    return transactions.filter(transaction => {
      // Filter by type
      if (!selectedTypes.has(transaction.type)) return false;
      
      // Filter by search query
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        const matchesNote = transaction.note?.toLowerCase().includes(searchLower) || false;
        const matchesAmount = Math.abs(transaction.amount).toString().includes(searchQuery);
        const matchesType = transaction.type.toLowerCase().includes(searchLower);
        const matchesCategory = transaction.category?.toLowerCase().includes(searchLower) || false;
        
        if (!matchesNote && !matchesAmount && !matchesType && !matchesCategory) {
          return false;
        }
      }
      
      return true;
    }).sort((a, b) => {
      // Sort by date (newest first)
      const dateA = getTransactionDate(a.date).getTime();
      const dateB = getTransactionDate(b.date).getTime();
      return dateB - dateA;
    });
  }, [transactions, searchQuery, selectedTypes]);

  // Toggle transaction type filter
  const toggleTypeFilter = useCallback((type: Transaction['type']) => {
    setSelectedTypes(prev => {
      const newTypes = new Set(prev);
      if (newTypes.has(type)) {
        newTypes.delete(type);
      } else {
        newTypes.add(type);
      }
      return newTypes;
    });
  }, []);

  return (
    <div className={`bg-white p-6 rounded-lg shadow ${className}`}>
      <div className="mb-4 space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">Recent Transactions</h3>
          
          <button
            onClick={() => setShowTypeFilter(!showTypeFilter)}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <FunnelIcon className="h-5 w-5 text-gray-500" />
          </button>
        </div>
        
        {/* Type filter dropdown */}
        {showTypeFilter && (
          <div className="flex space-x-2">
            {['income', 'expense', 'debt'].map(type => (
              <button
                key={type}
                onClick={() => toggleTypeFilter(type as Transaction['type'])}
                className={`px-3 py-1 text-sm rounded-full ${
                  selectedTypes.has(type as Transaction['type'])
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        )}
        
        {/* Search input */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search transactions..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      
      {/* Transactions list */}
      <div className="space-y-3">
        {loading && transactions.length === 0 ? (
          <div className="text-center py-4 text-gray-500">Loading transactions...</div>
        ) : filteredTransactions.length === 0 ? (
          <div className="text-center py-4 text-gray-500">No transactions found</div>
        ) : (
          <>
            {filteredTransactions.map(transaction => (
              <div 
                key={transaction.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center space-x-3">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                    transaction.type === 'income' 
                      ? 'bg-green-100 text-green-600' 
                      : transaction.type === 'expense'
                        ? 'bg-red-100 text-red-600'
                        : 'bg-yellow-100 text-yellow-600'
                  }`}>
                    {transaction.type === 'income' ? '↑' : transaction.type === 'expense' ? '↓' : '→'}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">
                      {transaction.category || 'Uncategorized'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {format(getTransactionDate(transaction.date), 'MMM d, yyyy')}
                      {transaction.note && ` • ${transaction.note}`}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`font-medium ${
                    transaction.type === 'income' 
                      ? 'text-green-600' 
                      : transaction.type === 'expense'
                        ? 'text-red-600'
                        : 'text-yellow-600'
                  }`}>
                    {transaction.type === 'expense' ? '-' : transaction.type === 'income' ? '+' : ''}
                    {formatCurrency(Math.abs(transaction.amount))}
                  </div>
                  {transaction.type === 'debt' && (
                    <div className="text-xs text-gray-500">
                      {transaction.status}
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {hasMore && (
              <button
                onClick={onLoadMore}
                disabled={loading}
                className="w-full mt-4 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {loading ? 'Loading...' : 'Load More'}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};
