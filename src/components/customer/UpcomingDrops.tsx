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

  // Filter out drops that don't have location data and only show upcoming/active
  const validDrops = Array.isArray(drops)
    ? drops.filter(
        drop =>
          drop.location &&
          (drop.status === 'upcoming' || drop.status === 'active')
      )
    : [];

  return (
    <Card className="p-3">
      <h2 className="text-2xl font-bold text-black mb-2 p-3">Upcoming Drops</h2>
      {validDrops.length === 0 ? (
        <div className="p-3">
          <p className="text-gray-600">
            Next drop coming soon. Check back here to pre-order.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {validDrops.map(drop => (
            <DropItem key={drop.id} drop={drop} />
          ))}
        </div>
      )}
    </Card>
  );
}
