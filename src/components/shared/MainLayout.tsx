import { Header } from './Header';
import { Footer } from './Footer';
import { StickyBasketButton } from '@/components/customer/StickyBasketButton';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-[480px] mx-auto bg-white min-h-screen">
        <Header />
        <main className="px-5">{children}</main>
        <Footer />
        <StickyBasketButton />
      </div>
    </div>
  );
}
