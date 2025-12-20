'use client';

import { useToast } from '@/contexts/ToastContext';
import { FaCheckCircle, FaExclamationCircle, FaInfoCircle, FaTimes, FaExclamationTriangle } from 'react-icons/fa';

export const Toaster = () => {
  const { toasts, removeToast } = useToast();

  const typeConfig = {
    success: {
      bg: 'bg-green-50 border-green-200',
      text: 'text-green-800',
      icon: FaCheckCircle,
      iconColor: 'text-green-600',
    },
    error: {
      bg: 'bg-red-50 border-red-200',
      text: 'text-red-800',
      icon: FaExclamationCircle,
      iconColor: 'text-red-600',
    },
    warning: {
      bg: 'bg-yellow-50 border-yellow-200',
      text: 'text-yellow-800',
      icon: FaExclamationTriangle,
      iconColor: 'text-yellow-600',
    },
    info: {
      bg: 'bg-blue-50 border-blue-200',
      text: 'text-blue-800',
      icon: FaInfoCircle,
      iconColor: 'text-blue-600',
    },
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[10000] flex flex-col gap-2 max-w-md w-full">
      {toasts.map((toast) => {
        const config = typeConfig[toast.type];
        const Icon = config.icon;

        return (
          <div
            key={toast.id}
            className={`${config.bg} ${config.text} border rounded-lg shadow-lg p-4 flex items-start gap-3 animate-slideInUp`}
          >
            <Icon className={`${config.iconColor} flex-shrink-0 mt-0.5`} />
            <p className="flex-1 text-sm font-medium">{toast.message}</p>
            <button
              onClick={() => removeToast(toast.id)}
              className={`${config.iconColor} hover:opacity-70 transition-opacity flex-shrink-0`}
            >
              <FaTimes className="text-sm" />
            </button>
          </div>
        );
      })}
    </div>
  );
};

