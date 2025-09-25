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
  X,
} from 'lucide-react';
import { MenuItem } from '../ui/MenuItem';
import { AdminButton } from '../ui/AdminButton';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { forwardRef } from 'react';
import Image from 'next/image';

interface AdminSidebarProps {
  className?: string;
  onClose?: () => void;
}

const AdminSidebar = forwardRef<HTMLDivElement, AdminSidebarProps>(
  ({ className, onClose }, ref) => {
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
        href: '/admin/delivery',
        icon: Truck,
        label: 'Delivery',
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

    const bottomMenuItems = [
      {
        href: '#logout',
        icon: LogOut,
        label: 'Logout',
        onClick: handleLogout,
      },
    ];

    return (
      <div
        ref={ref}
        className={cn('flex flex-col h-full bg-gray-100', 'w-64', className)}
      >
        {/* Logo/Brand */}
        <div className="flex items-center justify-between pt-6 pr-7 pb-3 pl-7">
          <Image
            src="/logo-kusack.svg"
            alt="Kusack Logo"
            width={120}
            height={47}
            className="h-10 w-auto"
          />
          {/* Close button - only visible on mobile */}
          {onClose && (
            <AdminButton
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="lg:hidden"
            >
              <X className="w-4 h-4" />
            </AdminButton>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
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
        <div className="px-4 pb-4 space-y-1">
          <AdminButton
            variant="outline"
            className="w-full justify-start"
            onClick={handleViewStore}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            View Store
          </AdminButton>

          {bottomMenuItems.map(item => (
            <MenuItem
              key={item.href}
              href={item.href}
              icon={item.icon}
              label={item.label}
              className="cursor-pointer"
              onClick={e => {
                e.preventDefault();
                item.onClick?.();
              }}
            />
          ))}
        </div>
      </div>
    );
  }
);

AdminSidebar.displayName = 'AdminSidebar';

export { AdminSidebar };
