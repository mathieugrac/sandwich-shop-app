'use client';

import { MainLayout } from '@/components/shared/MainLayout';
import { UpcomingDrops } from '@/components/customer/UpcomingDrops';

export default function Home() {
  return (
    <MainLayout>
      <div className="space-y-8 py-5">
        {/* Upcoming Drops Calendar */}
        <UpcomingDrops />
      </div>
    </MainLayout>
  );
}
