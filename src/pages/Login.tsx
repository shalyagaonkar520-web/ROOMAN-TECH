import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { BrainCircuit, Mail, Lock, LogIn, Chrome, AlertCircle, User as UserIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { 
    loginWithEmail, 
    signupWithEmail, 
    loginWithGoogle, 
    loginAsGuest 
  } = useAuth();
  
  const navigate = useNavigate();

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email.trim() || !password) {
      setError('All fields are required.');
      return;
    }
    
    if (!isLogin && !name.trim()) {
      setError('Please enter your full name to register.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);

    try {
      let authUser;
      if (isLogin) {
        authUser = await loginWithEmail(email, password);
      } else {
        authUser = await signupWithEmail(email, password, name.trim());
      }
      
      // Trigger automated welcome email (non-blocking)
      if (authUser && authUser.email) {
        fetch('/api/auth/welcome-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            email: authUser.email, 
            name: authUser.displayName || name.trim() || 'Candidate' 
          })
        }).catch(err => console.error("Error triggering welcome email API:", err));
      }

      navigate('/setup');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    setLoading(true);
    try {
      const authUser = await loginWithGoogle();
      
      // Trigger automated welcome email (non-blocking)
      if (authUser && authUser.email) {
        fetch('/api/auth/welcome-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            email: authUser.email, 
            name: authUser.displayName || 'Candidate' 
          })
        }).catch(err => console.error("Error triggering welcome email API:", err));
      }

      navigate('/setup');
    } catch (err: any) {
      setError(err.message || 'Failed to authenticate with Google');
    } finally {
      setLoading(false);
    }
  };

  const handleGuest = async () => {
    setError('');
    setLoading(true);
    try {
      await loginAsGuest();
      navigate('/setup');
    } catch (err: any) {
      setError(err.message || 'Failed to authenticate as Guest');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-slate-950">
      
      {/* Background aesthetics - Premium gradients */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full mix-blend-screen filter blur-[100px] opacity-40 animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full mix-blend-screen filter blur-[100px] opacity-30 animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-md w-full space-y-8 relative z-10 bg-slate-900/40 backdrop-blur-2xl p-8 rounded-3xl border border-slate-800/80 shadow-2xl shadow-black/50"
      >
        <div>
          <div className="mx-auto w-14 h-14 bg-gradient-to-tr from-indigo-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20 mb-6 group hover:scale-105 transition-transform duration-300">
            <BrainCircuit className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-center text-3xl font-extrabold tracking-tight text-white">
            {isLogin ? 'Welcome back' : 'Create your account'}
          </h2>
          <p className="mt-2 text-center text-sm text-slate-400">
            {isLogin ? 'Sign in to ROOMAN AI to continue' : 'Get started with automated AI interviews'}
          </p>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3 text-red-400"
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-xs font-semibold leading-relaxed">{error}</p>
          </motion.div>
        )}

        <form className="mt-6 space-y-5" onSubmit={handleEmailSubmit}>
          <div className="space-y-4">
            
            {/* Full Name field - Sign up only */}
            {!isLogin && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                transition={{ duration: 0.2 }}
              >
                <label className="block text-sm font-semibold text-slate-300 mb-1.5">Full Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <UserIcon className="h-5 w-5 text-slate-500" />
                  </div>
                  <input
                    type="text"
                    required={!isLogin}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="block w-full pl-11 pr-3 py-3 border border-slate-800 rounded-xl bg-slate-950/60 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-200 text-sm font-medium"
                    placeholder="John Doe"
                  />
                </div>
              </motion.div>
            )}

            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-1.5">Email address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-11 pr-3 py-3 border border-slate-800 rounded-xl bg-slate-950/60 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-200 text-sm font-medium"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-11 pr-3 py-3 border border-slate-800 rounded-xl bg-slate-950/60 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-200 text-sm font-medium"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full justify-center py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 border-0 transition-all cursor-pointer"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                Processing...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <LogIn className="w-5 h-5" />
                {isLogin ? 'Sign In' : 'Sign Up'}
              </span>
            )}
          </Button>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
            className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors duration-200 font-semibold"
          >
            {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
          </button>
        </div>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 bg-slate-900 text-slate-500 font-semibold">Or continue with</span>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <button
              onClick={handleGoogle}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-slate-800 rounded-xl shadow-sm bg-slate-900/50 text-sm font-semibold text-slate-300 hover:bg-slate-900 hover:text-white transition-colors duration-200 focus:outline-none cursor-pointer"
            >
              <Chrome className="w-5 h-5 text-slate-400" />
              Google
            </button>
            <button
              onClick={handleGuest}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-slate-800 rounded-xl shadow-sm bg-slate-900/50 text-sm font-semibold text-slate-300 hover:bg-slate-900 hover:text-white transition-colors duration-200 focus:outline-none cursor-pointer"
            >
              <UserIcon className="w-5 h-5 text-slate-400" />
              Guest
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
