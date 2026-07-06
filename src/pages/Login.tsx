import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { BrainCircuit, Mail, Lock, LogIn, Chrome, AlertCircle, Phone, User as UserIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [authMode, setAuthMode] = useState<'email' | 'phone'>('email');
  
  // Email states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Phone states
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [showOTPInput, setShowOTPInput] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<any>(null);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { 
    loginWithEmail, 
    signupWithEmail, 
    loginWithGoogle, 
    loginAsGuest, 
    setupRecaptcha, 
    sendPhoneCode 
  } = useAuth();
  
  const navigate = useNavigate();
  const recaptchaVerifier = useRef<any>(null);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await loginWithEmail(email, password);
      } else {
        await signupWithEmail(email, password);
      }
      navigate('/setup');
    } catch (err: any) {
      setError(err.message || 'Failed to authenticate');
    } finally {
      setLoading(false);
    }
  };

  const handleSendPhoneCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!recaptchaVerifier.current) {
      recaptchaVerifier.current = setupRecaptcha('recaptcha-container');
    }

    try {
      const result = await sendPhoneCode(phoneNumber, recaptchaVerifier.current);
      setConfirmationResult(result);
      setShowOTPInput(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await confirmationResult.confirm(verificationCode);
      navigate('/setup');
    } catch (err: any) {
      setError('Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    try {
      await loginWithGoogle();
      navigate('/setup');
    } catch (err: any) {
      setError(err.message || 'Failed to authenticate with Google');
    }
  };

  const handleGuest = async () => {
    setError('');
    try {
      await loginAsGuest();
      navigate('/setup');
    } catch (err: any) {
      setError(err.message || 'Failed to authenticate as Guest');
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div id="recaptcha-container"></div>
      
      {/* Background aesthetics */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full mix-blend-screen filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full mix-blend-screen filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-blue-500/10 rounded-full mix-blend-screen filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full space-y-8 relative z-10 bg-slate-900/60 backdrop-blur-xl p-8 rounded-3xl border border-slate-700/50 shadow-2xl"
      >
        <div>
          <div className="mx-auto w-12 h-12 bg-indigo-500/20 rounded-xl flex items-center justify-center border border-indigo-500/30 mb-4">
            <BrainCircuit className="w-6 h-6 text-indigo-400" />
          </div>
          <h2 className="text-center text-3xl font-bold tracking-tight text-white">
            {isLogin ? 'Welcome back' : 'Create an account'}
          </h2>
          <p className="mt-2 text-center text-sm text-slate-400">
            {isLogin ? 'Sign in to your account to continue' : 'Join us to start your interview journey'}
          </p>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3 text-red-400"
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </motion.div>
        )}

        <div className="flex bg-slate-800/50 p-1 rounded-lg border border-slate-700/50">
          <button
            onClick={() => setAuthMode('email')}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${authMode === 'email' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Email
          </button>
          <button
            onClick={() => setAuthMode('phone')}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${authMode === 'phone' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Phone
          </button>
        </div>

        {authMode === 'email' ? (
          <form className="mt-6 space-y-6" onSubmit={handleEmailSubmit}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Email address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-500" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-slate-700/50 rounded-xl bg-slate-950/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-200"
                    placeholder="you@example.com"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-500" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-slate-700/50 rounded-xl bg-slate-950/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-200"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full justify-center py-3"
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
        ) : (
          <form className="mt-6 space-y-6" onSubmit={showOTPInput ? handleVerifyOTP : handleSendPhoneCode}>
            <div className="space-y-4">
              {!showOTPInput ? (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Phone Number</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="h-5 w-5 text-slate-500" />
                    </div>
                    <input
                      type="tel"
                      required
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="block w-full pl-10 pr-3 py-3 border border-slate-700/50 rounded-xl bg-slate-950/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-200"
                      placeholder="+1 234 567 8900"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Verification Code</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-slate-500" />
                    </div>
                    <input
                      type="text"
                      required
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      className="block w-full pl-10 pr-3 py-3 border border-slate-700/50 rounded-xl bg-slate-950/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-200 tracking-widest text-lg font-mono"
                      placeholder="123456"
                      maxLength={6}
                    />
                  </div>
                </div>
              )}
            </div>

            <Button
              type="submit"
              className="w-full justify-center py-3"
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
                  {!showOTPInput ? 'Send Code' : 'Verify & Sign In'}
                </span>
              )}
            </Button>
          </form>
        )}

        {authMode === 'email' && (
          <div className="mt-4 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors duration-200 font-medium"
            >
              {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>
          </div>
        )}

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-700/50"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-slate-900 text-slate-400">Or continue with</span>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <button
              onClick={handleGoogle}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-slate-700/50 rounded-xl shadow-sm bg-slate-800/50 text-sm font-medium text-white hover:bg-slate-800 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-slate-600"
            >
              <Chrome className="w-5 h-5 text-slate-300" />
              Google
            </button>
            <button
              onClick={handleGuest}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-slate-700/50 rounded-xl shadow-sm bg-slate-800/50 text-sm font-medium text-white hover:bg-slate-800 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-slate-600"
            >
              <UserIcon className="w-5 h-5 text-slate-300" />
              Guest
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
