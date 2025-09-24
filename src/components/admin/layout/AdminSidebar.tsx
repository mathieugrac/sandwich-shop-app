'use client';

import {
  Home,
  Package,
  Users,
  MapPin,
  Calendar,
  Truck,
  BarChart3,
  Settings,
  ExternalLink,
  LogOut,
} from 'lucide-react';
import { MenuItem } from '../ui/MenuItem';
import { AdminButton } from '../ui/AdminButton';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { forwardRef } from 'react';

interface AdminSidebarProps {
  className?: string;
}

const AdminSidebar = forwardRef<HTMLDivElement, AdminSidebarProps>(
  ({ className }, ref) => {
    const router = useRouter();

    const handleLogout = async () => {
      await supabase.auth.signOut();
      router.push('/');
    };

    const handleViewStore = () => {
      window.open('/', '_blank');
    };

    const menuItems = [
      {
        href: '/admin/dashboard',
        icon: Home,
        label: 'Dashboard',
      },
      {
        href: '/admin/drops',
        icon: Calendar,
        label: 'Drops',
      },
      {
        href: '/admin/products',
        icon: Package,
        label: 'Products',
      },
      {
        href: '/admin/delivery',
        icon: Truck,
        label: 'Delivery',
      },
      {
        href: '/admin/clients',
        icon: Users,
        label: 'Customers',
      },
      {
        href: '/admin/locations',
        icon: MapPin,
        label: 'Locations',
      },
      {
        href: '/admin/analytics',
        icon: BarChart3,
        label: 'Analytics',
      },
      {
        href: '/admin/settings',
        icon: Settings,
        label: 'Settings',
      },
    ];

    return (
      <div
        ref={ref}
        className={cn(
          'flex flex-col h-full bg-white border-r border-gray-200',
          'w-64 fixed left-0 top-0 z-40',
          'lg:relative lg:z-0',
          className
        )}
      >
        {/* Logo/Brand */}
        <div className="flex items-center justify-center h-16 px-4 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">Fomé Admin</h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {menuItems.map(item => (
            <MenuItem
              key={item.href}
              href={item.href}
              icon={item.icon}
              label={item.label}
            />
          ))}
        </nav>

        {/* Bottom actions */}
        <div className="p-4 border-t border-gray-200 space-y-2">
          <AdminButton
            variant="outline"
            className="w-full justify-start"
            onClick={handleViewStore}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            View Store
          </AdminButton>

          <AdminButton
            variant="ghost"
            className="w-full justify-start text-gray-600 hover:text-gray-900"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </AdminButton>
        </div>
      </div>
    );
  }
);

AdminSidebar.displayName = 'AdminSidebar';

export { AdminSidebar };
