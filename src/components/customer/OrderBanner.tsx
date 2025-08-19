'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, Clock, Package, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { validateDropDeadline } from '@/lib/utils';

interface OrderBannerProps {
  dropId: string;
  className?: string;
}

interface DropStatus {
  orderable: boolean;
  reason?: string;
  timeUntilDeadline?: string;
  dropStatus?: string;
  drop?: {
    id: string;
    status: string;
    date: string;
    pickup_deadline: string | null;
    location: {
      name: string;
      district: string;
    };
  };
  grace_period_active?: boolean;
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

  // Don't show banner if drop is orderable and no special status
  if (
    dropStatus.orderable &&
    !dropStatus.timeUntilDeadline &&
    !dropStatus.grace_period_active
  ) {
    return null;
  }

  const getStatusIcon = () => {
    if (dropStatus.grace_period_active) {
      return (
        <svg
          className="w-5 h-5 text-orange-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      );
    }

    if (dropStatus.timeUntilDeadline) {
      return (
        <svg
          className="w-5 h-5 text-blue-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      );
    }

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
    if (!dropStatus.orderable) {
      return 'bg-red-50 border-red-200 text-red-800';
    }
    if (dropStatus.timeUntilDeadline) {
      return 'bg-orange-50 border-orange-200 text-orange-800';
    }
    return 'bg-green-50 border-green-200 text-green-800';
  };

  const getStatusMessage = () => {
    if (dropStatus.grace_period_active) {
      return (
        <div className="flex items-center space-x-2">
          <span className="text-orange-600 font-medium">
            Grace Period Active
          </span>
          <span className="text-orange-600 text-sm">
            {dropStatus.timeUntilDeadline}
          </span>
        </div>
      );
    }

    if (dropStatus.timeUntilDeadline) {
      return (
        <div className="flex items-center space-x-2">
          <span className="text-blue-600 font-medium">Order Deadline</span>
          <span className="text-blue-600 text-sm">
            {dropStatus.timeUntilDeadline} remaining
          </span>
        </div>
      );
    }

    return (
      <div className="flex items-center space-x-2">
        <span className="text-red-600 font-medium">Ordering Closed</span>
        <span className="text-blue-600 text-sm">{dropStatus.reason}</span>
      </div>
    );
  };

  // Use utility function for additional validation
  const deadlineValidation = validateDropDeadline(
    dropStatus.drop?.pickup_deadline || null
  );

  // Show warning if approaching deadline
  const showDeadlineWarning =
    deadlineValidation.isValid &&
    !deadlineValidation.isGracePeriod &&
    dropStatus.timeUntilDeadline &&
    dropStatus.timeUntilDeadline.includes('m') &&
    !dropStatus.timeUntilDeadline.includes('h');

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
      className={`border rounded-md p-3 ${className} ${
        dropStatus.grace_period_active
          ? 'bg-orange-50 border-orange-200'
          : dropStatus.timeUntilDeadline
            ? 'bg-blue-50 border-blue-200'
            : 'bg-red-50 border-red-200'
      }`}
    >
      <div className="flex items-center space-x-2">
        {getStatusIcon()}
        <div className="flex-1">
          {getStatusMessage()}
          {showDeadlineWarning && (
            <div className="text-orange-600 text-xs mt-1">
              ⚠️ Ordering closes soon!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
