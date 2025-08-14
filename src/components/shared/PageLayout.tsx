import { ReactNode } from 'react';

interface PageLayoutProps {
  children: ReactNode;
  className?: string;
}

export function PageLayout({ children, className = '' }: PageLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-100">
      <div
        className={`max-w-[480px] mx-auto bg-white min-h-screen ${className}`}
      >
        {children}
      </div>
    </div>
  );
}
