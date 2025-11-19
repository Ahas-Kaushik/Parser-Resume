import { useEffect } from 'react';
import { X, CheckCircle, XCircle, Info, AlertTriangle } from 'lucide-react';
import { useUIStore } from '../../store/uiStore';

export const ToastContainer = () => {
  const { toasts, removeToast } = useUIStore();

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          {...toast}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
};

interface ToastProps {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  onClose: () => void;
}

const Toast = ({ type, message, onClose }: ToastProps) => {
  const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-400" />,
    error: <XCircle className="w-5 h-5 text-red-400" />,
    info: <Info className="w-5 h-5 text-blue-400" />,
    warning: <AlertTriangle className="w-5 h-5 text-yellow-400" />,
  };

  const backgrounds = {
    success: 'bg-green-500/20 border-green-500/50',
    error: 'bg-red-500/20 border-red-500/50',
    info: 'bg-blue-500/20 border-blue-500/50',
    warning: 'bg-yellow-500/20 border-yellow-500/50',
  };

  return (
    <div
      className={`
        flex items-start space-x-3 p-4 rounded-xl
        backdrop-blur-xl border shadow-xl
        animate-slideIn min-w-[300px] max-w-md
        ${backgrounds[type]}
      `}
    >
      <div className="flex-shrink-0 mt-0.5">{icons[type]}</div>
      <p className="flex-1 text-white text-sm">{message}</p>
      <button
        onClick={onClose}
        className="flex-shrink-0 text-white/70 hover:text-white transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};