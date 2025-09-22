"use client";

import React, { useContext } from 'react';
import { Toast } from '@/components/ui/toast';
import { useToast as useToastHook } from '@/common/hooks/useToast';

export function Toaster() {
  const { toasts, dismiss } = useToastHook();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          variant={toast.variant}
          title={toast.title}
          description={toast.description}
          onClose={() => dismiss(toast.id)}
        />
      ))}
    </div>
  );
}
