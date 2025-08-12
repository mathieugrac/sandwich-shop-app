'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Clock } from 'lucide-react';
import { fetchFutureSells } from '@/lib/api/sells';
import { SellWithLocation } from '@/types/database';
import { useRouter } from 'next/navigation';

interface SellWithInventory extends SellWithLocation {
  total_available: number;
}

export function UpcomingDrops() {
  const [sells, setSells] = useState<SellWithInventory[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const loadFutureSells = async () => {
      try {
        console.log('🔄 UpcomingDrops: Starting to load future sells...');
        const futureSells = await fetchFutureSells();
        console.log('✅ UpcomingDrops: Future sells loaded:', futureSells);
        setSells(futureSells);
      } catch (error) {
        console.error('❌ UpcomingDrops: Error loading future sells:', error);
      } finally {
        console.log('🏁 UpcomingDrops: Setting loading to false');
        setLoading(false);
      }
    };

    loadFutureSells();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      day: date.getDate(),
      month: date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
    };
  };

  const handlePreOrder = (sell: SellWithInventory) => {
    if (sell.status === 'active') {
      router.push(`/menu/${sell.id}`);
    }
  };

  const handleNotifyMe = (sell: SellWithInventory) => {
    // TODO: Implement notification system
    console.log('Notify me clicked for sell:', sell.id);
  };

  console.log(
    '🔄 UpcomingDrops: Render state - loading:',
    loading,
    'sells count:',
    sells.length
  );

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
        <p className="text-gray-600">Loading upcoming drops...</p>
      </div>
    );
  }

  if (sells.length === 0) {
    return (
      <div className="text-center py-8">
        <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No upcoming drops
        </h3>
        <p className="text-gray-600">
          Check back later for new sandwich drops!
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
        {sells.map(sell => {
          const { day, month } = formatDate(sell.sell_date);
          const isActive = sell.status === 'active';
          const isDraft = sell.status === 'draft';

          return (
            <Card key={sell.id} className="bg-gray-50 border-0">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  {/* Date and Location */}
                  <div className="flex items-center space-x-4">
                    {/* Date Box */}
                    <div className="bg-gray-200 rounded-lg p-3 text-center min-w-[60px]">
                      <div className="text-2xl font-bold text-black">{day}</div>
                      <div className="text-sm text-black">{month}</div>
                    </div>

                    {/* Location Info */}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <MapPin className="w-4 h-4 text-gray-600" />
                        <h3 className="font-bold text-black">
                          {sell.location.name}
                        </h3>
                      </div>
                      <p className="text-sm text-gray-600">
                        {sell.location.district}
                      </p>

                      {/* Available Quantity or Status */}
                      {isActive ? (
                        <div className="flex items-center space-x-2 mt-2">
                          <span className="text-sm text-black">
                            {sell.total_available} left 🥪
                          </span>
                        </div>
                      ) : isDraft ? (
                        <div className="flex items-center space-x-2 mt-2">
                          <Clock className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-500">
                            Coming soon..
                          </span>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="flex-shrink-0">
                    {isActive ? (
                      <Button
                        onClick={() => handlePreOrder(sell)}
                        className="bg-black text-white hover:bg-gray-800 px-6 py-2 rounded-lg"
                      >
                        Pre-Order
                      </Button>
                    ) : isDraft ? (
                      <Button
                        onClick={() => handleNotifyMe(sell)}
                        variant="outline"
                        className="border-black text-black hover:bg-gray-100 px-6 py-2 rounded-lg"
                      >
                        Notify Me
                      </Button>
                    ) : (
                      <Badge variant="secondary" className="px-3 py-1">
                        {sell.status}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Delivery Timeframe */}
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span>Delivery: {sell.location.delivery_timeframe}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
