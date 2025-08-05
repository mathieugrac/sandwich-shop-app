import { Badge } from '@/components/ui/badge';

export function Header() {
  return (
    <header className="text-center py-12 px-5">
      {/* Status Pill */}
      <div className="flex justify-center mb-12">
        <Badge
          variant="outline"
          className="flex items-center gap-1 px-3 py-1 rounded-full border-2 text-xs"
        >
          <div className="w-1.5 h-1.5 bg-black rounded-full"></div>
          <span className="text-xs font-medium">PRE-ORDERS OPENED</span>
        </Badge>
      </div>

      {/* Brand Name */}
      <h1 className="text-4xl font-bold text-black mb-2">Fomé</h1>

      {/* Description */}
      <p className="text-lg text-black/80 mb-8">
        Your signature sandwiches for a delicious lunch.
      </p>
    </header>
  );
}
