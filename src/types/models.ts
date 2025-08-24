// Base types
export type FirebaseTimestamp = { seconds: number; nanoseconds: number };
export type DateType = Date | FirebaseTimestamp;

// Transaction types
export type TransactionType = 'income' | 'expense' | 'debt';

export interface BaseTransaction {
  id?: string;
  amount: number;
  date: DateType;
  note?: string;
  userId?: string;
  createdAt?: DateType;
  updatedAt?: DateType;
  type: TransactionType;
}

export interface Income extends BaseTransaction {
  type: 'income';
  category: 'salary' | 'bonus' | 'investment' | 'other';
}

export interface Expense extends BaseTransaction {
  type: 'expense';
  category: string;
}

export interface Debt extends BaseTransaction {
  type: 'debt';
  dueDate: DateType;
  paid: boolean;
  installmentAmount?: number;
}

// UI specific types
export interface UIDebt {
  id: string;
  amount: number;
  dueDate: FirebaseTimestamp;
  note?: string;
  paid: boolean;
}

export interface UITransaction {
  id: string;
  type: TransactionType;
  amount: number;
  date: FirebaseTimestamp;
  category?: string;
  note?: string;
  paid?: boolean;
}

// Union type of all transaction types
export type Transaction = Income | Expense | Debt;
