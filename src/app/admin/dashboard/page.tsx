'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminPageTemplate } from '@/components/admin/layout/AdminPageTemplate';
import {
  AdminButton,
  AdminCard,
  AdminCardContent,
  AdminCardHeader,
  AdminCardTitle,
} from '@/components/admin/ui';
import { supabase } from '@/lib/supabase/client';
import { useRequireAuth } from '@/lib/hooks';
import {
  Package,
  MapPin,
  Calendar,
  Users,
  BarChart3,
  LogOut,
} from 'lucide-react';

interface ActiveDropData {
  drop: {
    id: string;
    date: string;
    status: string;
    location: {
      name: string;
      address: string;
    };
  };
  orderStats: {
    total: number;
    delivered: number;
  };
  inventoryStats: {
    totalAvailable: number;
  };
  timeUntilDeadline: string | null;
}

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [activeDropData, setActiveDropData] = useState<ActiveDropData | null>(
    null
  );
  const [loadingActiveDrop, setLoadingActiveDrop] = useState(false);
  const router = useRouter();

  useRequireAuth();

  useEffect(() => {
    setLoading(false);
    loadActiveDropData();
  }, []);

  const loadActiveDropData = async () => {
    try {
      setLoadingActiveDrop(true);

      // Get the oldest active drop
      const { data: dropData, error: dropError } = await supabase
        .from('drops')
        .select(
          `
          id,
          date,
          status,
          location_id,
          locations (
            id,
            name,
            address,
            location_url,
            pickup_hour_start,
            pickup_hour_end
          )
        `
        )
        .eq('status', 'active')
        .order('date', { ascending: true })
        .limit(1)
        .single();

      if (dropError || !dropData) {
        if (dropError?.code === 'PGRST116') {
          // No active drops found
          setActiveDropData(null);
          return;
        }
        console.error('Error fetching next active drop:', dropError);
        setActiveDropData(null);
        return;
      }

      // Get order statistics for this drop
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('id, status')
        .eq('drop_id', dropData.id);

      if (ordersError) {
        console.error('Error loading order stats:', ordersError);
        return;
      }

      const orderStats = {
        total: ordersData?.length || 0,
        delivered:
          ordersData?.filter(order => order.status === 'delivered').length || 0,
      };

      // Get inventory statistics for this drop
      const { data: inventoryData, error: inventoryError } = await supabase
        .from('drop_products')
        .select('available_quantity')
        .eq('drop_id', dropData.id);

      if (inventoryError) {
        console.error('Error loading inventory stats:', inventoryError);
        return;
      }

      const inventoryStats = {
        totalAvailable:
          inventoryData?.reduce(
            (sum, item) => sum + (item.available_quantity || 0),
            0
          ) || 0,
      };

      // Calculate time until drop date (simplified since we don't have pickup_deadline)
      let timeUntilDeadline = null;
      if (dropData.date) {
        const dropDate = new Date(dropData.date);
        const now = new Date();
        const diffMs = dropDate.getTime() - now.getTime();

        if (diffMs > 0) {
          const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
          const diffHours = Math.floor(
            (diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
          );

          if (diffDays > 0) {
            timeUntilDeadline = `${diffDays}d ${diffHours}h`;
          } else if (diffHours > 0) {
            timeUntilDeadline = `${diffHours}h`;
          } else {
            timeUntilDeadline = 'Today';
          }
        }
      }

      setActiveDropData({
        drop: {
          id: dropData.id,
          date: dropData.date,
          status: dropData.status,
          location: {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            name: (dropData.locations as any)?.name || '',
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            address: (dropData.locations as any)?.address || '',
          },
        },
        orderStats,
        inventoryStats,
        timeUntilDeadline,
      });
    } catch (error) {
      console.error('Error loading active drop data:', error);
      setActiveDropData(null);
    } finally {
      setLoadingActiveDrop(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/admin');
  };

  const navigateTo = (path: string) => {
    router.push(path);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <AdminPageTemplate title="Dashboard">
      {/* Next Drop Card */}
      <div className="mb-4">
        {loadingActiveDrop ? (
          <AdminCard className="hover:shadow-lg transition-shadow">
            <AdminCardHeader className="text-center">
              <AdminCardTitle>Next Drop</AdminCardTitle>
            </AdminCardHeader>
            <AdminCardContent className="text-center">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
              </div>
            </AdminCardContent>
          </AdminCard>
        ) : activeDropData ? (
          <AdminCard className="hover:shadow-lg transition-shadow p-6">
            {/* Mobile Layout */}
            <div className="block md:hidden">
              <AdminCardHeader className="text-center">
                <AdminCardTitle className="text-md font-semibold mb-6">
                  Next Drop
                </AdminCardTitle>
              </AdminCardHeader>
              <AdminCardContent className="text-center space-y-4">
                <div>
                  <p className="text-xl font-semibold mb-1">
                    {new Date(activeDropData.drop.date).toLocaleDateString(
                      'en-US',
                      {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      }
                    )}
                  </p>
                  <p className="text-gray-600">
                    <span>At</span> {activeDropData.drop.location.name}
                  </p>
                </div>

                <div className="flex justify-center space-x-6 text-sm">
                  <div className="text-center">
                    <p className="font-semibold text-black text-xl">
                      {activeDropData.orderStats.total}
                    </p>
                    <p className="text-gray-600">Orders</p>
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-black text-xl">
                      {activeDropData.orderStats.delivered}
                    </p>
                    <p className="text-gray-600">Delivered</p>
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-black text-xl">
                      {activeDropData.inventoryStats.totalAvailable}
                    </p>
                    <p className="text-gray-600">Available</p>
                  </div>
                </div>

                <AdminButton
                  onClick={() => navigateTo('/admin/delivery')}
                  className="bg-black hover:bg-gray-800 text-white px-6 py-2 cursor-pointer"
                >
                  Manage Orders
                </AdminButton>
              </AdminCardContent>
            </div>

            {/* Desktop Layout */}
            <div className="hidden md:block">
              <AdminCardContent className="p-6">
                <div className="flex items-center justify-between">
                  {/* Left Side: Title + Date + Location */}
                  <div className="flex items-center space-x-4">
                    <div className="text-left">
                      <h3 className="text-md font-semibold mb-6">Next Drop</h3>
                      <p className="text-xl font-semibold mb-1">
                        {new Date(activeDropData.drop.date).toLocaleDateString(
                          'en-US',
                          {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          }
                        )}
                      </p>
                      <p className="text-gray-600">
                        <span>At</span> {activeDropData.drop.location.name}
                      </p>
                    </div>
                  </div>

                  {/* Right Side: Order Stats + CTA */}
                  <div className="flex items-center space-x-6">
                    {/* Order Statistics */}
                    <div className="flex space-x-6 text-sm">
                      <div className="text-center">
                        <p className="font-semibold text-black text-xl">
                          {activeDropData.orderStats.total}
                        </p>
                        <p className="text-gray-600">Orders</p>
                      </div>
                      <div className="text-center">
                        <p className="font-semibold text-black text-xl">
                          {activeDropData.orderStats.delivered}
                        </p>
                        <p className="text-gray-600">Delivered</p>
                      </div>
                      <div className="text-center">
                        <p className="font-semibold text-black text-xl">
                          {activeDropData.inventoryStats.totalAvailable}
                        </p>
                        <p className="text-gray-600">Available</p>
                      </div>
                    </div>

                    {/* CTA Button */}
                    <AdminButton
                      onClick={() => navigateTo('/admin/delivery')}
                      className="bg-black hover:bg-gray-800 text-white px-6 py-2 ml-4 cursor-pointer"
                    >
                      Manage Orders
                    </AdminButton>
                  </div>
                </div>
              </AdminCardContent>
            </div>
          </AdminCard>
        ) : (
          <AdminCard className="hover:shadow-lg transition-shadow p-6">
            {/* Mobile Layout - Empty State */}
            <div className="block md:hidden">
              <AdminCardHeader className="text-center">
                <AdminCardTitle className="text-md font-semibold mb-6">
                  Next Drop
                </AdminCardTitle>
              </AdminCardHeader>
              <AdminCardContent className="text-center space-y-4">
                <div>
                  <p className="text-lg font-semibold mb-1">
                    No active drops scheduled
                  </p>
                </div>

                <AdminButton
                  onClick={() => navigateTo('/admin/drops')}
                  className="bg-black hover:bg-gray-800 text-white px-6 py-2 cursor-pointer"
                >
                  Manage Drops
                </AdminButton>
              </AdminCardContent>
            </div>

            {/* Desktop Layout - Empty State */}
            <div className="hidden md:block">
              <AdminCardContent className="p-6">
                <div className="flex items-center justify-between">
                  {/* Left Side: Title + Date + Location */}
                  <div className="flex items-center space-x-4">
                    <div className="text-left">
                      <h3 className="text-md font-semibold mb-6">Next Drop</h3>
                      <p className="text-lg font-semibold mb-1">
                        No active drops scheduled
                      </p>
                    </div>
                  </div>

                  {/* Right Side: CTA */}
                  <div className="flex items-center">
                    <AdminButton
                      onClick={() => navigateTo('/admin/drops')}
                      className="bg-black hover:bg-gray-800 text-white px-6 py-2 cursor-pointer"
                    >
                      Manage Drops
                    </AdminButton>
                  </div>
                </div>
              </AdminCardContent>
            </div>
          </AdminCard>
        )}
      </div>
    </AdminPageTemplate>
  );
}
