"use client";

import toast, { ToastOptions } from 'react-hot-toast';

interface CustomToastOptions extends ToastOptions {
  title?: string;
  description?: string;
}

export const useToastNotifications = () => {
  const showToast = (message: string, options?: CustomToastOptions) => {
    const { title, description, ...toastOptions } = options || {};
    
    if (title && description) {
      return toast(
        () => (
          <div className="flex flex-col gap-1">
            <div className="font-medium text-sm">{title}</div>
            <div className="text-sm text-gray-600">{description}</div>
          </div>
        ),
        {
          duration: 4000,
          ...toastOptions,
        }
      );
    }
    
    return toast(message, {
      duration: 4000,
      ...toastOptions,
    });
  };

  const success = (message: string, options?: CustomToastOptions) => {
    const { title, description, ...toastOptions } = options || {};
    
    if (title && description) {
      return toast.success(
        () => (
          <div className="flex flex-col gap-1">
            <div className="font-medium text-sm">{title}</div>
            <div className="text-sm text-gray-600">{description}</div>
          </div>
        ),
        {
          duration: 4000,
          ...toastOptions,
        }
      );
    }
    
    return toast.success(message, {
      duration: 4000,
      ...toastOptions,
    });
  };

  const error = (message: string, options?: CustomToastOptions) => {
    const { title, description, ...toastOptions } = options || {};
    
    if (title && description) {
      return toast.error(
        () => (
          <div className="flex flex-col gap-1">
            <div className="font-medium text-sm">{title}</div>
            <div className="text-sm text-gray-600">{description}</div>
          </div>
        ),
        {
          duration: 5000,
          ...toastOptions,
        }
      );
    }
    
    return toast.error(message, {
      duration: 5000,
      ...toastOptions,
    });
  };

  const warning = (message: string, options?: CustomToastOptions) => {
    const { title, description, ...toastOptions } = options || {};
    
    if (title && description) {
      return toast(
        () => (
          <div className="flex flex-col gap-1">
            <div className="font-medium text-sm">{title}</div>
            <div className="text-sm text-gray-600">{description}</div>
          </div>
        ),
        {
          duration: 4000,
          icon: '⚠️',
          style: {
            background: '#fef3c7',
            color: '#92400e',
            border: '1px solid #fcd34d',
          },
          ...toastOptions,
        }
      );
    }
    
    return toast(message, {
      duration: 4000,
      icon: '⚠️',
      style: {
        background: '#fef3c7',
        color: '#92400e',
        border: '1px solid #fcd34d',
      },
      ...toastOptions,
    });
  };

  const info = (message: string, options?: CustomToastOptions) => {
    const { title, description, ...toastOptions } = options || {};
    
    if (title && description) {
      return toast(
        () => (
          <div className="flex flex-col gap-1">
            <div className="font-medium text-sm">{title}</div>
            <div className="text-sm text-gray-600">{description}</div>
          </div>
        ),
        {
          duration: 4000,
          icon: 'ℹ️',
          style: {
            background: '#dbeafe',
            color: '#1e40af',
            border: '1px solid #93c5fd',
          },
          ...toastOptions,
        }
      );
    }
    
    return toast(message, {
      duration: 4000,
      icon: 'ℹ️',
      style: {
        background: '#dbeafe',
        color: '#1e40af',
        border: '1px solid #93c5fd',
      },
      ...toastOptions,
    });
  };

  const loading = (message: string, options?: ToastOptions) => {
    return toast.loading(message, {
      duration: Infinity,
      ...options,
    });
  };

  const dismiss = (toastId?: string) => {
    return toast.dismiss(toastId);
  };

  const promise = <T,>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: any) => string);
    },
    options?: ToastOptions
  ) => {
    return toast.promise(promise, messages, {
      duration: 4000,
      ...options,
    });
  };

  return {
    toast: showToast,
    success,
    error,
    warning,
    info,
    loading,
    dismiss,
    promise,
  };
};