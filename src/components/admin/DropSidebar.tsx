'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar } from 'lucide-react';
import type { Database } from '@/types/database';

type Drop = Database['public']['Tables']['drops']['Row'];
type Location = Database['public']['Tables']['locations']['Row'];

interface DropWithLocation extends Drop {
  locations?: Location;
}

interface DropSidebarProps {
  drops: DropWithLocation[];
  selectedDropId: string | null;
  onDropSelect: (dropId: string) => void;
}

export default function DropSidebar({
  drops,
  selectedDropId,
  onDropSelect,
}: DropSidebarProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            Active
          </Badge>
        );
      case 'completed':
        return (
          <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">
            Completed
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
            Cancelled
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">
            {status}
          </Badge>
        );
    }
  };

  return (
    <Card className="h-fit">
      <CardHeader className="gap-0">
        <CardTitle className="flex items-center space-x-2">
          <Calendar className="w-5 h-5" />
          <span>Drops</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="space-y-1">
          {drops.filter(drop => drop.status !== 'upcoming').length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              No drops with analytics available
            </div>
          ) : (
            drops
              .filter(drop => drop.status !== 'upcoming')
              .map(drop => (
                <div
                  key={drop.id}
                  onClick={() => onDropSelect(drop.id)}
                  className={`p-4 cursor-pointer border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                    selectedDropId === drop.id
                      ? 'bg-blue-50 border-l-4 border-l-blue-500'
                      : ''
                  }`}
                >
                  <div className="space-y-1">
                    {/* Date and Status */}
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900">
                        {formatDate(drop.date)}
                      </span>
                      {getStatusBadge(drop.status || 'completed')}
                    </div>

                    {/* Location */}
                    <div className="text-gray-600">
                      At {drop.locations?.name || 'Unknown Location'}
                    </div>
                  </div>
                </div>
              ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
