'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useCart } from '@/lib/cart-context';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ArrowLeft } from 'lucide-react';
import { PageHeader, PageLayout } from '@/components/shared';
import { StripePayment } from '@/components/checkout/StripePayment';

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

export default function PaymentPage() {
  const router = useRouter();
  const { items, totalPrice, isInitialized, clearCart } = useCart();

  // State for order data
  const [orderData, setOrderData] = useState<{
    customerInfo: CustomerInfo | null;
    pickupTime: string;
    specialInstructions: string;
    dropInfo: DropInfo | null;
  }>({
    customerInfo: null,
    pickupTime: '',
    specialInstructions: '',
    dropInfo: null,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  // Load order data from localStorage
  useEffect(() => {
    if (!isInitialized) return;

    try {
      // Check if we have cart items
      if (items.length === 0) {
        router.push('/cart');
        return;
      }

      // Load customer info
      const savedCustomerInfo = localStorage.getItem('customerInfo');
      const customerInfo = savedCustomerInfo
        ? JSON.parse(savedCustomerInfo)
        : null;

      // Load other order data
      const pickupTime = localStorage.getItem('pickupTime') || '';
      const specialInstructions =
        localStorage.getItem('specialInstructions') || '';
      const savedDrop = localStorage.getItem('currentDrop');
      const dropInfo = savedDrop ? JSON.parse(savedDrop) : null;

      // Validate required data
      if (!customerInfo || !customerInfo.name || !customerInfo.email) {
        setError(
          'Customer information is missing. Please complete checkout first.'
        );
        setIsLoading(false);
        return;
      }

      if (!pickupTime) {
        setError('Pickup time is missing. Please select a pickup time.');
        setIsLoading(false);
        return;
      }

      if (!dropInfo) {
        setError('Drop information is missing. Please start over.');
        setIsLoading(false);
        return;
      }

      setOrderData({
        customerInfo,
        pickupTime,
        specialInstructions,
        dropInfo,
      });

      setError(null);
      setShowPayment(true); // Show payment form immediately when data loads
    } catch (err) {
      console.error('Error loading order data:', err);
      setError('Failed to load order information. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [isInitialized, items.length, router]);

  // Handle back navigation to checkout
  const handleBackToCheckout = () => {
    if (paymentProcessing) {
      // Prevent navigation during payment processing
      return;
    }
    router.push('/checkout');
  };

  // Handle successful payment
  const handlePaymentSuccess = async (paymentIntentId: string) => {
    console.log('✅ Payment successful:', paymentIntentId);
    setPaymentProcessing(true);

    try {
      // Save order info for banner display (order will be created by webhook)
      const activeOrder = {
        orderNumber: 'Processing...', // Will be updated when webhook processes
        status: 'pending',
        customerName: orderData.customerInfo?.name || '',
        customerEmail: orderData.customerInfo?.email || '',
        totalAmount: totalPrice || 0,
        dropDate: orderData.dropInfo?.date || '',
        pickupTime: orderData.pickupTime,
        locationName: orderData.dropInfo?.location?.name || '',
        paymentIntentId: paymentIntentId,
        timestamp: new Date().toISOString(),
      };

      localStorage.setItem('activeOrder', JSON.stringify(activeOrder));

      // Navigate to confirmation page after delay
      setTimeout(() => {
        // Clear only payment intent, keep other data for confirmation page fallback
        localStorage.removeItem('currentPaymentIntent');
        router.push(`/confirmation?orderId=${paymentIntentId}`);
      }, 2000);
    } catch (error) {
      console.error('Error handling payment success:', error);
      setError(
        'Payment successful but failed to create order. Please contact support.'
      );
      setPaymentProcessing(false);
    }
  };

  // Handle payment error
  const handlePaymentError = (error: string) => {
    console.error('❌ Payment failed:', error);
    setError(error);
    setPaymentProcessing(false);
  };

  // Format time with AM/PM
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

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      month: 'long',
      day: 'numeric',
    };
    return date.toLocaleDateString('en-US', options);
  };

  // Show loading state
  if (isLoading) {
    return (
      <PageLayout>
        <PageHeader
          title="Payment"
          subtitle="Processing..."
          onBackClick={handleBackToCheckout}
        />
        <main className="px-5 py-8">
          <Card className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
            <p>Loading payment information...</p>
          </Card>
        </main>
      </PageLayout>
    );
  }

  // Show error state
  if (error) {
    return (
      <PageLayout>
        <PageHeader
          title="Payment Error"
          subtitle="Unable to process payment"
          onBackClick={handleBackToCheckout}
        />
        <main className="px-5 py-8">
          <Card className="p-6 text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <div className="space-y-2">
              <Button
                onClick={handleBackToCheckout}
                variant="outline"
                className="w-full"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Checkout
              </Button>
              <Button onClick={() => router.push('/cart')} className="w-full">
                Back to Cart
              </Button>
            </div>
          </Card>
        </main>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <PageHeader onBackClick={handleBackToCheckout} />

      <main className="px-5 pb-0">
        <div className="space-y-5 pt-5">
          {/* Order Summary Section - First, above payment form */}
          <Card className="p-5">
            <h2 className="text-xl font-semibold mb-4">Order Summary</h2>

            {/* Order Items - Simple single line format */}
            <div className="space-y-2">
              {items.map(item => (
                <div
                  key={item.id}
                  className="flex justify-between items-center"
                >
                  <span>
                    {item.quantity}x {item.name}
                  </span>
                  <span className="font-medium">
                    €{(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            <Separator className="my-4" />

            {/* Total */}
            <div className="flex justify-between items-center text-lg font-semibold">
              <span>Total:</span>
              <span>€{totalPrice.toFixed(2)}</span>
            </div>
          </Card>

          {/* Payment Section - Second, below order summary */}
          {showPayment && !paymentProcessing && (
            <StripePayment
              items={items.map(item => ({
                id: item.id,
                name: item.name,
                quantity: item.quantity,
                price: item.price,
              }))}
              customerInfo={{
                name: orderData.customerInfo?.name || '',
                email: orderData.customerInfo?.email || '',
                phone: orderData.customerInfo?.phone || undefined,
                pickupTime: orderData.pickupTime,
                pickupDate:
                  orderData.dropInfo?.date ||
                  new Date().toISOString().split('T')[0],
                specialInstructions: orderData.specialInstructions || undefined,
              }}
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
            />
          )}

          {/* Payment Processing State */}
          {paymentProcessing && (
            <Card className="p-5">
              <div className="text-center">
                <LoadingSpinner />
                <h3 className="text-lg font-semibold mt-4 mb-2">
                  Processing Payment...
                </h3>
                <p className="text-gray-600">
                  Please wait while we process your order.
                </p>
              </div>
            </Card>
          )}
        </div>
      </main>
    </PageLayout>
  );
}
