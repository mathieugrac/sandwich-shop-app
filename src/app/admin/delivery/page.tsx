'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AdminPageTemplate } from '@/components/admin/layout/AdminPageTemplate';
import {
  AdminButton,
  AdminCard,
  AdminCardContent,
  AdminCardHeader,
  AdminCardTitle,
  AdminTable,
  AdminTableBody,
  AdminTableCell,
  AdminTableHead,
  AdminTableHeader,
  AdminTableRow,
} from '@/components/admin/ui';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { supabase } from '@/lib/supabase/client';
import { useRequireAuth } from '@/lib/hooks';
import { Clock, Package } from 'lucide-react';
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

export default function DeliveryPage() {
  const [loading, setLoading] = useState(true);
  const [activeDrops, setActiveDrops] = useState<
    (Drop & { locations?: Location })[]
  >([]);
  const [selectedDropId, setSelectedDropId] = useState<string | null>(null);
  const [dropOrders, setDropOrders] = useState<
    Record<string, OrderWithDetails[]>
  >({});
  const [updatingOrder, setUpdatingOrder] = useState<string | null>(null);
  const router = useRouter();

  useRequireAuth();

  useEffect(() => {
    loadDeliveryData();
  }, []);

  const loadDeliveryData = async () => {
    try {
      setLoading(true);

      // Get all active drops
      const { data: activeDropsData, error: dropsError } = await supabase
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
        .order('date');

      if (dropsError) {
        console.error('Error loading active drops:', dropsError);
        setActiveDrops([]);
        return;
      }

      if (!activeDropsData || activeDropsData.length === 0) {
        setActiveDrops([]);
        return;
      }

      setActiveDrops(activeDropsData);

      // Set selected drop to first one if none selected
      if (!selectedDropId && activeDropsData.length > 0) {
        setSelectedDropId(activeDropsData[0].id);
      }

      // Load orders for all active drops
      const ordersPromises = activeDropsData.map(async drop => {
        const { data: ordersData, error: ordersError } = await supabase
          .from('orders')
          .select(
            `
            *,
            clients (
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
                products (
                  name,
                  category
                )
              )
            )
          `
          )
          .eq('drop_id', drop.id)
          .eq('status', 'confirmed')
          .order('pickup_time');

        if (ordersError) {
          console.error(
            `Error loading orders for drop ${drop.id}:`,
            ordersError
          );
          return { dropId: drop.id, orders: [] };
        }

        return { dropId: drop.id, orders: ordersData || [] };
      });

      const ordersResults = await Promise.all(ordersPromises);

      // Build orders map by drop ID
      const ordersMap: Record<string, OrderWithDetails[]> = {};
      ordersResults.forEach(({ dropId, orders }) => {
        ordersMap[dropId] = orders;
      });

      setDropOrders(ordersMap);
    } catch (error) {
      console.error('Error loading delivery data:', error);
    } finally {
      setLoading(false);
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

  // Helper functions for new structure
  const getSelectedDrop = () => {
    return activeDrops.find(drop => drop.id === selectedDropId) || null;
  };

  const getCurrentOrders = () => {
    return selectedDropId ? dropOrders[selectedDropId] || [] : [];
  };

  const getDropFilterTitle = (drop: Drop & { locations?: Location }) => {
    const date = new Date(drop.date);
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const location = drop.locations?.name || 'Unknown Location';
    return `${day}/${month} ${location}`;
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

  // Generate Stripe dashboard URL for payment intent
  const getStripePaymentUrl = (paymentIntentId: string) => {
    const accountId = process.env.NEXT_PUBLIC_STRIPE_ACCOUNT_ID;
    const environment = process.env.NEXT_PUBLIC_STRIPE_ENVIRONMENT || 'test';

    if (!accountId) {
      console.warn('NEXT_PUBLIC_STRIPE_ACCOUNT_ID not configured');
      return '#';
    }

    return `https://dashboard.stripe.com/${accountId}/${environment}/payments/${paymentIntentId}`;
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

  if (!activeDrops.length) {
    return (
      <AdminPageTemplate title="Delivery">
        <AdminCard>
          <AdminCardContent className="text-center py-12">
            <Package className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Active Drops
            </h3>
            <p className="text-gray-600 mb-6">
              There are no active drops available for delivery management.
            </p>
            <AdminButton onClick={() => router.push('/admin/drops')}>
              Manage Drops
            </AdminButton>
          </AdminCardContent>
        </AdminCard>
      </AdminPageTemplate>
    );
  }

  const selectedDrop = getSelectedDrop();
  const currentOrders = getCurrentOrders();

  return (
    <TooltipProvider>
      <AdminPageTemplate title="Delivery">
        {/* Drop Filter Buttons */}
        <div className="flex gap-2 mb-6">
          {activeDrops.map(drop => (
            <AdminButton
              key={drop.id}
              variant={selectedDropId === drop.id ? 'admin-primary' : 'outline'}
              onClick={() => setSelectedDropId(drop.id)}
            >
              {getDropFilterTitle(drop)}
            </AdminButton>
          ))}
        </div>

        {/* Orders Table */}
        <AdminCard>
          <AdminCardContent className="p-0">
            <AdminTable>
              <AdminTableHeader>
                <AdminTableRow>
                  <AdminTableHead>Order</AdminTableHead>
                  <AdminTableHead>Pickup</AdminTableHead>
                  <AdminTableHead>Customer</AdminTableHead>
                  <AdminTableHead>Products</AdminTableHead>
                  <AdminTableHead>Instructions</AdminTableHead>
                  <AdminTableHead>Stripe</AdminTableHead>
                  <AdminTableHead className="text-right sr-only">
                    Action
                  </AdminTableHead>
                </AdminTableRow>
              </AdminTableHeader>
              <AdminTableBody>
                {currentOrders.map(order => (
                  <AdminTableRow key={order.id}>
                    <AdminTableCell>
                      <span className="text-sm font-medium text-blue-600">
                        #{order.order_number}
                      </span>
                    </AdminTableCell>
                    <AdminTableCell>
                      <span className="text-sm font-medium">
                        {formatTime(order.pickup_time)}
                      </span>
                    </AdminTableCell>
                    <AdminTableCell>
                      <div>
                        <p className="font-medium">{order.customer_name}</p>
                        <p className="text-sm" style={{ color: '#555' }}>
                          {order.clients?.email}
                        </p>
                      </div>
                    </AdminTableCell>
                    <AdminTableCell>
                      <div className="max-w-xs">
                        {getOrderItemsText(order).map((item, index) => (
                          <p key={index} className="text-sm">
                            {item}
                          </p>
                        ))}
                      </div>
                    </AdminTableCell>
                    <AdminTableCell>
                      <div className="max-w-xs">
                        {order.special_instructions ? (
                          <p className="text-sm text-gray-700">
                            {order.special_instructions}
                          </p>
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </div>
                    </AdminTableCell>
                    <AdminTableCell>
                      {order.payment_intent_id ? (
                        <a
                          href={getStripePaymentUrl(order.payment_intent_id)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-mono text-blue-600 hover:text-blue-800 hover:underline"
                          title={`Open in Stripe: ${order.payment_intent_id}`}
                        >
                          {order.payment_intent_id.substring(0, 20)}...
                        </a>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </AdminTableCell>
                    <AdminTableCell className="text-right">
                      <AdminButton
                        size="sm"
                        onClick={() => markAsDelivered(order.id)}
                        disabled={updatingOrder === order.id}
                        variant="admin-primary"
                      >
                        {updatingOrder === order.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                        ) : (
                          'Delivered'
                        )}
                      </AdminButton>
                    </AdminTableCell>
                  </AdminTableRow>
                ))}
                {currentOrders.length === 0 && (
                  <AdminTableRow>
                    <AdminTableCell
                      colSpan={7}
                      className="text-center py-8 text-gray-500"
                    >
                      No orders to deliver
                    </AdminTableCell>
                  </AdminTableRow>
                )}
              </AdminTableBody>
            </AdminTable>
          </AdminCardContent>
        </AdminCard>
      </AdminPageTemplate>
    </TooltipProvider>
  );
}
