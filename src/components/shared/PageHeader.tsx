'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MapPin } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  showBackButton?: boolean;
  showMapPin?: boolean;
  locationUrl?: string;
  onBackClick?: () => void;
}

export function PageHeader({
  title,
  subtitle,
  showBackButton = true,
  showMapPin = false,
  locationUrl,
  onBackClick,
}: PageHeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    if (onBackClick) {
      onBackClick();
    } else {
      router.back();
    }
  };

  const handleMapPinClick = () => {
    if (locationUrl) {
      window.open(locationUrl, '_blank');
    }
  };

  return (
    <div className="sticky top-0 z-40 bg-white border-b border-gray-200 p-3 flex justify-between items-center">
      <Button
        onClick={handleBack}
        variant="ghost"
        className="w-10 h-10 p-0 flex items-center justify-center"
      >
        <ArrowLeft className="w-5 h-5" />
      </Button>

      <div className="text-center flex-1">
        <div className="text-md font-semibold">{title}</div>
        {subtitle && <div className="text-sm text-gray-600">{subtitle}</div>}
      </div>

      {showMapPin && locationUrl ? (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleMapPinClick}
          className="p-2"
        >
          <MapPin className="w-5 h-5" />
        </Button>
      ) : (
        <div className="w-10" />
      )}
    </div>
  );
}
