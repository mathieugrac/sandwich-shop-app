'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
  backUrl?: string;
  actionButton?: React.ReactNode;
}

export default function AdminLayout({
  children,
  title,
  backUrl = '/admin/dashboard',
  actionButton,
}: AdminLayoutProps) {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button
              onClick={() => router.push(backUrl)}
              variant="ghost"
              size="sm"
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
            </div>
          </div>
          {actionButton}
        </div>

        {children}
      </div>
    </div>
  );
}
