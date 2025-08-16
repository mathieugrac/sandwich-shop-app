'use client';

import { DropWithLocation } from '@/types/database';
import { Calendar } from 'lucide-react';
import { useEffect, useState } from 'react';
import { fetchDrops } from '@/lib/api/drops';
import { Card } from '@/components/ui/card';
import { DropItem } from './DropItem';

export function UpcomingDrops() {
  const [drops, setDrops] = useState<DropWithLocation[]>([]);
  const [loading, setLoading] = useState(true);

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
    <Card className="p-3">
      <h2 className="text-2xl font-bold text-black mb-2 p-3">Upcoming Drops</h2>

      <div className="">
        {validDrops.map(drop => (
          <DropItem
            key={drop.id}
            drop={drop}
            formatDate={formatDate}
            formatPickupDeadline={formatPickupDeadline}
            getStatusColor={getStatusColor}
          />
        ))}
      </div>
    </Card>
  );
}
