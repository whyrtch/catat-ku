export interface UIDebt {
  id: string;
  amount: number;
  dueDate: { seconds: number; nanoseconds: number };
  note?: string;
  paid: boolean;
  // Add other debt properties as needed
}

export interface Income {
  id: string;
  amount: number;
  date: Date | { seconds: number; nanoseconds: number };
  category: 'salary' | 'bonus' | 'investment' | 'other';
  note?: string;
  // Add other income properties as needed
}

export interface Expense {
  id: string;
  amount: number;
  date: Date | { seconds: number; nanoseconds: number };
  category: string; // You might want to define specific categories
  note?: string;
  // Add other expense properties as needed
}

export interface Transaction {
  id: string;
  type: 'income' | 'expense' | 'debt';
  amount: number;
  date: Date | { seconds: number; nanoseconds: number };
  category?: string;
  note?: string;
  paid?: boolean;
}
