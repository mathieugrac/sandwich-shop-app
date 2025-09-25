'use client';

import { AdminPageTemplate } from '@/components/admin/layout/AdminPageTemplate';
import { useRequireAuth } from '@/lib/hooks';

export default function AnalyticsPage() {
  useRequireAuth();

  return (
    <AdminPageTemplate title="Analytics">
      <div className="text-center py-12">
        <p className="text-gray-600">
          Analytics functionality to be done later.
        </p>
      </div>
    </AdminPageTemplate>
  );
}
