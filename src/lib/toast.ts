import { toast as sonnerToast } from 'sonner';

// Custom toast wrapper with better styling and functionality
export const toast = {
  success: (message: string, options?: any) => {
    return sonnerToast.success(message, {
      style: {
        background: '#10B981',
        color: 'white',
        border: 'none',
      },
      ...options,
    });
  },

  error: (message: string, options?: any) => {
    return sonnerToast.error(message, {
      style: {
        background: '#EF4444',
        color: 'white',
        border: 'none',
      },
      duration: 6000, // Longer for errors
      ...options,
    });
  },

  info: (message: string, options?: any) => {
    return sonnerToast.info(message, {
      style: {
        background: '#3B82F6',
        color: 'white',
        border: 'none',
      },
      ...options,
    });
  },

  loading: (message: string, options?: any) => {
    return sonnerToast.loading(message, {
      style: {
        background: '#6B7280',
        color: 'white',
        border: 'none',
      },
      ...options,
    });
  },

  promise: sonnerToast.promise,

  // Confirmation toast with actions
  confirm: (
    message: string,
    onConfirm: () => void | Promise<void>,
    onCancel?: () => void
  ) => {
    return sonnerToast(message, {
      action: {
        label: 'Confirm',
        onClick: async () => {
          try {
            await onConfirm();
          } catch (error) {
            console.error('Confirm action failed:', error);
          }
        },
      },
      cancel: {
        label: 'Cancel',
        onClick: () => {
          if (onCancel) onCancel();
          sonnerToast.dismiss();
        },
      },
      duration: Infinity,
      style: {
        background: 'white',
        color: '#1F2937',
        border: '1px solid #D1D5DB',
      },
    });
  },

  dismiss: sonnerToast.dismiss,
  dismissAll: () => sonnerToast.dismiss(),
};

export default toast;