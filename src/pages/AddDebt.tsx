import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { addTransaction, Debt } from '../lib/firebaseConfig';
import { format, addMonths } from 'date-fns';

const AddDebt = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState(format(addMonths(new Date(), 1), 'yyyy-MM-dd'));
  const [installmentAmount, setInstallmentAmount] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  const calculateInstallment = (total: string, months: number = 1) => {
    const totalNum = parseFloat(total);
    if (isNaN(totalNum) || totalNum <= 0) return '';
    return (totalNum / months).toFixed(2);
  };

  const handleAmountChange = (value: string) => {
    setAmount(value);
    if (!installmentAmount || installmentAmount === calculateInstallment(amount)) {
      setInstallmentAmount(calculateInstallment(value));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    const amountNum = parseFloat(amount);
    const installmentNum = parseFloat(installmentAmount);
    
    if (isNaN(amountNum) || amountNum <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (isNaN(installmentNum) || installmentNum <= 0) {
      setError('Please enter a valid installment amount');
      return;
    }

    if (installmentNum > amountNum) {
      setError('Installment amount cannot be greater than total amount');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      await addTransaction<Debt>(user.uid, 'debts', {
        type: 'debt',
        amount: amountNum,
        date: new Date(), // Current date for when the debt was recorded
        dueDate: new Date(dueDate),
        installmentAmount: installmentNum,
        paid: false,
        note: note.trim() || undefined,
      });
      
      navigate('/');
    } catch (err) {
      console.error('Error adding debt:', err);
      setError('Failed to add debt. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Add Debt</h1>
          <p className="mt-1 text-sm text-gray-500">
            Record your debts to keep track of what you owe.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 text-sm text-red-700 bg-red-100 rounded-md">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
              Total Amount
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">Rp</span>
              </div>
              <input
                type="number"
                id="amount"
                className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-12 pr-12 sm:text-sm border-gray-300 rounded-md"
                placeholder="0.00"
                value={amount}
                onChange={(e) => handleAmountChange(e.target.value)}
                step="0.01"
                min="0"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700">
                Due Date
              </label>
              <div className="mt-1">
                <input
                  type="date"
                  id="dueDate"
                  className="focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  value={dueDate}
                  min={format(new Date(), 'yyyy-MM-dd')}
                  onChange={(e) => setDueDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="installmentAmount" className="block text-sm font-medium text-gray-700">
                Installment Amount
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">Rp</span>
                </div>
                <input
                  type="number"
                  id="installmentAmount"
                  className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-12 pr-12 sm:text-sm border-gray-300 rounded-md"
                  placeholder="0.00"
                  value={installmentAmount}
                  onChange={(e) => setInstallmentAmount(e.target.value)}
                  step="0.01"
                  min="0"
                  max={amount}
                  required
                />
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="note" className="block text-sm font-medium text-gray-700">
              Note (Optional)
            </label>
            <div className="mt-1">
              <textarea
                id="note"
                rows={3}
                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border border-gray-300 rounded-md"
                placeholder="e.g., Credit card payment, Personal loan"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Debt'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddDebt;
