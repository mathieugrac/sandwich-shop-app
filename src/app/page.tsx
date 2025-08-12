'use client';

import { MainLayout } from '@/components/shared/MainLayout';
import { ProjectDescription } from '@/components/customer/ProjectDescription';
import { UpcomingDrops } from '@/components/customer/UpcomingDrops';
import { AboutSection } from '@/components/customer/AboutSection';

export default function Home() {
  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Upcoming Drops Calendar */}
        <UpcomingDrops />
      </div>
    </MainLayout>
  );
}
