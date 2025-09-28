'use client';

import { useState, useEffect } from 'react';
import { AdminPageTemplate } from '@/components/admin/layout/AdminPageTemplate';
import {
  AdminCard,
  AdminCardContent,
  AdminTable,
  AdminTableBody,
  AdminTableCell,
  AdminTableHead,
  AdminTableHeader,
  AdminTableRow,
} from '@/components/admin/ui';
import { supabase } from '@/lib/supabase/client';
import { useRequireAuth } from '@/lib/hooks';
import { ShoppingBag } from 'lucide-react';
import type { Database } from '@/types/database';

// Types
type Order = Database['public']['Tables']['orders']['Row'];
type Client = Database['public']['Tables']['clients']['Row'];
type Product = Database['public']['Tables']['products']['Row'];

interface OrderWithDetails extends Order {
  clients?: Client;
  order_products?: Array<{
    order_quantity: number;
    drop_products?: {
      selling_price: number;
      products?: Product;
    };
  }>;
}

export default function OrdersPage() {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<OrderWithDetails[]>([]);

  useRequireAuth();

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);

      const { data: ordersData, error } = await supabase
        .from('orders')
        .select(
          `
          *,
          clients (
            email,
            phone
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
        .order('order_number', { ascending: false });

      if (error) {
        console.error('Error loading orders:', error);
        return;
      }

      setOrders(ordersData || []);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const getOrderProducts = (order: OrderWithDetails) => {
    return (
      order.order_products?.map(op => ({
        name: op.drop_products?.products?.name || 'Unknown',
        quantity: op.order_quantity,
        price: op.drop_products?.selling_price || 0,
      })) || []
    );
  };

  const getOrderProductsText = (order: OrderWithDetails) => {
    const products = getOrderProducts(order);
    return products
      .map(product => `${product.quantity}x ${product.name}`)
      .join(', ');
  };

  // Generate Stripe dashboard URL for payment intent
  const getStripePaymentUrl = (paymentIntentId: string) => {
    // Determine environment based on payment intent ID prefix
    const isLive =
      paymentIntentId.startsWith('pi_live_') ||
      (paymentIntentId.startsWith('pi_1') && !paymentIntentId.includes('test'));
    const environment = isLive ? '' : 'test/';

    return `https://dashboard.stripe.com/${environment}payments/${paymentIntentId}`;
  };

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
    <AdminPageTemplate title="Orders">
      <AdminCard>
        <AdminCardContent className="p-0">
          <div className="overflow-x-auto">
            <AdminTable>
              <AdminTableHeader>
                <AdminTableRow>
                  <AdminTableHead>Order ID</AdminTableHead>
                  <AdminTableHead>Date</AdminTableHead>
                  <AdminTableHead>Customer</AdminTableHead>
                  <AdminTableHead>Products</AdminTableHead>
                  <AdminTableHead>Stripe</AdminTableHead>
                  <AdminTableHead className="text-right">Total</AdminTableHead>
                </AdminTableRow>
              </AdminTableHeader>
              <AdminTableBody>
                {orders.map(order => (
                  <AdminTableRow key={order.id}>
                    <AdminTableCell className="align-top">
                      <div className="py-1">
                        <span className="text-sm font-medium text-blue-600">
                          #{order.order_number}
                        </span>
                      </div>
                    </AdminTableCell>
                    <AdminTableCell className="align-top">
                      <div className="py-1">
                        <span className="text-sm">
                          {formatDate(order.order_date)}
                        </span>
                      </div>
                    </AdminTableCell>
                    <AdminTableCell className="align-top">
                      <div className="py-1">
                        <p className="text-sm" style={{ color: '#111' }}>
                          {order.clients?.email || order.customer_email}
                        </p>
                      </div>
                    </AdminTableCell>
                    <AdminTableCell className="align-top">
                      <div className="max-w-48 min-w-32 py-1">
                        <p className="text-sm break-words">
                          {getOrderProductsText(order)}
                        </p>
                      </div>
                    </AdminTableCell>
                    <AdminTableCell className="align-top">
                      <div className="py-1">
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
                      </div>
                    </AdminTableCell>
                    <AdminTableCell className="text-right align-top">
                      <div className="py-1">
                        <span className="text-sm font-medium">
                          {formatCurrency(order.total_amount)}
                        </span>
                      </div>
                    </AdminTableCell>
                  </AdminTableRow>
                ))}
                {orders.length === 0 && (
                  <AdminTableRow>
                    <AdminTableCell
                      colSpan={6}
                      className="text-center py-12 text-gray-500"
                    >
                      <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No Orders Found
                      </h3>
                      <p className="text-gray-600">
                        Orders will appear here once customers start placing
                        them.
                      </p>
                    </AdminTableCell>
                  </AdminTableRow>
                )}
              </AdminTableBody>
            </AdminTable>
          </div>
        </AdminCardContent>
      </AdminCard>
    </AdminPageTemplate>
  );
}
