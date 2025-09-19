'use client';

import { MainLayout } from '@/components/shared/MainLayout';
import { UpcomingDrops } from '@/components/customer/UpcomingDrops';

export default function Home() {
  return (
    <MainLayout>
      <div className="space-y-8 py-4">
        <UpcomingDrops />
        <p className=" text-sm text-gray-500 text-center">
          Limited batches. Pre-order only.
        </p>
      </div>
    </MainLayout>
  );
}
