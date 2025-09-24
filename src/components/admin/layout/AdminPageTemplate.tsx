'use client';

import { AdminSidebar } from './AdminSidebar';
import { AdminButton } from '../ui/AdminButton';
import { FilterBar, FilterOption } from '../ui/FilterBar';
import { cn } from '@/lib/utils';
import { forwardRef, useState } from 'react';
import { Menu, X } from 'lucide-react';

interface AdminPageTemplateProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;

  // Header actions
  primaryAction?: {
    label: string;
    onClick: () => void;
    icon?: React.ComponentType<{ className?: string }>;
  };
  secondaryActions?: React.ReactNode;

  // Filter bar props
  showFilterBar?: boolean;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  filters?: FilterOption[];
  onFilterChange?: (value: string) => void;
  filterBarActions?: React.ReactNode;

  className?: string;
}

const AdminPageTemplate = forwardRef<HTMLDivElement, AdminPageTemplateProps>(
  (
    {
      title,
      subtitle,
      children,
      primaryAction,
      secondaryActions,
      showFilterBar = false,
      searchValue,
      onSearchChange,
      searchPlaceholder,
      filters,
      onFilterChange,
      filterBarActions,
      className,
      ...props
    },
    ref
  ) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
      <div
        ref={ref}
        className={cn('flex h-screen bg-gray-50', className)}
        {...props}
      >
        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <div
          className={cn(
            'transform transition-transform duration-300 ease-in-out lg:translate-x-0',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full',
            'lg:block'
          )}
        >
          <AdminSidebar />
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
          {/* Page header */}
          <header className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* Mobile menu button */}
                <AdminButton
                  variant="ghost"
                  size="sm"
                  className="lg:hidden"
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                >
                  {sidebarOpen ? (
                    <X className="w-5 h-5" />
                  ) : (
                    <Menu className="w-5 h-5" />
                  )}
                </AdminButton>

                {/* Page title */}
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
                  {subtitle && (
                    <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
                  )}
                </div>
              </div>

              {/* Header actions */}
              <div className="flex items-center gap-3">
                {secondaryActions}
                {primaryAction && (
                  <AdminButton
                    variant="admin-primary"
                    onClick={primaryAction.onClick}
                    className="flex items-center gap-2"
                  >
                    {primaryAction.icon && (
                      <primaryAction.icon className="w-4 h-4" />
                    )}
                    {primaryAction.label}
                  </AdminButton>
                )}
              </div>
            </div>
          </header>

          {/* Filter bar */}
          {showFilterBar && (
            <div className="bg-white border-b border-gray-200 px-6 py-4">
              <FilterBar
                searchValue={searchValue}
                onSearchChange={onSearchChange}
                searchPlaceholder={searchPlaceholder}
                filters={filters}
                onFilterChange={onFilterChange}
              >
                {filterBarActions}
              </FilterBar>
            </div>
          )}

          {/* Page content */}
          <main className="flex-1 overflow-y-auto p-6">{children}</main>
        </div>
      </div>
    );
  }
);

AdminPageTemplate.displayName = 'AdminPageTemplate';

export { AdminPageTemplate };
