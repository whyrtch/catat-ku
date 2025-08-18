import { addMonths } from 'date-fns';
import { addTransaction, type Debt } from './firebaseConfig';

interface DebtInstallment {
  amount: number;
  dueDate: Date;
  note: string;
  installmentNumber: number;
  totalInstallments: number;
  startDate: Date;
  paid: boolean;
  tenor: number;
  date: Date;
  category: string;
  userId: string;
}

export const calculateInstallments = (
  totalAmount: number,
  tenor: number,
  startDate: Date,
  baseNote: string
): DebtInstallment[] => {
  if (tenor < 1) {
    throw new Error('Tenor must be at least 1');
  }

  const installmentAmount = Math.floor(totalAmount / tenor * 100) / 100;
  const lastInstallment = totalAmount - (installmentAmount * (tenor - 1));

  return Array.from({ length: tenor }, (_, index) => {
    const isLast = index === tenor - 1;
    const amount = isLast ? lastInstallment : installmentAmount;
    const dueDate = addMonths(new Date(startDate), index);
    const note = tenor > 1 
      ? `${baseNote}, ${index + 1}/${tenor}` 
      : baseNote;

    return {
      amount,
      dueDate,
      note,
      installmentNumber: index + 1,
      totalInstallments: tenor,
      startDate: new Date(startDate),
      paid: false,
      tenor,
      date: new Date(),
      category: 'debt',
      userId: '' // This should be set by the caller
    };
  });
};

export const addDebtWithTenor = async (
  userId: string,
  totalAmount: number,
  tenor: number,
  startDate: Date,
  baseNote: string
): Promise<string[]> => {
  const installments = calculateInstallments(totalAmount, tenor, startDate, baseNote);
  const debtIds: string[] = [];

  for (const installment of installments) {
    // Create a debt object that matches the Debt interface
    const debtData: Omit<Debt, 'id'> = {
      type: 'debt',
      amount: installment.amount,
      dueDate: installment.dueDate,
      note: installment.note,
      paid: false,
      date: new Date(), // Current date for the transaction
      category: 'debt',
      userId: userId,
      installmentAmount: installment.amount
    };

    const debtId = await addTransaction<Omit<Debt, 'id'>>(userId, 'debts', debtData);
    debtIds.push(debtId);
  }

  return debtIds;
};

