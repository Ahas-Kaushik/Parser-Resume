import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CandidateDashboard from './pages/CandidateDashboard';
import EmployerDashboard from './pages/EmployerDashboard';
import JobListings from './pages/JobListings';
import JobDetails from './pages/JobDetails';
import ApplicationStatus from './pages/ApplicationStatus';
import PostJobPage from './pages/PostJobPage';
import ChatPage from './pages/ChatPage';
import ProfilePage from './pages/ProfilePage';

// Components
import { ProtectedRoute } from './components/layout/ProtectedRoute';

function App() {
  const { user } = useAuthStore();

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/jobs" element={<JobListings />} />
        <Route path="/jobs/:jobId" element={<JobDetails />} />

        {/* Protected Routes - Candidate */}
        <Route
          path="/candidate/dashboard"
          element={
            <ProtectedRoute allowedRoles={['candidate']}>
              <CandidateDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/candidate/applications"
          element={
            <ProtectedRoute allowedRoles={['candidate']}>
              <ApplicationStatus />
            </ProtectedRoute>
          }
        />

        {/* Protected Routes - Employer */}
        <Route
          path="/employer/dashboard"
          element={
            <ProtectedRoute allowedRoles={['employer']}>
              <EmployerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/employer/post-job"
          element={
            <ProtectedRoute allowedRoles={['employer']}>
              <PostJobPage />
            </ProtectedRoute>
          }
        />

        {/* Protected Routes - Both */}
        <Route
          path="/chat"
          element={
            <ProtectedRoute allowedRoles={['candidate', 'employer']}>
              <ChatPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute allowedRoles={['candidate', 'employer']}>
              <ProfilePage />
            </ProtectedRoute>
          }
        />

        {/* Redirect /dashboard based on role */}
        <Route
          path="/dashboard"
          element={
            user ? (
              user.role === 'employer' ? (
                <Navigate to="/employer/dashboard" replace />
              ) : (
                <Navigate to="/candidate/dashboard" replace />
              )
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;