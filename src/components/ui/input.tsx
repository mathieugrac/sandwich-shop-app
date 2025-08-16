import * as React from 'react';

import { cn } from '@/lib/utils';

interface InputProps extends React.ComponentProps<'input'> {
  inputSize?: 'sm' | 'md' | 'lg';
}

function Input({ className, type, inputSize = 'md', ...props }: InputProps) {
  const sizeClasses = {
    sm: 'h-8 px-2 py-1 text-sm',
    md: 'h-10 px-3 py-2 text-base', // 16px font size
    lg: 'h-12 px-4 py-3 text-lg',
  };

  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex w-full min-w-0 rounded-md border bg-transparent shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
        'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
        'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
        sizeClasses[inputSize],
        className
      )}
      {...props}
    />
  );
}

export { Input };
