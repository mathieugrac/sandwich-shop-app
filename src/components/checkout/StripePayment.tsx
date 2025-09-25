'use client';

import { useState, useEffect } from 'react';
import {
  useStripe,
  useElements,
  CardElement,
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
  const [formError, setFormError] = useState<string>('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      setFormError('Stripe has not loaded yet. Please try again.');
      return;
    }

    setIsProcessing(true);
    setFormError(''); // Clear any previous errors

    try {
      // Final availability check before payment
      const availabilityResponse = await fetch(
        '/api/payment/check-availability',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ clientSecret }),
        }
      );

      if (!availabilityResponse.ok) {
        const errorData = await availabilityResponse.json();
        setFormError(
          errorData.error ||
            'Some items are no longer available. Please refresh and try again.'
        );
        return;
      }

      const { error, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: elements.getElement(CardElement)!,
          },
        }
      );

      if (error) {
        console.error('Payment confirmation error:', error);
        setFormError(error.message || 'Payment failed. Please try again.');
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        console.log('✅ Payment succeeded:', paymentIntent.id);
        // Clear saved payment intent on success
        localStorage.removeItem('currentPaymentIntent');
        onSuccess(paymentIntent.id);
      } else {
        setFormError('Payment was not completed. Please try again.');
      }
    } catch (err) {
      console.error('Unexpected payment error:', err);
      setFormError('An unexpected error occurred. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Error message display within form */}
      {formError && (
        <div className="p-3 border border-red-200 bg-red-50 rounded-lg">
          <p className="text-red-700 text-sm">{formError}</p>
        </div>
      )}

      <div className="p-4 border rounded-lg bg-gray-50">
        <CardElement
          options={{
            hidePostalCode: true,
            style: {
              base: {
                fontSize: '16px',
                color: '#424770',
                fontFamily: 'system-ui, sans-serif',
                '::placeholder': {
                  color: '#aab7c4',
                },
              },
              invalid: {
                color: '#9e2146',
              },
            },
          }}
        />
      </div>

      <Button
        type="submit"
        disabled={!stripe || isProcessing || isLoading}
        className="mb-4 bg-black hover:bg-black text-white rounded-full px-8 text-lg font-medium shadow-lg hover:cursor-pointer hover:text-opacity-70 h-12 w-full disabled:bg-gray-400 disabled:cursor-not-allowed disabled:hover:text-opacity-100"
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

      {/* Secure payment message - Below button, centered */}
      <div className="text-center">
        <span className="text-gray-600 text-sm">
          Secure payment with Stripe
        </span>
      </div>
    </form>
  );
}

interface StripePaymentProps {
  items: CartItem[];
  customerInfo: CustomerInfo;
  onSuccess: (paymentIntentId: string) => void;
  onError: (error: string) => void;
}

export function StripePayment({
  items,
  customerInfo,
  onSuccess,
  onError,
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
      // Get drop ID from localStorage
      let dropId: string | undefined;
      try {
        const savedDrop = localStorage.getItem('currentDrop');
        if (savedDrop) {
          const parsedDrop = JSON.parse(savedDrop);
          dropId = parsedDrop.id;
        }
      } catch (error) {
        console.error('Error parsing drop info from localStorage:', error);
      }

      const response = await fetch('/api/payment/create-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items,
          customerInfo,
          dropId, // Pass the specific drop ID
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

  // Cleanup payment intent on component unmount or navigation
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Don't clear if payment is processing
      if (!isCreatingIntent) {
        localStorage.removeItem('currentPaymentIntent');
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // Clear payment intent when component unmounts (unless processing)
      if (!isCreatingIntent) {
        localStorage.removeItem('currentPaymentIntent');
      }
    };
  }, [isCreatingIntent]);

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
    <Card className="p-6">
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold">Payment Details</h2>
        </div>

        {/* Error message display */}
        {error && (
          <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
            <Button
              onClick={() => {
                setError('');
                createPaymentIntent();
              }}
              variant="outline"
              size="sm"
              className="mt-2 border-red-300 text-red-700 hover:bg-red-100"
            >
              Try Again
            </Button>
          </div>
        )}

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
