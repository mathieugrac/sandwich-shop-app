'use client';

import { DropWithCalculatedFields } from '@/lib/api/drops';
import { Calendar } from 'lucide-react';
import { useEffect, useState } from 'react';
import { fetchDrops } from '@/lib/api/drops';
import { Card } from '@/components/ui/card';
import { DropItem } from './DropItem';

export function UpcomingDrops() {
  const [drops, setDrops] = useState<DropWithCalculatedFields[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFutureDrops = async () => {
      try {
        const futureDrops = await fetchDrops();
        setDrops(futureDrops);
      } catch (error) {
        console.error('Error loading future drops:', error);
      } finally {
        setLoading(false);
      }
    };

    loadFutureDrops();
  }, []);

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
    <Card className="p-3">
      <h2 className="text-2xl font-bold text-black mb-2 p-3">Upcoming Drops</h2>
      <div className="space-y-3">
        {validDrops.map(drop => (
          <DropItem key={drop.id} drop={drop} />
        ))}
      </div>
    </Card>
  );
}
