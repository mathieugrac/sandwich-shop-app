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
          {/* Filter toggle button */}
          {filters.length > 0 && (
            <AdminButton
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                'flex items-center gap-2 flex-shrink-0 h-10 px-4 border-gray-300',
                showFilters && 'bg-gray-50 border-gray-400'
              )}
            >
              <Filter className="w-4 h-4" />
              <span className="text-sm">Filters</span>
              {filters.some(f => f.active) && (
                <span className="bg-black text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                  {filters.filter(f => f.active).length}
                </span>
              )}
            </AdminButton>
          )}

          {/* Search input - takes all available space */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
            <AdminInput
              type="text"
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={e => onSearchChange?.(e.target.value)}
              className={cn(
                'pl-10 h-10 border-gray-300 focus:border-gray-400 focus:ring-1 focus:ring-gray-400',
                searchValue && 'pr-10'
              )}
            />
            {searchValue && (
              <button
                onClick={() => onSearchChange?.('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-150 p-0.5 rounded-sm hover:bg-gray-100"
                type="button"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Additional actions */}
          {children}
        </div>

        {/* Filter options */}
        {showFilters && filters.length > 0 && (
          <div className="flex flex-wrap gap-2 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <span className="text-sm font-medium text-gray-700 mr-2 flex-shrink-0">
              Filter by:
            </span>
            <div className="flex flex-wrap gap-2">
              {filters.map(filter => (
                <AdminButton
                  key={filter.value}
                  variant={filter.active ? 'admin-primary' : 'outline'}
                  size="sm"
                  onClick={() => onFilterChange?.(filter.value)}
                  className="text-xs h-8 px-3"
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
                  className="text-xs text-gray-500 hover:text-gray-700 h-8 px-3"
                >
                  Clear all
                </AdminButton>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }
);

FilterBar.displayName = 'FilterBar';

export { FilterBar, type FilterOption };
