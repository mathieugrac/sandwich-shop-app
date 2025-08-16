import { Badge } from '@/components/ui/badge';

export function Header() {
  return (
    <header className="text-center py-16 px-5">
      <img
        src="/logo-fome.svg"
        alt="Fomé"
        className="mx-auto mb-5 h-16 w-auto"
      />
      <p className=" text-lg mb-1">Gourmet sandwiches for your Lunch</p>
      <p className="text-gray-600 text-md">Limited batches, pre-order only</p>
    </header>
  );
}
