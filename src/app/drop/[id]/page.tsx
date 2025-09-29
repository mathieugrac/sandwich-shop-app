'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { SandwichItem } from '@/components/customer/SandwichItem';
import { StickyBasketButton } from '@/components/customer/StickyBasketButton';
import { OrderBanner } from '@/components/customer/OrderBanner';
import { useCart } from '@/lib/cart-context';
import { fetchDropWithProducts } from '@/lib/api/drops';
import { DropWithProducts } from '@/lib/api/drops';
import { Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { PageHeader, PageLayout } from '@/components/shared';

export default function DropPage() {
  const { id } = useParams();
  const { addToCart, updateQuantity, removeFromCart, items } = useCart();
  const router = useRouter();
  const [dropData, setDropData] = useState<DropWithProducts | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        console.log('🔄 Loading drop data for:', id);

        const drop = await fetchDropWithProducts(id as string);
        console.log('✅ Drop data loaded:', drop);
        console.log('✅ Drop data structure:', {
          hasDropProducts: !!drop?.dropProducts,
          dropProductsType: typeof drop?.dropProducts,
          dropProductsIsArray: Array.isArray(drop?.dropProducts),
          dropProductsLength: drop?.dropProducts?.length,
          dropDataKeys: drop ? Object.keys(drop) : 'no drop data',
        });

        // Additional safety check: ensure drop has required properties
        if (drop && (!drop.location || !drop.date || !drop.status)) {
          console.error('❌ Drop data missing required properties:', drop);
          setError('Invalid drop data received from server');
          return;
        }

        setDropData(drop);
      } catch (err) {
        console.error('❌ Error loading drop data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        console.log('🏁 Setting loading to false');
        setLoading(false);
      }
    };

    if (id) {
      loadData();
    }
  }, [id]);

  // Debug current state
  console.log('🔍 Component state:', {
    loading,
    error,
    dropData: !!dropData,
    dropProductsCount: dropData?.dropProducts?.length,
  });

  // Check if drop is completed
  const isDropCompleted =
    dropData?.status === 'completed' || dropData?.status === 'cancelled';

  const handleAddToCart = (dropProductId: string) => {
    if (!dropData?.dropProducts || !Array.isArray(dropData.dropProducts)) {
      console.error(
        '❌ handleAddToCart: dropProducts is undefined or not an array'
      );
      return;
    }

    const dropProduct = dropData.dropProducts.find(
      item => item.id === dropProductId
    );
    if (dropProduct && dropData) {
      // Store drop information in localStorage for Cart and Checkout pages
      localStorage.setItem(
        'currentDrop',
        JSON.stringify({
          id: dropData.id, // Store the drop ID for navigation
          date: dropData.date,
          location: dropData.location,
          pickup_hour_start: dropData.location.pickup_hour_start,
          pickup_hour_end: dropData.location.pickup_hour_end,
        })
      );

      addToCart({
        id: dropProduct.id, // Use drop_product.id as cart item ID
        name: dropProduct.product.name,
        price: dropProduct.selling_price,
        availableStock: dropProduct.available_quantity || 0, // Store available stock
        dropProductId: dropProduct.id, // Store reference to drop_product
        dropId: dropData.id, // Store reference to the actual drop (for validation)
        productId: dropProduct.product.id, // Store reference to original product
        imageUrl: dropProduct.product.product_images?.[0]?.image_url, // Get first product image
      });
    }
  };

  const handleUpdateQuantity = (dropProductId: string, newQuantity: number) => {
    updateQuantity(dropProductId, newQuantity);
  };

  const handleRemoveFromCart = (dropProductId: string) => {
    removeFromCart(dropProductId);
  };

  const getCurrentCartQuantity = (dropProductId: string) => {
    const cartItem = items.find(item => item.id === dropProductId);
    return cartItem?.quantity || 0;
  };

  const getAvailableStock = (dropProductId: string) => {
    if (!dropData?.dropProducts || !Array.isArray(dropData.dropProducts)) {
      console.error(
        '❌ getAvailableStock: dropProducts is undefined or not an array'
      );
      return 0;
    }

    const dropProductItem = dropData.dropProducts.find(
      item => item.id === dropProductId
    );
    return dropProductItem?.available_quantity || 0;
  };

  const formatPickupTime = (timeString: string) => {
    // Convert time string (e.g., "14:00") to 12-hour format with am/pm
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'pm' : 'am';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;

    // Show minutes only if they're not "00"
    if (minutes === '00') {
      return `${displayHour}`;
    } else {
      return `${displayHour}:${minutes}`;
    }
  };

  const handleBack = () => {
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="max-w-[480px] mx-auto bg-white min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
            <p className="text-gray-600">Loading drop...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !dropData) {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="max-w-[480px] mx-auto bg-white min-h-screen">
          <div className="text-center py-8">
            <div className="max-w-md mx-auto">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-gray-400"
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
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {error ? 'Something went wrong' : 'Drop not found'}
                </h3>
                <p className="text-gray-600 mb-4">
                  {error ||
                    'The drop you are looking for does not exist or is not available.'}
                </p>
                <Button onClick={handleBack} variant="outline">
                  Go Back
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Filter only products with available stock
  console.log('🔍 Drop: dropData.dropProducts:', dropData.dropProducts);
  console.log(
    '🔍 Drop: dropData.dropProducts.length:',
    dropData.dropProducts?.length
  );

  // Defensive check: Ensure dropProducts is always an array
  const availableProducts = Array.isArray(dropData?.dropProducts)
    ? dropData.dropProducts
    : [];

  // If no drop products exist yet, show a message about setup
  const hasNoDropProducts = availableProducts.length === 0;

  console.log('🔍 Drop: availableProducts:', availableProducts);
  console.log('🔍 Drop: availableProducts.length:', availableProducts.length);
  console.log('🔍 Drop: hasNoDropProducts:', hasNoDropProducts);

  return (
    <PageLayout>
      <PageHeader
        dropData={{
          id: dropData.id,
          date: dropData.date,
          location: dropData.location,
        }}
        backTarget="/"
      />

      <main className="px-5">
        <div className="space-y-6 py-5">
          {/* Order Status Banner - Only show for active drops */}
          {!isDropCompleted && <OrderBanner dropId={id as string} />}

          {/* Drop Products Section */}
          {isDropCompleted ? (
            <div className="text-center py-8">
              <div className="max-w-md mx-auto">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <svg
                      className="w-8 h-8 text-gray-400"
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
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Drop Finished
                  </h3>
                  <p className="text-gray-600 mb-4">
                    This drop has finished. You can no longer add items to your
                    cart.
                  </p>
                  <Button
                    onClick={() => router.push('/')}
                    className="bg-black text-white hover:bg-gray-800"
                  >
                    See upcoming drops
                  </Button>
                </div>
              </div>
            </div>
          ) : hasNoDropProducts ? (
            <div className="text-center py-8">
              <div className="max-w-md mx-auto">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <svg
                      className="w-8 h-8 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Products not ready yet
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Products are being added to this drop. Please check back
                    later or contact us for more information.
                  </p>
                </div>
              </div>
            </div>
          ) : availableProducts.length === 0 ? (
            <div className="text-center py-8">
              <div className="max-w-md mx-auto">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <svg
                      className="w-8 h-8 text-gray-400"
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
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No products available
                  </h3>
                  <p className="text-gray-600 mb-4">
                    All products for this drop are currently sold out.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {availableProducts.map(dropProduct => (
                <SandwichItem
                  key={dropProduct.id}
                  name={dropProduct.product.name}
                  description={dropProduct.product.description || undefined}
                  allergens={dropProduct.product.allergens || undefined}
                  price={dropProduct.selling_price}
                  availableStock={getAvailableStock(dropProduct.id)}
                  images={dropProduct.product.product_images}
                  onAddToCart={() => handleAddToCart(dropProduct.id)}
                  onUpdateQuantity={newQuantity =>
                    handleUpdateQuantity(dropProduct.id, newQuantity)
                  }
                  onRemoveFromCart={() => handleRemoveFromCart(dropProduct.id)}
                  initialQuantity={getCurrentCartQuantity(dropProduct.id)}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Sticky Basket Button - Only show for active drops */}
      {!isDropCompleted && <StickyBasketButton />}
    </PageLayout>
  );
}
