import { useState, useMemo, useEffect } from 'react';
import { useDebts } from '../hooks/useDebts';
import { format, startOfMonth, endOfMonth, subMonths, addMonths, isWithinInterval } from 'date-fns';
import { formatCurrency } from '../utils/format';

export const DebtsPage = () => {
  const [selectedMonth, setSelectedMonth] = useState<Date | null>(null);
  const [visibleCount, setVisibleCount] = useState(10);
  const { debts, loading } = useDebts((debt) => !debt.paid);

  // Reset visible count when filters change
  useEffect(() => {
    setVisibleCount(10);
  }, [selectedMonth]);

  const filteredDebts = useMemo(() => {
    if (!selectedMonth) {
      return [...debts].sort((a, b) => 
        new Date(b.dueDate.seconds * 1000).getTime() - new Date(a.dueDate.seconds * 1000).getTime()
      );
    } else {
      const startDate = startOfMonth(selectedMonth);
      const endDate = endOfMonth(selectedMonth);
      
      return debts.filter(debt => {
        const dueDate = new Date(debt.dueDate.seconds * 1000);
        return isWithinInterval(dueDate, { start: startDate, end: endDate });
      });
    }
  }, [debts, selectedMonth]);
  
  const showAllTime = selectedMonth === null;
  const hasMoreDebts = filteredDebts.length > visibleCount;
  const visibleDebts = filteredDebts.slice(0, visibleCount);
  
  const loadMoreDebts = () => {
    setVisibleCount(prev => prev + 10);
  };

  const handlePreviousMonth = () => {
    setSelectedMonth(prev => prev && subMonths(prev, 1));
  };

  const handleNextMonth = () => {
    setSelectedMonth(prev => prev && addMonths(prev, 1));
  };

  const totalDebt = filteredDebts.reduce((sum, debt) => sum + debt.amount, 0);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Debts</h1>
          <button 
            onClick={() => window.history.back()}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
          >
            Back to Dashboard
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
            <h2 className="text-lg font-medium text-gray-900">Debt Overview</h2>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setSelectedMonth(null)}
                  className={`px-3 py-1 text-sm rounded-md ${!selectedMonth ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  All Time
                </button>
                <button
                  onClick={() => setSelectedMonth(new Date())}
                  className={`px-3 py-1 text-sm rounded-md ${selectedMonth ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  This Month
                </button>
              </div>
              {selectedMonth && (
                <div className="flex items-center space-x-2 border-l pl-4">
                  <button
                    onClick={handlePreviousMonth}
                    className="p-1 rounded-full hover:bg-gray-100"
                    aria-label="Previous month"
                  >
                    <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <span className="text-lg font-medium">
                    {format(selectedMonth, 'MMMM yyyy')}
                  </span>
                  <button
                    onClick={handleNextMonth}
                    className="p-1 rounded-full hover:bg-gray-100"
                    aria-label="Next month"
                    disabled={format(selectedMonth, 'yyyy-MM') >= format(new Date(), 'yyyy-MM')}
                  >
                    <svg 
                      className={`h-5 w-5 ${format(selectedMonth, 'yyyy-MM') >= format(new Date(), 'yyyy-MM') ? 'text-gray-300' : 'text-gray-500'}`} 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500">Total {showAllTime ? 'Debts' : 'Debt'}</p>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(totalDebt)}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500">Showing {Math.min(visibleCount, filteredDebts.length)} of {filteredDebts.length} Debts</p>
              <p className="text-2xl font-bold">{filteredDebts.length}</p>
            </div>
            {!showAllTime && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500">Month</p>
                <p className="text-xl font-medium">{format(selectedMonth, 'MMMM yyyy')}</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Debt List</h3>
          </div>
          
          {loading ? (
            <div className="p-6">
              <div className="animate-pulse space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-gray-200 rounded w-full"></div>
                ))}
              </div>
            </div>
          ) : visibleDebts.length > 0 ? (
            <>
              <ul className="divide-y divide-gray-200">
                {visibleDebts.map((debt) => (
                <li key={debt.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {debt.note || 'Unnamed Debt'}
                      </p>
                      <p className="text-sm text-gray-500">
                        Due: {new Date(debt.dueDate.seconds * 1000).toLocaleDateString()}
                      </p>
                    </div>
                    <p className="text-lg font-medium text-red-600">
                      {formatCurrency(debt.amount)}
                    </p>
                  </div>
                  </li>
                ))}
              </ul>
              {hasMoreDebts && (
                <div className="p-4 text-center">
                  <button
                    onClick={loadMoreDebts}
                    className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    disabled={loading}
                  >
                    {loading ? 'Loading...' : 'Load More'}
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="p-6 text-center text-gray-500">
              {showAllTime 
                ? 'No debts found in your records.'
                : `No debts found for ${format(selectedMonth, 'MMMM yyyy')}`
              }
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DebtsPage;
