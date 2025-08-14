'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect, useMemo, useCallback } from 'react';

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
import { Plus, Minus, MapPin, Clock } from 'lucide-react';
import { PageHeader, PageLayout } from '@/components/shared';

// Interface for drop information
interface DropInfo {
  date: string;
  location: {
    name: string;
    district: string;
    location_url?: string;
    pickup_hour_start: string;
    pickup_hour_end: string;
  };
  pickup_hour_start: string;
  pickup_hour_end: string;
}

// Function to generate pickup time slots based on location hours
const generatePickupTimes = (startTime: string, endTime: string): string[] => {
  const times: string[] = [];
  const start = new Date(`2000-01-01T${startTime}`);
  const end = new Date(`2000-01-01T${endTime}`);
  
  // Add 15-minute intervals
  const current = new Date(start);
  while (current <= end) {
    times.push(current.toTimeString().slice(0, 5));
    current.setMinutes(current.getMinutes() + 15);
  }
  
  return times;
};

// Function to format time with AM/PM
const formatTimeWithAMPM = (timeString: string): string => {
  const [hours, minutes] = timeString.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'pm' : 'am';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  
  if (minutes === '00') {
    return `${displayHour}${ampm}`;
  } else {
    return `${displayHour}:${minutes}${ampm}`;
  }
};

// Function to format pickup time range
const formatPickupTimeRange = (startTime: string, endTime: string): string => {
  const startFormatted = formatTimeWithAMPM(startTime);
  const endFormatted = formatTimeWithAMPM(endTime);
  return `${startFormatted} - ${endFormatted}`;
};

export default function CartPage() {
  const router = useRouter();
  const { items, removeFromCart, updateQuantity, clearCart, totalPrice } =
    useCart();
  const [selectedTime, setSelectedTime] = useState('');
  const [comment, setComment] = useState('');
  const [isLoading] = useState(false);
  const [dropInfo, setDropInfo] = useState<DropInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Generate pickup times based on location hours
  const pickupTimes = useMemo(() => {
    if (!dropInfo?.location?.pickup_hour_start || !dropInfo?.location?.pickup_hour_end) {
      return [];
    }
    return generatePickupTimes(
      dropInfo.location.pickup_hour_start,
      dropInfo.location.pickup_hour_end
    );
  }, [dropInfo?.location?.pickup_hour_start, dropInfo?.location?.pickup_hour_end]);

  // Memoized formatting functions
  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      month: 'long',
      day: 'numeric',
    };
    return date.toLocaleDateString('en-US', options);
  }, []);

  // Load drop information from localStorage
  useEffect(() => {
    const savedDrop = localStorage.getItem('currentDrop');
    if (savedDrop) {
      try {
        const parsedDrop = JSON.parse(savedDrop);
        // Validate the structure
        if (parsedDrop?.location?.pickup_hour_start && parsedDrop?.location?.pickup_hour_end) {
          setDropInfo(parsedDrop);
          setError(null);
        } else {
          setError('Invalid drop information format');
          console.error('Drop info missing required fields:', parsedDrop);
        }
      } catch (error) {
        setError('Failed to load drop information');
        console.error('Error parsing drop info:', error);
      }
    } else {
      setError('No drop information found');
    }
  }, []);

  // Handle back navigation
  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  // Handle clear cart
  const handleClearCart = useCallback(() => {
    clearCart();
    localStorage.removeItem('currentDrop');
    router.push('/');
  }, [clearCart, router]);

  // Handle place order
  const handlePlaceOrder = useCallback(() => {
    if (!selectedTime) {
      setError('Please select a pickup time');
      return;
    }

    if (!dropInfo) {
      setError('Drop information is missing');
      return;
    }

    try {
      // Save pickup time and special instructions to localStorage for checkout
      localStorage.setItem('pickupTime', selectedTime);
      localStorage.setItem('specialInstructions', comment);
      setError(null);

      // Navigate to checkout page
      router.push('/checkout');
    } catch (error) {
      setError('Failed to save order information');
      console.error('Error saving order info:', error);
    }
  }, [selectedTime, comment, dropInfo, router]);

  // If cart is empty, redirect to home
  useEffect(() => {
    if (items.length === 0) {
      router.push('/');
    }
  }, [items.length, router]);

  if (items.length === 0) {
    return null; // Will redirect
  }

  // Show error state if there's an error
  if (error && !dropInfo) {
    return (
      <PageLayout>
        <PageHeader 
          title="Error Loading Order"
          subtitle="Unable to load drop information"
          onBackClick={handleBack}
        />
        <main className="px-5 py-8">
          <Card className="p-6 text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={handleBack} variant="outline">
              Go Back
            </Button>
          </Card>
        </main>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <PageHeader 
        title={dropInfo ? `${formatDate(dropInfo.date)} (${formatPickupTimeRange(dropInfo.location.pickup_hour_start, dropInfo.location.pickup_hour_end)})` : "Your Order"}
        subtitle={dropInfo ? `${dropInfo.location.name}, ${dropInfo.location.district}` : "Cart"}
        showMapPin={!!dropInfo?.location?.location_url}
        locationUrl={dropInfo?.location?.location_url}
        onBackClick={handleBack}
      />

      <main className="px-5">
        <div className="space-y-6 py-4">
          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

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
                        aria-label={`Decrease quantity of ${item.name}`}
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
                        aria-label={`Increase quantity of ${item.name}`}
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
                      aria-label={`Remove ${item.name} from cart`}
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
            <h2 className="text-xl font-semibold mb-4">Special Instructions</h2>
            <Textarea
              placeholder="Any special requests or dietary requirements?"
              value={comment}
              onChange={e => setComment(e.target.value)}
              className="min-h-[100px]"
              aria-label="Special instructions for your order"
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
                  <SelectTrigger className="w-32" aria-label="Select pickup time">
                    <SelectValue placeholder="Select time" />
                  </SelectTrigger>
                  <SelectContent>
                    {pickupTimes.length > 0 ? (
                      pickupTimes.map(time => (
                        <SelectItem key={time} value={time}>
                          {formatTimeWithAMPM(time)}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="" disabled>
                        No times available
                      </SelectItem>
                    )}
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
                <p className="text-gray-700 mb-3">
                  {dropInfo?.location?.name || 'Location not specified'}
                </p>
                {dropInfo?.location?.location_url && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      window.open(dropInfo.location.location_url, '_blank')
                    }
                    className="w-full"
                    aria-label="Open location in maps"
                  >
                    Open in Maps
                  </Button>
                )}
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
          disabled={isLoading || !selectedTime || !dropInfo}
          className="w-full bg-black text-white py-4 text-lg font-medium"
          aria-label="Place your order"
        >
          {isLoading ? 'Processing...' : 'Place Order'}
        </Button>
      </div>
    </PageLayout>
  );
}
