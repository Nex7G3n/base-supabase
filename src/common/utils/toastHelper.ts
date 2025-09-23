import toast from 'react-hot-toast';

interface ToastHelperOptions {
  title?: string;
  description?: string;
  duration?: number;
}

export class ToastHelper {
  static success(message: string, options?: ToastHelperOptions) {
    const { title, description, duration = 4000 } = options || {};
    
    if (title && description) {
      return toast.success(
        `${title}: ${description}`,
        { duration }
      );
    }
    
    return toast.success(message, { duration });
  }

  static error(message: string, options?: ToastHelperOptions) {
    const { title, description, duration = 5000 } = options || {};
    
    if (title && description) {
      return toast.error(
        `${title}: ${description}`,
        { duration }
      );
    }
    
    return toast.error(message, { duration });
  }

  static warning(message: string, options?: ToastHelperOptions) {
    const { title, description, duration = 4000 } = options || {};
    
    const fullMessage = title && description ? `${title}: ${description}` : message;
    
    return toast(fullMessage, {
      duration,
      icon: '⚠️',
      style: {
        background: '#fef3c7',
        color: '#92400e',
        border: '1px solid #fcd34d',
      },
    });
  }

  static info(message: string, options?: ToastHelperOptions) {
    const { title, description, duration = 4000 } = options || {};
    
    const fullMessage = title && description ? `${title}: ${description}` : message;
    
    return toast(fullMessage, {
      duration,
      icon: 'ℹ️',
      style: {
        background: '#dbeafe',
        color: '#1e40af',
        border: '1px solid #93c5fd',
      },
    });
  }

  static loading(message: string, duration?: number) {
    return toast.loading(message, {
      duration: duration || Infinity,
    });
  }

  static dismiss(toastId?: string) {
    return toast.dismiss(toastId);
  }

  static promise<T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: any) => string);
    },
    duration: number = 4000
  ) {
    return toast.promise(promise, messages, { duration });
  }
}