'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, Clock, Package, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

interface OrderBannerProps {
  dropId: string;
  className?: string;
}

interface DropStatus {
  orderable: boolean;
  reason?: string;
  dropStatus?: string;
  drop?: {
    id: string;
    status: string;
    date: string;
    location: {
      name: string;
      district: string;
    };
  };
}

export function OrderBanner({ dropId, className = '' }: OrderBannerProps) {
  const [dropStatus, setDropStatus] = useState<DropStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const checkDropStatus = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/drops/${dropId}/orderable`);

        if (!response.ok) {
          throw new Error('Failed to check drop status');
        }

        const data = await response.json();
        setDropStatus(data);
        setError(null);
      } catch (err) {
        console.error('Error checking drop status:', err);
        setError('Failed to check drop status');
      } finally {
        setIsLoading(false);
      }
    };

    if (dropId) {
      checkDropStatus();

      // Check status every 2 minutes to reduce real-time checks
      const interval = setInterval(checkDropStatus, 120000);
      return () => clearInterval(interval);
    }
  }, [dropId]);

  if (isLoading) {
    return null; // Don't show anything while loading - eliminates the flash
  }

  if (error || !dropStatus) {
    return null; // Don't show banner if there's an error
  }

  // Don't show banner if drop is orderable
  if (dropStatus.orderable) {
    return null;
  }

  const getStatusIcon = () => {
    return (
      <svg
        className="w-5 h-5 text-red-600"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
    );
  };

  const getStatusColor = () => {
    return 'bg-red-50 border-red-200 text-red-800';
  };

  const getStatusMessage = () => {
    return (
      <div className="flex items-center space-x-2">
        <span className="text-red-600 font-medium">Ordering Closed</span>
        <span className="text-blue-600 text-sm">{dropStatus.reason}</span>
      </div>
    );
  };

  const getActionButton = () => {
    if (!dropStatus.orderable) {
      return (
        <Button
          onClick={() => router.push('/')}
          variant="outline"
          size="sm"
          className="ml-3"
        >
          View Other Drops
        </Button>
      );
    }
    return null;
  };

  return (
    <div
      className={`border rounded-md p-3 ${className} bg-red-50 border-red-200`}
    >
      <div className="flex items-center space-x-2">
        {getStatusIcon()}
        <div className="flex-1">{getStatusMessage()}</div>
      </div>
    </div>
  );
}
