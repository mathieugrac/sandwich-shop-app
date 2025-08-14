import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import { QuantitySelector } from '@/components/shared/QuantitySelector';
import Image from 'next/image';
import { useState } from 'react';

interface ProductImage {
  id: string;
  image_url: string;
  alt_text: string | null;
  sort_order: number;
}

interface SandwichItemProps {
  name: string;
  description?: string;
  price: number;
  availableStock: number;
  images?: ProductImage[];
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
  images,
  onAddToCart,
  onUpdateQuantity,
  onRemoveFromCart,
  initialQuantity = 0,
}: SandwichItemProps) {
  const [quantity, setQuantity] = useState(initialQuantity);
  const [isInCart, setIsInCart] = useState(initialQuantity > 0);

  const isSoldOut = availableStock === 0;
  const isLowStock = availableStock <= 3 && availableStock > 0;

  // Get the first image (sorted by sort_order)
  const firstImage =
    images && images.length > 0
      ? images.sort((a, b) => a.sort_order - b.sort_order)[0]
      : null;

  const handleAddToCart = () => {
    if (quantity === 0) {
      const newQuantity = 1;
      setQuantity(newQuantity);
      setIsInCart(true);
      onAddToCart();
      console.log('Added to cart, quantity:', newQuantity, 'isInCart:', true);
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
    <Card
      className={`overflow-hidden py-0 ${isSoldOut ? 'shadow-none' : 'shadow-xs'}`}
    >
      {/* Image Section */}
      <div className="relative">
        <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
          {firstImage ? (
            <Image
              src={firstImage.image_url}
              alt={firstImage.alt_text || name}
              width={400}
              height={192}
              className="w-full h-full object-cover"
              priority
            />
          ) : (
            <div className="text-gray-400 text-sm">No image available</div>
          )}
        </div>

        {/* Add to Cart Button / Quantity Control */}
        {!isSoldOut && !isInCart ? (
          <Button
            size="sm"
            className="absolute bottom-3 right-2 w-10 h-10 rounded-full bg-white border border-gray-300 hover:bg-gray-50"
            onClick={handleAddToCart}
          >
            <Plus className="h-4 w-4 text-black" />
          </Button>
        ) : !isSoldOut && isInCart ? (
          <div className="absolute bottom-3 right-2">
            <QuantitySelector
              quantity={quantity}
              onIncrease={handleIncreaseQuantity}
              onDecrease={handleDecreaseQuantity}
              maxQuantity={availableStock}
              minQuantity={0}
              size="md"
            />
          </div>
        ) : null}
      </div>

      {/* Content Section */}
      <div className="p-4">
        <div className="flex justify-between items-start mb-1">
          <h3
            className={`font-bold text-lg ${isSoldOut ? 'text-gray-400' : 'text-black'}`}
          >
            {name}
          </h3>
          <span
            className={`text-lg ${isSoldOut ? 'text-gray-400' : 'text-black'}`}
          >
            €{price.toFixed(2)}
          </span>
        </div>

        {/* Stock Status */}
        <div className="text-sm mb-3">
          {isSoldOut ? (
            <span className="italic text-gray-400">SOLD OUT</span>
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
          <div
            className={`text-sm leading-relaxed ${isSoldOut ? 'text-gray-400' : 'text-gray-600'}`}
          >
            {description}
          </div>
        )}
      </div>
    </Card>
  );
}
