import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import './utils/i18n';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './context/AuthContext';

// Pages
import LandingPage from './pages/LandingPage';
import CitizenLanding from './pages/CitizenLanding';
import TrackComplaint from './pages/TrackComplaint';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ComplaintDetail from './pages/ComplaintDetail';
import AdminDashboard from './pages/AdminDashboard';
import AnalyticsPage from './pages/AnalyticsPage';
import DepartmentView from './pages/DepartmentView';

// Home route — pehli baar landing dikhao, login ke baad complaint form
const HomeRoute = () => {
  const { user, loading } = useAuth();

  if (loading) return null;

  // Logged in users
  if (user) {
    if (['super_admin', 'department_head', 'officer'].includes(user.role)) {
      return <Navigate to="/admin" replace />;
    }
    // Citizen — complaint form
    return <Navigate to="/complaint-form" replace />;
  }

  // Logged out — Landing page
  return <LandingPage />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-primary)', fontFamily: 'var(--font-body)' }}>
          <Navbar />

          <main className="flex-grow pt-16 flex flex-col relative w-full overflow-x-hidden">
            <Routes>
              {/* Home — smart routing */}
              <Route path="/" element={<HomeRoute />} />

              {/* Public Routes */}
              <Route path="/track" element={<TrackComplaint />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/complaint/:trackingId" element={<ComplaintDetail />} />

              {/* Protected Citizen Routes */}
              <Route element={<ProtectedRoute roles={['citizen', 'super_admin', 'department_head', 'officer']} />}>
                <Route path="/complaint-form" element={<CitizenLanding />} />
              </Route>

              {/* Protected Admin Routes */}
              <Route element={<ProtectedRoute roles={['super_admin', 'department_head', 'officer']} />}>
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/department/:slug" element={<DepartmentView />} />
              </Route>

              {/* Protected Analytics */}
              <Route element={<ProtectedRoute roles={['super_admin', 'department_head']} />}>
                <Route path="/admin/analytics" element={<AnalyticsPage />} />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>

          <Toaster
            position="bottom-center"
            toastOptions={{
              className: 'font-semibold shadow-lg rounded-xl',
              duration: 4000,
              style: {
                background: 'var(--bg-surface-elevated)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-default)',
                backdropFilter: 'blur(12px)',
              },
            }}
          />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
