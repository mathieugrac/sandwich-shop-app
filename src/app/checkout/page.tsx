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
  const { items, totalPrice, clearCart, isInitialized } = useCart();

  // Consolidate form state
  const [formState, setFormState] = useState({
    customerInfo: {
      name: '',
      email: '',
      phone: '',
    },
    pickupTime: '',
    specialInstructions: '',
  });

  // Consolidate UI state
  const [uiState, setUiState] = useState({
    errors: {} as Partial<CustomerInfo>,
    isLoading: false,
    isValidatingDrop: false,
  });

  // Separate state for drop info (complex object)
  const [dropInfo, setDropInfo] = useState<DropInfo | null>(null);

  // Load saved customer info and order details from localStorage
  useEffect(() => {
    const savedInfo = localStorage.getItem('customerInfo');
    if (savedInfo) {
      try {
        const parsed = JSON.parse(savedInfo);
        setFormState(prev => ({
          ...prev,
          customerInfo: parsed,
        }));
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
      setFormState(prev => ({ ...prev, pickupTime: savedPickupTime }));
    }
    if (savedSpecialInstructions) {
      setFormState(prev => ({ ...prev, specialInstructions: savedSpecialInstructions }));
    }

    // Load drop information from localStorage
    const savedDrop = localStorage.getItem('currentDrop');
    if (savedDrop) {
      try {
        const parsedDrop = JSON.parse(savedDrop);
        setDropInfo(parsedDrop);

        // Validate the drop if we have an ID and cart is initialized
      } catch (error) {
        console.error('Error parsing drop info:', error);
      }
    }
  }, [isInitialized]);

  // Save customer info to localStorage
  const saveCustomerInfo = (info: CustomerInfo) => {
    localStorage.setItem('customerInfo', JSON.stringify(info));
  };

  // Update form state helper
  const updateFormState = (updates: Partial<typeof formState>) => {
    setFormState(prev => ({ ...prev, ...updates }));
  };

  // Update UI state helper
  const updateUiState = (updates: Partial<typeof uiState>) => {
    setUiState(prev => ({ ...prev, ...updates }));
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
    if (!formState.customerInfo.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formState.customerInfo.name.trim().length < 3) {
      newErrors.name = 'Name must be at least 3 characters';
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formState.customerInfo.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formState.customerInfo.email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Phone validation (optional but if provided, must be valid)
    if (formState.customerInfo.phone.trim()) {
      // More permissive regex for international numbers
      const phoneRegex = /^[\+]?[1-9][\d\s\-\(\)\.]{7,20}$/;
      if (!phoneRegex.test(formState.customerInfo.phone.trim())) {
        newErrors.phone = 'Please enter a valid phone number';
      }
    }

    updateUiState({ errors: newErrors });
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

    updateUiState({ isLoading: true });

    try {
      // Format phone number
      const formattedPhone = formState.customerInfo.phone.trim()
        ? formatPhoneNumber(formState.customerInfo.phone.trim())
        : '';

      const orderData = {
        customerName: formState.customerInfo.name.trim(),
        customerEmail: formState.customerInfo.email.trim(),
        customerPhone: formattedPhone,
        pickupTime: formState.pickupTime,
        pickupDate: dropInfo?.date || new Date().toISOString().split('T')[0], // Use actual drop date
        items: (items || []).map(item => ({
          id: item.dropProductId, // Use drop_product_id for the API
          name: item.name, // Add the missing name field
          quantity: item.quantity,
          price: item.price,
        })),
        specialInstructions: formState.specialInstructions,
        totalAmount: totalPrice || 0,
      };

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Checkout: API error:', errorData);
        throw new Error(errorData.error || 'Failed to place order');
      }

      const result = await response.json();

      // Save customer info for future orders
      saveCustomerInfo({
        ...formState.customerInfo,
        phone: formattedPhone,
      });

      // Save active order for banner display
      const activeOrder = {
        orderNumber: result.order.order_number,
        pickupTime: formState.pickupTime,
        pickupDate: dropInfo?.date || new Date().toISOString().split('T')[0], // Use actual drop date
        items: (items || []).map(item => ({
          name: item.name,
          quantity: item.quantity,
        })),
        totalAmount: totalPrice || 0,
      };

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

      // Force navigation using window.location as fallback
      try {
        router.push(confirmationUrl);
        // If router.push doesn't work, use window.location
        setTimeout(() => {
          if (window.location.pathname !== '/confirmation') {
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
      updateUiState({ isLoading: false });
    }
  };

  // Handle input changes
  const handleInputChange = (field: keyof CustomerInfo, value: string) => {
    setFormState(prev => ({
      ...prev,
      customerInfo: { ...prev.customerInfo, [field]: value },
    }));
    // Clear error when user starts typing
    if (uiState.errors[field]) {
      updateUiState({ errors: { ...uiState.errors, [field]: undefined } });
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
            ? `${formatDate(dropInfo.date)} (${formState.pickupTime || 'Select pickup time'})`
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
        <div className="space-y-5 py-5">
          {/* Drop Validation Status */}
          {uiState.isValidatingDrop && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-blue-600 text-sm">
                  Validating drop status...
                </span>
              </div>
            </div>
          )}

          {/* Name for Order */}
          <Card className="p-5 shadow-none">
            <h2 className="text-xl font-semibold mb-4">
              Which name on your order?
            </h2>
            <Input
              id="name"
              type="text"
              value={formState.customerInfo.name}
              onChange={e => handleInputChange('name', e.target.value)}
              placeholder="Enter your full name"
              className={uiState.errors.name ? 'border-red-500' : ''}
            />
            {uiState.errors.name && (
              <p className="text-sm text-red-600">{uiState.errors.name}</p>
            )}
          </Card>

          {/* Order Information */}
          <Card className="p-5 shadow-none">
            <h2 className="text-xl font-semibold mb-4">
              Where should we send your confirmation?
            </h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div className="space-y-2">
                <Input
                  id="email"
                  type="email"
                  value={formState.customerInfo.email}
                  onChange={e => handleInputChange('email', e.target.value)}
                  placeholder="your.email@example.com"
                  className={uiState.errors.email ? 'border-red-500' : ''}
                />
                {uiState.errors.email && (
                  <p className="text-sm text-red-600">{uiState.errors.email}</p>
                )}
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Input
                  id="phone"
                  type="tel"
                  value={formState.customerInfo.phone}
                  onChange={e => handleInputChange('phone', e.target.value)}
                  placeholder="+351 912 345 678 (optional)"
                  className={uiState.errors.phone ? 'border-red-500' : ''}
                />
                {uiState.errors.phone && (
                  <p className="text-sm text-red-600">{uiState.errors.phone}</p>
                )}
                {/* Description */}
                <p className="text-sm text-gray-600">
                  Just in case we need to reach you for the order
                </p>
              </div>
            </form>
          </Card>

          {/* Order Summary */}
          <Card className="p-5 shadow-none">
            <h2 className="text-xl font-semibold mb-5">Order Summary</h2>
            <div className="space-y-5">
              <div className="space-y-3">
                {(items || []).map(item => (
                  <div key={item.id} className="flex justify-between">
                    <span className="">
                      {item.quantity}x {item.name}
                    </span>
                    <span className="">
                      €{(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
                <Separator />
                <div className="flex justify-between">
                  <span className="text-xl">Total:</span>
                  <span className="text-xl font-semibold">
                    €{(totalPrice || 0).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Payment Information and Special Instructions */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600 text-sm">
                    Payment in cash or mbway {dropInfo?.location?.name} during
                    pickup
                  </span>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={uiState.isLoading || uiState.isValidatingDrop}
                className="w-full bg-black text-white py-4 text-lg font-medium rounded-full disabled:bg-gray-400 disabled:cursor-not-allowed"
                onClick={handleSubmit}
                size="lg"
              >
                {uiState.isLoading ? (
                  <div className="flex items-center space-x-2">
                    <LoadingSpinner />
                    <span>Processing...</span>
                  </div>
                ) : uiState.isValidatingDrop ? (
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
