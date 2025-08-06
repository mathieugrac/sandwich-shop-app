'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

import { useCart } from '@/lib/cart-context';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { X, Trash2, Plus, Minus, MapPin, Clock } from 'lucide-react';

// Mock data for pickup times (12:00 - 14:00 in 15-min intervals)
const pickupTimes = [
  '12:00',
  '12:15',
  '12:30',
  '12:45',
  '13:00',
  '13:15',
  '13:30',
  '13:45',
  '14:00',
];

// Mock shop address (to be replaced with real address)
const shopAddress = '123 Sandwich Street, City, Country';

export default function CartPage() {
  const router = useRouter();
  const { items, removeFromCart, updateQuantity, clearCart, totalPrice } =
    useCart();
  const [selectedTime, setSelectedTime] = useState('');
  const [comment, setComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Handle back navigation
  const handleBack = () => {
    router.back();
  };

  // Handle clear cart
  const handleClearCart = () => {
    clearCart();
    router.push('/');
  };

  // Handle place order
  const handlePlaceOrder = async () => {
    if (!selectedTime) {
      alert('Please select a pickup time');
      return;
    }

    setIsLoading(true);
    // TODO: Implement order placement logic
    console.log('Placing order:', { items, selectedTime, comment, totalPrice });
    setIsLoading(false);
  };

  // If cart is empty, redirect to home
  useEffect(() => {
    if (items.length === 0) {
      router.push('/');
    }
  }, [items.length, router]);

  if (items.length === 0) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-[480px] mx-auto bg-white min-h-screen">
        {/* Sticky Header */}
        <div className="sticky top-0 z-40 bg-white border-b border-gray-200 px-4 py-3 flex justify-between items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="p-2"
          >
            <X className="h-5 w-5" />
          </Button>

          <h1 className="text-lg font-semibold">Your Order</h1>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearCart}
            className="p-2 text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-5 w-5" />
          </Button>
        </div>

        <main className="px-5">
          <div className="space-y-6 py-4">
            {/* Items Section */}
            <section>
              <h2 className="text-xl font-semibold mb-4">Items</h2>
              <div className="space-y-3">
                {items.map(item => (
                  <Card key={item.id} className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-medium text-lg">{item.name}</h3>
                        <p className="text-gray-600">
                          €{item.price.toFixed(2)} each
                        </p>
                      </div>

                      <div className="flex items-center space-x-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            updateQuantity(item.id, item.quantity - 1)
                          }
                          disabled={item.quantity <= 1}
                          className="w-8 h-8 p-0"
                        >
                          <Minus className="h-4 w-4" />
                        </Button>

                        <span className="text-lg font-medium min-w-[2rem] text-center">
                          {item.quantity}
                        </span>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            updateQuantity(item.id, item.quantity + 1)
                          }
                          className="w-8 h-8 p-0"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="mt-3 flex justify-between items-center">
                      <span className="text-gray-600">
                        Total: €{(item.price * item.quantity).toFixed(2)}
                      </span>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFromCart(item.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        Remove
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </section>

            <Separator />

            {/* Comment Section */}
            <section>
              <h2 className="text-xl font-semibold mb-4">
                Special Instructions
              </h2>
              <Textarea
                placeholder="Any special requests or dietary requirements?"
                value={comment}
                onChange={e => setComment(e.target.value)}
                className="min-h-[100px]"
              />
            </section>

            <Separator />

            {/* Delivery Section */}
            <section>
              <h2 className="text-xl font-semibold mb-4">Pickup Details</h2>

              {/* Pickup Time */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-5 w-5 text-gray-600" />
                    <span className="font-medium">Pickup Time</span>
                  </div>
                  <Select value={selectedTime} onValueChange={setSelectedTime}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Select time" />
                    </SelectTrigger>
                    <SelectContent>
                      {pickupTimes.map(time => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Location */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <MapPin className="h-5 w-5 text-gray-600" />
                  <span className="font-medium">Pickup Location</span>
                </div>
                <Card className="p-4">
                  <p className="text-gray-700 mb-3">{shopAddress}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      window.open(
                        `https://maps.google.com/?q=${encodeURIComponent(shopAddress)}`,
                        '_blank'
                      )
                    }
                    className="w-full"
                  >
                    Open in Google Maps
                  </Button>
                </Card>
              </div>
            </section>

            <Separator />

            {/* Price Recap */}
            <section>
              <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
              <Card className="p-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>€{totalPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total:</span>
                    <span>€{totalPrice.toFixed(2)}</span>
                  </div>
                </div>
              </Card>
            </section>
          </div>
        </main>

        {/* Sticky Place Order Button */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4">
          <Button
            onClick={handlePlaceOrder}
            disabled={isLoading || !selectedTime}
            className="w-full bg-black text-white py-4 text-lg font-medium"
          >
            {isLoading ? 'Processing...' : 'Place Order'}
          </Button>
        </div>
      </div>
    </div>
  );
}
