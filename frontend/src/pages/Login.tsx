import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { authAPI, handleApiError } from '../lib/api';
import { useAuth } from '../App';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '', role: 'patient' });
  
  const roles = [
    { value: 'patient', label: 'Patient' },
    { value: 'doctor', label: 'Doctor' },
    { value: 'police', label: 'Police' },
    { value: 'judiciary', label: 'Judiciary' },
    { value: 'admin', label: 'Admin' }
  ];
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authAPI.login(formData);
      
      if (response.data.success) {
        const { data, token } = response.data;
        login(data, token);
        navigate('/');
      } else {
        setError(response.data.message || 'Login failed. Please try again.');
      }
    } catch (err: any) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Illustration Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="hidden lg:flex w-1/2 gradient-teal relative overflow-hidden"
      >
        {/* Background Patterns */}
        <div className="absolute inset-0 pattern-dots" />
        <div className="absolute inset-0 pattern-grid" />
        
        {/* Floating Elements */}
        <motion.div
          animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-20 right-20 w-32 h-32 bg-white/10 rounded-2xl backdrop-blur-sm"
        />
        <motion.div
          animate={{ y: [0, 30, 0], rotate: [0, -5, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute bottom-32 left-16 w-40 h-40 bg-white/10 rounded-full backdrop-blur-sm"
        />
        <motion.div
          animate={{ y: [0, -15, 0], x: [0, 10, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/3 left-1/4 w-24 h-24 bg-white/10 rounded-xl backdrop-blur-sm"
        />

        <div className="relative z-10 flex flex-col items-center justify-center w-full p-12 text-white">
          {/* Main Illustration */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mb-8"
          >
            <svg className="w-48 h-48" viewBox="0 0 200 200" fill="none">
              {/* Medical Cross */}
              <rect x="80" y="40" width="40" height="120" rx="8" fill="white" fillOpacity="0.9"/>
              <rect x="40" y="80" width="120" height="40" rx="8" fill="white" fillOpacity="0.9"/>
              {/* Inner glow */}
              <rect x="80" y="40" width="40" height="120" rx="8" stroke="white" strokeWidth="2" strokeOpacity="0.3"/>
              <rect x="40" y="80" width="120" height="40" rx="8" stroke="white" strokeWidth="2" strokeOpacity="0.3"/>
              {/* Blockchain nodes */}
              <circle cx="40" cy="40" r="6" fill="#A6DADC" fillOpacity="0.8"/>
              <circle cx="160" cy="40" r="6" fill="#A6DADC" fillOpacity="0.8"/>
              <circle cx="40" cy="160" r="6" fill="#A6DADC" fillOpacity="0.8"/>
              <circle cx="160" cy="160" r="6" fill="#A6DADC" fillOpacity="0.8"/>
              {/* Connection lines */}
              <line x1="46" y1="40" x2="154" y2="40" stroke="#A6DADC" strokeWidth="2" strokeOpacity="0.5"/>
              <line x1="46" y1="160" x2="154" y2="160" stroke="#A6DADC" strokeWidth="2" strokeOpacity="0.5"/>
              <line x1="40" y1="46" x2="40" y2="154" stroke="#A6DADC" strokeWidth="2" strokeOpacity="0.5"/>
              <line x1="160" y1="46" x2="160" y2="154" stroke="#A6DADC" strokeWidth="2" strokeOpacity="0.5"/>
              {/* AI Neural Network */}
              <circle cx="100" cy="100" r="20" fill="white" fillOpacity="0.15" stroke="white" strokeWidth="2"/>
              <circle cx="70" cy="70" r="8" fill="white" fillOpacity="0.3"/>
              <circle cx="130" cy="70" r="8" fill="white" fillOpacity="0.3"/>
              <circle cx="70" cy="130" r="8" fill="white" fillOpacity="0.3"/>
              <circle cx="130" cy="130" r="8" fill="white" fillOpacity="0.3"/>
              <line x1="88" y1="78" x2="112" y2="88" stroke="white" strokeWidth="1.5" strokeOpacity="0.5"/>
              <line x1="112" y1="88" x2="122" y2="70" stroke="white" strokeWidth="1.5" strokeOpacity="0.5"/>
              <line x1="88" y1="122" x2="112" y2="112" stroke="white" strokeWidth="1.5" strokeOpacity="0.5"/>
              <line x1="78" y1="120" x2="70" y2="78" stroke="white" strokeWidth="1.5" strokeOpacity="0.5"/>
            </svg>
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-center"
          >
            <h2 className="text-4xl font-bold mb-4 drop-shadow-lg">
              Smart Medico-Legal
            </h2>
            <p className="text-xl text-white/80 mb-8 max-w-md">
              Secure medical evidence management using AI and Blockchain technology
            </p>
          </motion.div>

          {/* Feature Pills */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="flex flex-wrap justify-center gap-4"
          >
            <div className="bg-white/15 backdrop-blur-md px-5 py-2.5 rounded-full border border-white/20">
              <span className="text-sm font-medium">🤖 AI Indexing</span>
            </div>
            <div className="bg-white/15 backdrop-blur-md px-5 py-2.5 rounded-full border border-white/20">
              <span className="text-sm font-medium">🔗 Blockchain</span>
            </div>
            <div className="bg-white/15 backdrop-blur-md px-5 py-2.5 rounded-full border border-white/20">
              <span className="text-sm font-medium">✓ Verified</span>
            </div>
          </motion.div>

          {/* Create Account Button */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="mt-12"
          >
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-xl text-white font-medium transition-all duration-300 border border-white/30 hover:border-white/50"
            >
              <span>Create Account</span>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </motion.div>
        </div>
      </motion.div>

      {/* Right Side - Login Form Section */}
      <motion.div
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-[#F5F9FA]"
      >
        <div className="w-full max-w-md">
          {/* Logo & Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <div className="flex items-center gap-3 mb-4">
              <motion.div
                whileHover={{ scale: 1.05, rotate: 5 }}
                className="w-14 h-14 rounded-2xl gradient-teal flex items-center justify-center shadow-lg"
              >
                <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </motion.div>
              <div>
                <h1 className="text-2xl font-bold text-[#1F2D3D]">
                  Medico-Legal
                </h1>
                <p className="text-sm text-[#2E8B8B]">AI + Blockchain System</p>
              </div>
            </div>
            <h2 className="text-3xl font-bold text-[#1F2D3D] mb-2">Welcome Back</h2>
            <p className="text-[#64748B]">Sign in to access your dashboard</p>
          </motion.div>

          {/* Glass Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card p-8"
          >
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-6 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-[#1F2D3D] mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#64748B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <input
                    type="email"
                    required
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    className="input-modern pl-12"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#1F2D3D] mb-2">
                  Password
                </label>
                <div className="relative">
                  <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#64748B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <input
                    type="password"
                    required
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    className="input-modern pl-12"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#1F2D3D] mb-2">
                  Role
                </label>
                <div className="relative">
                  <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#64748B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <select
                    required
                    onFocus={() => setFocusedField('role')}
                    onBlur={() => setFocusedField(null)}
                    className="input-modern pl-12"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  >
                    {roles.map((role) => (
                      <option key={role.value} value={role.value}>
                        {role.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 text-[#64748B] cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-gray-300 text-[#2E8B8B] focus:ring-[#2E8B8B]"
                  />
                  <span>Remember me</span>
                </label>
                <a href="#" className="text-[#2E8B8B] hover:text-[#256B6B] font-medium transition-colors">
                  Forgot password?
                </a>
              </div>

              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: loading ? 1 : 1.02 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {loading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-6 h-6 border-2 border-white border-t-transparent rounded-full"
                  />
                ) : (
                  <>
                    <span>Sign In</span>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </>
                )}
              </motion.button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-[#64748B]">or</span>
              </div>
            </div>

            <p className="text-center text-[#64748B]">
              Don't have an account?{' '}
              <Link
                to="/register"
                className="text-[#2E8B8B] hover:text-[#256B6B] font-semibold transition-colors"
              >
                Register here
              </Link>
            </p>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center text-[#64748B] text-sm mt-8 flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Secured with Blockchain Technology • AI-Powered Indexing
          </motion.p>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;