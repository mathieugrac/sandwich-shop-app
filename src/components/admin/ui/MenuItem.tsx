import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';
import { forwardRef } from 'react';

interface MenuItemProps {
  href: string;
  icon: LucideIcon;
  label: string;
  badge?: string | number;
  className?: string;
}

const MenuItem = forwardRef<HTMLAnchorElement, MenuItemProps>(
  ({ href, icon: Icon, label, badge, className, ...props }, ref) => {
    const pathname = usePathname();
    const isActive = pathname === href || pathname.startsWith(`${href}/`);

    return (
      <Link
        ref={ref}
        href={href}
        className={cn(
          // Base styles
          'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200',
          // Default state
          'text-gray-700 hover:text-gray-900 hover:bg-gray-100',
          // Active state
          isActive && 'bg-black text-white hover:bg-gray-800 hover:text-white',
          className
        )}
        {...props}
      >
        <Icon className="w-5 h-5 flex-shrink-0" />
        <span className="flex-1">{label}</span>
        {badge && (
          <span
            className={cn(
              'text-xs px-2 py-0.5 rounded-full font-medium',
              isActive ? 'bg-white text-black' : 'bg-gray-200 text-gray-700'
            )}
          >
            {badge}
          </span>
        )}
      </Link>
    );
  }
);

MenuItem.displayName = 'MenuItem';

export { MenuItem };
