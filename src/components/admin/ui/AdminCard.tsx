import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { forwardRef } from 'react';

// AdminCard - Enhanced card with admin styling
const AdminCard = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <Card
    ref={ref}
    className={cn(
      'border border-gray-200 shadow-xs bg-white',
      'rounded-lg overflow-hidden',
      'py-0', // Override default py-6 from base Card
      className
    )}
    {...props}
  />
));
AdminCard.displayName = 'AdminCard';

// AdminCardHeader - Enhanced header with admin styling
const AdminCardHeader = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <CardHeader
    ref={ref}
    className={cn('px-6 py-4 no-border', className)}
    {...props}
  />
));
AdminCardHeader.displayName = 'AdminCardHeader';

// AdminCardTitle - Enhanced title styling
const AdminCardTitle = forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <CardTitle
    ref={ref}
    className={cn('text-lg font-semibold text-gray-900', className)}
    {...props}
  />
));
AdminCardTitle.displayName = 'AdminCardTitle';

// AdminCardDescription - Enhanced description styling
const AdminCardDescription = forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <CardDescription
    ref={ref}
    className={cn('text-sm text-gray-600 mt-1', className)}
    {...props}
  />
));
AdminCardDescription.displayName = 'AdminCardDescription';

// AdminCardContent - Enhanced content with consistent padding
const AdminCardContent = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <CardContent
    ref={ref}
    className={cn('px-6 py-6 pt-2', className)}
    {...props}
  />
));
AdminCardContent.displayName = 'AdminCardContent';

// AdminCardFooter - Enhanced footer with admin styling
const AdminCardFooter = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <CardFooter
    ref={ref}
    className={cn(
      'px-6 py-4 border-t border-gray-100 bg-gray-50',
      'flex items-center justify-between',
      className
    )}
    {...props}
  />
));
AdminCardFooter.displayName = 'AdminCardFooter';

export {
  AdminCard,
  AdminCardHeader,
  AdminCardTitle,
  AdminCardDescription,
  AdminCardContent,
  AdminCardFooter,
};
