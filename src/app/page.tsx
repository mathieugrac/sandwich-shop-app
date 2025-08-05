'use client';

import { MainLayout } from '@/components/shared/MainLayout';
import { SandwichItem } from '@/components/customer/SandwichItem';
import { AboutSection } from '@/components/customer/AboutSection';
import { useCart } from '@/lib/cart-context';

// Mock data for demonstration
const sandwiches = [
  {
    id: 1,
    name: 'Umami Mush',
    description:
      'Marinated oyster mushrooms, crispy buckwheat, pickled apple, fresh coriander and miso butter',
    price: 10.0,
    availableStock: 20,
    imageUrl: undefined,
  },
  {
    id: 2,
    name: 'Nutty Beet',
    description:
      'honey-roasted beetroot, creamy labneh, zaatar, crunchy hazelnuts, pickled oignons and fresh mint',
    price: 9.0,
    availableStock: 0,
    imageUrl: undefined,
  },
  {
    id: 3,
    name: 'Bourgundy Beef',
    description:
      'wine-glazed beef cheek, caramelized onions, pickled carrots, arugula and garlic butter',
    price: 11.0,
    availableStock: 3,
    imageUrl: undefined,
  },
];

export default function Home() {
  const { addToCart } = useCart();

  const handleAddToCart = (sandwichId: number) => {
    const sandwich = sandwiches.find(s => s.id === sandwichId);
    if (sandwich) {
      addToCart({
        id: sandwich.id,
        name: sandwich.name,
        price: sandwich.price,
      });
    }
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
            <h2 className="text-2xl font-bold text-black mb-2">Today's Menu</h2>
            <p className="text-gray-600">{formatDate()}</p>
          </div>

          <div className="space-y-5">
            {sandwiches.map(sandwich => (
              <SandwichItem
                key={sandwich.id}
                name={sandwich.name}
                description={sandwich.description}
                price={sandwich.price}
                availableStock={sandwich.availableStock}
                imageUrl={sandwich.imageUrl}
                onAddToCart={() => handleAddToCart(sandwich.id)}
              />
            ))}
          </div>
        </section>

        {/* About Section */}
        <AboutSection />
      </div>
    </MainLayout>
  );
}
