interface Debt {
  id: string;
  amount: number;
  dueDate: { seconds: number; nanoseconds: number } | Date;
  paid: boolean;
  note?: string;
  installmentAmount?: number;
}

/**
 * Transforms Firestore document data to ensure it has the correct types
 * and required fields for the UI components.
 */
export function transformDebt(docData: any): Debt {
  const dueDate = docData.dueDate?.toDate 
    ? docData.dueDate.toDate() 
    : docData.dueDate || new Date();
    
  return {
    id: docData.id || '',
    amount: docData.amount || 0,
    dueDate,
    paid: Boolean(docData.paid),
    note: docData.note || '',
    ...(docData.installmentAmount && { installmentAmount: docData.installmentAmount })
  };
}

/**
 * Transforms an array of Firestore documents to the format expected by the UI.
 */
export function transformDebts(docs: Array<Debt>): Debt[] {
  return docs.map(doc => transformDebt(doc));
}
