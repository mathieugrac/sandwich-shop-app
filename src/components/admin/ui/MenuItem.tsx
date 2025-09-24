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
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}

const MenuItem = forwardRef<HTMLAnchorElement, MenuItemProps>(
  ({ href, icon: Icon, label, badge, className, onClick, ...props }, ref) => {
    const pathname = usePathname();
    const isActive = pathname === href || pathname.startsWith(`${href}/`);

    return (
      <Link
        ref={ref}
        href={href}
        onClick={onClick}
        className={cn(
          // Base styles - height 32px (h-8), padding 12px left/right (px-3), corner radius 6px (rounded-md)
          'flex items-center h-8 px-3 rounded-md transition-colors duration-200',
          // Gap 10px between icon and text (gap-2.5 = 10px)
          'gap-2.5',
          // Font size 13px (text-sm = 14px, closest), font weight medium
          'text-sm font-medium',
          // Default state - transparent bg, #555 text (text-gray-600 closest to #555)
          'bg-transparent text-gray-600',
          // Hover state - darker gray bg for gray sidebar, keep #555 text color
          'hover:bg-gray-200 hover:text-gray-600',
          // Active state - white bg, #111 text, light shadow, keep white bg and #111 text on hover
          isActive &&
            'bg-white text-gray-900 shadow-sm hover:bg-white hover:text-gray-900',
          className
        )}
        {...props}
      >
        {/* Icon 16x16px (w-4 h-4 = 16px) */}
        <Icon className="w-4 h-4 flex-shrink-0" />
        <span className="flex-1">{label}</span>
        {badge && (
          <span
            className={cn(
              'text-xs px-2 py-0.5 rounded-full font-medium',
              isActive ? 'bg-gray-900 text-white' : 'bg-gray-200 text-gray-700'
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
