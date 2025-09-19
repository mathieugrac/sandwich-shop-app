'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface DropData {
  id: string;
  date: string;
  location: {
    name: string;
    district: string;
  };
}

interface PageHeaderProps {
  dropData: DropData;
  backTarget: string;
}

export function PageHeader({ dropData, backTarget }: PageHeaderProps) {
  const router = useRouter();

  // Format date exactly like Drop page
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      month: 'short',
      day: 'numeric',
    };
    const formattedDate = date.toLocaleDateString('en-US', options);
    // Add period after the abbreviated month (e.g., "Aug 14" becomes "Aug. 14")
    return `Pickup on ${formattedDate.replace(/^(\w{3})\s/, '$1. ')}`;
  };

  const handleBack = () => {
    router.push(backTarget);
  };

  const title = formatDate(dropData.date);
  const subtitle = `${dropData.location.name} – ${dropData.location.district}`;

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

      <div className="w-10" />
    </div>
  );
}
