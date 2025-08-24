import { useState, useMemo, useCallback } from 'react';
import { format, subMonths, addMonths, isSameMonth, isSameYear } from 'date-fns';
import { Income, Expense, UIDebt } from '../../types/models';
import TransactionList from '../TransactionList';
import { ChevronLeftIcon, ChevronRightIcon, MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/24/outline';

// Base transaction type with common fields
type BaseTransaction = {
  id: string;
  amount: number;
  note?: string;
};

type IncomeTransaction = BaseTransaction & {
  type: 'income';
  date: Date | { seconds: number; nanoseconds: number };
  category?: string;
};

type ExpenseTransaction = BaseTransaction & {
  type: 'expense';
  date: Date | { seconds: number; nanoseconds: number };
  category?: string;
};

type DebtTransaction = BaseTransaction & {
  type: 'debt';
  date: Date | { seconds: number; nanoseconds: number };
  paid: boolean;
};

type Transaction = IncomeTransaction | ExpenseTransaction | DebtTransaction;

type TransactionType = 'income' | 'expense' | 'debt';

interface TransactionsSectionProps {
  incomes: Income[];
  expenses: Expense[];
  allDebts: UIDebt[];
  loading: boolean;
  onMarkAsPaid: (debtId: string) => void;
  className?: string;
}

const getTransactionDate = (date: Date | { seconds: number; nanoseconds: number }): Date => {
  return date instanceof Date ? date : new Date(date.seconds * 1000);
};

export const TransactionsSection = ({
  incomes,
  expenses,
  allDebts,
  loading,
  onMarkAsPaid,
  className = '',
}: TransactionsSectionProps) => {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [showTypeFilter, setShowTypeFilter] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState<Set<TransactionType>>(
    new Set(['income', 'expense', 'debt'] as TransactionType[])
  );

  // Get available months with transactions
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    const hasTransactions = incomes.length > 0 || expenses.length > 0 || allDebts.length > 0;
    
    // Process incomes and expenses
    [...incomes, ...expenses].forEach(transaction => {
      const date = getTransactionDate(transaction.date);
      months.add(format(date, 'yyyy-MM-01'));
    });
    
    // Process debts (they have dueDate instead of date)
    allDebts.forEach(debt => {
      const date = getTransactionDate(debt.dueDate);
      months.add(format(date, 'yyyy-MM-01'));
    });
    
    // Add current month if no transactions yet
    if (!hasTransactions) {
      months.add(format(new Date(), 'yyyy-MM-01'));
    }
    
    return Array.from(months)
      .map(dateStr => new Date(dateStr))
      .sort((a, b) => b.getTime() - a.getTime());
  }, [incomes, expenses, allDebts]);

  // Toggle transaction type filter
  const toggleTypeFilter = useCallback((type: TransactionType) => {
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

  // Filter transactions by selected month, search query, and type
  const filteredTransactions = useMemo(() => {
    return [
      ...incomes.map(income => ({
        id: income.id,
        type: 'income' as const,
        amount: income.amount,
        date: income.date,
        category: income.category,
        note: income.note
      })),
      ...expenses.map(expense => ({
        id: expense.id,
        type: 'expense' as const,
        amount: -expense.amount,
        date: expense.date,
        category: expense.category,
        note: expense.note
      })),
      ...allDebts.map(debt => ({
        id: debt.id,
        type: 'debt' as const,
        amount: -debt.amount, // Show debts as negative numbers
        date: debt.dueDate,
        note: debt.note,
        paid: debt.paid,
        category: 'debt' // Add category for consistent filtering
      }))
    ].filter(transaction => {
      // Filter by month
      const transactionDate = getTransactionDate(transaction.date);
      const isInSelectedMonth = isSameMonth(transactionDate, currentMonth) && 
                             isSameYear(transactionDate, currentMonth);
      
      // Filter by type
      const isSelectedType = selectedTypes.has(transaction.type);
      
      // Filter by search query
      const matchesSearch = searchQuery === '' || 
        transaction.note?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        transaction.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        formatCurrency(transaction.amount).toLowerCase().includes(searchQuery.toLowerCase());
      
      return isInSelectedMonth && isSelectedType && matchesSearch;
    }).sort((a, b) => {
      const dateA = getTransactionDate(a.date);
      const dateB = getTransactionDate(b.date);
      return dateB.getTime() - dateA.getTime(); // Sort newest first
    });
  }, [incomes, expenses, allDebts, currentMonth]);

  const handlePreviousMonth = () => {
    setCurrentMonth(prev => subMonths(prev, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(prev => addMonths(prev, 1));
  };

  const isCurrentMonth = isSameMonth(currentMonth, new Date());
  const monthName = format(currentMonth, 'MMMM yyyy');

  if (filteredTransactions.length === 0 && !loading) {
    return null;
  }

  return (
    <div className={`bg-white p-6 rounded-lg shadow ${className}`}>
      <div className="mb-4 space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">Transactions</h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePreviousMonth}
              className="p-1 rounded-full hover:bg-gray-100"
              aria-label="Previous month"
            >
              <ChevronLeftIcon className="h-5 w-5 text-gray-600" />
            </button>
            <span className="text-sm font-medium text-gray-700 w-32 text-center">
              {monthName}
            </span>
            <button
              onClick={handleNextMonth}
              disabled={isCurrentMonth}
              className={`p-1 rounded-full ${isCurrentMonth ? 'opacity-50' : 'hover:bg-gray-100'}`}
              aria-label="Next month"
            >
              <ChevronRightIcon className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>
        
        {/* Search and filter bar */}
        <div className="flex space-x-2">
          <div className="relative flex-1">
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
          
          <div className="relative">
            <button
              onClick={() => setShowTypeFilter(!showTypeFilter)}
              className={`inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${showTypeFilter ? 'ring-2 ring-indigo-500' : ''}`}
              aria-expanded="false"
              aria-haspopup="true"
            >
              <FunnelIcon className="h-4 w-4 mr-1" />
              <span>Filter</span>
            </button>
            
            {showTypeFilter && (
              <div className="origin-top-right absolute right-0 mt-2 w-40 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                <div className="py-1" role="menu" aria-orientation="vertical">
                  {(['income', 'expense', 'debt'] as const).map((type) => (
                    <label key={type} className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">
                      <input
                        type="checkbox"
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        checked={selectedTypes.has(type)}
                        onChange={() => toggleTypeFilter(type)}
                      />
                      <span className="ml-2 capitalize">{type}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="mb-2 flex justify-between text-xs text-gray-500">
        <span>Transactions: {filteredTransactions.length}</span>
        <span>
          {availableMonths.length > 0 && (
            <select
              value={currentMonth.toISOString()}
              onChange={(e) => setCurrentMonth(new Date(e.target.value))}
              className="bg-transparent border-none focus:ring-0 focus:ring-offset-0 text-sm"
            >
              {availableMonths.map((month) => (
                <option key={month.toISOString()} value={month.toISOString()}>
                  {format(month, 'MMM yyyy')}
                </option>
              ))}
            </select>
          )}
        </span>
      </div>
      
      <TransactionList
        transactions={filteredTransactions}
        loading={loading}
        onMarkAsPaid={onMarkAsPaid}
      />
    </div>
  );
};
