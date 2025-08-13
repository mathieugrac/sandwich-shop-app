'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { SandwichItem } from '@/components/customer/SandwichItem';
import { StickyBasketButton } from '@/components/customer/StickyBasketButton';
import { useCart } from '@/lib/cart-context';
import { fetchDropWithProducts } from '@/lib/api/drops';
import { DropWithProducts } from '@/types/database';
import { ArrowLeft, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export default function MenuPage() {
  const { dropId } = useParams();
  const { addToCart } = useCart();
  const router = useRouter();
  const [dropData, setDropData] = useState<DropWithProducts | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        console.log('🔄 Loading drop data for:', dropId);

        const drop = await fetchDropWithProducts(dropId as string);
        console.log('✅ Drop data loaded:', drop);
        console.log(
          '✅ Drop data drop products count:',
          drop?.dropProducts?.length
        );
        setDropData(drop);
      } catch (err) {
        console.error('❌ Error loading drop data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        console.log('🏁 Setting loading to false');
        setLoading(false);
      }
    };

    if (dropId) {
      loadData();
    }
  }, [dropId]);

  // Debug current state
  console.log('🔍 Component state:', {
    loading,
    error,
    dropData: !!dropData,
    dropProductsCount: dropData?.dropProducts?.length,
  });

  const handleAddToCart = (dropProductId: string) => {
    const dropProduct = dropData?.dropProducts.find(
      item => item.id === dropProductId
    );
    if (dropProduct) {
      addToCart({
        id: dropProduct.id, // Use drop_product.id as cart item ID
        name: dropProduct.product.name,
        price: dropProduct.selling_price,
        dropProductId: dropProduct.id, // Store reference to drop_product
        productId: dropProduct.product.id, // Store reference to original product
      });
    }
  };

  const getAvailableStock = (dropProductId: string) => {
    const dropProductItem = dropData?.dropProducts.find(
      item => item.id === dropProductId
    );
    return dropProductItem?.available_quantity || 0;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };
    return date.toLocaleDateString('en-US', options);
  };

  const handleBack = () => {
    router.back();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="max-w-[480px] mx-auto bg-white min-h-screen">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
            <p className="text-gray-600">Loading menu...</p>
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
  console.log('🔍 Menu: dropData.dropProducts:', dropData.dropProducts);
  console.log(
    '🔍 Menu: dropData.dropProducts.length:',
    dropData.dropProducts?.length
  );

  // Temporarily show all products for debugging
  let availableProducts = dropData.dropProducts || [];

  // If no drop products exist yet, show a message about setup
  const hasNoDropProducts = dropData.dropProducts.length === 0;

  console.log('🔍 Menu: availableProducts:', availableProducts);
  console.log('🔍 Menu: availableProducts.length:', availableProducts.length);
  console.log('🔍 Menu: hasNoDropProducts:', hasNoDropProducts);

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-[480px] mx-auto bg-white min-h-screen">
        {/* Header with Back Button */}
        <div className="sticky top-0 z-40 bg-white border-b border-gray-200 px-4 py-3 flex items-center">
          <Button
            onClick={handleBack}
            variant="ghost"
            size="sm"
            className="p-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-black">Menu</h1>
            <p className="text-gray-600">{formatDate(dropData.date)}</p>
          </div>
        </div>

        <main className="px-5">
          <div className="space-y-6 py-4">
            {/* Menu Section */}
            {hasNoDropProducts ? (
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
                      Menu not ready yet
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
              <section>
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-black mb-2">
                    Available Products
                  </h2>
                  <p className="text-gray-600">
                    Select your favorite sandwiches
                  </p>
                </div>
                <div className="space-y-5">
                  {availableProducts.map(dropProduct => (
                    <SandwichItem
                      key={dropProduct.id}
                      name={dropProduct.product.name}
                      description={dropProduct.product.description || undefined}
                      price={dropProduct.selling_price}
                      availableStock={getAvailableStock(dropProduct.id)}
                      onAddToCart={() => handleAddToCart(dropProduct.id)}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        </main>

        {/* Sticky Basket Button */}
        <StickyBasketButton />
      </div>
    </div>
  );
}
