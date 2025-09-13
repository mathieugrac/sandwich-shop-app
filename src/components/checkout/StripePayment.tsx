'use client';

import { useState, useEffect } from 'react';
import {
  useStripe,
  useElements,
  PaymentElement,
  Elements,
} from '@stripe/react-stripe-js';
import { stripePromise } from '@/lib/stripe/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { CartItem, CustomerInfo } from '@/lib/payments';

interface StripePaymentFormProps {
  clientSecret: string;
  onSuccess: (paymentIntentId: string) => void;
  onError: (error: string) => void;
  isLoading?: boolean;
}

function StripePaymentForm({
  clientSecret,
  onSuccess,
  onError,
  isLoading = false,
}: StripePaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      onError('Stripe has not loaded yet. Please try again.');
      return;
    }

    setIsProcessing(true);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: 'if_required', // This prevents automatic redirect
      });

      if (error) {
        console.error('Payment confirmation error:', error);
        onError(error.message || 'Payment failed. Please try again.');
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        console.log('✅ Payment succeeded:', paymentIntent.id);
        onSuccess(paymentIntent.id);
      } else {
        onError('Payment was not completed. Please try again.');
      }
    } catch (err) {
      console.error('Unexpected payment error:', err);
      onError('An unexpected error occurred. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="p-4 border rounded-lg bg-gray-50">
        <PaymentElement
          options={{
            layout: 'tabs',
            paymentMethodOrder: ['card', 'ideal', 'sepa_debit'],
          }}
        />
      </div>

      <Button
        type="submit"
        disabled={!stripe || isProcessing || isLoading}
        className="w-full bg-black text-white py-4 text-lg font-medium rounded-full disabled:bg-gray-400 disabled:cursor-not-allowed"
        size="lg"
      >
        {isProcessing ? (
          <div className="flex items-center space-x-2">
            <LoadingSpinner />
            <span>Processing Payment...</span>
          </div>
        ) : (
          'Pay Now'
        )}
      </Button>
    </form>
  );
}

interface StripePaymentProps {
  items: CartItem[];
  customerInfo: CustomerInfo;
  onSuccess: (paymentIntentId: string) => void;
  onError: (error: string) => void;
  onCancel: () => void;
}

export function StripePayment({
  items,
  customerInfo,
  onSuccess,
  onError,
  onCancel,
}: StripePaymentProps) {
  const [clientSecret, setClientSecret] = useState<string>('');
  const [isCreatingIntent, setIsCreatingIntent] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    // Check if we can reuse existing payment intent
    const savedPaymentIntent = localStorage.getItem('currentPaymentIntent');

    if (savedPaymentIntent) {
      try {
        const { paymentIntentId, cartHash, customerHash } =
          JSON.parse(savedPaymentIntent);
        const currentCartHash = generateCartHash(items);
        const currentCustomerHash = generateCustomerHash(customerInfo);

        // Reuse if cart and customer info haven't changed
        if (
          cartHash === currentCartHash &&
          customerHash === currentCustomerHash
        ) {
          console.log('♻️ Reusing existing payment intent:', paymentIntentId);
          validateAndReusePaymentIntent(paymentIntentId);
          return;
        }
      } catch (error) {
        console.error('Error parsing saved payment intent:', error);
      }
    }

    // Create new payment intent if no valid existing one
    createPaymentIntent();
  }, []);

  // Helper functions
  const generateCartHash = (items: CartItem[]): string => {
    return btoa(
      JSON.stringify(
        items.map(item => ({ id: item.id, quantity: item.quantity }))
      )
    );
  };

  const generateCustomerHash = (customerInfo: CustomerInfo): string => {
    return btoa(
      JSON.stringify({
        name: customerInfo.name,
        email: customerInfo.email,
        phone: customerInfo.phone,
        pickupTime: customerInfo.pickupTime,
        pickupDate: customerInfo.pickupDate,
      })
    );
  };

  const validateAndReusePaymentIntent = async (paymentIntentId: string) => {
    try {
      // Validate payment intent is still valid
      const response = await fetch(`/api/payment/validate-intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentIntentId }),
      });

      if (response.ok) {
        const { clientSecret } = await response.json();
        setClientSecret(clientSecret);
        console.log('✅ Payment intent reused successfully');
      } else {
        console.log('⚠️ Payment intent invalid, creating new one');
        createPaymentIntent();
      }
    } catch (error) {
      console.error('Error validating payment intent:', error);
      createPaymentIntent();
    }
  };

  const createPaymentIntent = async () => {
    setIsCreatingIntent(true);
    setError('');

    try {
      const response = await fetch('/api/payment/create-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items,
          customerInfo,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create payment intent');
      }

      const { clientSecret, paymentIntentId } = await response.json();
      setClientSecret(clientSecret);

      // Save payment intent for reuse
      const paymentIntentData = {
        paymentIntentId,
        cartHash: generateCartHash(items),
        customerHash: generateCustomerHash(customerInfo),
        createdAt: new Date().toISOString(),
      };
      localStorage.setItem(
        'currentPaymentIntent',
        JSON.stringify(paymentIntentData)
      );

      console.log('✅ New payment intent created and saved:', paymentIntentId);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to initialize payment';
      console.error('Payment intent creation failed:', err);
      setError(errorMessage);
      onError(errorMessage);
    } finally {
      setIsCreatingIntent(false);
    }
  };

  const stripeOptions = {
    clientSecret,
    appearance: {
      theme: 'stripe' as const,
      variables: {
        colorPrimary: '#000000',
        colorBackground: '#ffffff',
        colorText: '#000000',
        colorDanger: '#df1b41',
        fontFamily: 'system-ui, sans-serif',
        spacingUnit: '4px',
        borderRadius: '8px',
      },
    },
  };

  if (isCreatingIntent) {
    return (
      <Card className="p-8 shadow-none">
        <div className="flex flex-col items-center space-y-4">
          <LoadingSpinner />
          <p className="text-gray-600">Preparing payment...</p>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6 shadow-none border-red-200 bg-red-50">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-red-800">Payment Error</h3>
          <p className="text-red-700">{error}</p>
          <div className="flex space-x-3">
            <Button
              onClick={createPaymentIntent}
              variant="outline"
              className="border-red-300 text-red-700 hover:bg-red-100"
            >
              Try Again
            </Button>
            <Button onClick={onCancel} variant="outline">
              Cancel
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  if (!clientSecret) {
    return (
      <Card className="p-8 shadow-none">
        <div className="flex flex-col items-center space-y-4">
          <LoadingSpinner />
          <p className="text-gray-600">Loading payment form...</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 shadow-none">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Payment Details</h2>
          <Button
            onClick={onCancel}
            variant="ghost"
            size="sm"
            className="text-gray-500 hover:text-gray-700"
          >
            Cancel
          </Button>
        </div>

        <Elements stripe={stripePromise} options={stripeOptions}>
          <StripePaymentForm
            clientSecret={clientSecret}
            onSuccess={onSuccess}
            onError={onError}
            isLoading={isCreatingIntent}
          />
        </Elements>
      </div>
    </Card>
  );
}
