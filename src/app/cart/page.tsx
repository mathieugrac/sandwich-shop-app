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
import { MapPin, Clock, Squirrel, AlertCircle } from 'lucide-react';
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

  // Consolidate form state
  const [formState, setFormState] = useState({
    selectedTime: '',
    comment: '',
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

  // Memoized formatting functions
  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      month: 'long',
      day: 'numeric',
    };
    return date.toLocaleDateString('en-US', options);
  }, []);

  // Load drop information and saved form data from localStorage
  useEffect(() => {
    const savedDrop = localStorage.getItem('currentDrop');
    const savedPickupTime = localStorage.getItem('cartPickupTime');
    const savedComment = localStorage.getItem('cartComment');

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
    if (savedComment) {
      setFormState(prev => ({ ...prev, comment: savedComment }));
    }
  }, []);

  // Save form data to localStorage when it changes
  useEffect(() => {
    if (formState.selectedTime) {
      localStorage.setItem('cartPickupTime', formState.selectedTime);
    }
    if (formState.comment) {
      localStorage.setItem('cartComment', formState.comment);
    }
  }, [formState.selectedTime, formState.comment]);

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
    router.back();
  }, [router]);

  // Handle clear cart
  const handleClearCart = useCallback(() => {
    clearCart();
    localStorage.removeItem('currentDrop');
    localStorage.removeItem('cartPickupTime');
    localStorage.removeItem('cartComment');
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
      localStorage.setItem('specialInstructions', formState.comment);
      updateUiState({ error: null });

      // Navigate to checkout page
      router.push('/checkout');
    } catch (error) {
      updateUiState({ error: 'Failed to save order information' });
      console.error('Error saving order info:', error);
    }
  }, [
    formState.selectedTime,
    formState.comment,
    dropInfo,
    router,
    updateUiState,
  ]);

  // Show error state if there's an error
  if (uiState.error && !dropInfo) {
    return (
      <PageLayout>
        <PageHeader
          title="Error Loading Order"
          subtitle="Unable to load drop information"
          onBackClick={handleBack}
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
      <PageHeader
        title={
          dropInfo
            ? `${formatDate(dropInfo.date)} (${formatPickupTimeRange(dropInfo.location.pickup_hour_start, dropInfo.location.pickup_hour_end)})`
            : 'Your Order'
        }
        subtitle={
          dropInfo
            ? `${dropInfo.location.name}, ${dropInfo.location.district}`
            : 'Cart'
        }
        showMapPin={!!dropInfo?.location?.location_url}
        locationUrl={dropInfo?.location?.location_url}
        onBackClick={handleBack}
      />

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
                          router.push(`/menu/${dropInfo.id}`);
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
                      value={formState.comment}
                      onChange={e =>
                        updateFormState({ comment: e.target.value })
                      }
                      aria-label="Special instructions for your order"
                      className="shadow-none resize-none min-h-[60px] border-0 p-2"
                    />
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <Squirrel className="mx-auto h-12 w-12 text-gray-500 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Your cart is empty
                  </h3>
                  <p className="text-gray-500 mb-6">
                    Add some delicious sandwiches to get started!
                  </p>
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
              {/* Pickup Time */}
              <Card className="p-5">
                <h2 className="text-xl font-semibold mb-1">Pickup Time</h2>
                <p className="mb-4">
                  Select a an aproximate time for your order
                </p>
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
              </Card>
            </>
          )}
        </div>
      </main>

      {/* Sticky Footer with Total and Continue Button */}
      {items.length > 0 && (
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 mt-5">
          {/* Total Order */}
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-xl font-semibold">Total Order</h2>
            <span className="text-xl font-semibold">
              €{totalPrice.toFixed(2)}
            </span>
          </div>

          {/* Payment Info */}
          <p className="text-sm text-gray-600 mb-5 text-left">
            Payment in cash or mbway at {dropInfo?.location?.name} during pickup
          </p>

          <Button
            onClick={handlePlaceOrder}
            disabled={
              uiState.isLoading ||
              !formState.selectedTime ||
              !dropInfo ||
              uiState.isValidating
            }
            className="w-full bg-black text-white py-4 text-lg font-medium rounded-full disabled:bg-gray-400 disabled:cursor-not-allowed"
            aria-label="Continue to checkout"
            size="lg"
          >
            {uiState.isLoading
              ? 'Processing...'
              : uiState.isValidating
                ? 'Validating...'
                : 'Continue'}
          </Button>
        </div>
      )}
    </PageLayout>
  );
}
