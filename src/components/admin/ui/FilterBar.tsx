import { Search, Filter, X } from 'lucide-react';
import { AdminButton } from './AdminButton';
import { AdminInput } from './AdminInput';
import { cn } from '@/lib/utils';
import { forwardRef, useState } from 'react';

interface FilterOption {
  label: string;
  value: string;
  active?: boolean;
}

interface FilterBarProps {
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  filters?: FilterOption[];
  onFilterChange?: (value: string) => void;
  className?: string;
  children?: React.ReactNode;
}

const FilterBar = forwardRef<HTMLDivElement, FilterBarProps>(
  (
    {
      searchValue = '',
      onSearchChange,
      searchPlaceholder = 'Search...',
      filters = [],
      onFilterChange,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const [showFilters, setShowFilters] = useState(false);

    return (
      <div ref={ref} className={cn('space-y-4', className)} {...props}>
        {/* Main filter bar */}
        <div className="flex items-center gap-4">
          {/* Search input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <AdminInput
              type="text"
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={e => onSearchChange?.(e.target.value)}
              className="pl-10"
            />
            {searchValue && (
              <button
                onClick={() => onSearchChange?.('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filter toggle button */}
          {filters.length > 0 && (
            <AdminButton
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Filters
              {filters.some(f => f.active) && (
                <span className="bg-black text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {filters.filter(f => f.active).length}
                </span>
              )}
            </AdminButton>
          )}

          {/* Additional actions */}
          {children}
        </div>

        {/* Filter options */}
        {showFilters && filters.length > 0 && (
          <div className="flex flex-wrap gap-2 p-4 bg-gray-50 rounded-lg border">
            <span className="text-sm font-medium text-gray-700 mr-2">
              Filter by:
            </span>
            {filters.map(filter => (
              <AdminButton
                key={filter.value}
                variant={filter.active ? 'admin-primary' : 'outline'}
                size="sm"
                onClick={() => onFilterChange?.(filter.value)}
                className="text-xs"
              >
                {filter.label}
              </AdminButton>
            ))}
            {filters.some(f => f.active) && (
              <AdminButton
                variant="ghost"
                size="sm"
                onClick={() =>
                  filters.forEach(f => f.active && onFilterChange?.(f.value))
                }
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                Clear all
              </AdminButton>
            )}
          </div>
        )}
      </div>
    );
  }
);

FilterBar.displayName = 'FilterBar';

export { FilterBar, type FilterOption };
