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
import { CartItem, CustomerInfo as PaymentCustomerInfo } from '@/lib/payments';

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
  const { items, totalPrice, clearCart, isInitialized, comment } = useCart();

  // Consolidate form state
  const [formState, setFormState] = useState({
    customerInfo: {
      name: '',
      email: '',
      phone: '',
    },
    pickupTime: '',
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

    // Load pickup time
    const savedPickupTime = localStorage.getItem('pickupTime');

    if (savedPickupTime) {
      setFormState(prev => ({ ...prev, pickupTime: savedPickupTime }));
    }
    // Special instructions now come from cart context

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

  // Handle form submission - now redirects to payment page
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Format phone number and save customer info
    const formattedPhone = formState.customerInfo.phone.trim()
      ? formatPhoneNumber(formState.customerInfo.phone.trim())
      : '';

    saveCustomerInfo({
      ...formState.customerInfo,
      phone: formattedPhone,
    });

    // Redirect to payment page
    router.push('/payment');
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
    router.push('/cart');
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
      {dropInfo ? (
        <PageHeader
          dropData={{
            id: dropInfo.id || '',
            date: dropInfo.date,
            location: dropInfo.location,
          }}
          backTarget="/cart"
        />
      ) : (
        <PageHeader
          dropData={{
            id: '',
            date: new Date().toISOString(),
            location: {
              name: 'Customer Information',
              district: '',
            },
          }}
          backTarget="/cart"
        />
      )}

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

          {/* Customer Info and Submit */}
          <Card className="p-5 shadow-none">
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
                'Continue to payment'
              )}
            </Button>

            {/* Payment Information - Below button, centered */}
            <div className="mt-4 text-center">
              <span className="text-gray-600 text-sm">
                Secure online payment with Stripe
              </span>
            </div>
          </Card>
        </div>
      </main>
    </PageLayout>
  );
}
