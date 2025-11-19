import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { Spinner } from '../ui/Spinner';
import type { UserRole } from '../../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { isAuthenticated, user, checkAuth } = useAuthStore();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const verifyAuth = async () => {
      console.log('🔍 ProtectedRoute: Checking auth...');
      await checkAuth();
      setIsChecking(false);
      console.log('✅ ProtectedRoute: Auth check complete');
    };
    
    verifyAuth();
  }, [checkAuth]);

  // Show loading while checking auth
  if (isChecking) {
    console.log('⏳ ProtectedRoute: Still checking auth...');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-500 via-blue-500 to-purple-500">
        <Spinner size="lg" />
      </div>
    );
  }

  // Not authenticated - redirect to login
  if (!isAuthenticated || !user) {
    console.log('🚫 ProtectedRoute: Not authenticated, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  // Check role if specified
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    console.log('🚫 ProtectedRoute: Wrong role, redirecting home');
    return <Navigate to="/" replace />;
  }

  console.log('✅ ProtectedRoute: Access granted');
  return <>{children}</>;
};