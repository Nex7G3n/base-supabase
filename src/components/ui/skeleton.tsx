import React from 'react';

interface SkeletonProps {
  className?: string;
  children?: React.ReactNode;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '', children }) => {
  return (
    <div className={`animate-pulse bg-gray-200 rounded ${className}`}>
      {children}
    </div>
  );
};

export const SkeletonText: React.FC<{ lines?: number; className?: string }> = ({ 
  lines = 1, 
  className = '' 
}) => {
  return (
    <div className={className}>
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className={`h-4 bg-gray-200 rounded animate-pulse mb-2 ${
            index === lines - 1 && lines > 1 ? 'w-3/4' : 'w-full'
          }`}
        />
      ))}
    </div>
  );
};

export const SkeletonCard: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`bg-white rounded-lg shadow-sm p-6 ${className}`}>
      <div className="animate-pulse">
        <div className="flex items-center mb-4">
          <div className="w-8 h-8 bg-gray-200 rounded mr-3" />
          <div className="h-6 bg-gray-200 rounded w-32" />
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-full" />
          <div className="h-4 bg-gray-200 rounded w-3/4" />
        </div>
      </div>
    </div>
  );
};

export const PageSkeleton: React.FC<{ isAuthenticated?: boolean }> = ({ isAuthenticated = true }) => {
  if (!isAuthenticated) {
    return <LoginSkeleton />;
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar skeleton */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="flex flex-col w-64">
          <div className="flex flex-col h-0 flex-1 bg-white border-r border-gray-200">
            <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
              <div className="flex items-center flex-shrink-0 px-4 animate-pulse">
                <div className="h-8 w-32 bg-gray-200 rounded" />
              </div>
              <nav className="mt-5 flex-1 px-2 space-y-1">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-10 bg-gray-200 rounded animate-pulse mb-2" />
                ))}
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Main content skeleton */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header skeleton */}
        <header className="bg-white shadow-sm border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between px-4 py-4 animate-pulse">
            <div className="h-6 w-24 bg-gray-200 rounded lg:hidden" />
            <div className="h-6 w-32 bg-gray-200 rounded flex-1 lg:ml-4" />
            <div className="flex items-center space-x-4">
              <div className="h-4 w-20 bg-gray-200 rounded hidden md:block" />
              <div className="w-8 h-8 bg-gray-200 rounded-full" />
            </div>
          </div>
        </header>

        {/* Page content skeleton */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-6">
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="text-center animate-pulse">
                  <div className="h-10 bg-gray-200 rounded w-64 mx-auto mb-4" />
                  <div className="h-6 bg-gray-200 rounded w-48 mx-auto mb-6" />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    <SkeletonCard />
                    <SkeletonCard />
                    <SkeletonCard />
                  </div>
                  
                  <div className="pt-6 border-t border-gray-200">
                    <div className="h-4 bg-gray-200 rounded w-48 mx-auto mb-4" />
                    <div className="h-10 bg-gray-200 rounded w-32 mx-auto" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export const LoginSkeleton: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md">
        <div className="text-center animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mx-auto mb-2" />
          <div className="h-6 bg-gray-200 rounded w-64 mx-auto mb-8" />
        </div>
        
        <div className="space-y-4 animate-pulse">
          <div className="h-12 bg-gray-200 rounded w-full" />
          <div className="text-center">
            <div className="h-4 bg-gray-200 rounded w-32 mx-auto" />
          </div>
        </div>
      </div>
    </div>
  );
};

// Export simple skeleton for quick use
export const SimpleSkeleton: React.FC<{ className?: string }> = ({ className = 'h-4 w-full' }) => {
  return <div className={`animate-pulse bg-gray-200 rounded ${className}`} />;
};
