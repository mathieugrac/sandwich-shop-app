'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase/client';
import {
  Package,
  MapPin,
  Calendar,
  Users,
  ShoppingCart,
  LogOut,
  Zap,
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
  timeUntilDeadline: string | null;
}

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [activeDropData, setActiveDropData] = useState<ActiveDropData | null>(
    null
  );
  const [loadingActiveDrop, setLoadingActiveDrop] = useState(false);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push('/admin');
    } else {
      setLoading(false);
      loadActiveDropData();
    }
  };

  const loadActiveDropData = async () => {
    try {
      setLoadingActiveDrop(true);

      // Get next active drop directly from Supabase
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
        .gte('date', new Date().toISOString().split('T')[0]) // Use date instead of pickup_deadline
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
            name: (dropData.locations as any)?.name || '',
            address: (dropData.locations as any)?.address || '',
          },
        },
        orderStats,
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
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Admin Dashboard
            </h1>
            <p className="text-gray-600">
              Manage your sandwich shop operations
            </p>
          </div>
          <Button onClick={handleLogout} variant="outline">
            <LogOut className="w-4 h-4" />
          </Button>
        </div>

        {/* Next Drop Card */}
        <div className="mb-8">
          {loadingActiveDrop ? (
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="text-center">
                <Zap className="w-12 h-12 mx-auto mb-4 text-blue-600" />
                <CardTitle>Next Drop</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
                </div>
              </CardContent>
            </Card>
          ) : activeDropData ? (
            <Card className="hover:shadow-lg transition-shadow p-6">
              {/* Mobile Layout */}
              <div className="block md:hidden">
                <CardHeader className="text-center">
                  <Zap className="w-12 h-12 mx-auto mb-4 text-blue-600" />
                  <CardTitle className="text-lg font-semibold">
                    Next Drop
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                  <div>
                    <p className="text-lg font-semibold mb-1">
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
                        {activeDropData.orderStats.total -
                          activeDropData.orderStats.delivered}
                      </p>
                      <p className="text-gray-600">Remaining</p>
                    </div>
                  </div>

                  <Button
                    onClick={() => navigateTo('/admin/delivery')}
                    className="bg-black hover:bg-gray-800 text-white px-6 py-2 cursor-pointer"
                  >
                    Manage Orders
                  </Button>
                </CardContent>
              </div>

              {/* Desktop Layout */}
              <div className="hidden md:block">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    {/* Left Side: Icon + Title + Date + Location */}
                    <div className="flex items-center space-x-4">
                      <Zap className="w-12 h-12 text-blue-600 flex-shrink-0" />
                      <div className="text-left">
                        <h3 className="text-lg font-semibold">Next Drop</h3>
                        <p className="text-lg font-semibold mb-1">
                          {new Date(
                            activeDropData.drop.date
                          ).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
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
                            {activeDropData.orderStats.total -
                              activeDropData.orderStats.delivered}
                          </p>
                          <p className="text-gray-600">Remaining</p>
                        </div>
                      </div>

                      {/* CTA Button */}
                      <Button
                        onClick={() => navigateTo('/admin/delivery')}
                        className="bg-black hover:bg-gray-800 text-white px-6 py-2 ml-4 cursor-pointer"
                      >
                        Manage Orders
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </div>
            </Card>
          ) : (
            <Card className="hover:shadow-lg transition-shadow p-6">
              {/* Mobile Layout - Empty State */}
              <div className="block md:hidden">
                <CardHeader className="text-center">
                  <Zap className="w-12 h-12 mx-auto mb-4 text-blue-600" />
                  <CardTitle className="text-lg font-semibold">
                    Next Drop
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                  <div>
                    <p className="text-lg font-semibold mb-1">
                      No active drops scheduled
                    </p>
                  </div>

                  <Button
                    onClick={() => navigateTo('/admin/drops')}
                    className="bg-black hover:bg-gray-800 text-white px-6 py-2 cursor-pointer"
                  >
                    Manage Drops
                  </Button>
                </CardContent>
              </div>

              {/* Desktop Layout - Empty State */}
              <div className="hidden md:block">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    {/* Left Side: Icon + Title + Date + Location */}
                    <div className="flex items-center space-x-4">
                      <Zap className="w-12 h-12 text-blue-600 flex-shrink-0" />
                      <div className="text-left">
                        <h3 className="text-lg font-semibold">Next Drop</h3>
                        <p className="text-lg font-semibold mb-1">
                          No active drops scheduled
                        </p>
                      </div>
                    </div>

                    {/* Right Side: CTA */}
                    <div className="flex items-center">
                      <Button
                        onClick={() => navigateTo('/admin/drops')}
                        className="bg-black hover:bg-gray-800 text-white px-6 py-2 cursor-pointer"
                      >
                        Manage Drops
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </div>
            </Card>
          )}
        </div>

        {/* Navigation Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Products */}
          <Card
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => navigateTo('/admin/products')}
          >
            <CardHeader className="text-center">
              <Package className="w-12 h-12 mx-auto mb-4 text-blue-600" />
              <CardTitle>Products</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-600">Manage sandwich menu and pricing</p>
            </CardContent>
          </Card>

          {/* Locations */}
          <Card
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => navigateTo('/admin/locations')}
          >
            <CardHeader className="text-center">
              <MapPin className="w-12 h-12 mx-auto mb-4 text-green-600" />
              <CardTitle>Locations</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-600">
                Manage delivery locations and timeframes
              </p>
            </CardContent>
          </Card>

          {/* Drops */}
          <Card
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => navigateTo('/admin/drops')}
          >
            <CardHeader className="text-center">
              <Calendar className="w-12 h-12 mx-auto mb-4 text-purple-600" />
              <CardTitle>Drops</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-600">Create and manage sandwich drops</p>
            </CardContent>
          </Card>

          {/* Clients */}
          <Card
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => navigateTo('/admin/clients')}
          >
            <CardHeader className="text-center">
              <Users className="w-12 h-12 mx-auto mb-4 text-orange-600" />
              <CardTitle>Clients</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-600">
                View customer information and history
              </p>
            </CardContent>
          </Card>

          {/* Analytics */}
          <Card
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => navigateTo('/admin/analytics')}
          >
            <CardHeader className="text-center">
              <ShoppingCart className="w-12 h-12 mx-auto mb-4 text-red-600" />
              <CardTitle>Analytics</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-600">
                View drop analytics and order history
              </p>
            </CardContent>
          </Card>

          {/* Drop Products */}
          <Card
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => navigateTo('/admin/drop-products')}
          >
            <CardHeader className="text-center">
              <Package className="w-12 h-12 mx-auto mb-4 text-indigo-600" />
              <CardTitle>Drop Products</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-600">
                Monitor and edit product availability across drops
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
