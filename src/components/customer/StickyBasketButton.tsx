'use client';

import { Button } from '@/components/ui/button';
import { useCart } from '@/lib/cart-context';
import { useRouter } from 'next/navigation';

export function StickyBasketButton() {
  const { totalItems, totalPrice } = useCart();
  const router = useRouter();

  if (totalItems === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-10 left-1/2 transform -translate-x-1/2 z-50">
      <Button 
        className="bg-black text-white rounded-lg py-4 px-8 text-lg font-medium shadow-lg"
        onClick={() => router.push('/cart')}
      >
        View Basket ({totalItems}) - €{totalPrice.toFixed(2)}
      </Button>
    </div>
  );
}
