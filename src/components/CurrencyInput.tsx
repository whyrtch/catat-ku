import React, { ChangeEvent } from 'react';

interface CurrencyInputProps {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  placeholder?: string;
  className?: string;
}

export const CurrencyInput: React.FC<CurrencyInputProps> = ({
  value,
  onChange,
  id,
  placeholder = '0',
  className = '',
}) => {
  // Get currency configuration from environment variables with defaults
  const currencySymbol = import.meta.env.VITE_CURRENCY_SYMBOL || 'Rp';
  const currencyLocale = import.meta.env.VITE_CURRENCY_LOCALE || 'id-ID';

  const formatCurrency = (value: string): string => {
    // Remove all non-digit characters
    const numericValue = value.replace(/\D/g, '');
    if (!numericValue) return '';
    
    // Format as number without currency symbol (we'll add it manually)
    return new Intl.NumberFormat(currencyLocale, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Number(numericValue));
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    // Remove all non-digit characters and update the parent component
    const numericValue = inputValue.replace(/\D/g, '');
    onChange(numericValue);
  };

  // Format the display value (without symbol)
  const displayValue = formatCurrency(value);

  return (
    <div className="relative rounded-md shadow-sm">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <span className="text-gray-500 sm:text-sm">{currencySymbol}</span>
      </div>
      <input
        type="text"
        id={id}
        className={`${className} focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 pr-12 sm:text-sm border-gray-300 rounded-md h-10`}
        placeholder={placeholder}
        value={displayValue}
        onChange={handleChange}
        onFocus={(e) => {
          // Select all text on focus for easier editing
          e.target.select();
        }}
      />
    </div>
  );
};

export default CurrencyInput;
