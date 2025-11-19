import { Link, useNavigate } from 'react-router-dom';
import { LogOut, User, Briefcase, MessageCircle, Home } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useToast } from '../../hooks/useToast';

export default function Navbar() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuthStore();
  const toast = useToast();

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
          <div className="flex items-center space-x-6">
            {isAuthenticated ? (
              <>
                <Link
                  to="/"
                  className="flex items-center space-x-2 text-white/80 hover:text-white transition-colors"
                >
                  <Home className="w-4 h-4" />
                  <span>Home</span>
                </Link>

                <Link
                  to="/jobs"
                  className="flex items-center space-x-2 text-white/80 hover:text-white transition-colors"
                >
                  <Briefcase className="w-4 h-4" />
                  <span>Jobs</span>
                </Link>

                <Link
                  to="/chat"
                  className="flex items-center space-x-2 text-white/80 hover:text-white transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Chat</span>
                </Link>

                <Link
                  to={user?.role === 'employer' ? '/employer/dashboard' : '/candidate/dashboard'}
                  className="flex items-center space-x-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl transition-all"
                >
                  <User className="w-4 h-4 text-white" />
                  <span className="text-white font-medium">Dashboard</span>
                </Link>

                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-xl transition-all border border-red-500/50"
                >
                  <LogOut className="w-4 h-4 text-red-300" />
                  <span className="text-red-300 font-medium">Logout</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/jobs"
                  className="text-white/80 hover:text-white transition-colors"
                >
                  Browse Jobs
                </Link>

                <Link
                  to="/login"
                  className="px-4 py-2 text-white/80 hover:text-white transition-colors"
                >
                  Login
                </Link>

                <Link
                  to="/register"
                  className="px-6 py-2 bg-white/20 hover:bg-white/30 text-white font-semibold rounded-xl transition-all backdrop-blur-sm border border-white/30"
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