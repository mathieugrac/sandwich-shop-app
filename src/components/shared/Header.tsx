import { Badge } from '@/components/ui/badge';

export function Header() {
  return (
    <header className="text-center py-16 px-5">
      <img
        src="/logo-kusack.svg"
        alt="Fomé"
        className="mx-auto mb-5 h-18 w-auto"
      />
      <p className="text-lg leading-normal tracking-normal text-gray-700">
        Gourmet sandwiches,
        <br />
        crafted for your lunch.
      </p>
    </header>
  );
}
