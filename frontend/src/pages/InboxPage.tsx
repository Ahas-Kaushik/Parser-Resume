/**
 * InboxPage — Notifications inbox
 * Shows: new job alerts, DM notifications, application updates
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Mail, Briefcase, CheckCheck, ArrowLeft } from 'lucide-react';
import { GlassLayout } from '../components/layout/GlassLayout';
import { GlassCard } from '../components/ui/GlassCard';
import Navbar from '../components/layout/Navbar';
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

const typeIcon = (type: Notification['type']) => {
  switch (type) {
    case 'new_job': return <Briefcase className="w-5 h-5 text-indigo-300" />;
    case 'direct_message': return <Mail className="w-5 h-5 text-purple-300" />;
    case 'application_update': return <CheckCheck className="w-5 h-5 text-green-300" />;
    default: return <Bell className="w-5 h-5 text-white/60" />;
  }
};

const typeBg = (type: Notification['type']) => {
  switch (type) {
    case 'new_job': return 'bg-indigo-500/20 border-indigo-500/30';
    case 'direct_message': return 'bg-purple-500/20 border-purple-500/30';
    case 'application_update': return 'bg-green-500/20 border-green-500/30';
    default: return 'bg-white/5 border-white/10';
  }
};

export default function InboxPage() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.get<Notification[]>(`/notifications/?unread_only=${filter === 'unread'}`);
      setNotifications(res.data);
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNotifications(); }, [filter]);

  const markAllRead = async () => {
    try {
      await api.post('/notifications/mark-all-read');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.error('Failed to mark all read', err);
    }
  };

  const handleClick = async (notif: Notification) => {
    // Mark this one as read
    if (!notif.is_read) {
      try {
        await api.post('/notifications/mark-read', { notification_ids: [notif.id] });
        setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
      } catch {}
    }
    if (notif.link) navigate(notif.link);
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <GlassLayout>
      <Navbar />
      <div className="container mx-auto px-6 py-10 max-w-3xl">
        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center space-x-2 text-white/70 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back</span>
        </button>

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Bell className="w-7 h-7 text-white" />
            <h1 className="text-3xl font-bold text-white">Inbox</h1>
            {unreadCount > 0 && (
              <span className="bg-indigo-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="text-sm text-indigo-300 hover:text-indigo-200 flex items-center space-x-1"
            >
              <CheckCheck className="w-4 h-4" />
              <span>Mark all read</span>
            </button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex space-x-2 mb-6">
          {(['all', 'unread'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all capitalize ${
                filter === f
                  ? 'bg-indigo-500/30 text-indigo-200 border border-indigo-500/50'
                  : 'text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Notifications List */}
        {loading ? (
          <div className="text-center py-20 text-white/50">Loading...</div>
        ) : notifications.length === 0 ? (
          <GlassCard className="text-center py-16">
            <Bell className="w-12 h-12 text-white/30 mx-auto mb-4" />
            <p className="text-white/60 text-lg">
              {filter === 'unread' ? 'No unread notifications' : 'Your inbox is empty'}
            </p>
          </GlassCard>
        ) : (
          <div className="space-y-3">
            {notifications.map(notif => (
              <button
                key={notif.id}
                onClick={() => handleClick(notif)}
                className={`w-full text-left p-4 rounded-xl border transition-all ${typeBg(notif.type)} ${
                  !notif.is_read ? 'ring-1 ring-white/20' : 'opacity-70'
                } hover:opacity-100`}
              >
                <div className="flex items-start space-x-3">
                  <div className="mt-0.5 flex-shrink-0">{typeIcon(notif.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`font-semibold text-sm truncate ${notif.is_read ? 'text-white/70' : 'text-white'}`}>
                        {notif.title}
                      </p>
                      {!notif.is_read && (
                        <span className="w-2 h-2 bg-indigo-400 rounded-full flex-shrink-0 mt-1" />
                      )}
                    </div>
                    <p className="text-white/60 text-sm mt-0.5 line-clamp-2">{notif.message}</p>
                    <p className="text-white/30 text-xs mt-1">
                      {new Date(notif.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </GlassLayout>
  );
}