import { QuantitySelector } from '@/components/shared/QuantitySelector';

interface CartItemProps {
  id: string;
  name: string;
  price: number;
  quantity: number;
  availableStock: number;
  imageUrl?: string;
  onUpdateQuantity: (id: string, newQuantity: number) => void;
  onRemove: (id: string) => void;
}

export function CartItem({
  id,
  name,
  price,
  quantity,
  availableStock,
  imageUrl,
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
    <div className="">
      <div className="flex items-center space-x-4">
        {/* Left side: Product image */}
        {imageUrl && (
          <div className="flex-shrink-0">
            <img
              src={imageUrl}
              alt={name}
              className="w-[60px] h-[60px] rounded-md object-cover"
              width={60}
              height={60}
            />
          </div>
        )}

        {/* Middle: Product info */}
        <div className="flex-1">
          <h3 className="font-medium text-lg">{name}</h3>
          <p className="text-gray-600">
            €{price.toFixed(2)} each
          </p>
        </div>

        {/* Right side: Quantity controls */}
        <div className="flex-shrink-0">
          <QuantitySelector
            quantity={quantity}
            onIncrease={handleIncreaseQuantity}
            onDecrease={handleDecreaseQuantity}
            maxQuantity={availableStock}
            minQuantity={0}
            size="md"
          />
        </div>
      </div>

    </div>
  );
}
