import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, User, Briefcase, MessageCircle, Home, Bell } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useNotificationStore } from '../../store/notificationStore';
import { useToast } from '../../hooks/useToast';
import { ThemeToggle } from '../ui/ThemeToggle';

export default function Navbar() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { unreadCount, fetchUnreadCount } = useNotificationStore();
  const toast = useToast();

  // Poll unread count every 30 seconds while logged in
  useEffect(() => {
    if (!isAuthenticated) return;
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30_000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/');
  };

  return (
    <nav className="bg-white/10 backdrop-blur-xl border-b border-white/20 sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <img
              src="/fyj-logo.png"
              alt="Fetch Ya Job"
              className="h-10 w-10 object-contain group-hover:scale-110 transition-transform"
            />
            <span className="text-xl font-bold text-white">Fetch Ya Job</span>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <Link
                  to="/"
                  className="flex items-center space-x-1 text-white/80 hover:text-white transition-colors"
                >
                  <Home className="w-4 h-4" />
                  <span className="hidden sm:inline">Home</span>
                </Link>

                <Link
                  to="/jobs"
                  className="flex items-center space-x-1 text-white/80 hover:text-white transition-colors"
                >
                  <Briefcase className="w-4 h-4" />
                  <span className="hidden sm:inline">Jobs</span>
                </Link>

                <Link
                  to="/chat"
                  className="flex items-center space-x-1 text-white/80 hover:text-white transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span className="hidden sm:inline">Chat</span>
                </Link>

                {/* ── Inbox Bell with unread badge ── */}
                <Link
                  to="/inbox"
                  className="relative flex items-center space-x-1 text-white/80 hover:text-white transition-colors"
                  title="Inbox"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 animate-pulse">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </Link>

                <Link
                  to={user?.role === 'employer' ? '/employer/dashboard' : '/candidate/dashboard'}
                  className="flex items-center space-x-2 px-3 py-2 bg-white/20 hover:bg-white/30 rounded-xl transition-all"
                >
                  {/* Show avatar if OAuth user, else generic icon */}
                  {(user as any)?.avatar_url ? (
                    <img
                      src={(user as any).avatar_url}
                      alt={user?.name}
                      className="w-5 h-5 rounded-full"
                    />
                  ) : (
                    <User className="w-4 h-4 text-white" />
                  )}
                  <span className="text-white font-medium hidden sm:inline">Dashboard</span>
                </Link>

                <ThemeToggle />

                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 px-3 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-xl transition-all border border-red-500/50"
                >
                  <LogOut className="w-4 h-4 text-red-300" />
                  <span className="text-red-300 font-medium hidden sm:inline">Logout</span>
                </button>
              </>
            ) : (
              <>
                <Link to="/jobs" className="text-white/80 hover:text-white transition-colors">
                  Browse Jobs
                </Link>
                <Link to="/login" className="px-4 py-2 text-white/80 hover:text-white transition-colors">
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-5 py-2 bg-white/20 hover:bg-white/30 text-white font-semibold rounded-xl transition-all backdrop-blur-sm border border-white/30"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}