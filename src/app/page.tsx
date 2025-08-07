'use client';

import { useEffect, useState } from 'react';
import { MainLayout } from '@/components/shared/MainLayout';
import { SandwichItem } from '@/components/customer/SandwichItem';
import { AboutSection } from '@/components/customer/AboutSection';
import { StickyBasketButton } from '@/components/customer/StickyBasketButton';
import { useCart } from '@/lib/cart-context';
import { fetchNextActiveSell, NextActiveSell } from '@/lib/api/sells';

export default function Home() {
  const { addToCart } = useCart();
  const [sellData, setSellData] = useState<NextActiveSell | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        console.log('🔄 Loading sell data...');

        const nextActiveSell = await fetchNextActiveSell();
        console.log('✅ Sell data loaded:', nextActiveSell);
        setSellData(nextActiveSell);
      } catch (err) {
        console.error('❌ Error loading sell data:', err);
        console.log('❌ Error details:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleAddToCart = (productId: string) => {
    const product = sellData?.products.find(p => p.id === productId);
    if (product) {
      addToCart({
        id: product.id,
        name: product.name,
        price: product.price,
      });
    }
  };

  const getAvailableStock = (productId: string) => {
    const product = sellData?.products.find(p => p.id === productId);
    return product?.availableStock || 0;
  };

  const formatDate = () => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const options: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      month: 'long',
      day: 'numeric',
    };

    return tomorrow.toLocaleDateString('en-US', options);
  };

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Menu Section */}
        {loading ? (
          <section>
            <div className="mb-6 text-center">
              <h2 className="text-2xl font-bold text-black mb-2">
                Today&apos;s Menu
              </h2>
              <p className="text-gray-600">{formatDate()}</p>
            </div>
            <div className="text-center py-8">
              <p className="text-gray-600">Loading menu...</p>
            </div>
          </section>
        ) : error ||
          !sellData ||
          !sellData.products ||
          sellData.products.length === 0 ? (
          <section>
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
                    The shop is closed for now
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Come back later for the next sell
                  </p>
                </div>
              </div>
            </div>
          </section>
        ) : (
          <section>
            <div className="mb-6 text-center">
              <h2 className="text-2xl font-bold text-black mb-2">
                Today&apos;s Menu
              </h2>
              <p className="text-gray-600">{formatDate()}</p>
            </div>
            <div className="space-y-5">
              {sellData.products.map(product => (
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

        {/* About Section */}
        <AboutSection />
      </div>

      {/* Sticky Basket Button */}
      <StickyBasketButton />
    </MainLayout>
  );
}
