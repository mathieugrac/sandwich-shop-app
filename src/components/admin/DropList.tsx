'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Loader2,
  Edit,
  Trash2,
  Eye,
  Calendar,
  MapPin,
  Package,
} from 'lucide-react';
import { AdminDrop } from '@/lib/api/drops';
import type { Database } from '@/types/database';

type Drop = Database['public']['Tables']['drops']['Row'];

interface DropListProps {
  upcomingDrops: AdminDrop[];
  pastDrops: AdminDrop[];
  onOpenInventory: (
    drop: AdminDrop & {
      drop_products_count?: number;
      drop_products_total?: number;
    }
  ) => void;
  onOpenEdit: (
    drop: AdminDrop & {
      drop_products_count?: number;
      drop_products_total?: number;
    }
  ) => void;
  onDeleteDrop: (dropId: string) => void;
  onStatusChange: (dropId: string, newStatus: Drop['status']) => void;
  onViewOrders: (dropId: string) => void;
}

export default function DropList({
  upcomingDrops,
  pastDrops,
  onOpenInventory,
  onOpenEdit,
  onDeleteDrop,
  onStatusChange,
  onViewOrders,
}: DropListProps) {
  const getStatusBadge = (status: string | null) => {
    if (!status) return <Badge variant="secondary">Unknown</Badge>;

    switch (status) {
      case 'upcoming':
        return <Badge variant="secondary">Upcoming</Badge>;
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'completed':
        return <Badge className="bg-blue-100 text-blue-800">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'upcoming':
        return <Calendar className="h-4 w-4" />;
      case 'active':
        return <Eye className="h-4 w-4" />;
      case 'completed':
        return <Package className="h-4 w-4" />;
      case 'cancelled':
        return <Calendar className="h-4 w-4" />;
      default:
        return <Calendar className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const isToday = (dateString: string) => {
    const today = new Date().toISOString().split('T')[0];
    return dateString === today;
  };

  return (
    <>
      {/* Upcoming Drops Table (upcoming + active) */}
      <Card>
        <CardHeader>
          <CardTitle className="pb-2">Upcoming Drops</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Total Items</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {upcomingDrops.map(drop => (
                <TableRow key={drop.id}>
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <span
                        className={isToday(drop.date) ? 'font-semibold' : ''}
                      >
                        {formatDate(drop.date)}
                      </span>
                      {isToday(drop.date) && (
                        <Badge variant="outline" className="mt-1 w-fit">
                          Today
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{drop.location_name || 'No location'}</TableCell>
                  <TableCell>{getStatusBadge(drop.status)}</TableCell>
                  <TableCell>{drop.total_available || 0}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      {/* Status Management Buttons */}
                      {drop.status === 'upcoming' && (
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => onStatusChange(drop.id, 'active')}
                          className="flex items-center space-x-2"
                        >
                          <Eye className="w-4 h-4" />
                          <span>Activate</span>
                        </Button>
                      )}

                      {drop.status === 'active' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onStatusChange(drop.id, 'completed')}
                          className="flex items-center space-x-2"
                        >
                          <Package className="w-4 h-4" />
                          <span>Complete</span>
                        </Button>
                      )}

                      {/* Standard Action Buttons */}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onOpenInventory(drop)}
                      >
                        Inventory
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onOpenEdit(drop)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>

                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => onDeleteDrop(drop.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {upcomingDrops.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center py-8 text-gray-500"
                  >
                    No upcoming or active drops found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Past Drops Table (completed + cancelled) */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="pb-2">Past Drops</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Total Items</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pastDrops.map(drop => (
                <TableRow key={drop.id}>
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <span>{formatDate(drop.date)}</span>
                    </div>
                  </TableCell>
                  <TableCell>{drop.location_name || 'No location'}</TableCell>
                  <TableCell>{getStatusBadge(drop.status)}</TableCell>
                  <TableCell>{drop.total_available || 0}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      {/* Reopen Button for Completed Drops */}
                      {drop.status === 'completed' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onStatusChange(drop.id, 'active')}
                          className="flex items-center space-x-2"
                        >
                          <Eye className="w-4 h-4" />
                          <span>Reopen</span>
                        </Button>
                      )}

                      {/* View Orders Button */}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onViewOrders(drop.id)}
                        className="flex items-center space-x-2"
                      >
                        <span>View Orders</span>
                      </Button>

                      {/* Edit Button - Only for non-completed drops */}
                      {drop.status !== 'completed' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onOpenEdit(drop)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {pastDrops.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center py-8 text-gray-500"
                  >
                    No past drops found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
