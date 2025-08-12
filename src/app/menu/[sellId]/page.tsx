'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { MainLayout } from '@/components/shared/MainLayout';
import { SandwichItem } from '@/components/customer/SandwichItem';
import { StickyBasketButton } from '@/components/customer/StickyBasketButton';
import { useCart } from '@/lib/cart-context';
import { fetchSellWithInventory } from '@/lib/api/sells';
import { SellWithInventory } from '@/types/database';
import { ArrowLeft, MapPin, Clock, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export default function MenuPage() {
  const { sellId } = useParams();
  const { addToCart } = useCart();
  const router = useRouter();
  const [sellData, setSellData] = useState<SellWithInventory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        console.log('🔄 Loading sell data for:', sellId);

        const sell = await fetchSellWithInventory(sellId as string);
        console.log('✅ Sell data loaded:', sell);
        setSellData(sell);
      } catch (err) {
        console.error('❌ Error loading sell data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    if (sellId) {
      loadData();
    }
  }, [sellId]);

  const handleAddToCart = (productId: string) => {
    const product = sellData?.inventory.find(
      item => item.product_id === productId
    )?.product;
    if (product) {
      addToCart({
        id: product.id,
        name: product.name,
        price: product.price,
      });
    }
  };

  const getAvailableStock = (productId: string) => {
    const inventoryItem = sellData?.inventory.find(
      item => item.product_id === productId
    );
    return inventoryItem?.available_quantity || 0;
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
      <MainLayout>
        <div className="space-y-8">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
            <p className="text-gray-600">Loading menu...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error || !sellData) {
    return (
      <MainLayout>
        <div className="space-y-8">
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
                  {error ? 'Something went wrong' : 'Sell not found'}
                </h3>
                <p className="text-gray-600 mb-4">
                  {error ||
                    'The sell you are looking for does not exist or is not available.'}
                </p>
                <Button onClick={handleBack} variant="outline">
                  Go Back
                </Button>
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  // Filter only products with available inventory
  const availableProducts = sellData.inventory
    .filter(item => item.product.active && item.available_quantity > 0)
    .map(item => item.product);

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header with Back Button */}
        <div className="flex items-center space-x-4">
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
            <p className="text-gray-600">{formatDate(sellData.sell_date)}</p>
          </div>
        </div>

        {/* Sell Information Card */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <MapPin className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-black">
                {sellData.location.name}
              </h2>
            </div>
            <div className="text-right">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(sellData.sell_date)}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Clock className="w-4 h-4" />
                <span>{sellData.location.delivery_timeframe}</span>
              </div>
            </div>
          </div>
          <p className="text-sm text-gray-600">{sellData.location.address}</p>
        </div>

        {/* Menu Section */}
        {availableProducts.length === 0 ? (
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
                  All products for this sell are currently sold out.
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
              <p className="text-gray-600">Select your favorite sandwiches</p>
            </div>
            <div className="space-y-5">
              {availableProducts.map(product => (
                <SandwichItem
                  key={product.id}
                  name={product.name}
                  description={product.description}
                  price={product.price}
                  availableStock={getAvailableStock(product.id)}
                  imageUrl={product.image_url}
                  onAddToCart={() => handleAddToCart(product.id)}
                />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Sticky Basket Button */}
      <StickyBasketButton />
    </MainLayout>
  );
}
