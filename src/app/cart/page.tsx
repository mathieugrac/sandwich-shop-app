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
import { MapPin, Clock, AlertCircle } from 'lucide-react';
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

  // Add 30-minute intervals
  const current = new Date(start);
  while (current <= end) {
    times.push(current.toTimeString().slice(0, 5));
    current.setMinutes(current.getMinutes() + 30);
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

export default function CartPage() {
  const router = useRouter();
  const {
    items,
    removeFromCart,
    updateQuantity,
    clearCart,
    totalPrice,
    comment,
    setComment,
  } = useCart();

  // Consolidate form state
  const [formState, setFormState] = useState({
    selectedTime: '',
  });

  // Consolidate UI state
  const [uiState, setUiState] = useState({
    isLoading: false,
    isValidating: false,
    error: null as string | null,
  });

  // Separate state for drop info (complex object)
  const [dropInfo, setDropInfo] = useState<DropInfo | null>(null);

  // Generate pickup times based on location hours
  const pickupTimes = useMemo(() => {
    if (
      !dropInfo?.location?.pickup_hour_start ||
      !dropInfo?.location?.pickup_hour_end
    ) {
      return [];
    }
    return generatePickupTimes(
      dropInfo.location.pickup_hour_start,
      dropInfo.location.pickup_hour_end
    );
  }, [
    dropInfo?.location?.pickup_hour_start,
    dropInfo?.location?.pickup_hour_end,
  ]);

  // Load drop information and saved form data from localStorage
  useEffect(() => {
    const savedDrop = localStorage.getItem('currentDrop');
    const savedPickupTime = localStorage.getItem('cartPickupTime');

    if (savedDrop) {
      try {
        const parsedDrop = JSON.parse(savedDrop);
        // Validate the structure
        if (
          parsedDrop?.location?.pickup_hour_start &&
          parsedDrop?.location?.pickup_hour_end
        ) {
          setDropInfo(parsedDrop);
          setUiState(prev => ({ ...prev, error: null }));
        } else {
          setUiState(prev => ({
            ...prev,
            error: 'Invalid drop information format',
          }));
          console.error('Drop info missing required fields:', parsedDrop);
        }
      } catch (error) {
        setUiState(prev => ({
          ...prev,
          error: 'Failed to load drop information',
        }));
        console.error('Error parsing drop info:', error);
      }
    } else {
      setUiState(prev => ({ ...prev, error: 'No drop information found' }));
    }

    // Load saved form data
    if (savedPickupTime) {
      setFormState(prev => ({ ...prev, selectedTime: savedPickupTime }));
    }
    // Comment is now managed by cart context, no need to load separately
  }, []);

  // Save form data to localStorage when it changes
  useEffect(() => {
    if (formState.selectedTime) {
      localStorage.setItem('cartPickupTime', formState.selectedTime);
    }
    // Comment is now managed by cart context, no need to save separately
  }, [formState.selectedTime]);

  // Redirect to drop page when cart becomes empty
  useEffect(() => {
    if (items.length === 0 && dropInfo?.id) {
      router.push(`/drop/${dropInfo.id}`);
    } else if (items.length === 0) {
      // Fallback to home if no drop info
      router.push('/');
    }
  }, [items.length, dropInfo?.id, router]);

  // Update form state helper
  const updateFormState = (updates: Partial<typeof formState>) => {
    setFormState(prev => ({ ...prev, ...updates }));
  };

  // Update UI state helper
  const updateUiState = (updates: Partial<typeof uiState>) => {
    setUiState(prev => ({ ...prev, ...updates }));
  };

  // Handle back navigation
  const handleBack = useCallback(() => {
    // Navigate back to the drop page if we have drop info
    if (dropInfo?.id) {
      router.push(`/drop/${dropInfo.id}`);
    } else {
      // Fallback to home if no drop info
      router.push('/');
    }
  }, [router, dropInfo?.id]);

  // Handle clear cart
  const handleClearCart = useCallback(() => {
    clearCart();
    localStorage.removeItem('currentDrop');
    localStorage.removeItem('cartPickupTime');
    // Comment is now cleared automatically by clearCart()
    router.push('/');
  }, [clearCart, router]);

  // Handle place order
  const handlePlaceOrder = useCallback(() => {
    if (!formState.selectedTime) {
      updateUiState({ error: 'Please select a pickup time' });
      return;
    }

    if (!dropInfo) {
      updateUiState({ error: 'Drop information is missing' });
      return;
    }

    try {
      // Save pickup time and special instructions to localStorage for checkout
      localStorage.setItem('pickupTime', formState.selectedTime);
      localStorage.setItem('specialInstructions', comment);
      updateUiState({ error: null });

      // Navigate to checkout page
      router.push('/checkout');
    } catch (error) {
      updateUiState({ error: 'Failed to save order information' });
      console.error('Error saving order info:', error);
    }
  }, [formState.selectedTime, comment, dropInfo, router, updateUiState]);

  // Show error state if there's an error
  if (uiState.error && !dropInfo) {
    return (
      <PageLayout>
        <PageHeader
          dropData={{
            id: '',
            date: new Date().toISOString(),
            location: {
              name: 'Error Loading Order',
              district: 'Unable to load drop information',
            },
          }}
          backTarget="/"
        />
        <main className="px-5 py-8">
          <Card className="p-6 text-center">
            <p className="text-red-600 mb-4">{uiState.error}</p>
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
      {dropInfo ? (
        <PageHeader
          dropData={{
            id: dropInfo.id || '',
            date: dropInfo.date,
            location: dropInfo.location,
          }}
          backTarget={dropInfo.id ? `/drop/${dropInfo.id}` : '/'}
        />
      ) : (
        <PageHeader
          dropData={{
            id: '',
            date: new Date().toISOString(),
            location: {
              name: 'Cart',
              district: '',
            },
          }}
          backTarget="/"
        />
      )}

      <main className="px-5 pb-0">
        <div className="space-y-5 pt-5">
          {/* Drop Validation Status */}
          {uiState.isValidating && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <p className="text-blue-600 text-sm">
                  Validating drop status...
                </p>
              </div>
            </div>
          )}

          {/* General Error Display */}
          {uiState.error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-red-600 text-sm">{uiState.error}</p>
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

                  {/* Add More Button */}
                  <div className="pt-4 flex justify-start">
                    <Button
                      onClick={() => {
                        if (dropInfo?.id) {
                          router.push(`/drop/${dropInfo.id}`);
                        } else {
                          router.push('/');
                        }
                      }}
                      variant="outline"
                      className="bg-black text-white hover:bg-gray-800 hover:text-white border-black  rounded-full"
                    >
                      Add More
                    </Button>
                  </div>

                  {/* Divider */}
                  <Separator className="my-4" />

                  {/* Special Instructions */}
                  <div>
                    <Textarea
                      placeholder="Leave a comment..."
                      value={comment}
                      onChange={e => setComment(e.target.value)}
                      aria-label="Special instructions for your order"
                      className="shadow-none resize-none min-h-[60px] border-0 p-2"
                    />
                  </div>
                </>
              ) : null}
            </Card>
          </section>

          {items.length > 0 && (
            <>
              {/* Pickup Time */}
              <Card className="p-5">
                <h2 className="text-xl font-semibold mb-4">
                  Select a pickup time
                </h2>
                <Select
                  value={formState.selectedTime}
                  onValueChange={value =>
                    updateFormState({ selectedTime: value })
                  }
                >
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
                <p className="text-sm text-gray-500 mt-4">
                  More explanation here about the pickup: where, how.
                </p>
              </Card>

              {/* Continue Button */}
              <div className="pt-2">
                <Button
                  onClick={handlePlaceOrder}
                  disabled={
                    uiState.isLoading ||
                    !formState.selectedTime ||
                    !dropInfo ||
                    uiState.isValidating
                  }
                  className="bg-black hover:bg-black text-white rounded-full px-8 text-lg font-medium shadow-lg hover:cursor-pointer hover:text-opacity-70 h-12 w-full disabled:bg-gray-400 disabled:cursor-not-allowed disabled:hover:text-opacity-100"
                  aria-label="Continue to checkout"
                  size="lg"
                >
                  {uiState.isLoading
                    ? 'Processing...'
                    : uiState.isValidating
                      ? 'Validating...'
                      : `Check Out • €${totalPrice.toFixed(2)}`}
                </Button>
              </div>
            </>
          )}
        </div>
      </main>
    </PageLayout>
  );
}
