'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useCart } from '@/lib/cart-context';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

import { PageHeader, PageLayout } from '@/components/shared';

// Interface for drop information
interface DropInfo {
  date: string;
  location: {
    name: string;
    district: string;
    location_url?: string;
  };
  pickup_hour_start: string;
  pickup_hour_end: string;
}

interface CustomerInfo {
  name: string;
  email: string;
  phone: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const {
    items,
    totalPrice,
    clearCart,
    validateDrop,
    isDropValid,
    dropValidationError,
    isInitialized,
  } = useCart();

  // Debug logging
  console.log('Checkout: Cart context values:', {
    items,
    totalPrice,
    isInitialized,
    isDropValid,
    dropValidationError,
  });
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: '',
    email: '',
    phone: '',
  });
  const [errors, setErrors] = useState<Partial<CustomerInfo>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [pickupTime, setPickupTime] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [dropInfo, setDropInfo] = useState<DropInfo | null>(null);
  const [isValidatingDrop, setIsValidatingDrop] = useState(false);

  // Load saved customer info and order details from localStorage
  useEffect(() => {
    const savedInfo = localStorage.getItem('customerInfo');
    if (savedInfo) {
      try {
        const parsed = JSON.parse(savedInfo);
        setCustomerInfo(parsed);
      } catch (error) {
        console.error('Error parsing saved customer info:', error);
      }
    }

    // Load pickup time and special instructions
    const savedPickupTime = localStorage.getItem('pickupTime');
    const savedSpecialInstructions = localStorage.getItem(
      'specialInstructions'
    );

    if (savedPickupTime) {
      setPickupTime(savedPickupTime);
    }
    if (savedSpecialInstructions) {
      setSpecialInstructions(savedSpecialInstructions);
    }

    // Load drop information from localStorage
    const savedDrop = localStorage.getItem('currentDrop');
    if (savedDrop) {
      try {
        const parsedDrop = JSON.parse(savedDrop);
        setDropInfo(parsedDrop);

        // Validate the drop if we have an ID and cart is initialized
        if (parsedDrop.id && isInitialized && validateDrop) {
          setIsValidatingDrop(true);
          validateDrop(parsedDrop.id).finally(() => {
            setIsValidatingDrop(false);
          });
        }
      } catch (error) {
        console.error('Error parsing drop info:', error);
      }
    }
  }, [validateDrop, isInitialized]);

  // Save customer info to localStorage
  const saveCustomerInfo = (info: CustomerInfo) => {
    localStorage.setItem('customerInfo', JSON.stringify(info));
  };

  // Format functions for the header
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      month: 'long',
      day: 'numeric',
    };
    return date.toLocaleDateString('en-US', options);
  };

  const formatPickupTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'pm' : 'am';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    if (minutes === '00') {
      return `${displayHour}`;
    } else {
      return `${displayHour}:${minutes}`;
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Partial<CustomerInfo> = {};

    // Name validation
    if (!customerInfo.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (customerInfo.name.trim().length < 3) {
      newErrors.name = 'Name must be at least 3 characters';
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!customerInfo.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(customerInfo.email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Phone validation (optional but if provided, must be valid)
    if (customerInfo.phone.trim()) {
      // More permissive regex for international numbers
      const phoneRegex = /^[\+]?[1-9][\d\s\-\(\)\.]{7,20}$/;
      if (!phoneRegex.test(customerInfo.phone.trim())) {
        newErrors.phone = 'Please enter a valid phone number';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Format phone number on submit
  const formatPhoneNumber = (phone: string): string => {
    // Remove all non-digits except +
    const cleaned = phone.replace(/[^\d+]/g, '');

    // Basic international formatting
    if (cleaned.startsWith('+')) {
      return cleaned;
    } else if (cleaned.startsWith('00')) {
      return '+' + cleaned.substring(2);
    } else if (cleaned.startsWith('1') && cleaned.length === 11) {
      return '+1' + cleaned.substring(1);
    } else {
      return cleaned; // Return as-is for other formats
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (!isDropValid) {
      alert(
        dropValidationError ||
          'This drop is no longer accepting orders. Please return to the menu to check availability.'
      );
      return;
    }

    setIsLoading(true);

    try {
      // Format phone number
      const formattedPhone = customerInfo.phone.trim()
        ? formatPhoneNumber(customerInfo.phone.trim())
        : '';

      const orderData = {
        customerName: customerInfo.name.trim(),
        customerEmail: customerInfo.email.trim(),
        customerPhone: formattedPhone,
        pickupTime: pickupTime,
        pickupDate: new Date().toISOString().split('T')[0],
        items: (items || []).map(item => ({
          id: item.dropProductId, // Use drop_product_id for the API
          quantity: item.quantity,
          price: item.price,
        })),
        specialInstructions: specialInstructions,
        totalAmount: totalPrice || 0,
      };

      console.log('Checkout: Sending order data:', orderData);

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      console.log('Checkout: Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Checkout: API error:', errorData);
        throw new Error(errorData.error || 'Failed to place order');
      }

      const result = await response.json();
      console.log('Checkout: Order result:', result);

      console.log('Checkout: Order successful, redirecting to confirmation...');

      // Save customer info for future orders
      saveCustomerInfo({
        ...customerInfo,
        phone: formattedPhone,
      });

      // Save active order for banner display
      const activeOrder = {
        orderNumber: result.order.order_number,
        pickupTime: pickupTime,
        pickupDate: new Date().toISOString().split('T')[0], // Today's date
        items: (items || []).map(item => ({
          name: item.name,
          quantity: item.quantity,
        })),
        totalAmount: totalPrice || 0,
      };
      console.log('Checkout: Saving active order:', activeOrder);
      localStorage.setItem('activeOrder', JSON.stringify(activeOrder));

      // Clear cart and localStorage
      if (clearCart) {
        clearCart();
      }
      localStorage.removeItem('pickupTime');
      localStorage.removeItem('specialInstructions');
      localStorage.removeItem('currentDrop'); // Also clear drop info

      // Redirect to confirmation
      const confirmationUrl = `/confirmation?orderId=${result.order.id}`;
      console.log('Checkout: Redirecting to:', confirmationUrl);

      // Force navigation using window.location as fallback
      try {
        router.push(confirmationUrl);
        // If router.push doesn't work, use window.location
        setTimeout(() => {
          if (window.location.pathname !== '/confirmation') {
            console.log('Checkout: Router failed, using window.location');
            window.location.href = confirmationUrl;
          }
        }, 100);
      } catch (error) {
        console.error('Checkout: Navigation error:', error);
        window.location.href = confirmationUrl;
      }
    } catch (error) {
      console.error('Order placement failed:', error);

      // More user-friendly error message
      let errorMessage = 'Failed to place order. Please try again.';
      if (error instanceof Error) {
        if (error.message.includes('No active drop available')) {
          errorMessage =
            'Sorry, there are no active orders at the moment. Please try again later.';
        } else if (error.message.includes('Failed to reserve drop products')) {
          errorMessage =
            'Sorry, some items are no longer available. Please refresh and try again.';
        } else if (error.message.includes('Missing required fields')) {
          errorMessage = 'Please check your order details and try again.';
        } else {
          errorMessage = error.message;
        }
      }

      alert(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle input changes
  const handleInputChange = (field: keyof CustomerInfo, value: string) => {
    setCustomerInfo(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // Handle back navigation
  const handleBack = () => {
    router.back();
  };

  // If cart is empty, redirect to home
  useEffect(() => {
    if (isInitialized && items && items.length === 0) {
      router.push('/');
    }
  }, [isInitialized, items, router]);

  // Wait for cart to be initialized and items to be loaded before rendering
  if (!isInitialized) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center min-h-screen">
          <LoadingSpinner />
        </div>
      </PageLayout>
    );
  }

  // If cart is empty, redirect to home
  if (!items || items.length === 0) {
    return null; // Will redirect
  }

  return (
    <PageLayout>
      <PageHeader
        title={
          dropInfo
            ? `${formatDate(dropInfo.date)} (${formatPickupTime(dropInfo.pickup_hour_start)}${
                parseInt(dropInfo.pickup_hour_start.split(':')[0]) < 12 !==
                parseInt(dropInfo.pickup_hour_end.split(':')[0]) < 12
                  ? parseInt(dropInfo.pickup_hour_start.split(':')[0]) < 12
                    ? 'am'
                    : 'pm'
                  : ''
              } - ${formatPickupTime(dropInfo.pickup_hour_end)}${
                parseInt(dropInfo.pickup_hour_start.split(':')[0]) < 12 ===
                parseInt(dropInfo.pickup_hour_end.split(':')[0]) < 12
                  ? parseInt(dropInfo.pickup_hour_end.split(':')[0]) < 12
                    ? 'am'
                    : 'pm'
                  : 'pm'
              })`
            : 'Customer Information'
        }
        subtitle={
          dropInfo
            ? `${dropInfo.location.name}, ${dropInfo.location.district}`
            : undefined
        }
        showMapPin={!!dropInfo?.location?.location_url}
        locationUrl={dropInfo?.location?.location_url}
        onBackClick={handleBack}
      />

      <main className="px-5">
        <div className="space-y-6 py-5">
          {/* Drop Validation Status */}
          {isValidatingDrop && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-blue-600 text-sm">
                  Validating drop status...
                </span>
              </div>
            </div>
          )}

          {/* Drop Validation Error */}
          {!isValidatingDrop && !isDropValid && dropValidationError && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex items-center space-x-2">
                <svg
                  className="w-4 h-4 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="text-red-600 text-sm font-medium">
                  Ordering Closed
                </span>
              </div>
              <p className="text-red-600 text-sm mt-1">{dropValidationError}</p>
              <Button
                onClick={() => router.push('/')}
                variant="outline"
                size="sm"
                className="mt-2"
              >
                Return to Home
              </Button>
            </div>
          )}

          {/* Customer Information Form */}
          <Card className="p-5">
            <h2 className="text-xl font-semibold mb-5">Your Information</h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="mb-2">
                  Full Name
                </Label>
                <Input
                  id="name"
                  type="text"
                  value={customerInfo.name}
                  onChange={e => handleInputChange('name', e.target.value)}
                  placeholder="Enter your full name"
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && (
                  <p className="text-sm text-red-600">{errors.name}</p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="mb-2">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={customerInfo.email}
                  onChange={e => handleInputChange('email', e.target.value)}
                  placeholder="your.email@example.com"
                  className={errors.email ? 'border-red-500' : ''}
                />
                {errors.email && (
                  <p className="text-sm text-red-600">{errors.email}</p>
                )}
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone" className="mb-2">
                  Phone (Optional)
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={customerInfo.phone}
                  onChange={e => handleInputChange('phone', e.target.value)}
                  placeholder="+1 (555) 123-4567"
                  className={errors.phone ? 'border-red-500' : ''}
                />
                {errors.phone && (
                  <p className="text-sm text-red-600">{errors.phone}</p>
                )}
              </div>
            </form>
          </Card>

          {/* Order Summary */}
          <Card className="p-5">
            <h2 className="text-xl font-semibold mb-5">Order Summary</h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Total:</span>
                  <span className="font-semibold">
                    €{(totalPrice || 0).toFixed(2)}
                  </span>
                </div>
                {(items || []).map(item => (
                  <div key={item.id} className="flex justify-between">
                    <span className="text-gray-500 text-sm">
                      {item.quantity}x {item.name}
                    </span>
                    <span className="text-gray-500 text-sm">
                      €{(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
              <Separator />
              {/* Pickup Time and Special Instructions */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="">Pickup Time:</span>
                  <span className="font-semibold">{pickupTime}</span>
                </div>
                {specialInstructions && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Special Instructions:</span>
                    <span className="font-medium">{specialInstructions}</span>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading || !isDropValid || isValidatingDrop}
                className="w-full bg-black text-white py-4 text-lg font-medium mt-4 rounded-full disabled:bg-gray-400 disabled:cursor-not-allowed"
                onClick={handleSubmit}
                size="lg"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <LoadingSpinner />
                    <span>Processing...</span>
                  </div>
                ) : !isDropValid ? (
                  'Ordering Closed'
                ) : isValidatingDrop ? (
                  'Validating...'
                ) : (
                  'Place Order'
                )}
              </Button>
            </div>
          </Card>
        </div>
      </main>
    </PageLayout>
  );
}
