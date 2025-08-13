'use client';

import { DropWithLocation } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Package } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { fetchDrops } from '@/lib/api/drops';

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

  // Filter out drops that don't have location data
  const validDrops = drops.filter(drop => drop.location);

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
        <p className="text-gray-600">
          Pre-order your favorite sandwiches for upcoming events
        </p>
      </div>

      <div className="space-y-4">
        {validDrops.map(drop => {
          const { day, month } = formatDate(drop.date);
          const isActive = drop.status === 'active';
          const isUpcoming = drop.status === 'upcoming';

          // Debug: Log the drop data to see what's actually being returned
          console.log('🔍 Drop data:', drop);
          console.log('🔍 Drop location:', drop.location);

          // Defensive check: Make sure location exists
          if (!drop.location) {
            console.error('❌ Drop missing location:', drop);
            return null; // Skip rendering this drop
          }

          return (
            <div key={drop.id} className="bg-gray-50 border-0">
              <div className="p-4">
                <div className="flex items-center justify-between">
                  {/* Date and Location */}
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span className="font-medium">
                        {new Date(drop.date).toLocaleDateString('en-US', {
                          weekday: 'long',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 mt-1">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">
                        {drop.location.name}
                      </span>
                      {drop.location.district && (
                        <span className="text-xs text-gray-500">
                          ({drop.location.district})
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col items-end space-y-2">
                    {drop.status === 'active' ? (
                      <Button
                        onClick={() => handlePreOrder(drop)}
                        className="bg-black hover:bg-gray-800 text-white px-4 py-2 text-sm"
                      >
                        Order Now
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

                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Package className="w-4 h-4" />
                    <span>
                      Pickup: {drop.location.pickup_hour_start} -{' '}
                      {drop.location.pickup_hour_end}
                    </span>
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
