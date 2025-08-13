'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase/client';
import {
  ArrowLeft,
  Search,
  Filter,
  Eye,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  Euro,
  Calendar,
  MapPin,
} from 'lucide-react';

interface Order {
  id: string;
  order_number: string;
  pickup_time: string;
  status: 'pending' | 'confirmed' | 'prepared' | 'completed' | 'cancelled';
  total_amount: number;
  special_instructions: string | null;
  created_at: string;
  drop_id: string;
  client_id: string | null;
}

interface Drop {
  id: string;
  date: string;
  status: string;
  locations?: {
    name: string;
    address: string;
    pickup_hour_start: string;
    pickup_hour_end: string;
  };
}

interface OrderWithDrop extends Order {
  drop?: Drop;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderWithDrop[]>([]);
  const [drops, setDrops] = useState<Drop[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dropFilter, setDropFilter] = useState<string>('all');
  const router = useRouter();

  useEffect(() => {
    checkAuth();
    loadData();
  }, []);

  const checkAuth = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push('/admin');
    }
  };

  const loadData = async () => {
    try {
      console.log('🔄 Loading orders and drops...');

      // Load drops first
      const { data: dropsData, error: dropsError } = await supabase
        .from('drops')
        .select(
          `
          id,
          date,
          status,
          location:locations (
            name,
            address,
            pickup_hour_start,
            pickup_hour_end
          )
        `
        )
        .order('date', { ascending: false });

      if (dropsError) {
        console.error('❌ Error loading drops:', dropsError);
      } else {
        console.log('✅ Drops loaded:', dropsData);
        setDrops(dropsData || []);
      }

      // Load all orders
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (ordersError) {
        console.error('❌ Error loading orders:', ordersError);
      } else {
        console.log('✅ Orders loaded:', ordersData);

        // Combine orders with drop information
        const ordersWithDrops = (ordersData || []).map(order => {
          const drop = dropsData?.find(d => d.id === order.drop_id);
          return {
            ...order,
            drop: drop || undefined,
          };
        });

        setOrders(ordersWithDrops);
      }
    } catch (error) {
      console.error('❌ Unexpected error in loadData:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;

      // Reload data to reflect changes
      await loadData();
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-orange-500" />;
      case 'confirmed':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'prepared':
        return <CheckCircle className="w-4 h-4 text-blue-500" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'confirmed':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'prepared':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.order_number
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' || order.status === statusFilter;
    const matchesDrop = dropFilter === 'all' || order.drop_id === dropFilter;

    return matchesSearch && matchesStatus && matchesDrop;
  });

  const groupedOrders = filteredOrders.reduce(
    (groups, order) => {
      const dropDate = order.drop?.date || 'No Drop Date';
      if (!groups[dropDate]) {
        groups[dropDate] = [];
      }
      groups[dropDate].push(order);
      return groups;
    },
    {} as Record<string, OrderWithDrop[]>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button
              onClick={() => router.push('/admin/dashboard')}
              variant="ghost"
              size="sm"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
              <p className="text-gray-600">Track and manage customer orders</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Filter className="w-5 h-5 mr-2" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="search">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="Search orders..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="status-filter">Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="prepared">Prepared</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="drop-filter">Drop Date</Label>
                <Select value={dropFilter} onValueChange={setDropFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Drops</SelectItem>
                    {drops.map(drop => (
                      <SelectItem key={drop.id} value={drop.id}>
                        {new Date(drop.date).toLocaleDateString()} -{' '}
                        {drop.status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Orders by Drop Date */}
        {Object.entries(groupedOrders).map(([dropDate, ordersForDate]) => (
          <Card key={dropDate} className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                {dropDate === 'No Drop Date'
                  ? 'Orders Without Drop Date'
                  : `Drop Date: ${new Date(dropDate).toLocaleDateString()}`}
                {dropDate !== 'No Drop Date' &&
                  ordersForDate[0]?.drop?.locations && (
                    <div className="ml-4 flex items-center text-sm text-gray-600">
                      <MapPin className="w-4 h-4 mr-1" />
                      {ordersForDate[0].drop.locations.name} -{' '}
                      {ordersForDate[0].drop.locations.pickup_hour_start} - {ordersForDate[0].drop.locations.pickup_hour_end}
                    </div>
                  )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order #</TableHead>
                    <TableHead>Pickup Time</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ordersForDate.map(order => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">
                        {order.order_number}
                      </TableCell>
                      <TableCell>{order.pickup_time}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(order.status)}>
                          <div className="flex items-center space-x-1">
                            {getStatusIcon(order.status)}
                            <span className="capitalize">{order.status}</span>
                          </div>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Euro className="w-4 h-4 text-gray-400" />
                          <span className="font-medium">
                            {order.total_amount}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(order.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Select
                            value={order.status}
                            onValueChange={value =>
                              updateOrderStatus(order.id, value)
                            }
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="confirmed">
                                Confirmed
                              </SelectItem>
                              <SelectItem value="prepared">Prepared</SelectItem>
                              <SelectItem value="completed">
                                Completed
                              </SelectItem>
                              <SelectItem value="cancelled">
                                Cancelled
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))}

        {Object.keys(groupedOrders).length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <div className="text-gray-500">
                <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No orders found matching your filters</p>
                <p className="text-sm">
                  Try adjusting your search or filter criteria
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
