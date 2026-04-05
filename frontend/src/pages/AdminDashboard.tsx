import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../App';
import { dashboardAPI, authAPI, blockchainAPI, casesAPI } from '../lib/api';
import { Sidebar, Navbar, DashboardCard, StatusBadge } from '../components';

interface User { _id: string; fullName: string; email: string; role: string; createdAt: string; }
interface Case { _id: string; caseNumber: string; title: string; caseType: string; patientName: string; doctorName: string; status: string; blockchainVerified: boolean; blockchainHash?: string; blockTimestamp?: string; verificationStatus?: string; verifiedAt?: string; aiIndexing?: { caseType: string; injury: string; keywords: string[]; indexedAt: string; }; createdAt: string; }

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [blockchainStats, setBlockchainStats] = useState<any>(null);
  const [aiLogs, setAiLogs] = useState<any[]>([]);
  const [blockchainLogs, setBlockchainLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUser, setNewUser] = useState({ fullName: '', email: '', password: '', role: 'patient' });

  useEffect(() => { fetchData(); }, []);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [dashboardRes, usersRes, bcRes, casesRes] = await Promise.all([dashboardAPI.getData(), authAPI.getAllUsers(), blockchainAPI.getStats(), casesAPI.getAll({})]);
      setStats(dashboardRes.data.data);
      setUsers(usersRes.data.data || []);
      setBlockchainStats(bcRes.data.data);
      setCases(casesRes.data.data || []);
    } catch (error) { console.error('Error fetching data:', error); }
    finally { setLoading(false); }
  }, []);

  const fetchLogs = useCallback(async () => {
    try {
      setLoadingLogs(true);
      const casesRes = await casesAPI.getAll({});
      const allCases = casesRes.data.data || [];
      const aiLogData = allCases.filter((c: Case) => c.aiIndexing && c.aiIndexing.indexedAt).map((c: Case) => ({ _id: c._id, caseNumber: c.caseNumber, action: 'AI_INDEXING', description: `AI indexed case: ${c.aiIndexing?.keywords?.length || 0} keywords extracted`, timestamp: c.aiIndexing?.indexedAt, user: c.doctorName, keywords: c.aiIndexing?.keywords }));
      setAiLogs(aiLogData);
      const bcLogData = allCases.filter((c: Case) => c.blockchainHash).map((c: Case) => ({ _id: c._id, caseNumber: c.caseNumber, action: 'BLOCKCHAIN_VERIFY', description: `Hash: ${c.blockchainHash?.substring(0, 20)}...`, timestamp: c.blockTimestamp || c.verifiedAt, hash: c.blockchainHash, status: c.verificationStatus }));
      setBlockchainLogs(bcLogData);
    } catch (error) { console.error('Error fetching logs:', error); }
    finally { setLoadingLogs(false); }
  }, []);

  const handleTabChange = useCallback((tab: string) => { setActiveTab(tab); if ((tab === 'ai-logs' || tab === 'blockchain-logs') && aiLogs.length === 0) fetchLogs(); }, [aiLogs.length, fetchLogs]);

  const verifiedCount = useMemo(() => cases.filter(c => c.blockchainVerified).length, [cases]);
  const pendingVerification = useMemo(() => cases.length - verifiedCount, [cases, verifiedCount]);

  const renderContent = () => {
    if (activeTab === 'profile') {
      return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto">
          <div className="glass-card p-8">
            <div className="text-center mb-6">
              <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center mb-4 shadow-lg">
                <span className="text-3xl text-white font-bold">{user?.fullName?.charAt(0).toUpperCase()}</span>
              </div>
              <h3 className="text-xl font-semibold text-[#1F2D3D]">{user?.fullName}</h3>
              <p className="text-[#64748B] capitalize">{user?.role}</p>
            </div>
            <div className="space-y-4">
              <div className="p-4 bg-[#F5F9FA] rounded-xl"><p className="text-xs font-medium text-[#64748B] mb-1">Email</p><p className="text-sm font-semibold text-[#1F2D3D]">{user?.email}</p></div>
              <div className="p-4 bg-[#F5F9FA] rounded-xl"><p className="text-xs font-medium text-[#64748B] mb-1">Role</p><p className="text-sm font-semibold text-[#1F2D3D] capitalize">{user?.role}</p></div>
            </div>
          </div>
        </motion.div>
      );
    }

    if (activeTab === 'dashboard') {
      return (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <DashboardCard title="Total Users" value={stats?.totalUsers || 0} icon="👥" color="primary" description="System users" delay={0} />
            <DashboardCard title="Total Cases" value={stats?.totalCases || 0} icon="📋" color="teal" description="All cases" delay={1} />
            <DashboardCard title="Verified Records" value={verifiedCount} icon="✓" color="accent" description="Blockchain verified" delay={2} />
            <DashboardCard title="Pending Verification" value={pendingVerification} icon="⏳" color="purple" description="Awaiting verification" delay={3} />
          </div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[{ role: 'Admins', count: stats?.usersByRole?.admin || 0, color: 'from-red-400 to-red-600', icon: '🔧' }, { role: 'Doctors', count: stats?.usersByRole?.doctors || 0, color: 'from-blue-400 to-blue-600', icon: '👨‍⚕️' }, { role: 'Police', count: stats?.usersByRole?.police || 0, color: 'from-indigo-400 to-indigo-600', icon: '👮' }, { role: 'Judiciary', count: stats?.usersByRole?.judiciary || 0, color: 'from-purple-400 to-purple-600', icon: '⚖️' }, { role: 'Patients', count: stats?.usersByRole?.patients || 0, color: 'from-teal-400 to-teal-600', icon: '🏥' }].map((item, index) => (
              <motion.div key={item.role} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 + index * 0.1 }} whileHover={{ y: -4 }} className="glass-card p-4">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-3 shadow-lg`}><span className="text-xl">{item.icon}</span></div>
                <p className="text-2xl font-bold text-[#1F2D3D]">{item.count}</p>
                <p className="text-sm text-[#64748B]">{item.role}</p>
              </motion.div>
            ))}
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="glass-card p-6">
            <h3 className="text-lg font-semibold text-[#1F2D3D] mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-[#2E8B8B]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
              Blockchain Verification Status
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-green-50 rounded-xl border border-green-200"><p className="text-2xl font-bold text-green-600">{verifiedCount}</p><p className="text-sm text-green-700">Verified Records</p></div>
              <div className="p-4 bg-orange-50 rounded-xl border border-orange-200"><p className="text-2xl font-bold text-orange-600">{pendingVerification}</p><p className="text-sm text-orange-700">Pending Verification</p></div>
              <div className="p-4 bg-purple-50 rounded-xl border border-purple-200"><p className="text-2xl font-bold text-purple-600">{blockchainStats?.totalBlocks || 0}</p><p className="text-sm text-purple-700">Blockchain Blocks</p></div>
            </div>
          </motion.div>
        </div>
      );
    }

    if (activeTab === 'medical-records') {
      return (
        <div className="space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card overflow-hidden">
            <div className="p-6 border-b border-gray-100"><h3 className="text-lg font-semibold text-[#1F2D3D]">All Medico-Legal Cases</h3></div>
            {loading ? (<div className="flex items-center justify-center py-20"><motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-10 h-10 border-4 border-red-200 border-t-red-600 rounded-full" /></div>) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-red-50 to-orange-50">
                    <tr><th className="px-6 py-4 text-left text-xs font-semibold text-[#64748B]">Case No.</th><th className="px-6 py-4 text-left text-xs font-semibold text-[#64748B]">Title</th><th className="px-6 py-4 text-left text-xs font-semibold text-[#64748B]">Patient</th><th className="px-6 py-4 text-left text-xs font-semibold text-[#64748B]">Doctor</th><th className="px-6 py-4 text-left text-xs font-semibold text-[#64748B]">Type</th><th className="px-6 py-4 text-left text-xs font-semibold text-[#64748B]">Status</th><th className="px-6 py-4 text-left text-xs font-semibold text-[#64748B]">Verified</th></tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {cases.map((c, index) => (<motion.tr key={c._id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }} className="hover:bg-[#F5F9FA]/50"><td className="px-6 py-4 text-sm text-[#64748B] font-medium">{c.caseNumber}</td><td className="px-6 py-4 text-sm text-[#1F2D3D]">{c.title}</td><td className="px-6 py-4 text-sm text-[#64748B]">{c.patientName}</td><td className="px-6 py-4 text-sm text-[#64748B]">{c.doctorName}</td><td className="px-6 py-4"><span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">{c.caseType}</span></td><td className="px-6 py-4"><span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">{c.status}</span></td><td className="px-6 py-4"><StatusBadge status={c.blockchainVerified ? 'verified' : 'pending'} size="sm" /></td></motion.tr>))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        </div>
      );
    }

    if (activeTab === 'ai-logs' || activeTab === 'blockchain-logs') {
      const logs = activeTab === 'ai-logs' ? aiLogs : blockchainLogs;
      const loadingThis = loadingLogs;
      return (
        <div className="space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-[#1F2D3D] flex items-center gap-2">
                {activeTab === 'ai-logs' ? (<><svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636a.5.5 0 01.364.636v2.027a.5.5 0 01-.364.636m0 0a.5.5 0 01-.364-.636v-2.027a.5.5 0 01.364-.636M5.727 5.727a.5.5 0 01.637-.051A7.5 7.5 0 0119 12c0 4.167-3.392 7.5-7.727 7.5a.5.5 0 01-.364-.636" /></svg> AI Indexing Logs</>) : (<><svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg> Blockchain Logs</>)}
              </h3>
              <p className="text-sm text-[#64748B]">{activeTab === 'ai-logs' ? 'Monitor AI document indexing activities' : 'Monitor blockchain verification activities'}</p>
            </div>
            {loadingThis ? (<div className="flex items-center justify-center py-20"><motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-10 h-10 border-4 border-green-200 border-t-green-600 rounded-full" /></div>) : logs.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-[#F5F9FA] flex items-center justify-center">
                  <svg className="w-10 h-10 text-[#64748B]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                </div>
                <p className="text-[#64748B]">No logs found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-green-50 to-teal-50">
                    <tr><th className="px-6 py-4 text-left text-xs font-semibold text-[#64748B]">Timestamp</th><th className="px-6 py-4 text-left text-xs font-semibold text-[#64748B]">Case</th><th className="px-6 py-4 text-left text-xs font-semibold text-[#64748B]">Action</th><th className="px-6 py-4 text-left text-xs font-semibold text-[#64748B]">Description</th>{activeTab === 'ai-logs' && <th className="px-6 py-4 text-left text-xs font-semibold text-[#64748B]">Keywords</th>}</tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {logs.map((log: any, index: number) => (<motion.tr key={index} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }} className="hover:bg-[#F5F9FA]/50"><td className="px-6 py-4 text-sm text-[#64748B]">{log.timestamp ? new Date(log.timestamp).toLocaleString() : 'N/A'}</td><td className="px-6 py-4 text-sm font-semibold text-[#1F2D3D]">{log.caseNumber}</td><td className="px-6 py-4"><span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">{log.action}</span></td><td className="px-6 py-4 text-sm text-[#64748B]">{log.description}</td>{activeTab === 'ai-logs' && <td className="px-6 py-4"><div className="flex flex-wrap gap-1">{log.keywords?.slice(0, 3).map((kw: string, i: number) => (<span key={i} className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded">{kw}</span>))}</div></td>}</motion.tr>))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        </div>
      );
    }

    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
        <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-[#F5F9FA] flex items-center justify-center">
          <svg className="w-10 h-10 text-[#64748B]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /></svg>
        </div>
        <p className="text-[#64748B]">Coming Soon</p>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F5F9FA]">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} onLogout={logout} />
      <div className="ml-64 p-6">
        <Navbar title="Admin Dashboard" subtitle="System administration" />
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AdminDashboard;