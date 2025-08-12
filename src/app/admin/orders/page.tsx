'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

import { supabase } from '@/lib/supabase/client';
import {
  ArrowLeft,
  Clock,
  CheckCircle,
  AlertCircle,
  ShoppingCart,
  User,
  Phone,
  Mail,
  Calendar,
  Loader2,
} from 'lucide-react';

interface OrderItem {
  id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  products: {
    name: string;
    description: string;
  };
}

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  pickup_time: string;
  pickup_date: string;
  sell_id: string;
  status: 'pending' | 'confirmed' | 'ready' | 'completed' | 'cancelled';
  total_amount: number;
  special_instructions: string;
  created_at: string;
  order_items: OrderItem[];
}

function OrderManagementContent() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('pending');
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    checkAuth();
    loadOrders();
  }, []);

  useEffect(() => {
    const statusFromUrl = searchParams.get('status');
    if (
      statusFromUrl &&
      ['pending', 'confirmed', 'ready', 'completed', 'all'].includes(
        statusFromUrl
      )
    ) {
      setSelectedStatus(statusFromUrl);
    }
  }, [searchParams]);

  const checkAuth = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push('/admin');
    }
  };

  const loadOrders = async () => {
    try {
      // Get the next active sell
      const { data: nextSell } = await supabase.rpc('get_next_active_sell');

      if (!nextSell || nextSell.length === 0) {
        setOrders([]);
        return;
      }

      const activeSell = nextSell[0];

      // Load orders for the active sell
      const { data: ordersData } = await supabase
        .from('orders')
        .select(
          `
          *,
          order_items (
            *,
            products (
              name,
              description
            )
          )
        `
        )
        .eq('sell_id', activeSell.id)
        .order('created_at', { ascending: true });

      setOrders(ordersData || []);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    setUpdating(orderId);
    try {
      // Get the order details first
      const order = orders.find(o => o.id === orderId);
      if (!order) {
        throw new Error('Order not found');
      }

      // Update order status using the new API endpoint
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update order status');
      }

      // If confirming an order, update inventory
      if (newStatus === 'confirmed' && order.status === 'pending') {
        console.log('Confirming order, updating inventory...');

        // Update inventory for each item in the order
        for (const item of order.order_items) {
          try {
            // Call the reserve_sell_inventory function
            const { data, error } = await supabase.rpc(
              'reserve_sell_inventory',
              {
                p_sell_id: order.sell_id, // Assuming sell_id is available
                p_product_id: item.product_id,
                p_quantity: item.quantity,
              }
            );

            if (error) {
              console.error('Error reserving inventory:', error);
            } else {
              console.log('Inventory reserved successfully:', data);
            }
          } catch (error) {
            console.error('Error reserving inventory for item:', error);
          }
        }
      }

      // Update local state
      setOrders(
        orders.map(order =>
          order.id === orderId
            ? { ...order, status: newStatus as Order['status'] }
            : order
        )
      );
    } catch (error) {
      console.error('Error updating order status:', error);
    } finally {
      setUpdating(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-orange-100 text-orange-800">Pending</Badge>;
      case 'confirmed':
        return (
          <Badge className="bg-yellow-100 text-yellow-800">Confirmed</Badge>
        );
      case 'ready':
        return <Badge className="bg-green-100 text-green-800">Ready</Badge>;
      case 'completed':
        return <Badge className="bg-gray-100 text-gray-800">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'confirmed':
        return <AlertCircle className="h-4 w-4" />;
      case 'ready':
        return <CheckCircle className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'cancelled':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const formatTime = (time: string) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const filteredOrders =
    selectedStatus === 'all'
      ? orders
      : orders.filter(order => order.status === selectedStatus);

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
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 px-4 py-3 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/admin/dashboard')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <h1 className="text-xl font-semibold">
              Order Management - Next Active Sell
            </h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card
            className={`cursor-pointer transition-colors hover:bg-gray-50 ${
              selectedStatus === 'pending'
                ? 'ring-2 ring-orange-400 bg-orange-50'
                : ''
            }`}
            onClick={() => setSelectedStatus('pending')}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {orders.filter(o => o.status === 'pending').length}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-orange-400" />
              </div>
            </CardContent>
          </Card>
          <Card
            className={`cursor-pointer transition-colors hover:bg-gray-50 ${
              selectedStatus === 'confirmed'
                ? 'ring-2 ring-yellow-400 bg-yellow-50'
                : ''
            }`}
            onClick={() => setSelectedStatus('confirmed')}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Confirmed</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {orders.filter(o => o.status === 'confirmed').length}
                  </p>
                </div>
                <AlertCircle className="h-8 w-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>
          <Card
            className={`cursor-pointer transition-colors hover:bg-gray-50 ${
              selectedStatus === 'ready'
                ? 'ring-2 ring-green-400 bg-green-50'
                : ''
            }`}
            onClick={() => setSelectedStatus('ready')}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Ready</p>
                  <p className="text-2xl font-bold text-green-600">
                    {orders.filter(o => o.status === 'ready').length}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
          <Card
            className={`cursor-pointer transition-colors hover:bg-gray-50 ${
              selectedStatus === 'completed'
                ? 'ring-2 ring-gray-400 bg-gray-50'
                : ''
            }`}
            onClick={() => setSelectedStatus('completed')}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-gray-600">
                    {orders.filter(o => o.status === 'completed').length}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No orders found
              </h3>
              <p className="text-gray-500">
                {selectedStatus === 'all'
                  ? 'No orders for the next active sell yet.'
                  : `No ${selectedStatus} orders found for the next active sell.`}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map(order => (
              <Card
                key={order.id}
                className="hover:shadow-md transition-shadow"
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(order.status)}
                      <div>
                        <CardTitle className="text-lg">
                          Order #{order.order_number}
                        </CardTitle>
                        <CardDescription>
                          {new Date(order.created_at).toLocaleString()}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(order.status)}
                      <div className="text-right">
                        <div className="font-semibold">
                          €{order.total_amount.toFixed(2)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {order.order_items.length} items
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Customer Info */}
                    <div>
                      <h4 className="font-medium mb-3 flex items-center">
                        <User className="h-4 w-4 mr-2" />
                        Customer Information
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-2 text-gray-400" />
                          <span>{order.customer_name}</span>
                        </div>
                        <div className="flex items-center">
                          <Mail className="h-4 w-4 mr-2 text-gray-400" />
                          <span>{order.customer_email}</span>
                        </div>
                        {order.customer_phone && (
                          <div className="flex items-center">
                            <Phone className="h-4 w-4 mr-2 text-gray-400" />
                            <span>{order.customer_phone}</span>
                          </div>
                        )}
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                          <span>Pickup: {formatTime(order.pickup_time)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Order Items */}
                    <div>
                      <h4 className="font-medium mb-3 flex items-center">
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        Order Items
                      </h4>
                      <div className="space-y-2">
                        {order.order_items.map(item => (
                          <div
                            key={item.id}
                            className="flex justify-between text-sm"
                          >
                            <span>
                              {item.quantity}x {item.products.name}
                            </span>
                            <span>
                              €{(item.quantity * item.unit_price).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                      {order.special_instructions && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <h5 className="font-medium text-sm mb-1">
                            Special Instructions:
                          </h5>
                          <p className="text-sm text-gray-600">
                            {order.special_instructions}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Status Update */}
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        Update Status:
                      </span>
                      <div className="flex space-x-2">
                        {['pending', 'confirmed', 'ready', 'completed'].map(
                          status => (
                            <Button
                              key={status}
                              variant={
                                order.status === status ? 'default' : 'outline'
                              }
                              size="sm"
                              onClick={() =>
                                updateOrderStatus(order.id, status)
                              }
                              disabled={updating === order.id}
                            >
                              {updating === order.id &&
                              order.status === status ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                status.charAt(0).toUpperCase() + status.slice(1)
                              )}
                            </Button>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function OrderManagementPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Loading orders...</p>
        </div>
      </div>
    }>
      <OrderManagementContent />
    </Suspense>
  );
}
