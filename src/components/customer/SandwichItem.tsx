import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus, Minus } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';

interface SandwichItemProps {
  name: string;
  description?: string;
  price: number;
  availableStock: number;
  imageUrl?: string;
  onAddToCart: () => void;
  onUpdateQuantity?: (newQuantity: number) => void;
  onRemoveFromCart?: () => void;
  initialQuantity?: number;
}

export function SandwichItem({
  name,
  description,
  price,
  availableStock,
  imageUrl,
  onAddToCart,
  onUpdateQuantity,
  onRemoveFromCart,
  initialQuantity = 0,
}: SandwichItemProps) {
  const [quantity, setQuantity] = useState(initialQuantity);
  const [isInCart, setIsInCart] = useState(initialQuantity > 0);

  const isSoldOut = availableStock === 0;
  const isLowStock = availableStock <= 3 && availableStock > 0;

  const handleAddToCart = () => {
    if (quantity === 0) {
      const newQuantity = 1;
      setQuantity(newQuantity);
      setIsInCart(true);
      onAddToCart();
    }
  };

  const handleIncreaseQuantity = () => {
    if (quantity < availableStock) {
      const newQuantity = quantity + 1;
      setQuantity(newQuantity);
      if (onUpdateQuantity) {
        onUpdateQuantity(newQuantity);
      } else {
        onAddToCart(); // Fallback for backward compatibility
      }
    }
  };

  const handleDecreaseQuantity = () => {
    if (quantity > 1) {
      const newQuantity = quantity - 1;
      setQuantity(newQuantity);
      if (onUpdateQuantity) {
        onUpdateQuantity(newQuantity);
      }
    } else if (quantity === 1) {
      setQuantity(0);
      setIsInCart(false);
      if (onRemoveFromCart) {
        onRemoveFromCart();
      }
    }
  };

  return (
    <Card className="overflow-hidden py-0">
      {/* Image Section */}
      <div className="relative">
        <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={name}
              width={400}
              height={192}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-gray-400 text-sm">Image placeholder</div>
          )}
        </div>

        {/* Add to Cart Button / Quantity Control */}
        {!isInCart ? (
          <Button
            size="sm"
            className="absolute bottom-3 right-2 w-10 h-10 rounded-full bg-white border border-gray-300 hover:bg-gray-50"
            onClick={handleAddToCart}
            disabled={isSoldOut}
          >
            <Plus className="h-4 w-4 text-black" />
          </Button>
        ) : (
          <div className="absolute bottom-3 right-2 bg-white border border-gray-300 rounded-full flex items-center px-[3px] py-1 h-10">
            <Button
              size="sm"
              variant="ghost"
              className="w-8 h-8 p-0 rounded-full hover:bg-gray-100"
              onClick={handleDecreaseQuantity}
              disabled={quantity <= 0}
            >
              <Minus className="h-3 w-3 text-black" />
            </Button>
            <span className="mx-2 text-sm font-medium text-black min-w-[1rem] text-center">
              {quantity}
            </span>
            <Button
              size="sm"
              variant="ghost"
              className="w-8 h-8 p-0 rounded-full hover:bg-gray-100"
              onClick={handleIncreaseQuantity}
              disabled={quantity >= availableStock}
            >
              <Plus className="h-3 w-3 text-black" />
            </Button>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-4">
        <div className="flex justify-between items-start mb-1">
          <h3 className="font-bold text-black text-lg">{name}</h3>
          <span className="text-black text-lg">€{price.toFixed(2)}</span>
        </div>

        {/* Stock Status */}
        <div className="text-sm mb-3">
          {isSoldOut ? (
            <span className="italic">SOLD OUT</span>
          ) : isLowStock ? (
            <span className="italic">
              {availableStock} sandwiches left, hurry up!
            </span>
          ) : (
            <span className="text-gray-600">
              {availableStock} sandwiches left
            </span>
          )}
        </div>

        {/* Description */}
        {description && (
          <div className="text-sm text-gray-600 leading-relaxed">
            {description}
          </div>
        )}
      </div>
    </Card>
  );
}
