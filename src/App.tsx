import { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import Setup from './pages/Setup';
import CareerAssistant from './pages/CareerAssistant';
import Interview from './pages/Interview';
import FaceToFaceInterview from './pages/FaceToFaceInterview';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';

import ManualTest from './pages/ManualTest';
import ProtectedRoute from './components/ProtectedRoute';
import SplashScreen from './components/SplashScreen';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { useStore } from './store/useStore';

function SmartRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/career-assistant" replace /> : <Navigate to="/login" replace />;
}

export default function App() {
  const theme = useStore((state) => state.theme);
  const [showSplash, setShowSplash] = useState(true);
  
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  return (
    <>
      {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
      <AuthProvider>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<SmartRedirect />} />
          <Route path="welcome" element={<Landing />} />
          <Route path="login" element={<Login />} />
          <Route path="setup" element={
            <ProtectedRoute>
              <Setup />
            </ProtectedRoute>
          } />
          <Route path="career-assistant" element={
            <ProtectedRoute>
              <CareerAssistant />
            </ProtectedRoute>
          } />
          <Route path="interview/:id" element={
            <ProtectedRoute>
              <Interview />
            </ProtectedRoute>
          } />
          <Route path="interview/f2f/:id" element={
            <ProtectedRoute>
              <FaceToFaceInterview />
            </ProtectedRoute>
          } />
          <Route path="report/:id" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />

          <Route path="manual-test" element={
            <ProtectedRoute>
              <ManualTest />
            </ProtectedRoute>
          } />
        </Route>
      </Routes>
    </AuthProvider>
    </>
  );
}


