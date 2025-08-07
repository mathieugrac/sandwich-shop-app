import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import Image from 'next/image';

interface SandwichItemProps {
  name: string;
  description?: string;
  price: number;
  availableStock: number;
  imageUrl?: string;
  onAddToCart: () => void;
}

export function SandwichItem({
  name,
  description,
  price,
  availableStock,
  imageUrl,
  onAddToCart,
}: SandwichItemProps) {
  const isSoldOut = availableStock === 0;
  const isLowStock = availableStock <= 3 && availableStock > 0;

  return (
    <Card className="overflow-hidden">
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

        {/* Add to Cart Button */}
        <Button
          size="sm"
          className="absolute bottom-2 right-2 w-10 h-10 rounded-full bg-white border border-gray-300 hover:bg-gray-50"
          onClick={onAddToCart}
          disabled={isSoldOut}
        >
          <Plus className="h-4 w-4 text-black" />
        </Button>
      </div>

      {/* Content Section */}
      <div className="p-3">
        <div className="flex justify-between items-start mb-1">
          <h3 className="font-bold text-black text-lg">{name}</h3>
          <span className="text-black text-lg">€{price.toFixed(2)}</span>
        </div>

        {/* Stock Status */}
        <div className="text-sm text-gray-600 mb-2">
          {isSoldOut ? (
            <span className="italic text-gray-400">SOLD OUT</span>
          ) : isLowStock ? (
            <span className="italic text-gray-600">
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
