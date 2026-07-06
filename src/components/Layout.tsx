import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { BrainCircuit, LayoutDashboard, Moon, Sun, LogIn, LogOut, Laptop } from 'lucide-react';
import { useStore } from '../store/useStore';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'motion/react';

export default function Layout() {
  const { theme, toggleTheme } = useStore();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error("Failed to log out", err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0A0A0A] text-slate-900 dark:text-slate-50 font-sans selection:bg-blue-200 dark:selection:bg-blue-900 transition-colors duration-300 flex flex-col">
      <nav className="sticky top-0 z-50 border-b border-slate-200/50 dark:border-white/10 bg-white/50 dark:bg-black/50 backdrop-blur-xl supports-[backdrop-filter]:bg-white/50 supports-[backdrop-filter]:dark:bg-black/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link to="/" className="flex items-center space-x-2 group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
                <BrainCircuit className="w-5 h-5" />
              </div>
              <span className="font-bold text-lg tracking-tight">
                Rooman <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-violet-500">AI</span>
              </span>
            </Link>
            
            <div className="flex items-center space-x-6">
              {user && (
                <Link 
                  to="/dashboard" 
                  className={`text-sm font-semibold flex items-center space-x-2 transition-colors ${
                    location.pathname === '/dashboard' 
                    ? 'text-indigo-600 dark:text-indigo-400' 
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Dashboard</span>
                </Link>
              )}

              
              <div className="h-4 w-px bg-slate-200 dark:bg-slate-800" />
              
              {user ? (
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-slate-500 hidden sm:inline-block">
                    {user.email}
                  </span>
                  <button 
                    onClick={handleLogout}
                    className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors flex items-center space-x-2"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="hidden sm:inline-block">Sign Out</span>
                  </button>
                </div>
              ) : (
                <Link 
                  to="/login"
                  className="text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Sign In</span>
                </Link>
              )}

              <div className="h-4 w-px bg-slate-200 dark:bg-slate-800" />
              
              <button 
                onClick={toggleTheme}
                className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 transition-colors p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </nav>
      
      <main className="flex-grow flex flex-col w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="flex-grow flex flex-col"
        >
          <Outlet />
        </motion.div>
      </main>

      <footer className="border-t border-slate-200/50 dark:border-white/10 py-8 mt-12 bg-white/50 dark:bg-black/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <BrainCircuit className="w-4 h-4" />
              <span>Rooman AI Interviewer © 2026</span>
            </div>
            <div className="flex items-center space-x-6">
               <span>Powered by Gemini AI</span>
               <a href="https://github.com/shalyagaonkar520-web/ROOMAN-TECH" target="_blank" rel="noreferrer" className="hover:text-slate-900 dark:hover:text-slate-200 flex items-center">
                 <Laptop className="w-4 h-4 mr-1" /> View Source
               </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
