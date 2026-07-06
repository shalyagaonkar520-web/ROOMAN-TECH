import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import Setup from './pages/Setup';
import Interview from './pages/Interview';
import FaceToFaceInterview from './pages/FaceToFaceInterview';
import Dashboard from './pages/Dashboard';
import History from './pages/History';
import { useStore } from './store/useStore';

export default function App() {
  const theme = useStore((state) => state.theme);
  
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Landing />} />
        <Route path="setup" element={<Setup />} />
        <Route path="interview/:id" element={<Interview />} />
        <Route path="interview/f2f/:id" element={<FaceToFaceInterview />} />
        <Route path="report/:id" element={<Dashboard />} />
        <Route path="history" element={<History />} />
      </Route>
    </Routes>
  );
}
