'use client';

import { useEffect, useState } from 'react';
import { MainLayout } from '@/components/shared/MainLayout';
import { SandwichItem } from '@/components/customer/SandwichItem';
import { AboutSection } from '@/components/customer/AboutSection';
import { StickyBasketButton } from '@/components/customer/StickyBasketButton';
import { useCart } from '@/lib/cart-context';
import { fetchProducts, Product } from '@/lib/api/products';
import { fetchInventory, InventoryItem } from '@/lib/api/inventory';

export default function Home() {
  const { addToCart } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const today = new Date().toISOString().split('T')[0];
        
        const [productsData, inventoryData] = await Promise.all([
          fetchProducts(),
          fetchInventory(today),
        ]);
        
        setProducts(productsData);
        setInventory(inventoryData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleAddToCart = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      addToCart({
        id: product.id,
        name: product.name,
        price: product.price,
      });
    }
  };

  const getAvailableStock = (productId: string) => {
    const inventoryItem = inventory.find(item => item.product_id === productId);
    return inventoryItem?.available_quantity || 0;
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
        <section>
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-bold text-black mb-2">
              Today&apos;s Menu
            </h2>
            <p className="text-gray-600">{formatDate()}</p>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-600">Loading menu...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-600">Error: {error}</p>
            </div>
          ) : (
            <div className="space-y-5">
              {products.map(product => (
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
          )}
        </section>

        {/* About Section */}
        <AboutSection />
      </div>

      {/* Sticky Basket Button */}
      <StickyBasketButton />
    </MainLayout>
  );
}
