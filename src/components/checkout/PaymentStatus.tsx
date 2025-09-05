'use client';

import { CheckCircle, XCircle, Clock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export type PaymentStatus = 'processing' | 'succeeded' | 'failed' | 'cancelled';

interface PaymentStatusProps {
  status: PaymentStatus;
  message?: string;
  orderNumber?: string;
  onRetry?: () => void;
  onContinue?: () => void;
}

export function PaymentStatus({
  status,
  message,
  orderNumber,
  onRetry,
  onContinue,
}: PaymentStatusProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'processing':
        return {
          icon: <Clock className="w-12 h-12 text-blue-500" />,
          title: 'Processing Payment',
          description:
            message || 'Please wait while we process your payment...',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          textColor: 'text-blue-800',
        };
      case 'succeeded':
        return {
          icon: <CheckCircle className="w-12 h-12 text-green-500" />,
          title: 'Payment Successful!',
          description:
            message || 'Your order has been confirmed and is being prepared.',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          textColor: 'text-green-800',
        };
      case 'failed':
        return {
          icon: <XCircle className="w-12 h-12 text-red-500" />,
          title: 'Payment Failed',
          description:
            message || 'Your payment could not be processed. Please try again.',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          textColor: 'text-red-800',
        };
      case 'cancelled':
        return {
          icon: <XCircle className="w-12 h-12 text-gray-500" />,
          title: 'Payment Cancelled',
          description:
            message ||
            'Your payment was cancelled. Your cart has been preserved.',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          textColor: 'text-gray-800',
        };
      default:
        return {
          icon: <Clock className="w-12 h-12 text-gray-500" />,
          title: 'Processing',
          description: 'Please wait...',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          textColor: 'text-gray-800',
        };
    }
  };

  const config = getStatusConfig();

  return (
    <Card className={`p-8 shadow-none ${config.bgColor} ${config.borderColor}`}>
      <div className="flex flex-col items-center text-center space-y-6">
        {config.icon}

        <div className="space-y-2">
          <h2 className={`text-2xl font-semibold ${config.textColor}`}>
            {config.title}
          </h2>
          <p className={`text-lg ${config.textColor}`}>{config.description}</p>

          {orderNumber && status === 'succeeded' && (
            <div className="mt-4 p-3 bg-white rounded-lg border">
              <p className="text-sm text-gray-600">Order Number</p>
              <p className="text-xl font-mono font-semibold">{orderNumber}</p>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex space-x-3">
          {status === 'failed' && onRetry && (
            <Button
              onClick={onRetry}
              className="bg-black text-white hover:bg-gray-800"
            >
              Try Again
            </Button>
          )}

          {(status === 'succeeded' || status === 'cancelled') && onContinue && (
            <Button
              onClick={onContinue}
              className="bg-black text-white hover:bg-gray-800"
            >
              {status === 'succeeded' ? 'View Order' : 'Continue Shopping'}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
