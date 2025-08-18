export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export const formatTransactionDate = (date: Date | { seconds: number; nanoseconds: number } | string | undefined): string => {
  if (!date) return 'No date';
  
  try {
    let dateObj: Date;
    
    if (typeof date === 'string') {
      dateObj = new Date(date);
    } else if ('seconds' in date) {
      // Handle Firestore timestamp
      dateObj = new Date(date.seconds * 1000);
    } else if (date instanceof Date) {
      dateObj = date;
    } else {
      return 'Invalid date';
    }
    
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
};

export const formatDate = (date: Date | string): string => {
  if (typeof date === 'string') {
    date = new Date(date);
  }
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const getStartOfMonth = (): Date => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
};

export const getEndOfMonth = (): Date => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 0);
};
