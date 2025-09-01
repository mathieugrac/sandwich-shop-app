'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { Calendar, Euro, Users, TrendingUp } from 'lucide-react';
import type { Database } from '@/types/database';

// Types
type Drop = Database['public']['Tables']['drops']['Row'];
type Location = Database['public']['Tables']['locations']['Row'];
type Order = Database['public']['Tables']['orders']['Row'];
type Client = Database['public']['Tables']['clients']['Row'];

interface DropWithLocation extends Drop {
  locations?: Location;
}

interface OrderWithDetails extends Order {
  clients?: Client;
  order_products?: Array<{
    order_quantity: number;
    drop_products?: {
      selling_price: number;
      products?: {
        name: string;
        category: string;
      };
    };
  }>;
}

interface DropAnalyticsData {
  drop: DropWithLocation;
  orders: OrderWithDetails[];
  totalRevenue: number;
  totalOrders: number;
  completionRate: number;
}

interface DropAnalyticsProps {
  data: DropAnalyticsData;
  loading: boolean;
}

export default function DropAnalytics({ data, loading }: DropAnalyticsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
            Active
          </Badge>
        );
      case 'delivered':
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            Delivered
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

  const getOrderItems = (order: OrderWithDetails) => {
    return (
      order.order_products?.map(op => ({
        name: op.drop_products?.products?.name || 'Unknown',
        quantity: op.order_quantity,
        price: op.drop_products?.selling_price || 0,
      })) || []
    );
  };

  const getOrderItemsText = (order: OrderWithDetails) => {
    const items = getOrderItems(order);
    return items.map(item => `${item.quantity}x ${item.name}`);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-8">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              <div className="grid grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-16 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Drop Overview */}
      <Card>
        <CardHeader className="gap-0">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">
                {formatDate(data.drop.date)}
              </CardTitle>
              <div className="text-gray-600 mb-3">
                <span>
                  {data.drop.locations?.name || 'Unknown Location'}
                  {data.drop.locations?.district &&
                    `, ${data.drop.locations.district}`}
                </span>
              </div>
            </div>
            <Badge
              className={`${
                data.drop.status === 'active'
                  ? 'bg-green-100 text-green-800'
                  : data.drop.status === 'completed'
                    ? 'bg-gray-100 text-gray-800'
                    : data.drop.status === 'upcoming'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-red-100 text-red-800'
              }`}
            >
              {data.drop.status?.charAt(0).toUpperCase() +
                (data.drop.status?.slice(1) || '')}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {/* Statistics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Euro className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-gray-600">
                  Revenue
                </span>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(data.totalRevenue)}
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Users className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-gray-600">
                  Total Orders
                </span>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {data.totalOrders}
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <TrendingUp className="w-5 h-5 text-purple-600" />
                <span className="text-sm font-medium text-gray-600">
                  Completion Rate
                </span>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {data.completionRate.toFixed(1)}%
              </p>
            </div>
          </div>

          {/* Drop Notes */}
          {data.drop.notes && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Drop Notes</h4>
              <p className="text-blue-800 text-sm">{data.drop.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader className="gap-0">
          <CardTitle className="flex items-center space-x-2">
            <Users className="w-5 h-5" />
            <span>Orders ({data.orders.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Order Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.orders.map(order => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <div className="min-w-0">
                        <p className="font-medium truncate">
                          {order.clients?.name}
                        </p>
                        <p className="text-sm text-gray-600 truncate">
                          #{order.order_number}
                        </p>
                        {order.clients?.phone && (
                          <p className="text-sm text-gray-600 truncate">
                            {order.clients.phone}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(order.status || 'active')}
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs min-w-0">
                        {getOrderItemsText(order).map((item, index) => (
                          <p key={index} className="text-sm truncate">
                            {item}
                          </p>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">
                        {formatCurrency(order.total_amount)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600">
                        {formatDateTime(order.created_at || '')}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
                {data.orders.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center py-8 text-gray-500"
                    >
                      No orders for this drop
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
