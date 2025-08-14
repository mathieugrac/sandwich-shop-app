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
import { MapPin, Clock, Squirrel } from 'lucide-react';
import { PageHeader, PageLayout } from '@/components/shared';
import { CartItem } from '@/components/customer';

// Interface for drop information
interface DropInfo {
  id?: string; // Optional drop ID for navigation
  date: string;
  location: {
    name: string;
    district: string;
    address: string;
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
        <div className="space-y-5 py-5">
          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Order Section */}
          <section>
            <Card className="p-5">
              {items.length > 0 ? (
                <>
                  <h2 className="text-xl font-semibold mb-5">Your Order</h2>
                  <div className="space-y-4">
                    {items.map(item => (
                      <CartItem
                        key={item.id}
                        id={item.id}
                        name={item.name}
                        price={item.price}
                        quantity={item.quantity}
                        availableStock={item.availableStock}
                        imageUrl={item.imageUrl}
                        onUpdateQuantity={updateQuantity}
                        onRemove={removeFromCart}
                      />
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <Squirrel className="mx-auto h-12 w-12 text-gray-500 mb-4"/>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Your cart is empty</h3>
                  <p className="text-gray-500 mb-6">Add some delicious sandwiches to get started!</p>
                  <Button
                    onClick={() => {
                      if (dropInfo?.id) {
                        router.push(`/menu/${dropInfo.id}`);
                      } else {
                        router.push('/');
                      }
                    }}
                    className="bg-black text-white hover:bg-gray-800"
                  >
                    Add Products
                  </Button>
                </div>
              )}
            </Card>
          </section>

          {items.length > 0 && (
            <>
              {/* Comment Section */}
              <Card className="p-5">
                <h2 className="text-xl font-semibold mb-4">Special Instructions</h2>
                <Textarea
                  placeholder="Any special requests or dietary requirements?"
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  aria-label="Special instructions for your order"
                  className="shadow-none resize-none min-h-[80px]"
                />
              </Card>

              {/* Pickup Time */}
              <Card className="p-5">
                <h2 className="text-xl font-semibold mb-1">Pickup Time</h2>
                <p className="mb-4">Please select a an aproximate time for your order</p>
                <Select value={selectedTime} onValueChange={setSelectedTime}>
                      <SelectTrigger className="" aria-label="Select a slot">
                        <SelectValue placeholder="Select a slot" />
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
                </Card>

                {/* Location */}
                <Card className="p-5">
                   <h2 className="text-xl font-semibold mb-4">Pickup Location</h2>
                   <p className="font-semibold mb-1">
                     {dropInfo?.location?.name || 'Location not specified'}
                   </p>
                   <p className="mb-3">
                     {dropInfo?.location?.address || 'Address not specified'}
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


              {/* Price Recap */}
              <Card className="p-5">
                <div className="flex justify-between my-auto mb-4">
                  <h2 className="text-xl font-semibold">Order Summary</h2>
                  <span className="text-xl font-semibold ">€{totalPrice.toFixed(2)}</span>
                </div>
                <p>
                  Payment in cash or mbway at {dropInfo?.location?.name} during pickup.
                </p>
              </Card>
            </>
          )}
        </div>
      </main>

      {/* Sticky Place Order Button */}
      {items.length > 0 && (
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4">
          <Button
            onClick={handlePlaceOrder}
            disabled={isLoading || !selectedTime || !dropInfo}
            className="w-full bg-black text-white py-4 text-lg font-medium rounded-full"
            aria-label="Continue to checkout"
            size="lg"
          >
            {isLoading ? 'Processing...' : 'Continue'}
          </Button>
        </div>
      )}
    </PageLayout>
  );
}
