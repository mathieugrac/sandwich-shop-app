'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
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
  Package,
  ShoppingCart,
  Users,
  TrendingUp,
  LogOut,
  Settings,
  Calendar,
} from 'lucide-react';

interface DashboardStats {
  totalOrders: number;
  pendingOrders: number;
  totalProducts: number;
  totalRevenue: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    pendingOrders: 0,
    totalProducts: 0,
    totalRevenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const checkAuth = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push('/admin');
    }
  }, [router]);

  const loadDashboardStats = useCallback(async () => {
    try {
      // Get the next active sell
      const { data: nextSell } = await supabase.rpc('get_next_active_sell');

      let orders = [];
      if (nextSell && nextSell.length > 0) {
        const activeSell = nextSell[0];

        // Get orders for the active sell
        const { data: ordersData } = await supabase
          .from('orders')
          .select('*')
          .eq('sell_id', activeSell.id);

        orders = ordersData || [];
      }

      // Get products count
      const { data: products } = await supabase
        .from('products')
        .select('id')
        .eq('active', true);

      const totalOrders = orders.length;
      const pendingOrders = orders.filter(o => o.status === 'pending').length;
      const totalRevenue = orders.reduce(
        (sum, order) => sum + parseFloat(order.total_amount),
        0
      );

      setStats({
        totalOrders,
        pendingOrders,
        totalProducts: products?.length || 0,
        totalRevenue,
      });
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
    loadDashboardStats();
  }, [checkAuth, loadDashboardStats]);

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
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-semibold">Admin Dashboard</h1>
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigateTo('/admin/orders?status=pending')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Pending Orders
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingOrders}</div>
              <p className="text-xs text-muted-foreground">Need attention</p>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigateTo('/admin/orders')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Next Sell Orders
              </CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalOrders}</div>
              <p className="text-xs text-muted-foreground">
                {stats.pendingOrders} pending
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenue</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                €{stats.totalRevenue.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                Today&apos;s total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Products
              </CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalProducts}</div>
              <p className="text-xs text-muted-foreground">Available items</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigateTo('/admin/orders')}
          >
            <CardHeader>
              <CardTitle className="flex items-center">
                <ShoppingCart className="h-5 w-5 mr-2" />
                View Orders
              </CardTitle>
              <CardDescription>
                Manage next active sell orders and update status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  {stats.pendingOrders} orders need attention
                </p>
                {stats.pendingOrders > 0 && (
                  <Badge variant="destructive">{stats.pendingOrders}</Badge>
                )}
              </div>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigateTo('/admin/sells')}
          >
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Manage Sells
              </CardTitle>
              <CardDescription>
                Create and manage sells for specific dates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Create sells in advance and manage their status
              </p>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigateTo('/admin/inventory')}
          >
            <CardHeader>
              <CardTitle className="flex items-center">
                <Package className="h-5 w-5 mr-2" />
                Manage Inventory
              </CardTitle>
              <CardDescription>
                Set inventory quantities for specific sells
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Update stock levels for sell menu items
              </p>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigateTo('/admin/settings')}
          >
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                Settings
              </CardTitle>
              <CardDescription>
                Manage shop settings and preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Configure shop hours, pickup times, and more
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest orders and updates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No recent activity to display</p>
                <p className="text-sm">
                  Orders will appear here as they come in
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
