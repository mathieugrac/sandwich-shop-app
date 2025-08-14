import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Trash2 } from 'lucide-react';
import { QuantitySelector } from '@/components/shared/QuantitySelector';

interface CartItemProps {
  id: string;
  name: string;
  price: number;
  quantity: number;
  onUpdateQuantity: (id: string, newQuantity: number) => void;
  onRemove: (id: string) => void;
}

export function CartItem({
  id,
  name,
  price,
  quantity,
  onUpdateQuantity,
  onRemove,
}: CartItemProps) {
  const handleIncreaseQuantity = () => {
    onUpdateQuantity(id, quantity + 1);
  };

  const handleDecreaseQuantity = () => {
    if (quantity > 1) {
      onUpdateQuantity(id, quantity - 1);
    }
  };

  const handleRemove = () => {
    onRemove(id);
  };

  return (
    <Card className="p-4">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h3 className="font-medium text-lg">{name}</h3>
          <p className="text-gray-600">
            €{price.toFixed(2)} each
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <QuantitySelector
            quantity={quantity}
            onIncrease={handleIncreaseQuantity}
            onDecrease={handleDecreaseQuantity}
            minQuantity={1}
            size="sm"
          />
        </div>
      </div>

      <div className="mt-3 flex justify-between items-center">
        <span className="text-gray-600">
          Total: €{(price * quantity).toFixed(2)}
        </span>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleRemove}
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
          aria-label={`Remove ${name} from cart`}
        >
          <Trash2 className="h-4 w-4 mr-1" />
          Remove
        </Button>
      </div>
    </Card>
  );
}
