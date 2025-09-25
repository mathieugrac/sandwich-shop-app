import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { forwardRef } from 'react';

export interface AdminBadgeProps extends React.ComponentProps<'span'> {
  variant?:
    | 'default'
    | 'secondary'
    | 'destructive'
    | 'outline'
    | 'success'
    | 'warning'
    | 'info';
  asChild?: boolean;
}

const AdminBadge = forwardRef<HTMLSpanElement, AdminBadgeProps>(
  ({ className, variant = 'default', asChild, ...props }, ref) => {
    // Admin-specific badge variants
    const adminVariantStyles = {
      success:
        'bg-green-100 text-green-800 border-green-200 hover:bg-green-200',
      warning:
        'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200',
      info: 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200',
    };

    // Check if it's an admin-specific variant
    const isAdminVariant = ['success', 'warning', 'info'].includes(variant);
    const shadcnVariant = isAdminVariant ? 'outline' : variant;
    const adminStyles = isAdminVariant
      ? adminVariantStyles[variant as keyof typeof adminVariantStyles]
      : '';

    return (
      <Badge
        className={cn(
          // Admin-specific base styles
          'font-medium text-xs px-1.5 py-0.5',
          'border transition-colors duration-200',
          // Apply admin variant styles
          adminStyles,
          className
        )}
        variant={shadcnVariant as any}
        asChild={asChild}
        ref={ref}
        {...props}
      />
    );
  }
);

AdminBadge.displayName = 'AdminBadge';

export { AdminBadge };
