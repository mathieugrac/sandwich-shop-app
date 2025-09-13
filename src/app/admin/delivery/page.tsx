'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { supabase } from '@/lib/supabase/client';
import { AdminLayout } from '@/components/admin';
import { useRequireAuth } from '@/lib/hooks';
import {
  Clock,
  Package,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  User,
  Phone,
  Mail,
  MessageCircle,
  Euro,
  MoreHorizontal,
} from 'lucide-react';
import type { Database } from '@/types/database';

// Types
type Order = Database['public']['Tables']['orders']['Row'];
type Client = Database['public']['Tables']['clients']['Row'];
type Drop = Database['public']['Tables']['drops']['Row'];
type Location = Database['public']['Tables']['locations']['Row'];
type Product = Database['public']['Tables']['products']['Row'];

interface OrderWithDetails extends Order {
  clients?: Client;
  drops?: Drop & {
    locations?: Location;
  };
  order_products?: Array<{
    order_quantity: number;
    drop_products?: {
      selling_price: number;
      products?: Product;
    };
  }>;
}

interface PreparationItem {
  productName: string;
  totalOrders: number;
  stockQuantity: number;
  remaining: number;
}

export default function DeliveryPage() {
  const [loading, setLoading] = useState(true);
  const [activeDrop, setActiveDrop] = useState<
    (Drop & { locations?: Location }) | null
  >(null);
  const [activeOrders, setActiveOrders] = useState<OrderWithDetails[]>([]);
  const [deliveredOrders, setDeliveredOrders] = useState<OrderWithDetails[]>(
    []
  );
  const [preparationItems, setPreparationItems] = useState<PreparationItem[]>(
    []
  );
  const [showDelivered, setShowDelivered] = useState(false);
  const [updatingOrder, setUpdatingOrder] = useState<string | null>(null);
  const router = useRouter();

  useRequireAuth();

  useEffect(() => {
    loadDeliveryData();
  }, []);

  const loadDeliveryData = async () => {
    try {
      setLoading(true);

      // Get next active drop
      const { data: activeDropData, error: dropError } = await supabase
        .from('drops')
        .select(
          `
          *,
          locations (
            name,
            address,
            pickup_hour_start,
            pickup_hour_end
          )
        `
        )
        .eq('status', 'active')
        .order('date')
        .limit(1)
        .single();

      if (dropError) {
        console.error('Error loading active drop:', dropError);
        setActiveDrop(null);
        return;
      }

      setActiveDrop(activeDropData);

      // Load orders for this drop
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(
          `
          *,
          clients (
            name,
            email,
            phone
          ),
          drops (
            *,
            locations (
              name,
              address
            )
          ),
          order_products (
            order_quantity,
            drop_products (
              selling_price,
              stock_quantity,
              products (
                name,
                category
              )
            )
          )
        `
        )
        .eq('drop_id', activeDropData.id)
        .order('pickup_time');

      if (ordersError) {
        console.error('Error loading orders:', ordersError);
        return;
      }

      // Separate active and delivered orders
      const active =
        ordersData?.filter(order => order.status === 'confirmed') || [];
      const delivered =
        ordersData?.filter(order => order.status === 'delivered') || [];

      setActiveOrders(active);
      setDeliveredOrders(delivered);

      // Calculate preparation overview
      calculatePreparationOverview(activeDropData.id);
    } catch (error) {
      console.error('Error loading delivery data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculatePreparationOverview = async (dropId: string) => {
    try {
      // Get all drop products for this drop with order quantities
      const { data: dropProductsData, error } = await supabase
        .from('drop_products')
        .select(
          `
          *,
          products (
            name,
            category
          ),
          order_products (
            order_quantity,
            orders (
              status
            )
          )
        `
        )
        .eq('drop_id', dropId);

      if (error) {
        console.error('Error calculating preparation overview:', error);
        return;
      }

      const preparationMap = new Map<string, PreparationItem>();

      dropProductsData?.forEach(dropProduct => {
        const productName = dropProduct.products?.name || 'Unknown Product';

        // Calculate total active orders for this product
        const totalActiveOrders =
          dropProduct.order_products?.reduce(
            (
              sum: number,
              orderProduct: {
                order_quantity: number;
                orders?: { status: string };
              }
            ) => {
              // Only count orders that are still active
              if (orderProduct.orders?.status === 'confirmed') {
                return sum + orderProduct.order_quantity;
              }
              return sum;
            },
            0
          ) || 0;

        preparationMap.set(productName, {
          productName,
          totalOrders: totalActiveOrders,
          stockQuantity: dropProduct.stock_quantity,
          remaining: dropProduct.stock_quantity - totalActiveOrders,
        });
      });

      setPreparationItems(Array.from(preparationMap.values()));
    } catch (error) {
      console.error('Error in preparation calculation:', error);
    }
  };

  const markAsDelivered = async (orderId: string) => {
    try {
      setUpdatingOrder(orderId);

      const { error } = await supabase
        .from('orders')
        .update({ status: 'delivered' })
        .eq('id', orderId);

      if (error) {
        console.error('Error updating order status:', error);
        return;
      }

      // Reload data to reflect changes
      await loadDeliveryData();
    } catch (error) {
      console.error('Error marking order as delivered:', error);
    } finally {
      setUpdatingOrder(null);
    }
  };

  const changeOrderStatus = async (
    orderId: string,
    newStatus: 'confirmed' | 'delivered'
  ) => {
    try {
      setUpdatingOrder(orderId);

      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) {
        console.error('Error updating order status:', error);
        return;
      }

      // Reload data to reflect changes
      await loadDeliveryData();
    } catch (error) {
      console.error('Error changing order status:', error);
    } finally {
      setUpdatingOrder(null);
    }
  };

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
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
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Loading delivery interface...</p>
        </div>
      </div>
    );
  }

  if (!activeDrop) {
    return (
      <AdminLayout title="Delivery Mode" backUrl="/admin/dashboard">
        <Card>
          <CardContent className="text-center py-12">
            <Package className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Active Drop
            </h3>
            <p className="text-gray-600 mb-6">
              There are no active drops available for delivery management.
            </p>
            <Button onClick={() => router.push('/admin/drops')}>
              Manage Drops
            </Button>
          </CardContent>
        </Card>
      </AdminLayout>
    );
  }

  const getDropTitle = () => {
    return new Date(activeDrop.date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getDropDescription = () => {
    const location = activeDrop.locations?.name || 'Unknown Location';
    const hours =
      activeDrop.locations?.pickup_hour_start &&
      activeDrop.locations?.pickup_hour_end
        ? `${activeDrop.locations.pickup_hour_start} - ${activeDrop.locations.pickup_hour_end}`
        : 'Hours not set';
    return `${location} • ${hours}`;
  };

  return (
    <TooltipProvider>
      <AdminLayout
        title={getDropTitle()}
        subtitle={getDropDescription()}
        backUrl="/admin/dashboard"
      >
        {/* Preparation Overview */}
        <Card className="mb-6">
          <CardHeader className="gap-0">
            <CardTitle className="flex items-center space-x-2 mb-3">
              <Package className="w-5 h-5" />
              <span>Preparation Overview</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {preparationItems.length === 0 ? (
              <p className="text-gray-600">No items to prepare</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {preparationItems.map((item, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <h4 className="font-medium mb-2">{item.productName}</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Ordered:</span>
                        <span className="font-medium">{item.totalOrders}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Remaining Stock:</span>
                        <span
                          className={
                            item.remaining < 0 ? 'text-red-600 font-medium' : ''
                          }
                        >
                          {item.remaining}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Active Orders */}
        <Card className="mb-6">
          <CardHeader className="gap-0">
            <CardTitle className="flex items-center space-x-2 mb-3">
              <Clock className="w-5 h-5" />
              <span>Active Orders ({activeOrders.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pickup Time</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Instructions</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Order Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeOrders.map(order => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <span className="text-sm font-medium">
                        {formatTime(order.pickup_time)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{order.clients?.name}</p>
                        <p className="text-sm text-gray-600">
                          #{order.order_number}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs">
                        {getOrderItemsText(order).map((item, index) => (
                          <p key={index} className="text-sm">
                            {item}
                          </p>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      {order.special_instructions ? (
                        <Tooltip delayDuration={0}>
                          <TooltipTrigger asChild>
                            <div className="flex items-center justify-center w-8 h-8 rounded-md cursor-pointer hover:bg-gray-200 transition-colors">
                              <MessageCircle className="w-4 h-4 text-black" />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">
                              {order.special_instructions}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
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
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        onClick={() => markAsDelivered(order.id)}
                        disabled={updatingOrder === order.id}
                        className="bg-black hover:bg-gray-800"
                      >
                        {updatingOrder === order.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                        ) : (
                          'Mark as paid'
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {activeOrders.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center py-8 text-gray-500"
                    >
                      No active orders
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Delivered Orders Toggle */}
        {deliveredOrders.length > 0 && (
          <Card>
            <CardHeader className="gap-0">
              <CardTitle
                className="flex items-center justify-between cursor-pointer"
                onClick={() => setShowDelivered(!showDelivered)}
              >
                <span className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>Delivered Orders ({deliveredOrders.length})</span>
                </span>
                {showDelivered ? (
                  <ChevronUp className="w-5 h-5" />
                ) : (
                  <ChevronDown className="w-5 h-5" />
                )}
              </CardTitle>
            </CardHeader>
            {showDelivered && (
              <CardContent className="mt-3">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Pickup Time</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Instructions</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Order Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deliveredOrders.map(order => (
                      <TableRow key={order.id} className="bg-gray-50">
                        <TableCell>
                          <span className="text-sm font-medium">
                            {formatTime(order.pickup_time)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{order.clients?.name}</p>
                            <p className="text-sm text-gray-600">
                              #{order.order_number}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-xs">
                            {getOrderItemsText(order).map((item, index) => (
                              <p key={index} className="text-sm">
                                {item}
                              </p>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          {order.special_instructions ? (
                            <Tooltip delayDuration={0}>
                              <TooltipTrigger asChild>
                                <div className="flex items-center justify-center w-8 h-8 rounded-md cursor-pointer hover:bg-gray-200 transition-colors">
                                  <MessageCircle className="w-4 h-4 text-black" />
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs">
                                  {order.special_instructions}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          ) : (
                            <span className="text-gray-400 text-sm">-</span>
                          )}
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
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                disabled={updatingOrder === order.id}
                              >
                                {updatingOrder === order.id ? (
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600" />
                                ) : (
                                  <MoreHorizontal className="h-4 w-4" />
                                )}
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() =>
                                  changeOrderStatus(order.id, 'confirmed')
                                }
                                className="cursor-pointer"
                              >
                                Change status to Confirmed
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            )}
          </Card>
        )}
      </AdminLayout>
    </TooltipProvider>
  );
}
