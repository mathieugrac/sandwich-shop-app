import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { forwardRef } from 'react';
import { VariantProps } from 'class-variance-authority';

export interface AdminButtonProps extends React.ComponentProps<'button'> {
  variant?:
    | 'default'
    | 'destructive'
    | 'outline'
    | 'secondary'
    | 'ghost'
    | 'link'
    | 'admin-primary'
    | 'admin-secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  asChild?: boolean;
}

const AdminButton = forwardRef<HTMLButtonElement, AdminButtonProps>(
  ({ className, variant = 'default', size, asChild, ...props }, ref) => {
    // Admin-specific variant styles
    const adminVariantStyles = {
      'admin-primary':
        'bg-black hover:bg-gray-800 text-white font-medium shadow-sm',
      'admin-secondary':
        'bg-gray-100 hover:bg-gray-200 text-gray-900 border border-gray-300 font-medium',
    };

    // Admin-specific size overrides
    const adminSizeStyles = {
      icon: 'size-8', // 32x32px instead of shadcn's default 36x36px
    };

    // Use admin variant styles if it's an admin variant, otherwise pass through to shadcn
    const isAdminVariant = variant?.startsWith('admin-');
    const shadcnVariant = isAdminVariant ? 'default' : variant;
    const adminStyles = isAdminVariant
      ? adminVariantStyles[variant as keyof typeof adminVariantStyles]
      : '';

    // Apply admin size override for icon size
    const adminSizeOverride = size === 'icon' ? adminSizeStyles.icon : '';

    return (
      <Button
        className={cn(
          // Admin-specific base styles
          'transition-colors duration-200',
          // Apply admin variant styles
          adminStyles,
          // Apply admin size overrides
          adminSizeOverride,
          // Ghost variant hover - match MenuItem hover background
          variant === 'ghost' && 'hover:bg-gray-200',
          className
        )}
        variant={shadcnVariant as any}
        size={size}
        asChild={asChild}
        ref={ref}
        {...props}
      />
    );
  }
);

AdminButton.displayName = 'AdminButton';

export { AdminButton };
