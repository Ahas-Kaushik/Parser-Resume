/**
 * Notification Store (Zustand)
 * Manages inbox notifications state globally.
 * Drives the unread badge count shown in the Navbar.
 */

import { create } from 'zustand';
import api from '../lib/api';

interface Notification {
  id: number;
  type: 'new_job' | 'direct_message' | 'application_update' | 'system';
  title: string;
  message: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;

  fetchNotifications: (unreadOnly?: boolean) => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markRead: (ids: number[]) => Promise<void>;
  markAllRead: () => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,

  fetchNotifications: async (unreadOnly = false) => {
    set({ isLoading: true });
    try {
      const res = await api.get<Notification[]>(`/notifications/?unread_only=${unreadOnly}`);
      set({
        notifications: res.data,
        unreadCount: res.data.filter(n => !n.is_read).length,
        isLoading: false
      });
    } catch (err) {
      set({ isLoading: false });
    }
  },

  fetchUnreadCount: async () => {
    try {
      const res = await api.get<{ unread_count: number }>('/notifications/unread-count');
      set({ unreadCount: res.data.unread_count });
    } catch {}
  },

  markRead: async (ids: number[]) => {
    try {
      await api.post('/notifications/mark-read', { notification_ids: ids });
      set(state => ({
        notifications: state.notifications.map(n =>
          ids.includes(n.id) ? { ...n, is_read: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - ids.filter(
          id => state.notifications.find(n => n.id === id && !n.is_read)
        ).length)
      }));
    } catch {}
  },

  markAllRead: async () => {
    try {
      await api.post('/notifications/mark-all-read');
      set(state => ({
        notifications: state.notifications.map(n => ({ ...n, is_read: true })),
        unreadCount: 0
      }));
    } catch {}
  }
}));