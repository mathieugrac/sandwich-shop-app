import { Button } from '@/components/ui/button';
import { Plus, Minus } from 'lucide-react';

/**
 * A reusable quantity selector component with increase/decrease buttons
 * 
 * @example
 * ```tsx
 * <QuantitySelector
 *   quantity={2}
 *   onIncrease={() => setQuantity(q => q + 1)}
 *   onDecrease={() => setQuantity(q => q - 1)}
 *   maxQuantity={10}
 *   size="md"
 * />
 * ```
 */
interface QuantitySelectorProps {
  /** Current quantity value */
  quantity: number;
  /** Callback when increase button is clicked */
  onIncrease: () => void;
  /** Callback when decrease button is clicked */
  onDecrease: () => void;
  /** Maximum allowed quantity (optional) */
  maxQuantity?: number;
  /** Minimum allowed quantity (defaults to 0) */
  minQuantity?: number;
  /** Whether the component is disabled */
  disabled?: boolean;
  /** Size variant: sm, md, lg, or xl */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Additional CSS classes */
  className?: string;
}

export function QuantitySelector({
  quantity,
  onIncrease,
  onDecrease,
  maxQuantity,
  minQuantity = 0,
  disabled = false,
  size = 'md',
  className = '',
}: QuantitySelectorProps) {
  const isIncreaseDisabled = disabled || (maxQuantity !== undefined && quantity >= maxQuantity);
  const isDecreaseDisabled = disabled || quantity <= minQuantity;

  const sizeClasses = {
    sm: 'h-8 text-xs',
    md: 'h-10 text-sm',
    lg: 'h-12 text-base',
    xl: 'h-12 text-base',
  };

  const buttonSizeClasses = {
    sm: 'w-6 h-6 p-0',
    md: 'w-8 h-8 p-0',
    lg: 'w-10 h-10 p-0',
    xl: 'w-[42px] h-[42px] p-0',
  };

  const iconSizes = {
    sm: 'h-2.5 w-2.5',
    md: 'h-3 w-3',
    lg: 'h-4 w-4',
    xl: 'h-5 w-5',
  };

  return (
    <div className={`bg-white border border-gray-300 rounded-full flex items-center px-[2px] py-1 ${sizeClasses[size]} ${className}`}>
      <Button
        size="sm"
        variant="ghost"
        className={`${buttonSizeClasses[size]} rounded-full hover:bg-gray-100`}
        onClick={onDecrease}
        disabled={isDecreaseDisabled}
      >
        <Minus className={`${iconSizes[size]} text-black`} />
      </Button>
      
      <span className={`mx-2 font-medium text-black min-w-[1rem] text-center`}>
        {quantity}
      </span>
      
      <Button
        size="sm"
        variant="ghost"
        className={`${buttonSizeClasses[size]} rounded-full hover:bg-gray-100`}
        onClick={onIncrease}
        disabled={isIncreaseDisabled}
      >
        <Plus className={`${iconSizes[size]} text-black`} />
      </Button>
    </div>
  );
}
