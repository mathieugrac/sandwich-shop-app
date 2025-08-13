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
} from 'lucide-react';

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
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

          {/* Orders */}
          <Card
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => navigateTo('/admin/orders')}
          >
            <CardHeader className="text-center">
              <ShoppingCart className="w-12 h-12 mx-auto mb-4 text-red-600" />
              <CardTitle>Orders</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-600">Track and manage customer orders</p>
            </CardContent>
          </Card>

          {/* Inventory */}
          <Card
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => navigateTo('/admin/inventory')}
          >
            <CardHeader className="text-center">
              <Package className="w-12 h-12 mx-auto mb-4 text-indigo-600" />
              <CardTitle>Inventory</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-600">
                Manage product quantities and pricing
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
