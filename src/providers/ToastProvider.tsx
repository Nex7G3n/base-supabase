"use client";

import React, { createContext, useContext, ReactNode } from 'react';
import { useToast as useToastHook, ToastMessage } from '@/common/hooks/useToast';
import { Toaster } from '@/components/ui/toaster';

interface ToastContextType {
  toast: (message: Omit<ToastMessage, 'id'>) => string;
  dismiss: (id: string) => void;
  success: (title: string, description?: string) => string;
  error: (title: string, description?: string) => string;
  warning: (title: string, description?: string) => string;
  info: (title: string, description?: string) => string;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

interface ToastProviderProps {
  children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const toastHook = useToastHook();

  return (
    <ToastContext.Provider value={toastHook}>
      {children}
      <Toaster />
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextType {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
