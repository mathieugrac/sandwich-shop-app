import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { forwardRef } from 'react';

interface AdminInputProps extends React.ComponentProps<'input'> {
  inputSize?: 'sm' | 'md' | 'lg';
}

// AdminInput - Enhanced input with admin styling
const AdminInput = forwardRef<HTMLInputElement, AdminInputProps>(
  ({ className, type, ...props }, ref) => (
    <Input
      type={type}
      className={cn(
        'border-gray-300 focus:border-black focus:ring-black',
        'rounded-md px-3 py-2 text-sm',
        'placeholder:text-gray-500',
        'transition-colors duration-200',
        className
      )}
      ref={ref}
      {...props}
    />
  )
);
AdminInput.displayName = 'AdminInput';

// AdminLabel - Enhanced label with admin styling
const AdminLabel = forwardRef<
  React.ElementRef<typeof Label>,
  React.ComponentPropsWithoutRef<typeof Label>
>(({ className, ...props }, ref) => (
  <Label
    ref={ref}
    className={cn('text-sm font-medium text-gray-900', 'mb-2 block', className)}
    {...props}
  />
));
AdminLabel.displayName = 'AdminLabel';

// AdminInputGroup - Wrapper for input with label
interface AdminInputGroupProps {
  label: string;
  children: React.ReactNode;
  required?: boolean;
  error?: string;
  className?: string;
}

const AdminInputGroup = forwardRef<HTMLDivElement, AdminInputGroupProps>(
  ({ label, children, required, error, className, ...props }, ref) => (
    <div ref={ref} className={cn('space-y-2', className)} {...props}>
      <AdminLabel>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </AdminLabel>
      {children}
      {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
    </div>
  )
);
AdminInputGroup.displayName = 'AdminInputGroup';

export { AdminInput, AdminLabel, AdminInputGroup };
