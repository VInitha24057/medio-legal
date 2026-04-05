import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect, createContext, useContext } from 'react';

// Auth Context
interface User {
  _id: string;
  username: string;
  email: string;
  role: string;
  fullName: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (user: User, token: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import DoctorDashboard from './pages/DoctorDashboard';
import PoliceDashboard from './pages/PoliceDashboard';
import JudiciaryDashboard from './pages/JudiciaryDashboard';
import PatientDashboard from './pages/PatientDashboard';
import AdminDashboard from './pages/AdminDashboard';
import ModernDashboard from './pages/ModernDashboard';

// Protected Route Component
const ProtectedRoute = ({ children, roles }: { children: JSX.Element; roles?: string[] }) => {
  const { user, isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (roles && user && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

// Dashboard Router based on role
const DashboardRouter = () => {
  const { user } = useAuth();
  
  switch (user?.role) {
    case 'doctor':
      return <DoctorDashboard />;
    case 'police':
      return <PoliceDashboard />;
    case 'judiciary':
      return <JudiciaryDashboard />;
    case 'patient':
      return <PatientDashboard />;
    case 'admin':
      return <AdminDashboard />;
    default:
      return <Navigate to="/login" replace />;
  }
};

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [demoMode, setDemoMode] = useState(false);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    const storedDemo = localStorage.getItem('demoMode');
    
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    if (storedDemo === 'true') {
      setDemoMode(true);
    }
  }, []);

  const login = (user: User, token: string) => {
    setUser(user);
    setToken(token);
    setDemoMode(false);
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('demoMode', 'false');
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setDemoMode(false);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('demoMode');
  };

  const startDemo = () => {
    setDemoMode(true);
    setUser({
      _id: 'demo',
      username: 'demo',
      email: 'demo@medico.com',
      role: 'admin',
      fullName: 'Demo User'
    });
    localStorage.setItem('demoMode', 'true');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!token || demoMode }}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/modern" element={
            demoMode ? <ModernDashboard /> : <Navigate to="/login" replace />
          } />
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <DashboardRouter />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </BrowserRouter>
    </AuthContext.Provider>
  );
}

export default App;
