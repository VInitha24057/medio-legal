import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../App';
import { dashboardAPI, casesAPI } from '../lib/api';
import { MedicalRecordCard } from '../components';

interface Case {
  _id: string;
  caseNumber: string;
  title: string;
  caseType: string;
  patientName: string;
  doctorName: string;
  createdAt: string;
  blockchainVerified: boolean;
}

const ModernDashboard = () => {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState({
    totalRecords: 0,
    legalCases: 0,
    aiIndexedReports: 0,
    blockchainVerified: 0,
  });
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');

  // Mock data for demonstration
  const mockStats = {
    totalRecords: 1248,
    legalCases: 342,
    aiIndexedReports: 891,
    blockchainVerified: 567,
  };

  const mockCases: Case[] = [
    { _id: '1', caseNumber: 'ML-2024-001', title: 'Medical Report', caseType: 'Accident', patientName: 'John Smith', doctorName: 'Dr. Sarah', createdAt: '2024-01-15', blockchainVerified: true },
    { _id: '2', caseNumber: 'ML-2024-002', title: 'Lab Results', caseType: 'Medical', patientName: 'Emily Davis', doctorName: 'Dr. Michael', createdAt: '2024-01-14', blockchainVerified: true },
    { _id: '3', caseNumber: 'ML-2024-003', title: 'X-Ray Report', caseType: 'Diagnostic', patientName: 'Robert Brown', doctorName: 'Dr. Lisa', createdAt: '2024-01-13', blockchainVerified: false },
    { _id: '4', caseNumber: 'ML-2024-004', title: 'Prescription', caseType: 'Treatment', patientName: 'Maria Garcia', doctorName: 'Dr. James', createdAt: '2024-01-12', blockchainVerified: true },
    { _id: '5', caseNumber: 'ML-2024-005', title: 'Surgery Report', caseType: 'Surgical', patientName: 'David Wilson', doctorName: 'Dr. Emma', createdAt: '2024-01-11', blockchainVerified: true },
    { _id: '6', caseNumber: 'ML-2024-006', title: 'Blood Test', caseType: 'Laboratory', patientName: 'Jennifer Lee', doctorName: 'Dr. Robert', createdAt: '2024-01-10', blockchainVerified: false },
  ];

  useEffect(() => {
    // Use mock data for demonstration
    setTimeout(() => {
      setStats(mockStats);
      setCases(mockCases);
      setLoading(false);
    }, 500);
  }, []);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'records', label: 'Medical Records', icon: '📋' },
    { id: 'upload', label: 'Upload Report', icon: '📤' },
    { id: 'ai-analysis', label: 'AI Analysis', icon: '🤖' },
    { id: 'blockchain', label: 'Blockchain Verification', icon: '🔗' },
    { id: 'users', label: 'Users', icon: '👥' },
    { id: 'logout', label: 'Logout', icon: '🚪' },
  ];

  const handleMenuClick = (id: string) => {
    if (id === 'logout') {
      logout();
    } else {
      setActiveTab(id);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView stats={stats} />;
      case 'records':
        return <RecordsView cases={cases} />;
      case 'upload':
        return <UploadView />;
      case 'ai-analysis':
        return <AIAnalysisView />;
      case 'blockchain':
        return <BlockchainView cases={cases} />;
      case 'users':
        return <UsersView />;
      default:
        return <DashboardView stats={stats} />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation Bar */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-white shadow-soft z-50">
        <div className="flex items-center justify-between h-full px-6">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <span className="text-white text-lg">🏥</span>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-primary">Medico-Legal</h1>
              <p className="text-xs text-gray-400">AI + Blockchain</p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-xl mx-8">
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
              <input
                type="text"
                placeholder="Search records, cases, patients..."
                className="w-full pl-12 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary transition-all"
              />
            </div>
          </div>

          {/* User Profile */}
          <div className="flex items-center gap-4">
            <button className="p-2 rounded-xl hover:bg-gray-50 transition-colors">
              <span className="text-xl">🔔</span>
            </button>
            <div className="flex items-center gap-3 pl-4 border-l border-gray-100">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <span className="text-white text-sm font-medium">{user?.fullName?.charAt(0) || 'A'}</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800">{user?.fullName || 'Admin'}</p>
                <p className="text-xs text-gray-400 capitalize">{user?.role || 'Administrator'}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Left Sidebar */}
      <aside className="fixed left-0 top-16 bottom-0 w-64 bg-white border-r border-gray-100 shadow-soft-lg p-4">
        <nav className="space-y-1">
          {menuItems.map((item) => (
            <motion.button
              key={item.id}
              onClick={() => handleMenuClick(item.id)}
              whileHover={{ x: 4 }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === item.id
                  ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-lg'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-primary'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </motion.button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="ml-64 pt-16 min-h-screen">
        <div className="p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

// Dashboard Analytics View
const DashboardView = ({ stats }: { stats: any }) => {
  const analytics = [
    { label: 'Total Records', value: stats.totalRecords, icon: '📁', color: 'from-primary to-primary/80' },
    { label: 'Legal Cases', value: stats.legalCases, icon: '⚖️', color: 'from-secondary to-secondary/80' },
    { label: 'AI Indexed Reports', value: stats.aiIndexedReports, icon: '🤖', color: 'from-emerald-500 to-emerald-600' },
    { label: 'Blockchain Verified', value: stats.blockchainVerified, icon: '🔗', color: 'from-accent to-accent/80' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>
        <p className="text-gray-500 mt-1">Welcome back! Here's an overview of your medico-legal records.</p>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {analytics.map((item, index) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-2xl p-6 shadow-soft hover:shadow-soft-lg transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500">{item.label}</p>
                <p className="text-3xl font-bold text-gray-800 mt-2">{item.value.toLocaleString()}</p>
              </div>
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center`}>
                <span className="text-2xl">{item.icon}</span>
              </div>
            </div>
            <div className="mt-4 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(item.value / stats.totalRecords) * 100}%` }}
                transition={{ delay: index * 0.1 + 0.3, duration: 0.8 }}
                className={`h-full bg-gradient-to-r ${item.color} rounded-full`}
              />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-2xl p-6 shadow-soft">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Activity</h3>
        <div className="space-y-4">
          {[
            { action: 'New case uploaded', detail: 'ML-2024-006 by Dr. Robert', time: '2 min ago', icon: '📤' },
            { action: 'Blockchain verification', detail: 'ML-2024-005 verified', time: '15 min ago', icon: '✓' },
            { action: 'AI indexing complete', detail: '3 documents processed', time: '1 hour ago', icon: '🤖' },
            { action: 'User registered', detail: 'New patient: John Doe', time: '2 hours ago', icon: '👤' },
          ].map((activity, index) => (
            <div key={index} className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                <span>{activity.icon}</span>
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-800">{activity.action}</p>
                <p className="text-sm text-gray-500">{activity.detail}</p>
              </div>
              <span className="text-xs text-gray-400">{activity.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Medical Records Grid View (Using MedicalRecordCard Component)
const RecordsView = ({ cases }: { cases: Case[] }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Medical Records</h2>
          <p className="text-gray-500 mt-1">Browse all your medical records in gallery view</p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-gray-100 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-200">Grid</button>
          <button className="px-4 py-2 bg-primary/10 rounded-xl text-sm font-medium text-primary">List</button>
        </div>
      </div>

      {/* Gallery Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {cases.map((record, index) => (
          <MedicalRecordCard
            key={record._id}
            caseNumber={record.caseNumber}
            title={record.title}
            caseType={record.caseType}
            patientName={record.patientName}
            doctorName={record.doctorName}
            createdAt={record.createdAt}
            blockchainVerified={record.blockchainVerified}
            delay={index}
          />
        ))}
      </div>
    </div>
  );
};

// Upload View
const UploadView = () => {
  const [dragActive, setDragActive] = useState(false);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Upload Report</h2>
        <p className="text-gray-500 mt-1">Upload medical reports and documents</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Drag & Drop Upload */}
        <div className="space-y-4">
          <div
            onDragEnter={() => setDragActive(true)}
            onDragLeave={() => setDragActive(false)}
            onDrop={() => setDragActive(false)}
            className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all ${
              dragActive 
                ? 'border-secondary bg-secondary/5' 
                : 'border-gray-200 hover:border-primary/50'
            }`}
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
              <span className="text-3xl">📁</span>
            </div>
            <p className="text-lg font-medium text-gray-700">Drag & drop files here</p>
            <p className="text-sm text-gray-400 mt-2">or click to browse</p>
            <button className="mt-4 px-6 py-2.5 bg-gradient-to-r from-primary to-secondary text-white rounded-xl font-medium">
              Select Files
            </button>
          </div>

          <p className="text-xs text-gray-400 text-center">Supports: PDF, JPG, PNG, DOC (Max 10MB)</p>
        </div>

        {/* Upload Form */}
        <div className="bg-white rounded-2xl p-6 shadow-soft space-y-4">
          <h3 className="text-lg font-semibold text-gray-800">Report Details</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">Patient Name</label>
            <input
              type="text"
              placeholder="Enter patient name"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">Case Description</label>
            <textarea
              rows={4}
              placeholder="Describe the case..."
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary resize-none"
            />
          </div>

          <button className="w-full py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-xl font-medium hover:opacity-90 transition-opacity">
            Upload Report
          </button>
        </div>
      </div>
    </div>
  );
};

// AI Analysis View
const AIAnalysisView = () => {
  const extractedData = [
    { label: 'Patient Name', value: 'John Smith', icon: '👤' },
    { label: 'Age', value: '45 years', icon: '🎂' },
    { label: 'Blood Pressure', value: '120/80 mmHg', icon: '💓' },
    { label: 'Heart Rate', value: '72 bpm', icon: '❤️' },
    { label: 'Temperature', value: '98.6°F', icon: '🌡️' },
    { label: 'Diagnosis', value: 'Normal findings', icon: '📋' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">AI Analysis</h2>
        <p className="text-gray-500 mt-1">View extracted document information</p>
      </div>

      {/* Document Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Document Preview</h3>
            <button className="text-sm text-secondary font-medium">View Full →</button>
          </div>
          <div className="h-64 bg-gray-50 rounded-xl flex items-center justify-center">
            <div className="text-center">
              <span className="text-6xl">📄</span>
              <p className="text-gray-400 mt-2">ML-2024-001.pdf</p>
            </div>
          </div>
        </div>

        {/* Extracted Info */}
        <div className="bg-white rounded-2xl p-6 shadow-soft">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Extracted Information</h3>
          <div className="space-y-3">
            {extractedData.map((item, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <span className="text-xl">{item.icon}</span>
                <div>
                  <p className="text-xs text-gray-400">{item.label}</p>
                  <p className="font-medium text-gray-800">{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI Confidence Score */}
      <div className="bg-gradient-to-r from-primary to-secondary rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/80">AI Confidence Score</p>
            <p className="text-4xl font-bold mt-1">98.5%</p>
          </div>
          <div className="text-right">
            <p className="text-white/80">Processing Time</p>
            <p className="text-2xl font-bold mt-1">1.2s</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Blockchain Verification View
const BlockchainView = ({ cases }: { cases: Case[] }) => {
  const verified = cases.filter(c => c.blockchainVerified);
  const pending = cases.filter(c => !c.blockchainVerified);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Blockchain Verification</h2>
        <p className="text-gray-500 mt-1">Verify and track document integrity</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-soft">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center">
              <span className="text-2xl">✓</span>
            </div>
            <div>
              <p className="text-sm text-gray-500">Verified</p>
              <p className="text-2xl font-bold text-gray-800">{verified.length}</p>
            </div>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full w-3/4 bg-accent rounded-full" />
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-soft">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center">
              <span className="text-2xl">⏳</span>
            </div>
            <div>
              <p className="text-sm text-gray-500">Pending</p>
              <p className="text-2xl font-bold text-gray-800">{pending.length}</p>
            </div>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full w-1/4 bg-yellow-400 rounded-full" />
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-soft">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <span className="text-2xl">🔗</span>
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Blocks</p>
              <p className="text-2xl font-bold text-gray-800">1,247</p>
            </div>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full w-full bg-gradient-to-r from-primary to-secondary rounded-full" />
          </div>
        </div>
      </div>

      {/* Verification List */}
      <div className="bg-white rounded-2xl shadow-soft overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800">Verification Status</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {cases.map((record) => (
            <div key={record._id} className="p-4 flex items-center justify-between hover:bg-gray-50">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  record.blockchainVerified ? 'bg-accent/20' : 'bg-yellow-100'
                }`}>
                  <span className={record.blockchainVerified ? 'text-accent' : 'text-yellow-500'}>
                    {record.blockchainVerified ? '✓' : '⏳'}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-gray-800">{record.caseNumber}</p>
                  <p className="text-sm text-gray-500">{record.title}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  record.blockchainVerified 
                    ? 'bg-accent/20 text-accent' 
                    : 'bg-yellow-100 text-yellow-600'
                }`}>
                  {record.blockchainVerified ? 'Verified' : 'Pending'}
                </span>
                <button className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                  <span>🔗</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Users View
const UsersView = () => {
  const users = [
    { name: 'Admin User', email: 'admin@medico.com', role: 'Admin', status: 'Active' },
    { name: 'Dr. Sarah Johnson', email: 'sarah@medico.com', role: 'Doctor', status: 'Active' },
    { name: 'John Smith', email: 'john@medico.com', role: 'Patient', status: 'Active' },
    { name: 'Officer Mike', email: 'mike@police.gov', role: 'Police', status: 'Active' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Users</h2>
          <p className="text-gray-500 mt-1">Manage system users and permissions</p>
        </div>
        <button className="px-4 py-2 bg-gradient-to-r from-primary to-secondary text-white rounded-xl font-medium">
          + Add User
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-soft overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">User</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Role</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Status</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map((user, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                      <span className="text-white text-sm font-medium">{user.name.charAt(0)}</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{user.name}</p>
                      <p className="text-sm text-gray-400">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="px-3 py-1 bg-primary/10 text-primary text-sm font-medium rounded-full">{user.role}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="px-3 py-1 bg-accent/20 text-accent text-sm font-medium rounded-full">{user.status}</span>
                </td>
                <td className="px-6 py-4">
                  <button className="text-gray-400 hover:text-primary">✏️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ModernDashboard;