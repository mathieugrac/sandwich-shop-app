import { Card } from '@/components/ui/card';
import { QuantitySelector } from '@/components/shared/QuantitySelector';

interface CartItemProps {
  id: string;
  name: string;
  price: number;
  quantity: number;
  availableStock: number;
  onUpdateQuantity: (id: string, newQuantity: number) => void;
  onRemove: (id: string) => void;
}

export function CartItem({
  id,
  name,
  price,
  quantity,
  availableStock,
  onUpdateQuantity,
  onRemove,
}: CartItemProps) {
  const handleIncreaseQuantity = () => {
    if (quantity < availableStock) {
      onUpdateQuantity(id, quantity + 1);
    }
  };

  const handleDecreaseQuantity = () => {
    if (quantity > 1) {
      onUpdateQuantity(id, quantity - 1);
    } else if (quantity === 1) {
      // When quantity reaches 0, remove the item
      onRemove(id);
    }
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
            maxQuantity={availableStock}
            minQuantity={0}
            size="sm"
          />
        </div>
      </div>
    </Card>
  );
}
