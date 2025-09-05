'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase/client';
import { AdminLayout, DropSidebar, DropAnalytics } from '@/components/admin';
import { Calendar, MapPin, Euro, Package, Users } from 'lucide-react';
import { useRequireAuth } from '@/lib/hooks';
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

function AnalyticsContent() {
  const [loading, setLoading] = useState(true);
  const [drops, setDrops] = useState<DropWithLocation[]>([]);
  const [selectedDropId, setSelectedDropId] = useState<string | null>(null);
  const [analyticsData, setAnalyticsData] = useState<DropAnalyticsData | null>(
    null
  );
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();

  useRequireAuth();

  useEffect(() => {
    loadDrops();
  }, []);

  useEffect(() => {
    // Check for drop parameter in URL
    const dropParam = searchParams.get('drop');
    if (dropParam && drops.length > 0) {
      setSelectedDropId(dropParam);
    } else if (drops.length > 0 && !selectedDropId) {
      // Select most recent drop with analytics (non-upcoming) by default
      const dropsWithAnalytics = drops.filter(
        drop => drop.status !== 'upcoming'
      );
      if (dropsWithAnalytics.length > 0) {
        setSelectedDropId(dropsWithAnalytics[0].id);
      }
    }
  }, [searchParams, drops, selectedDropId]);

  useEffect(() => {
    if (selectedDropId) {
      loadAnalyticsData(selectedDropId);
    }
  }, [selectedDropId]);

  const loadDrops = async () => {
    try {
      setLoading(true);

      const { data: dropsData, error } = await supabase
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
        .order('date', { ascending: false });

      if (error) {
        console.error('Error loading drops:', error);
        return;
      }

      setDrops(dropsData || []);
    } catch (error) {
      console.error('Error in loadDrops:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAnalyticsData = async (dropId: string) => {
    try {
      setLoadingAnalytics(true);

      // Get drop details
      const selectedDrop = drops.find(d => d.id === dropId);
      if (!selectedDrop) return;

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
        .eq('drop_id', dropId)
        .order('created_at', { ascending: false });

      if (ordersError) {
        console.error('Error loading orders:', ordersError);
        return;
      }

      const orders = ordersData || [];
      const deliveredOrders = orders.filter(
        order => order.status === 'delivered'
      );
      const totalRevenue = orders.reduce(
        (sum, order) => sum + order.total_amount,
        0
      );
      const completionRate =
        orders.length > 0 ? (deliveredOrders.length / orders.length) * 100 : 0;

      setAnalyticsData({
        drop: selectedDrop,
        orders,
        totalRevenue,
        totalOrders: orders.length,
        completionRate,
      });
    } catch (error) {
      console.error('Error loading analytics data:', error);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  const handleDropSelect = (dropId: string) => {
    setSelectedDropId(dropId);
    // Update URL without page reload
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set('drop', dropId);
    window.history.replaceState({}, '', newUrl.toString());
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout
      title="Drop Analytics"
      subtitle="Historical analysis and drop management"
      backUrl="/admin/dashboard"
    >
      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="w-80 flex-shrink-0">
          <DropSidebar
            drops={drops}
            selectedDropId={selectedDropId}
            onDropSelect={handleDropSelect}
          />
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {analyticsData ? (
            <DropAnalytics data={analyticsData} loading={loadingAnalytics} />
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Package className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Select a Drop
                </h3>
                <p className="text-gray-600">
                  Choose a drop from the sidebar to view its analytics and order
                  details.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

export default function AnalyticsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
        </div>
      }
    >
      <AnalyticsContent />
    </Suspense>
  );
}
