import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, orderBy, limit, startAfter, getDocs, DocumentData } from 'firebase/firestore';
import { db } from '../lib/firebaseConfig';
import { format } from 'date-fns';
import { formatCurrency } from '../utils/format';

interface Debt {
  id: string;
  amount: number;
  note?: string;
  date: { seconds: number; nanoseconds: number };
  dueDate: { seconds: number; nanoseconds: number };
  paid: boolean;
  paidAt?: { seconds: number; nanoseconds: number };
}

const ITEMS_PER_PAGE = 10;

export default function History() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [lastVisible, setLastVisible] = useState<DocumentData | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchDebts = async (loadMore = false) => {
    if (!user?.uid) {
      console.log('No user ID available');
      return;
    }

    try {
      if (!loadMore) {
        setLoading(true);
        setDebts([]);
      } else {
        setLoadingMore(true);
      }

      console.log('Fetching debts for user:', user.uid);
      
      // First, check if the collection exists and has any documents
      // const debtsRef = collection(db, 'debts');
      const debtsRef = collection(db, 'users', user.uid, 'debts');
      const countQuery = query(debtsRef);
      
      const countSnapshot = await getDocs(countQuery);
      console.log('Found', countSnapshot.size, 'debts for user');
      
      if (countSnapshot.empty) {
        console.log('No debts found for user');
        setDebts([]);
        setHasMore(false);
        return;
      }

      // Then fetch the paginated data
      let q = query(
        debtsRef,
        where('userId', '==', user.uid),
        orderBy('date', 'desc'),
        limit(ITEMS_PER_PAGE)
      );

      if (loadMore && lastVisible) {
        console.log('Fetching next page after last visible');
        q = query(q, startAfter(lastVisible));
      }

      const querySnapshot = await getDocs(q);
      console.log('Fetched', querySnapshot.size, 'documents');
      
      const newDebts = querySnapshot.docs.map(doc => {
        const data = doc.data();
        console.log('Document data:', doc.id, data);
        return {
          id: doc.id,
          ...data
        } as Debt;
      });

      console.log('Processed debts:', newDebts);

      if (loadMore) {
        setDebts(prev => [...prev, ...newDebts]);
      } else {
        setDebts(newDebts);
      }

      setHasMore(newDebts.length === ITEMS_PER_PAGE);
      
      if (querySnapshot.docs.length > 0) {
        setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1]);
      }
    } catch (error) {
      console.error('Error fetching debts:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchDebts();
  }, [user?.uid]);

  const handleLoadMore = () => {
    fetchDebts(true);
  };

  if (loading && debts.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <h1 className="text-2xl font-bold mb-6">Debt History</h1>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white p-4 rounded-lg shadow animate-pulse h-20" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="flex items-center mb-6">
        <button 
          onClick={() => navigate(-1)}
          className="mr-4 p-2 rounded-full hover:bg-gray-100"
          aria-label="Go back"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-6 w-6 text-gray-600" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M10 19l-7-7m0 0l7-7m-7 7h18" 
            />
          </svg>
        </button>
        <h1 className="text-2xl font-bold">Debt History</h1>
      </div>
      
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white p-4 rounded-lg shadow animate-pulse h-20" />
          ))}
        </div>
      ) : debts.length === 0 ? (
        <div className="text-center py-10">
          <div className="text-gray-500 mb-4">No debt history found</div>
          <button
            onClick={() => fetchDebts()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Refresh
          </button>
        </div>
      ) : (
        <>
          <div className="space-y-4 mb-6">
            {debts.map((debt) => (
              <div key={debt.id} className="bg-white p-4 rounded-lg shadow">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-gray-900">
                      {formatCurrency(debt.amount)}
                    </p>
                    {debt.note && (
                      <p className="text-sm text-gray-600 mt-1">{debt.note}</p>
                    )}
                    <div className="mt-2 flex items-center text-sm text-gray-500">
                      <span>
                        {format(new Date(debt.date.seconds * 1000), 'MMM d, yyyy')}
                      </span>
                      <span className="mx-2">•</span>
                      <span className={debt.paid ? 'text-green-600' : 'text-yellow-600'}>
                        {debt.paid ? 'Paid' : 'Pending'}
                      </span>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    Due: {format(new Date(debt.dueDate.seconds * 1000), 'MMM d, yyyy')}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {hasMore && (
            <div className="flex justify-center">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loadingMore ? 'Loading...' : 'Show More'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
