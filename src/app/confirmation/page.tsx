'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, Clock, MapPin, ArrowLeft } from 'lucide-react';
import { useCart } from '@/lib/cart-context';

// Simple type for confirmation page cart items
interface ConfirmationCartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  description?: string;
}

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

          let cartItems: ConfirmationCartItem[] | null = null;
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
                customerName: parsedOrder.customerName || 'Unknown',
                customerEmail: parsedOrder.customerEmail || 'Unknown',
                customerPhone: parsedOrder.customerPhone || null,
                pickupDate:
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
              };
            } catch (e) {
              console.error('Error parsing activeOrder:', e);
              // Create minimal fallback
              fallbackOrder = {
                orderNumber: `ORD-${Date.now().toString().slice(-8)}`,
                customerName: 'Unknown',
                customerEmail: 'Unknown',
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
          } else {
            // No activeOrder, create minimal fallback
            fallbackOrder = {
              orderNumber: `ORD-${Date.now().toString().slice(-8)}`,
              customerName: 'Unknown',
              customerEmail: 'Unknown',
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

    fetchOrderDetails();
  }, [orderId]);

  const handleBackToHome = () => {
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Processing your order...</p>
          <p className="text-sm text-gray-500 mt-2">
            This may take a few seconds
          </p>
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
                    <span className="font-medium">
                      {orderData.order.orderNumber || 'Processing...'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Customer:</span>
                    <span className="font-medium">
                      {orderData.order.customerName || 'Unknown'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Email:</span>
                    <span className="font-medium">
                      {orderData.order.customerEmail || 'Unknown'}
                    </span>
                  </div>
                  {orderData.order.customerPhone && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Phone:</span>
                      <span className="font-medium">
                        {orderData.order.customerPhone}
                      </span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Amount:</span>
                    <span className="font-semibold text-lg">
                      €{(orderData.order.totalAmount || 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              </Card>
            </section>

            {/* Order Items */}
            {orderData.order_products &&
              orderData.order_products.length > 0 && (
                <section>
                  <h3 className="text-xl font-semibold mb-4">Order Items</h3>
                  <Card className="p-4">
                    <div className="space-y-3">
                      {orderData.order_products.map((item, index) => (
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
                  {/* 1. Pickup Location */}
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
                    </div>
                  </div>

                  {/* 2. Pickup Time */}
                  <div className="flex items-center space-x-3">
                    <Clock className="h-5 w-5 text-gray-600" />
                    <div>
                      <p className="text-sm text-gray-600">Pickup Time</p>
                      <p className="font-medium">
                        {orderData.order.pickupTime
                          ? new Date(
                              `2000-01-01T${orderData.order.pickupTime}`
                            ).toLocaleTimeString('en-US', {
                              hour: 'numeric',
                              minute: '2-digit',
                              hour12: true,
                            })
                          : 'Not specified'}
                      </p>
                    </div>
                  </div>

                  {/* 3. Show Map Button - Full Width */}
                  <div className="pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const currentDrop = localStorage.getItem('currentDrop');
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
              </Card>
            </section>
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
