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
        className={cn('flex h-screen bg-white', className)}
        {...props}
      >
        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/40 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Desktop Sidebar - hidden on mobile */}
        <div className="hidden lg:block">
          <AdminSidebar />
        </div>

        {/* Mobile Sidebar - overlay when open */}
        {sidebarOpen && (
          <div className="fixed inset-y-0 left-0 z-50 lg:hidden">
            <AdminSidebar onClose={() => setSidebarOpen(false)} />
          </div>
        )}

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Page header */}
          <header className="bg-white px-6 py-7 lg:px-12 lg:py-7">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* Mobile menu button - only visible on mobile */}
                <AdminButton
                  variant="ghost"
                  size="sm"
                  className="lg:hidden"
                  onClick={() => setSidebarOpen(true)}
                >
                  <Menu className="w-5 h-5" />
                </AdminButton>

                {/* Page title */}
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
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
            <div className="bg-white px-6 lg:px-12">
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
          <main className="flex-1 overflow-y-auto bg-white px-6 pb-6 pt-8 lg:px-12 lg:pb-12 lg:pt-8">
            {children}
          </main>
        </div>
      </div>
    );
  }
);

AdminPageTemplate.displayName = 'AdminPageTemplate';

export { AdminPageTemplate };
