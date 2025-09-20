'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { CheckCircle } from 'lucide-react';
import { useCart } from '@/lib/cart-context';

interface ParsedOrder {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  pickupDate: string;
  pickupTime: string;
  totalAmount: number;
  specialInstructions: string | null;
  order_products: OrderItem[]; // Updated from order_items
  status: string;
  createdAt: string;
  dropInfo?: {
    location?: {
      name?: string;
      address?: string;
    };
  };
}

interface OrderItem {
  id: string;
  quantity: number;
  unit_price: number;
  products: {
    name: string;
    description: string;
  };
}

interface OrderDetails {
  order: ParsedOrder;
  order_products: OrderItem[]; // Updated from order_items
}

function ConfirmationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const { clearCart } = useCart();
  const [orderData, setOrderData] = useState<OrderDetails>({
    order: {
      orderNumber: '',
      customerName: '',
      customerEmail: '',
      customerPhone: null,
      pickupDate: '',
      pickupTime: '',
      totalAmount: 0,
      specialInstructions: null,
      order_products: [], // Updated from order_items
      status: '',
      createdAt: '',
    },
    order_products: [], // Updated from order_items
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) {
      router.push('/');
      return;
    }

    const fetchOrderDetails = async (retryCount = 0) => {
      try {
        const response = await fetch(`/api/orders/${orderId}`);

        if (!response.ok) {
          if (response.status === 404 && retryCount < 5) {
            // Order might not be committed yet by webhook, retry with longer delays
            const delay = Math.min(1000 * Math.pow(1.5, retryCount), 5000); // Exponential backoff, max 5s
            console.log(
              `Order not found, retrying in ${delay}ms (attempt ${retryCount + 1}/6)`
            );
            setTimeout(() => fetchOrderDetails(retryCount + 1), delay);
            return;
          }
          throw new Error('Failed to fetch order details');
        }

        const data = await response.json();
        console.log('Successfully fetched order from database:', data);
        console.log('API response structure:', {
          success: data.success,
          hasOrder: !!data.order,
          orderKeys: data.order ? Object.keys(data.order) : [],
          orderData: data.order,
        });

        // Transform the API response to match our expected structure
        if (data.success && data.order) {
          const apiOrder = data.order;
          console.log('Processing API order:', apiOrder);

          const transformedOrder: ParsedOrder = {
            orderNumber: apiOrder.order_number || '',
            customerName: apiOrder.customer_name || '',
            customerEmail: apiOrder.customer_email || '',
            customerPhone: apiOrder.customer_phone || null,
            pickupDate: apiOrder.pickup_date || '',
            pickupTime: apiOrder.pickup_time || '',
            totalAmount: apiOrder.total_amount || 0,
            specialInstructions: apiOrder.special_instructions || null,
            order_products: apiOrder.order_products || [],
            status: apiOrder.status || 'confirmed', // Use actual status from API
            createdAt: apiOrder.created_at || new Date().toISOString(),
            dropInfo: apiOrder.drop_info || undefined,
          };

          console.log('Transformed order:', transformedOrder);

          setOrderData({
            order: transformedOrder,
            order_products: transformedOrder.order_products,
          });

          // Clean up localStorage and cart after successfully loading order data from API
          clearCart();
          localStorage.removeItem('pickupTime');
          localStorage.removeItem('currentDrop');
          localStorage.removeItem('customerInfo');
          localStorage.removeItem('activeOrder');
        } else {
          throw new Error('Invalid API response format');
        }
      } catch (error) {
        console.error('Error fetching order details:', error);
        console.log(
          'Database fetch failed, falling back to localStorage data...'
        );
        console.log('Available localStorage keys:', Object.keys(localStorage));
        console.log('cartItems:', localStorage.getItem('cartItems'));
        console.log('customerInfo:', localStorage.getItem('customerInfo'));
        console.log('currentDrop:', localStorage.getItem('currentDrop'));

        // Fallback to localStorage data if API fails
        let fallbackOrder: ParsedOrder;

        try {
          const customerInfo = localStorage.getItem('customerInfo');
          const activeOrder = localStorage.getItem('activeOrder');
          const cartPickupTime = localStorage.getItem('cartPickupTime');

          console.log('activeOrder:', activeOrder);

          let cartItems: any[] | null = null;
          let cartComment = '';
          let totalAmount = 0;

          // Use activeOrder data directly (now contains complete info)
          if (activeOrder) {
            try {
              const parsedOrder = JSON.parse(activeOrder);
              console.log('Using activeOrder data:', parsedOrder);

              fallbackOrder = {
                orderNumber:
                  parsedOrder.orderNumber ||
                  `ORD-${Date.now().toString().slice(-8)}`,
                customerName: parsedOrder.customerName || 'Unknown Customer',
                customerEmail:
                  parsedOrder.customerEmail || 'unknown@example.com',
                customerPhone: parsedOrder.customerPhone || null,
                pickupDate:
                  parsedOrder.dropDate ||
                  parsedOrder.pickupDate ||
                  new Date().toISOString().split('T')[0],
                pickupTime: parsedOrder.pickupTime || '12:00',
                totalAmount: parsedOrder.totalAmount || 0,
                specialInstructions: parsedOrder.specialInstructions || '',
                order_products: (parsedOrder.items || []).map((item: any) => ({
                  id: item.id || Math.random().toString(),
                  quantity: item.quantity || 1,
                  unit_price: item.price || 0,
                  products: {
                    name: item.name || 'Unknown Item',
                    description: item.description || '',
                  },
                })),
                status: 'confirmed',
                createdAt: new Date().toISOString(),
                dropInfo: parsedOrder.dropInfo || undefined,
              };
            } catch (e) {
              console.error('Error parsing activeOrder:', e);
              // Try to get customer info from separate localStorage items as fallback
              const customerInfo = localStorage.getItem('customerInfo');
              let customerName = 'Unknown Customer';
              let customerEmail = 'unknown@example.com';
              let customerPhone = null;

              if (customerInfo) {
                try {
                  const parsed = JSON.parse(customerInfo);
                  customerName = parsed.name || customerName;
                  customerEmail = parsed.email || customerEmail;
                  customerPhone = parsed.phone || null;
                } catch (parseError) {
                  console.error('Error parsing customerInfo:', parseError);
                }
              }

              fallbackOrder = {
                orderNumber: `ORD-${Date.now().toString().slice(-8)}`,
                customerName,
                customerEmail,
                customerPhone,
                pickupDate: new Date().toISOString().split('T')[0],
                pickupTime: '12:00',
                totalAmount: 0,
                specialInstructions: '',
                order_products: [],
                status: 'confirmed',
                createdAt: new Date().toISOString(),
              };
            }
          } else {
            // No activeOrder, try to get customer info from separate localStorage items
            const customerInfo = localStorage.getItem('customerInfo');
            let customerName = 'Unknown Customer';
            let customerEmail = 'unknown@example.com';
            let customerPhone = null;

            if (customerInfo) {
              try {
                const parsed = JSON.parse(customerInfo);
                customerName = parsed.name || customerName;
                customerEmail = parsed.email || customerEmail;
                customerPhone = parsed.phone || null;
              } catch (parseError) {
                console.error('Error parsing customerInfo:', parseError);
              }
            }

            fallbackOrder = {
              orderNumber: `ORD-${Date.now().toString().slice(-8)}`,
              customerName,
              customerEmail,
              customerPhone,
              pickupDate: new Date().toISOString().split('T')[0],
              pickupTime: '12:00',
              totalAmount: 0,
              specialInstructions: '',
              order_products: [],
              status: 'confirmed',
              createdAt: new Date().toISOString(),
            };
          }
        } catch (fallbackError) {
          console.error('Error creating fallback order:', fallbackError);
          // Create a minimal fallback order if parsing fails
          fallbackOrder = {
            orderNumber: `ORD-${Date.now().toString().slice(-8)}`,
            customerName: 'Your Name',
            customerEmail: 'your.email@example.com',
            customerPhone: null,
            pickupDate: new Date().toISOString().split('T')[0],
            pickupTime: '12:00',
            totalAmount: 0,
            specialInstructions: '',
            order_products: [],
            status: 'confirmed',
            createdAt: new Date().toISOString(),
          };
        }

        setOrderData({
          order: fallbackOrder,
          order_products: fallbackOrder.order_products,
        });

        // Clean up localStorage and cart after successfully loading order data
        clearCart();
        localStorage.removeItem('pickupTime');
        localStorage.removeItem('currentDrop');
        localStorage.removeItem('customerInfo');
        localStorage.removeItem('activeOrder');
      } finally {
        setLoading(false);
      }
    };

    void fetchOrderDetails();
  }, [orderId]);

  const handleBackToHome = () => {
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="max-w-[480px] w-full mx-auto bg-white min-h-screen flex flex-col justify-center items-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-lg text-gray-600">Loading your order...</p>
          </div>
        </div>
      </div>
    );
  }

  // Safety check to ensure orderData is properly initialized
  // Only show "Order Not Found" if we have no order data at all
  if (!orderData || !orderData.order) {
    console.error('❌ Order data not properly initialized:', orderData);
    console.error('❌ Loading state:', loading);
    console.error('❌ OrderId:', orderId);
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Order Not Found
          </h1>
          <p className="text-gray-600 mb-6">
            We couldn&apos;t load your order details.
          </p>
          <button
            onClick={handleBackToHome}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-[480px] mx-auto bg-white min-h-screen">
        <main className="px-5">
          <div className="space-y-6 py-4">
            {/* Success Message */}
            <div className="text-center py-8">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-black mb-2">Thank you!</h2>
              <p className="text-black">
                We've sent you a confirmation at{' '}
                {orderData.order.customerEmail || 'your email'}
              </p>
            </div>

            {/* Order Summary */}
            <section>
              <Card className="p-5">
                <h2 className="text-xl font-semibold mb-4">
                  Order #{orderData.order.orderNumber}
                </h2>

                <div className="space-y-3">
                  {/* First Group */}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Name:</span>
                    <span className="font-medium">
                      {orderData.order.customerName || 'Unknown'}
                    </span>
                  </div>

                  <div className="flex justify-between items-start">
                    <span className="text-gray-600">Product ordered:</span>
                    <div className="text-right">
                      {orderData.order_products &&
                      orderData.order_products.length > 0 ? (
                        orderData.order_products.map((item, index) => (
                          <p key={index} className="font-medium">
                            {item.quantity}x {item.products.name}
                          </p>
                        ))
                      ) : (
                        <p className="font-medium">No items</p>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-600">Total:</span>
                    <span className="font-medium">
                      €{(orderData.order.totalAmount || 0).toFixed(2)}
                    </span>
                  </div>

                  <Separator />

                  {/* Second Group */}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Location:</span>
                    <span className="font-medium">
                      {(() => {
                        // Try to get location from dropInfo or localStorage
                        if (orderData.order.dropInfo?.location?.name) {
                          return orderData.order.dropInfo.location.name;
                        }

                        const currentDrop = localStorage.getItem('currentDrop');
                        if (currentDrop) {
                          try {
                            const dropInfo = JSON.parse(currentDrop);
                            return dropInfo.location?.name || 'Impact Hub';
                          } catch (e) {
                            return 'Impact Hub';
                          }
                        }

                        return 'Impact Hub';
                      })()}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-600">Date:</span>
                    <span className="font-medium">
                      {(() => {
                        const date = new Date(orderData.order.pickupDate);
                        return date.toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        });
                      })()}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-600">Pickup:</span>
                    <span className="font-medium">
                      {orderData.order.pickupTime
                        ? new Date(`2000-01-01T${orderData.order.pickupTime}`)
                            .toLocaleTimeString('en-US', {
                              hour: 'numeric',
                              minute: '2-digit',
                              hour12: false,
                            })
                            .replace(':00', 'h00')
                        : 'Not specified'}
                    </span>
                  </div>
                </div>
              </Card>
            </section>
          </div>
        </main>

        {/* Action Buttons */}
        <div className="p-5 space-y-3">
          <Button
            onClick={() => {
              const currentDrop = localStorage.getItem('currentDrop');
              if (currentDrop) {
                try {
                  const dropInfo = JSON.parse(currentDrop);
                  if (dropInfo.location?.location_url) {
                    window.open(dropInfo.location.location_url, '_blank');
                  } else {
                    // Fallback to default location
                    window.open(
                      'https://maps.google.com/?q=Impact+Hub+Penha+Lisboa',
                      '_blank'
                    );
                  }
                } catch (e) {
                  // Fallback to default location
                  window.open(
                    'https://maps.google.com/?q=Impact+Hub+Penha+Lisboa',
                    '_blank'
                  );
                }
              } else {
                // Fallback to default location
                window.open(
                  'https://maps.google.com/?q=Impact+Hub+Penha+Lisboa',
                  '_blank'
                );
              }
            }}
            className="bg-black hover:bg-black text-white rounded-full px-8 text-lg font-medium shadow-lg hover:cursor-pointer hover:text-opacity-70 h-12 w-full disabled:bg-gray-400 disabled:cursor-not-allowed disabled:hover:text-opacity-100"
            size="lg"
          >
            See{' '}
            {(() => {
              // Try to get location from dropInfo or localStorage
              if (orderData.order.dropInfo?.location?.name) {
                return orderData.order.dropInfo.location.name;
              }

              const currentDrop = localStorage.getItem('currentDrop');
              if (currentDrop) {
                try {
                  const dropInfo = JSON.parse(currentDrop);
                  return dropInfo.location?.name || 'Impact Hub';
                } catch (e) {
                  return 'Impact Hub';
                }
              }

              return 'Impact Hub';
            })()}{' '}
            on map
          </Button>

          <Button
            variant="outline"
            onClick={handleBackToHome}
            className="w-full py-4 text-lg font-medium rounded-full"
            size="lg"
          >
            Close
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
