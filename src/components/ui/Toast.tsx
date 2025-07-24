import React from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { useUIStore, Toast as ToastType } from '@/stores';
import { cn } from '@/utils';

interface ToastProps {
  toast: ToastType;
}

const toastIcons = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle,
};

const toastStyles = {
  success: 'bg-success/10 border-success/20 text-success',
  error: 'bg-destructive/10 border-destructive/20 text-destructive',
  info: 'bg-primary/10 border-primary/20 text-primary',
  warning: 'bg-warning/10 border-warning/20 text-warning',
};

export const ToastItem: React.FC<ToastProps> = ({ toast }) => {
  const { dismissToast } = useUIStore();
  const Icon = toastIcons[toast.type];

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-4 rounded-lg border shadow-lg backdrop-blur-sm',
        'animate-in slide-in-from-right-full duration-300',
        toastStyles[toast.type]
      )}
    >
      <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
      
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-sm">{toast.title}</h4>
        <p className="text-sm opacity-90 mt-1">{toast.message}</p>
        
        {toast.action && (
          <button
            onClick={toast.action.onClick}
            className="text-sm font-medium underline mt-2 hover:no-underline"
          >
            {toast.action.label}
          </button>
        )}
      </div>
      
      <button
        onClick={() => dismissToast(toast.id)}
        className="p-1 rounded-md hover:bg-black/10 transition-colors"
        aria-label="Dismiss notification"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export const ToastContainer: React.FC = () => {
  const { toasts } = useUIStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
};