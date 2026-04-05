import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { authAPI, handleApiError } from '../lib/api';
import { useAuth } from '../App';

interface RoleOption {
  value: string;
  label: string;
  icon: string;
  description: string;
  color: string;
}

const roles: RoleOption[] = [
  { value: 'patient', label: 'Patient', icon: '🏥', description: 'Access medical records', color: 'from-teal-500 to-teal-600' },
  { value: 'doctor', label: 'Doctor', icon: '👨‍⚕️', description: 'Upload & manage reports', color: 'from-blue-500 to-blue-600' },
  { value: 'police', label: 'Police', icon: '👮', description: 'Investigate cases', color: 'from-indigo-500 to-indigo-600' },
  { value: 'judiciary', label: 'Judiciary', icon: '⚖️', description: 'Verify evidence', color: 'from-purple-500 to-purple-600' },
  { value: 'admin', label: 'Admin', icon: '🔧', description: 'System administration', color: 'from-red-500 to-red-600' },
];

const Register = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'patient',
    fullName: '',
    phone: '',
    hospital: '',
    department: '',
    badgeNumber: '',
    courtName: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const response = await authAPI.register(formData);
      
      // Check if registration was successful
      if (response.data.success) {
        const { data, token } = response.data;
        login(data, token);
        navigate('/');
      } else {
        setError(response.data.message || 'Registration failed. Please try again.');
      }
    } catch (err: any) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-900 via-primary-800 to-teal-900">
        <motion.div
          animate={{ y: [0, -30, 0], x: [0, 20, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-10 right-20 w-80 h-80 bg-teal-500/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ y: [0, 40, 0], x: [0, -20, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute bottom-10 left-20 w-96 h-96 bg-primary-500/20 rounded-full blur-3xl"
        />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:50px_50px]" />
      </div>

      <div className="relative min-h-screen flex items-center justify-center p-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-2xl"
        >
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-center mb-8"
          >
            <motion.div
              whileHover={{ scale: 1.05, rotate: 5 }}
              className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-teal-400 to-teal-600 shadow-glow-teal mb-4"
            >
              <span className="text-4xl">🏥</span>
            </motion.div>
            <h1 className="text-3xl font-bold text-white mb-2">Create Account</h1>
            <p className="text-white/60">Join the Medico-Legal System</p>
          </motion.div>

          {/* Glass Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/10 backdrop-blur-glass rounded-3xl shadow-glass p-8 border border-white/20"
          >
            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mb-6 px-4 py-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-200 text-sm"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Role Selection */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-3">
                  Select Your Role
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {roles.map((role, index) => (
                    <motion.button
                      key={role.value}
                      type="button"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setFormData({ ...formData, role: role.value })}
                      className={`p-3 rounded-xl border-2 transition-all duration-300 ${
                        formData.role === role.value
                          ? 'border-teal-400 bg-teal-500/20 shadow-glow-teal'
                          : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/30'
                      }`}
                    >
                      <div className={`w-10 h-10 mx-auto mb-2 rounded-xl bg-gradient-to-br ${role.color} flex items-center justify-center shadow-lg`}>
                        <span className="text-xl">{role.icon}</span>
                      </div>
                      <p className="text-xs font-medium text-white">{role.label}</p>
                      <p className="text-[10px] text-white/50 mt-1">{role.description}</p>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Name Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <motion.div
                  animate={{ scale: focusedField === 'fullName' ? 1.02 : 1 }}
                  transition={{ duration: 0.2 }}
                >
                  <label className="block text-sm font-medium text-white/80 mb-2">Full Name</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">👤</span>
                    <input
                      type="text"
                      required
                      onFocus={() => setFocusedField('fullName')}
                      onBlur={() => setFocusedField(null)}
                      className="w-full pl-12 pr-4 py-3 bg-white/10 border-2 border-white/20 rounded-xl text-white placeholder-white/40 focus:border-teal-400 focus:bg-white/20 focus:outline-none transition-all"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    />
                  </div>
                </motion.div>

                <motion.div
                  animate={{ scale: focusedField === 'username' ? 1.02 : 1 }}
                  transition={{ duration: 0.2 }}
                >
                  <label className="block text-sm font-medium text-white/80 mb-2">Username</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">🎫</span>
                    <input
                      type="text"
                      required
                      onFocus={() => setFocusedField('username')}
                      onBlur={() => setFocusedField(null)}
                      className="w-full pl-12 pr-4 py-3 bg-white/10 border-2 border-white/20 rounded-xl text-white placeholder-white/40 focus:border-teal-400 focus:bg-white/20 focus:outline-none transition-all"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    />
                  </div>
                </motion.div>
              </div>

              {/* Email & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <motion.div
                  animate={{ scale: focusedField === 'email' ? 1.02 : 1 }}
                  transition={{ duration: 0.2 }}
                >
                  <label className="block text-sm font-medium text-white/80 mb-2">Email</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">✉️</span>
                    <input
                      type="email"
                      required
                      onFocus={() => setFocusedField('email')}
                      onBlur={() => setFocusedField(null)}
                      className="w-full pl-12 pr-4 py-3 bg-white/10 border-2 border-white/20 rounded-xl text-white placeholder-white/40 focus:border-teal-400 focus:bg-white/20 focus:outline-none transition-all"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                </motion.div>

                <motion.div
                  animate={{ scale: focusedField === 'phone' ? 1.02 : 1 }}
                  transition={{ duration: 0.2 }}
                >
                  <label className="block text-sm font-medium text-white/80 mb-2">Phone</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">📱</span>
                    <input
                      type="text"
                      onFocus={() => setFocusedField('phone')}
                      onBlur={() => setFocusedField(null)}
                      className="w-full pl-12 pr-4 py-3 bg-white/10 border-2 border-white/20 rounded-xl text-white placeholder-white/40 focus:border-teal-400 focus:bg-white/20 focus:outline-none transition-all"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                </motion.div>
              </div>

              {/* Role-specific fields */}
              <AnimatePresence>
                {formData.role === 'doctor' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                  >
                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2">Hospital</label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 bg-white/10 border-2 border-white/20 rounded-xl text-white placeholder-white/40 focus:border-teal-400 focus:bg-white/20 focus:outline-none transition-all"
                        value={formData.hospital}
                        onChange={(e) => setFormData({ ...formData, hospital: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2">Department</label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 bg-white/10 border-2 border-white/20 rounded-xl text-white placeholder-white/40 focus:border-teal-400 focus:bg-white/20 focus:outline-none transition-all"
                        value={formData.department}
                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      />
                    </div>
                  </motion.div>
                )}

                {formData.role === 'police' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <label className="block text-sm font-medium text-white/80 mb-2">Badge Number</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 bg-white/10 border-2 border-white/20 rounded-xl text-white placeholder-white/40 focus:border-teal-400 focus:bg-white/20 focus:outline-none transition-all"
                      value={formData.badgeNumber}
                      onChange={(e) => setFormData({ ...formData, badgeNumber: e.target.value })}
                    />
                  </motion.div>
                )}

                {formData.role === 'judiciary' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <label className="block text-sm font-medium text-white/80 mb-2">Court Name</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 bg-white/10 border-2 border-white/20 rounded-xl text-white placeholder-white/40 focus:border-teal-400 focus:bg-white/20 focus:outline-none transition-all"
                      value={formData.courtName}
                      onChange={(e) => setFormData({ ...formData, courtName: e.target.value })}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Password Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <motion.div
                  animate={{ scale: focusedField === 'password' ? 1.02 : 1 }}
                  transition={{ duration: 0.2 }}
                >
                  <label className="block text-sm font-medium text-white/80 mb-2">Password</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">🔒</span>
                    <input
                      type="password"
                      required
                      onFocus={() => setFocusedField('password')}
                      onBlur={() => setFocusedField(null)}
                      className="w-full pl-12 pr-4 py-3 bg-white/10 border-2 border-white/20 rounded-xl text-white placeholder-white/40 focus:border-teal-400 focus:bg-white/20 focus:outline-none transition-all"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                  </div>
                </motion.div>

                <motion.div
                  animate={{ scale: focusedField === 'confirmPassword' ? 1.02 : 1 }}
                  transition={{ duration: 0.2 }}
                >
                  <label className="block text-sm font-medium text-white/80 mb-2">Confirm Password</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">🔐</span>
                    <input
                      type="password"
                      required
                      onFocus={() => setFocusedField('confirmPassword')}
                      onBlur={() => setFocusedField(null)}
                      className="w-full pl-12 pr-4 py-3 bg-white/10 border-2 border-white/20 rounded-xl text-white placeholder-white/40 focus:border-teal-400 focus:bg-white/20 focus:outline-none transition-all"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    />
                  </div>
                </motion.div>
              </div>

              {/* Submit Button */}
              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-4 bg-gradient-to-r from-teal-500 to-teal-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-teal-500/30 transition-all duration-300 disabled:opacity-50"
              >
                {loading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-6 h-6 border-2 border-white border-t-transparent rounded-full mx-auto"
                  />
                ) : (
                  'Create Account'
                )}
              </motion.button>
            </form>

            {/* Login Link */}
            <p className="text-center text-white/60 mt-6">
              Already have an account?{' '}
              <Link
                to="/login"
                className="text-teal-400 hover:text-teal-300 font-medium transition-colors"
              >
                Login here
              </Link>
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default Register;
