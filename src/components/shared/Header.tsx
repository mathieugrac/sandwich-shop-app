import { Badge } from '@/components/ui/badge';

export function Header() {
  return (
    <header className="text-center py-16 px-5">
      <img
        src="/logo-moonlight-3.svg"
        alt="Fomé"
        className="mx-auto mb-5 h-18 w-auto"
      />
      <p
        className="text-gray-700 uppercase"
        style={{ letterSpacing: '1px', fontSize: '14px', lineHeight: '26px' }}
      >
        Gourmet sandwiches,
        <br />
        crafted for your lunch.
      </p>
    </header>
  );
}
