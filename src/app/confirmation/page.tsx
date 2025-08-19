'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, Clock, MapPin, ArrowLeft } from 'lucide-react';

// Simple type for confirmation page cart items
interface ConfirmationCartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  description?: string;
}

interface ParsedOrder {
  items?: ConfirmationCartItem[];
  comment?: string;
  totalAmount?: number;
  pickupTime?: string;
  pickupDate?: string;
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
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  pickup_time: string;
  pickup_date: string;
  total_amount: number;
  special_instructions?: string;
  created_at: string;
  order_items: OrderItem[];
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

    const fetchOrderDetails = async (retryCount = 0) => {
      try {
        console.log(
          `Attempting to fetch order ${orderId} (attempt ${retryCount + 1})`
        );
        const response = await fetch(`/api/orders/${orderId}`);

        if (!response.ok) {
          if (response.status === 404 && retryCount < 2) {
            // Order might not be committed yet, retry after a delay
            console.log(
              `Order not found, retrying in 1 second... (attempt ${retryCount + 1})`
            );
            setTimeout(() => fetchOrderDetails(retryCount + 1), 1000);
            return;
          }
          throw new Error('Failed to fetch order details');
        }

        const data = await response.json();
        console.log('Successfully fetched order from database:', data.order);
        setOrder(data.order);
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
        let fallbackOrder: OrderDetails;

        try {
          const customerInfo = localStorage.getItem('customerInfo');
          const activeOrder = localStorage.getItem('activeOrder');
          const cartPickupTime = localStorage.getItem('cartPickupTime');

          console.log('activeOrder:', activeOrder);

          let cartItems: ConfirmationCartItem[] | null = null;
          let cartComment = '';
          let totalAmount = 0;

          // Try to get cart data from activeOrder first
          if (activeOrder) {
            try {
              const parsedOrder: ParsedOrder = JSON.parse(activeOrder);
              console.log('Parsed activeOrder:', parsedOrder);

              // Handle the actual structure from activeOrder
              if (parsedOrder.items) {
                cartItems = parsedOrder.items.map(
                  (item: ConfirmationCartItem) => ({
                    id: item.id || Math.random().toString(),
                    name: item.name,
                    price: item.price || 0,
                    quantity: item.quantity,
                    description: item.description || '',
                  })
                );
              }

              cartComment = parsedOrder.comment || '';
              totalAmount = parsedOrder.totalAmount || 0;

              console.log('Processed cartItems:', cartItems);
              console.log('Processed totalAmount:', totalAmount);
            } catch (e) {
              console.log('Failed to parse activeOrder, trying other keys...');
            }
          }

          // Fallback to other possible keys
          if (!cartItems) {
            const storedCartItems = localStorage.getItem('cartItems');
            if (storedCartItems) {
              try {
                cartItems = JSON.parse(storedCartItems);
              } catch (e) {
                cartItems = [];
              }
            }
          }

          if (!cartComment) {
            cartComment = localStorage.getItem('cartComment') || '';
          }

          fallbackOrder = {
            id: orderId,
            order_number: `ORD-${Date.now().toString().slice(-8)}`,
            customer_name: customerInfo
              ? JSON.parse(customerInfo).name
              : 'Your Name',
            customer_email: customerInfo
              ? JSON.parse(customerInfo).email
              : 'your.email@example.com',
            customer_phone: customerInfo ? JSON.parse(customerInfo).phone : '',
            pickup_time: (() => {
              if (activeOrder) {
                try {
                  const parsedOrder: ParsedOrder = JSON.parse(activeOrder);
                  return parsedOrder.pickupTime || cartPickupTime || '12:00';
                } catch (e) {
                  return cartPickupTime || '12:00';
                }
              }
              return cartPickupTime || '12:00';
            })(),
            pickup_date: (() => {
              if (activeOrder) {
                try {
                  const parsedOrder: ParsedOrder = JSON.parse(activeOrder);
                  return (
                    parsedOrder.pickupDate ||
                    new Date().toISOString().split('T')[0]
                  );
                } catch (e) {
                  return new Date().toISOString().split('T')[0];
                }
              }
              return new Date().toISOString().split('T')[0];
            })(),
            total_amount:
              totalAmount ||
              (cartItems && cartItems.length > 0
                ? cartItems.reduce(
                    (total: number, item: ConfirmationCartItem) =>
                      total + item.price * item.quantity,
                    0
                  )
                : 0),
            special_instructions: cartComment,
            created_at: new Date().toISOString(),
            order_items:
              cartItems && cartItems.length > 0
                ? cartItems.map((item: ConfirmationCartItem) => ({
                    id: item.id,
                    quantity: item.quantity,
                    unit_price: item.price,
                    products: {
                      name: item.name,
                      description: item.description || '',
                    },
                  }))
                : [],
          };
        } catch (fallbackError) {
          console.error('Error creating fallback order:', fallbackError);
          // Create a minimal fallback order if parsing fails
          fallbackOrder = {
            id: orderId,
            order_number: `ORD-${Date.now().toString().slice(-8)}`,
            customer_name: 'Your Name',
            customer_email: 'your.email@example.com',
            customer_phone: '',
            pickup_time: '12:00',
            pickup_date: new Date().toISOString().split('T')[0],
            total_amount: 0,
            special_instructions: '',
            created_at: new Date().toISOString(),
            order_items: [],
          };
        }

        setOrder(fallbackOrder);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
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
        <main className="px-5">
          <div className="space-y-6 py-4">
            {/* Success Message */}
            <div className="text-center py-8">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-black mb-2">
                Thanks for your order!
              </h2>
              <p className="text-black">
                You will receive soon an email confirmation.
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
                  {order.customer_phone && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Phone:</span>
                      <span className="font-medium">
                        {order.customer_phone}
                      </span>
                    </div>
                  )}
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

            {/* Order Items */}
            {order.order_items && order.order_items.length > 0 && (
              <section>
                <h3 className="text-xl font-semibold mb-4">Order Items</h3>
                <Card className="p-4">
                  <div className="space-y-3">
                    {order.order_items.map((item, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center"
                      >
                        <div>
                          <span className="font-medium">
                            {item.products.name}
                          </span>
                          <span className="text-gray-600 ml-2">
                            x{item.quantity}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </section>
            )}

            {/* Pickup Information */}
            <section>
              <h3 className="text-xl font-semibold mb-4">Pickup Information</h3>
              <Card className="p-4">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Clock className="h-5 w-5 text-gray-600" />
                    <div>
                      <p className="text-sm text-gray-600">Pickup Time</p>
                      <p className="font-medium">
                        {order.pickup_time
                          ? new Date(
                              `2000-01-01T${order.pickup_time}`
                            ).toLocaleTimeString('en-US', {
                              hour: 'numeric',
                              minute: '2-digit',
                              hour12: true,
                            })
                          : 'Not specified'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <MapPin className="h-5 w-5 text-gray-600" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-600">Pickup Location</p>
                      <p className="font-medium">
                        {(() => {
                          // Try activeOrder first, then currentDrop
                          const activeOrder =
                            localStorage.getItem('activeOrder');
                          const currentDrop =
                            localStorage.getItem('currentDrop');

                          if (activeOrder) {
                            try {
                              const parsedOrder: ParsedOrder =
                                JSON.parse(activeOrder);
                              if (parsedOrder.dropInfo?.location?.name) {
                                return parsedOrder.dropInfo.location.name;
                              }
                            } catch (e) {
                              console.log(
                                'Failed to parse activeOrder for location'
                              );
                            }
                          }

                          if (currentDrop) {
                            try {
                              const dropInfo = JSON.parse(currentDrop);
                              return dropInfo.location?.name || 'Location';
                            } catch (e) {
                              return 'Location not specified';
                            }
                          }

                          // For now, show a default location since the data structure is unclear
                          return 'Impact Hub, Penha';
                        })()}
                      </p>
                      <p className="text-sm">
                        {(() => {
                          // Try activeOrder first, then currentDrop
                          const activeOrder =
                            localStorage.getItem('activeOrder');
                          const currentDrop =
                            localStorage.getItem('currentDrop');

                          if (activeOrder) {
                            try {
                              const parsedOrder: ParsedOrder =
                                JSON.parse(activeOrder);
                              if (parsedOrder.dropInfo?.location?.address) {
                                return parsedOrder.dropInfo.location.address;
                              }
                            } catch (e) {
                              console.log(
                                'Failed to parse activeOrder for address'
                              );
                            }
                          }

                          if (currentDrop) {
                            try {
                              const dropInfo = JSON.parse(currentDrop);
                              return (
                                dropInfo.location?.address ||
                                'Address not specified'
                              );
                            } catch (e) {
                              return 'Address not specified';
                            }
                          }

                          // For now, show a default address
                          return 'Rua da Penha de França, 4, 1170-112 Lisboa, Portugal';
                        })()}
                      </p>

                      {/* Show Map Button */}
                      <div className="mt-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const currentDrop =
                              localStorage.getItem('currentDrop');
                            if (currentDrop) {
                              try {
                                const dropInfo = JSON.parse(currentDrop);
                                if (dropInfo.location?.location_url) {
                                  window.open(
                                    dropInfo.location.location_url,
                                    '_blank'
                                  );
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
                          className="w-full"
                        >
                          Show on Map
                        </Button>
                      </div>
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
          </div>
        </main>

        {/* Action Buttons */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4">
          <Button
            onClick={handleBackToHome}
            className="w-full bg-black text-white py-4 text-lg font-medium rounded-full"
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
