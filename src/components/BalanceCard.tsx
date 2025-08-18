import { Card, CardBody, CardHeader } from '@heroui/card';
import { formatCurrency } from '../utils/format';

interface BalanceCardProps {
  balance: number;
  totalDebt: number;
  debtToIncomeRatio: number;
  loading?: boolean;
}

export const BalanceCard = ({
  balance,
  totalDebt,
  debtToIncomeRatio,
  loading = false,
}: BalanceCardProps) => {
  const getStatusColor = (ratio: number) => {
    if (totalDebt === 0 && balance > 0) return 'text-green-600';
    if (ratio > 50) return 'text-red-600';
    if (ratio > 30) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getStatusText = (ratio: number) => {
    if (totalDebt === 0 && balance > 0) return 'Healthy';
    if (ratio > 50) return 'Critical';
    if (ratio > 30) return 'Warning';
    return 'Healthy';
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardBody>
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <h2 className="text-xl font-bold">Financial Overview</h2>
      </CardHeader>
      <CardBody className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">
              {balance >= 0 ? 'Current Balance' : 'Debt'}
            </p>
            <p className={`text-2xl font-bold ${balance < 0 ? 'text-red-600' : ''}`}>
              {balance >= 0 ? formatCurrency(balance) : formatCurrency(Math.abs(balance))}
            </p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">Total Debt</p>
            <p className={`text-2xl font-bold ${totalDebt > 0 ? 'text-red-600' : ''}`}>
              {formatCurrency(totalDebt)}
            </p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">Debt-to-Income</p>
            <div className="flex items-center justify-between">
              <p className={`text-2xl font-bold ${debtToIncomeRatio > 0 && getStatusColor(debtToIncomeRatio).includes('red') ? 'text-red-600' : ''}`}>
                {debtToIncomeRatio}%
              </p>
              {debtToIncomeRatio > 0 && (
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                    debtToIncomeRatio
                  )} bg-opacity-20`}
                >
                  {getStatusText(debtToIncomeRatio)}
                </span>
              )}
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
};

export default BalanceCard;
