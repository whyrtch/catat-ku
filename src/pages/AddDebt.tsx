import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, addMonths, parseISO } from 'date-fns';
import { useAuth } from '../hooks/useAuth';
import { addDebtWithTenor } from '../lib/debtUtils';
import CurrencyInput from '../components/CurrencyInput';
import { formatCurrency } from '../utils/format';

const AddDebt = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [amount, setAmount] = useState('');
  const [tenor, setTenor] = useState(1); // Default to 1 month
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [dueDate, setDueDate] = useState(format(addMonths(new Date(), 1), 'yyyy-MM-dd'));
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAmountChange = (value: string) => {
    setAmount(value);
  };

  // Update due date when tenor or start date changes
  useEffect(() => {
    const start = new Date(startDate);
    const newDueDate = addMonths(start, tenor);
    setDueDate(format(newDueDate, 'yyyy-MM-dd'));
  }, [tenor, startDate]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  const handleSubmitDebt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !dueDate || !user) return;

    const totalAmount = parseFloat(amount);
    const startDateObj = tenor > 1 ? parseISO(startDate) : parseISO(dueDate);
    const baseNote = note + ', Debt payment';
    
    if (startDateObj > new Date(dueDate)) {
      setError('Start date cannot be after due date');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      await addDebtWithTenor(
        user.uid,
        totalAmount,
        tenor,
        startDateObj,
        baseNote
      );
      
      navigate('/');
    } catch (error) {
      console.error('Error adding debt:', error);
      setError('Failed to add debt. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Add New Debt</h1>
            <p className="mt-1 text-sm text-gray-500">
              Record your debt details to keep track of what you owe.
            </p>
          </div>

          <form onSubmit={handleSubmitDebt} className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-700 bg-red-100 rounded-md">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
                Total Amount
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">Rp</span>
                </div>
                <CurrencyInput
                  id="amount"
                  value={amount}
                  onChange={handleAmountChange}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="tenor" className="block text-sm font-medium text-gray-700">
                  Tenor (Months)
                </label>
                <select
                  id="tenor"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-10"
                  value={tenor}
                  onChange={(e) => setTenor(Number(e.target.value))}
                >
                  {[1, 2, 3, 4, 5, 6, 12].map((num) => (
                    <option key={num} value={num}>
                      {num} {num === 1 ? 'Month' : 'Months'}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-4">
                {tenor > 1 && (
                  <div>
                    <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                      Start Date
                    </label>
                    <input
                      type="date"
                      id="startDate"
                      value={startDate}
                      min={format(new Date(), 'yyyy-MM-dd')}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      required={tenor > 1}
                    />
                  </div>
                )}
                <div>
                  <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700">
                    Due Date
                  </label>
                  <input
                    type="date"
                    id="dueDate"
                    className={`mt-1 block w-full rounded-md border-gray-300 ${
                      tenor > 1 ? 'bg-gray-100' : 'bg-white'
                    } shadow-sm sm:text-sm`}
                    value={dueDate}
                    onChange={tenor === 1 ? (e) => setDueDate(e.target.value) : undefined}
                    readOnly={tenor > 1}
                    required
                    min={format(new Date(), 'yyyy-MM-dd')}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Automatically calculated based on start date and tenor
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700">
                  Payment Plan
                </label>
                <div className="mt-1 p-3 bg-gray-50 rounded-md">
                  <p className="text-sm text-gray-600">
                    {tenor > 1 
                      ? `This debt will be split into ${tenor} installments of ${formatCurrency(parseFloat(amount) / tenor)}`
                      : 'This will be a single payment'}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="note" className="block text-sm font-medium text-gray-700">
                Note (Optional)
              </label>
              <textarea
                id="note"
                rows={3}
                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border border-gray-300 rounded-md p-2"
                value={note}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNote(e.target.value)}
                placeholder="Add a note about this debt"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => navigate('/')}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Adding...' : 'Add Debt'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddDebt;
