import { Badge } from '@/components/ui/badge';

export function Header() {
  return (
    <header className="text-center py-16 px-5">
      <h1 className="text-4xl font-bold text-black mb-5">Fomé</h1>
      <p className=" text-lg mb-1">Gourmet sandwiches for your Lunch.</p>
      <p className="text-gray-600 text-md">Limited batches, pre-order only.</p>
    </header>
  );
}
