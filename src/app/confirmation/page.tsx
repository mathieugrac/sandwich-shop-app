'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, Clock, MapPin, ArrowLeft } from 'lucide-react';

interface OrderDetails {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  pickup_time: string;
  pickup_date: string;
  total_amount: number;
  special_instructions?: string;
  created_at: string;
}

function ConfirmationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) {
      router.push('/');
      return;
    }

    // For now, we'll show a mock confirmation since we don't have the order details
    // In a real app, you'd fetch the order details from the API
    const mockOrder: OrderDetails = {
      id: orderId,
      order_number: `ORD-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(
        Math.random() * 9999
      )
        .toString()
        .padStart(4, '0')}`,
      customer_name: 'Your Name', // This would come from the actual order
      customer_email: 'your.email@example.com',
      pickup_time: localStorage.getItem('pickupTime') || '12:00',
      pickup_date: new Date().toISOString().split('T')[0],
      total_amount: 0, // This would come from the actual order
      special_instructions: localStorage.getItem('specialInstructions') || '',
      created_at: new Date().toISOString(),
    };

    setOrder(mockOrder);
    setLoading(false);
  }, [orderId, router]);

  const handleBackToHome = () => {
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Order not found</p>
          <Button onClick={handleBackToHome}>Back to Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-[480px] mx-auto bg-white min-h-screen">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-white border-b border-gray-200 px-4 py-3 flex items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBackToHome}
            className="p-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold ml-2">Order Confirmation</h1>
        </div>

        <main className="px-5">
          <div className="space-y-6 py-4">
            {/* Success Message */}
            <div className="text-center py-8">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-black mb-2">
                Order Confirmed!
              </h2>
              <p className="text-gray-600">
                Thank you for your order. We&apos;ll have it ready for pickup.
              </p>
            </div>

            {/* Order Details */}
            <section>
              <h3 className="text-xl font-semibold mb-4">Order Details</h3>
              <Card className="p-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Order Number:</span>
                    <span className="font-medium">{order.order_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Customer:</span>
                    <span className="font-medium">{order.customer_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Email:</span>
                    <span className="font-medium">{order.customer_email}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Amount:</span>
                    <span className="font-semibold text-lg">
                      €{order.total_amount.toFixed(2)}
                    </span>
                  </div>
                </div>
              </Card>
            </section>

            {/* Pickup Information */}
            <section>
              <h3 className="text-xl font-semibold mb-4">Pickup Information</h3>
              <Card className="p-4">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Clock className="h-5 w-5 text-gray-600" />
                    <div>
                      <p className="text-sm text-gray-600">Pickup Time</p>
                      <p className="font-medium">{order.pickup_time}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <MapPin className="h-5 w-5 text-gray-600" />
                    <div>
                      <p className="text-sm text-gray-600">Pickup Location</p>
                      <p className="font-medium">
                        123 Sandwich Street, City, Country
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            </section>

            {/* Special Instructions */}
            {order.special_instructions && (
              <section>
                <h3 className="text-xl font-semibold mb-4">
                  Special Instructions
                </h3>
                <Card className="p-4">
                  <p className="text-gray-700">{order.special_instructions}</p>
                </Card>
              </section>
            )}

            {/* Important Notes */}
            <section>
              <Card className="p-4 bg-blue-50 border-blue-200">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">
                  Important Notes
                </h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Please arrive within 15 minutes of your pickup time</li>
                  <li>• Bring your order number for pickup</li>
                  <li>• We&apos;ll send you an email confirmation shortly</li>
                  <li>• Call us if you need to make any changes</li>
                </ul>
              </Card>
            </section>
          </div>
        </main>

        {/* Action Buttons */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4">
          <Button
            onClick={handleBackToHome}
            className="w-full bg-black text-white py-4 text-lg font-medium"
          >
            Back to Menu
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function ConfirmationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      }
    >
      <ConfirmationContent />
    </Suspense>
  );
}
