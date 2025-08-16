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
      
      // Check status every 30 seconds to keep it updated
      const interval = setInterval(checkDropStatus, 30000);
      return () => clearInterval(interval);
    }
  }, [dropId]);

  if (isLoading) {
    return (
      <div className={`bg-blue-50 border border-blue-200 rounded-md p-3 ${className}`}>
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span className="text-blue-600 text-sm">Checking drop status...</span>
        </div>
      </div>
    );
  }

  if (error || !dropStatus) {
    return null; // Don't show banner if there's an error
  }

  // Don't show banner if drop is orderable and no special status
  if (dropStatus.orderable && !dropStatus.timeUntilDeadline) {
    return null;
  }

  const getStatusIcon = () => {
    if (!dropStatus.orderable) {
      return <AlertCircle className="w-4 h-4 text-red-600" />;
    }
    if (dropStatus.timeUntilDeadline) {
      return <Clock className="w-4 h-4 text-orange-600" />;
    }
    return <Package className="w-4 h-4 text-green-600" />;
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
    if (!dropStatus.orderable) {
      return dropStatus.reason || 'This drop is no longer accepting orders';
    }
    if (dropStatus.timeUntilDeadline) {
      return `Ordering closes in ${dropStatus.timeUntilDeadline}`;
    }
    return 'Ordering is open';
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
    <div className={`${getStatusColor()} border rounded-md p-3 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {getStatusIcon()}
          <span className="text-sm font-medium">{getStatusMessage()}</span>
        </div>
        {getActionButton()}
      </div>
    </div>
  );
}
