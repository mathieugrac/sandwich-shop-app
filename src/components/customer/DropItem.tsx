'use client';

import { DropWithCalculatedFields } from '@/lib/api/drops';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Clock, Package } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { validateDropDeadline } from '@/lib/utils';

interface DropItemProps {
  drop: DropWithCalculatedFields;
}

export function DropItem({ drop }: DropItemProps) {
  const router = useRouter();

  // Format date internally
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      day: date.getDate(),
      month: date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
    };
  };

  // Format pickup deadline internally
  const formatPickupDeadline = (deadlineString: string | null) => {
    if (!deadlineString) return null;

    const deadline = new Date(deadlineString);
    const now = new Date();
    const diffMs = deadline.getTime() - now.getTime();

    if (diffMs <= 0) return 'Closed';

    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes}m left`;
    } else if (diffMinutes > 0) {
      return `${diffMinutes}m left`;
    } else {
      return 'Closing soon';
    }
  };

  // Get status color internally
  const getStatusColor = (status: string | null, deadline: string | null) => {
    if (!status) return 'text-gray-500';

    if (status === 'completed' || status === 'cancelled')
      return 'text-gray-500';
    if (status === 'active') {
      if (deadline && new Date(deadline) <= new Date()) {
        return 'text-red-600';
      }
      return 'text-black';
    }
    return 'text-black';
  };

  const { day, month } = formatDate(drop.date);
  const timeRemaining = formatPickupDeadline(drop.pickup_deadline);
  const statusColor = getStatusColor(drop.status, drop.pickup_deadline);

  // Use centralized deadline validation
  const deadlineValidation = validateDropDeadline(drop.pickup_deadline);

  const handlePreOrder = () => {
    if (drop.status === 'active' && deadlineValidation.isValid) {
              router.push(`/drop/${drop.id}`);
    }
  };

  const handleNotifyMe = () => {
    // TODO: Implement notification system
    console.log('Notify me clicked for drop:', drop.id);
  };

  // Defensive check: Make sure location exists
  if (!drop.location) {
    console.error('❌ Drop missing location:', drop);
    return null; // Skip rendering this drop
  }

  return (
    <div
      key={drop.id}
      className="hover:bg-gray-100/90 transition-colors duration-200 rounded-md p-3"
    >
      <div className="flex items-center justify-between">
        {/* Date and Location */}
        <div className="flex-1">
          <div className="flex items-center space-x-4">
            {/* Date Display */}
            <div className="bg-gray-300/50 rounded-md p-3 text-center min-w-[56px]">
              <div className="text-2xl text-gray-800">{day}</div>
              <div className="text-xs text-gray-500 font-medium">{month}</div>
            </div>

            {/* Location Info */}
            <div className="flex-1">
              <p className="text-md font-semibold text-black">
                {drop.location.name}, {drop.location.district}
              </p>
              {/* Status and Time Remaining */}
              <div className="flex items-center space-x-2 mt-1">
                <span className={`text-md font-normal ${statusColor}`}>
                  {drop.status === 'active'
                    ? `${drop.total_available || 0} left 🥪`
                    : 'Coming Soon'}
                </span>
                {timeRemaining && drop.status === 'active' && (
                  <span className="text-xs text-gray-500 flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>{timeRemaining}</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col items-end space-y-2">
          {drop.status === 'active' ? (
            <Button
              onClick={handlePreOrder}
              className="bg-black hover:bg-gray-800 text-white px-4 py-2 text-md"
              size="lg"
              disabled={!deadlineValidation.isValid}
            >
              {deadlineValidation.isExpired
                ? 'Closed'
                : deadlineValidation.isGracePeriod
                  ? 'Grace Period'
                  : 'Pre-Order'}
            </Button>
          ) : (
            <Button
              onClick={handleNotifyMe}
              variant="outline"
              className="px-4 py-2 text-md"
              size="lg"
            >
              Notify Me
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
