import { create } from 'zustand';
import type { ToastMessage } from '../types';
import { generateId } from '../lib/utils';

interface UIState {
  toasts: ToastMessage[];
  showToast: (type: ToastMessage['type'], message: string, duration?: number) => void;
  removeToast: (id: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  toasts: [],

  showToast: (type, message, duration = 5000) => {
    const id = generateId();
    const toast: ToastMessage = { id, type, message, duration };
    
    set((state) => ({
      toasts: [...state.toasts, toast],
    }));

    // Auto remove after duration
    if (duration > 0) {
      setTimeout(() => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        }));
      }, duration);
    }
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },
}));