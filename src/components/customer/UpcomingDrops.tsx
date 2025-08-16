'use client';

import { DropWithLocation } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Package, Clock, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { fetchDrops } from '@/lib/api/drops';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function UpcomingDrops() {
  const [drops, setDrops] = useState<DropWithLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const loadFutureDrops = async () => {
      try {
        console.log('🔄 UpcomingDrops: Starting to load future drops...');
        const futureDrops = await fetchDrops();
        console.log('✅ UpcomingDrops: Future drops loaded:', futureDrops);
        setDrops(futureDrops);
      } catch (error) {
        console.error('❌ UpcomingDrops: Error loading future drops:', error);
      } finally {
        console.log('🏁 UpcomingDrops: Setting loading to false');
        setLoading(false);
      }
    };

    loadFutureDrops();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      day: date.getDate(),
      month: date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
    };
  };

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

  const getStatusColor = (status: string, deadline: string | null) => {
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

  const getStatusIcon = (status: string, deadline: string | null) => {
    if (status === 'completed' || status === 'cancelled')
      return <Calendar className="w-4 h-4" />;
    if (status === 'active') {
      if (deadline && new Date(deadline) <= new Date()) {
        return <AlertCircle className="w-4 h-4" />;
      }
      return <Package className="w-4 h-4" />;
    }
    return <Clock className="w-4 h-4" />;
  };

  const handlePreOrder = (drop: DropWithLocation) => {
    if (drop.status === 'active') {
      router.push(`/menu/${drop.id}`);
    }
  };

  const handleNotifyMe = (drop: DropWithLocation) => {
    // TODO: Implement notification system
    console.log('Notify me clicked for drop:', drop.id);
  };

  console.log(
    '🔄 UpcomingDrops: Render state - loading:',
    loading,
    'drops count:',
    drops.length,
    'drops data:',
    drops
  );

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
        <p className="text-gray-600">Loading upcoming drops...</p>
      </div>
    );
  }

  // Defensive check: Make sure drops is an array and has data
  if (!Array.isArray(drops) || drops.length === 0) {
    return (
      <div className="text-center py-8">
        <Calendar className="w-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No upcoming drops
        </h3>
        <p className="text-gray-600">
          Check back later for new sandwich drops!
        </p>
      </div>
    );
  }

  // Filter out drops that don't have location data and only show upcoming/active
  const validDrops = drops.filter(
    drop =>
      drop.location && (drop.status === 'upcoming' || drop.status === 'active')
  );

  if (validDrops.length === 0) {
    return (
      <div className="text-center py-8">
        <Calendar className="w-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No valid drops found
        </h3>
        <p className="text-gray-600">
          Some drops may be missing location information.
        </p>
      </div>
    );
  }

  return (
    <section className="py-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-black mb-2">Upcoming Drops</h2>
      </div>

      <div className="space-y-4">
        {validDrops.map(drop => {
          const { day, month } = formatDate(drop.date);
          const isActive = drop.status === 'active';
          const isUpcoming = drop.status === 'upcoming';
          const timeRemaining = formatPickupDeadline(drop.pickup_deadline);
          const statusColor = getStatusColor(drop.status, drop.pickup_deadline);
          const statusIcon = getStatusIcon(drop.status, drop.pickup_deadline);

          // Debug: Log the drop data to see what's actually being returned
          console.log('🔍 Drop data:', drop);
          console.log('🔍 Drop location:', drop.location);

          // Defensive check: Make sure location exists
          if (!drop.location) {
            console.error('❌ Drop missing location:', drop);
            return null; // Skip rendering this drop
          }

          return (
            <div key={drop.id} className="bg-gray-100 border-0 rounded-md">
              <div className="p-4">
                <div className="flex items-center justify-between">
                  {/* Date and Location */}
                  <div className="flex-1">
                    <div className="flex items-center space-x-4">
                      {/* Date Display */}
                      <div className="bg-gray-200 rounded-md p-3 text-center min-w-[56px]">
                        <div className="text-2xl text-gray-800">{day}</div>
                        <div className="text-xs text-gray-500 font-medium">
                          {month}
                        </div>
                      </div>

                      {/* Location Info */}
                      <div className="flex-1">
                        <p className="text-md font-semibold text-black">
                          {drop.location.name}, {drop.location.district}
                        </p>
                        {/* Status and Time Remaining */}
                        <div className="flex items-center space-x-2 mt-1">
                          <span
                            className={`text-md font-normal ${statusColor}`}
                          >
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
                        onClick={() => handlePreOrder(drop)}
                        className="bg-black hover:bg-gray-800 text-white px-4 py-2 text-md"
                        size="lg"
                        disabled={
                          !!(
                            drop.pickup_deadline &&
                            new Date(drop.pickup_deadline) <= new Date()
                          )
                        }
                      >
                        {drop.pickup_deadline &&
                        new Date(drop.pickup_deadline) <= new Date()
                          ? 'Closed'
                          : 'Pre-Order'}
                      </Button>
                    ) : drop.status === 'upcoming' ? (
                      <Button
                        onClick={() => handleNotifyMe(drop)}
                        variant="outline"
                        className="px-4 py-2 text-sm"
                      >
                        Notify Me
                      </Button>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
