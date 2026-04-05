import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../App';
import { patientRecordsAPI } from '../lib/api';
import { Sidebar, Navbar, StatusBadge } from '../components';

interface PatientCase {
  _id: string;
  caseNumber: string;
  caseType: string;
  patientName: string;
  patientId?: string;
  doctorName?: string;
  hospitalName?: string;
  status: string;
  reportStatus?: string;
  reportPath?: string;
  blockchainVerified: boolean;
  blockchainHash?: string;
  createdAt: string;
  submittedAt?: string;
  documents?: Array<{
    fileName: string;
    filePath: string;
  }>;
  medicalDetails?: {
    examinationDate?: string;
    examinationFindings?: string;
    treatment?: string;
  };
  policeVerified?: boolean;
  policeVerifiedAt?: string;
  forwardedToJudiciary?: boolean;
  forwardedToJudiciaryAt?: string;
  judiciaryApprovedAt?: string;
  blockTimestamp?: string;
}

const PatientDashboard = () => {
  const { user, logout } = useAuth();
  const [cases, setCases] = useState<PatientCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedCase, setSelectedCase] = useState<PatientCase | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    fetchCases();
  }, []);

  const fetchCases = async () => {
    try {
      setLoading(true);
      const response = await patientRecordsAPI.getMyCases();
      const records = response.data.data || [];
      const mappedCases = records.map((r: any) => ({
        _id: r._id,
        caseNumber: r.caseNumber,
        caseType: r.caseType,
        patientName: r.patientName,
        patientId: r.patientId,
        doctorName: r.doctorName,
        hospitalName: r.hospitalName,
        status: r.status,
        reportStatus: r.reportStatus,
        reportPath: r.reportPath,
        blockchainVerified: r.blockchainVerified,
        blockchainHash: r.blockchainHash,
        createdAt: r.createdAt || r.date,
        documents: r.documents || (r.filePath ? [{ fileName: r.fileName, filePath: r.filePath }] : [])
      }));
      setCases(mappedCases);
      setError('');
    } catch (err: any) {
      console.error('Error fetching cases:', err);
      setError(err.response?.data?.message || 'Failed to load your cases');
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = (caseId: string) => {
    const token = localStorage.getItem('token');
    window.open(`/api/download-report/${caseId}?token=${token}`);
  };

  const openDetails = (caseItem: PatientCase) => {
    setSelectedCase(caseItem);
    setShowDetailsModal(true);
  };

  const getCaseProgress = (caseItem: PatientCase) => {
    const status = caseItem.status;
    if (status === 'Report Ready' || status === 'Verified' || caseItem.blockchainVerified) return 'doctor_uploaded';
    if (caseItem.policeVerified || caseItem.policeVerifiedAt) return 'police_verified';
    if (caseItem.forwardedToJudiciary || caseItem.judiciaryApprovedAt) return 'court_verified';
    return 'pending';
  };

  const getWorkflowTimeline = (caseItem: PatientCase) => {
    const timeline = [];
    timeline.push({ label: 'Case Created', icon: '📝', date: caseItem.createdAt, completed: true });
    const hasReport = caseItem.documents && caseItem.documents.length > 0;
    timeline.push({ label: 'Doctor Uploaded Report', icon: '👨‍⚕️', date: caseItem.createdAt, completed: hasReport || caseItem.status === 'Report Ready' || caseItem.status === 'Verified' });
    timeline.push({ label: 'Blockchain Hash Generated', icon: '🔗', date: caseItem.blockTimestamp, completed: caseItem.blockchainVerified || !!caseItem.blockchainHash });
    timeline.push({ label: 'Police Verified', icon: '👮', date: caseItem.policeVerifiedAt, completed: caseItem.policeVerified || !!caseItem.policeVerifiedAt });
    timeline.push({ label: 'Court Verification', icon: '⚖️', date: caseItem.judiciaryApprovedAt || caseItem.forwardedToJudiciaryAt, completed: caseItem.judiciaryApprovedAt || (caseItem.forwardedToJudiciary && caseItem.status === 'Forwarded to Judiciary') });
    return timeline;
  };

  const getStatusLabel = (caseItem: PatientCase) => {
    if (caseItem.status === 'Verified' || caseItem.blockchainVerified) return 'Completed';
    if (caseItem.policeVerified) return 'Police Verified';
    if (caseItem.forwardedToJudiciary) return 'Sent to Court';
    if (caseItem.status === 'Report Ready') return 'Report Ready';
    return 'Pending';
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-[#2E8B8B] to-[#4F9DA6] shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-[#64748B]">My Cases</p>
                    <p className="text-3xl font-bold text-[#1F2D3D]">{cases.length}</p>
                  </div>
                </div>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-[#64748B]">Reports Available</p>
                    <p className="text-3xl font-bold text-[#1F2D3D]">{cases.filter(c => c.status === 'Report Ready').length}</p>
                  </div>
                </div>
              </motion.div>
            </div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <h3 className="text-lg font-semibold text-[#1F2D3D] mb-4">My Medical Records</h3>
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-10 h-10 border-4 border-[#2E8B8B]/20 border-t-[#2E8B8B] rounded-full" />
                </div>
              ) : error ? (
                <div className="glass-card p-4 text-red-600">{error}</div>
              ) : cases.length === 0 ? (
                <div className="glass-card p-10 text-center">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-[#F5F9FA] flex items-center justify-center">
                    <svg className="w-10 h-10 text-[#64748B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-[#64748B] text-lg">No medico legal record available</p>
                  <p className="text-[#94A3B8] text-sm mt-1">Your medical records will appear here once added by your doctor.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {cases.map((caseItem, index) => (
                    <motion.div key={caseItem._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }} whileHover={{ y: -4 }} className="glass-card-hover p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#2E8B8B] to-[#4F9DA6] flex items-center justify-center shadow-lg">
                          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                        </div>
                        <StatusBadge status={caseItem.blockchainVerified ? 'verified' : 'pending'} size="sm" />
                      </div>
                      <h4 className="font-semibold text-[#1F2D3D] mb-2">{caseItem.caseNumber}</h4>
                      <p className="text-sm text-[#64748B] mb-1">Type: {caseItem.caseType}</p>
                      <p className="text-sm text-[#64748B] mb-1">Doctor: {caseItem.doctorName || 'Not assigned'}</p>
                      <p className="text-sm text-[#64748B] mb-4">Hospital: {caseItem.hospitalName || 'N/A'}</p>
                      <div className="mb-4">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                          getCaseProgress(caseItem) === 'court_verified' ? 'bg-green-100 text-green-700' :
                          getCaseProgress(caseItem) === 'police_verified' ? 'bg-blue-100 text-blue-700' :
                          getCaseProgress(caseItem) === 'doctor_uploaded' ? 'bg-purple-100 text-purple-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {getStatusLabel(caseItem)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <span className="text-xs text-[#94A3B8]">{new Date(caseItem.createdAt).toLocaleDateString()}</span>
                        <div className="flex gap-2">
                          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => openDetails(caseItem)} className="px-3 py-2 bg-[#F5F9FA] text-[#64748B] rounded-xl text-sm font-semibold hover:bg-[#E8F4F4]">
                            View
                          </motion.button>
                          {caseItem.documents && caseItem.documents.length > 0 && (
                            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => downloadReport(caseItem._id)} className="px-3 py-2 bg-gradient-to-r from-[#2E8B8B] to-[#4F9DA6] text-white rounded-xl text-sm font-semibold">
                              Download
                            </motion.button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        );

      case 'profile':
        return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto">
            <div className="glass-card p-8">
              <div className="text-center mb-6">
                <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center mb-4 shadow-lg">
                  <span className="text-3xl text-white font-bold">{user?.fullName?.charAt(0).toUpperCase()}</span>
                </div>
                <h3 className="text-xl font-semibold text-[#1F2D3D]">{user?.fullName}</h3>
                <p className="text-[#64748B] capitalize">{user?.role}</p>
              </div>
              <div className="space-y-4">
                <div className="p-4 bg-[#F5F9FA] rounded-xl">
                  <p className="text-xs font-medium text-[#64748B] mb-1">Name</p>
                  <p className="text-sm font-semibold text-[#1F2D3D]">{user?.fullName}</p>
                </div>
                <div className="p-4 bg-[#F5F9FA] rounded-xl">
                  <p className="text-xs font-medium text-[#64748B] mb-1">Email</p>
                  <p className="text-sm font-semibold text-[#1F2D3D]">{user?.email || 'Not provided'}</p>
                </div>
                <div className="p-4 bg-[#F5F9FA] rounded-xl">
                  <p className="text-xs font-medium text-[#64748B] mb-1">Role</p>
                  <p className="text-sm font-semibold text-[#1F2D3D] capitalize">{user?.role}</p>
                </div>
              </div>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F9FA]">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} onLogout={logout} />
      <div className="ml-64 p-6">
        <Navbar title="Patient Dashboard" subtitle="View your medical records" showNotifications={false} />
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </div>

      {showDetailsModal && selectedCase && (
        <div className="modal-overlay">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-[#1F2D3D]">Case Details</h2>
              <button onClick={() => setShowDetailsModal(false)} className="text-[#64748B] hover:text-[#1F2D3D] text-2xl">×</button>
            </div>

            <div className="mb-6 p-5 bg-[#F5F9FA] rounded-xl">
              <h3 className="text-lg font-semibold text-[#1F2D3D] mb-3">Case Status</h3>
              <div className="flex items-center gap-3">
                <StatusBadge status={selectedCase.status === 'Verified' ? 'verified' : 'pending'} size="md" />
                <span className="font-semibold text-[#1F2D3D]">{getStatusLabel(selectedCase)}</span>
              </div>
            </div>

            <div className="mb-6 p-5 bg-green-50 rounded-xl">
              <h3 className="text-lg font-semibold text-green-800 mb-3">Medical Information</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><strong>Case ID:</strong> {selectedCase.caseNumber}</div>
                <div><strong>Case Type:</strong> {selectedCase.caseType}</div>
                <div><strong>Patient Name:</strong> {selectedCase.patientName}</div>
                <div><strong>Doctor Name:</strong> {selectedCase.doctorName || 'Not assigned'}</div>
                <div><strong>Hospital Name:</strong> {selectedCase.hospitalName || 'N/A'}</div>
                <div><strong>Report Date:</strong> {selectedCase.createdAt ? new Date(selectedCase.createdAt).toLocaleDateString() : 'N/A'}</div>
              </div>
            </div>

            <div className="mb-6 p-5 bg-amber-50 rounded-xl">
              <h3 className="text-lg font-semibold text-amber-800 mb-3">Blockchain Verification</h3>
              <div className="flex items-center gap-2 mb-2">
                {selectedCase.blockchainVerified ? (
                  <span className="flex items-center gap-1.5 text-green-600 font-semibold">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Verified
                  </span>
                ) : (
                  <span className="text-[#64748B]">Pending Verification</span>
                )}
              </div>
              {selectedCase.blockchainHash && (
                <div className="text-xs mt-2">
                  <strong>Hash:</strong>
                  <div className="font-mono break-all mt-1 p-2 bg-white rounded-lg">{selectedCase.blockchainHash}</div>
                </div>
              )}
            </div>

            <div className="mb-6 p-5 bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl">
              <h3 className="text-lg font-semibold text-[#1F2D3D] mb-4">Workflow Timeline</h3>
              <div className="space-y-3">
                {getWorkflowTimeline(selectedCase).map((step, idx) => (
                  <div key={idx} className={`flex items-center gap-3 p-3 rounded-lg transition-all ${step.completed ? 'bg-white shadow-sm' : 'bg-gray-100 opacity-60'}`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${step.completed ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-500'}`}>
                      {step.icon}
                    </div>
                    <div className="flex-1">
                      <p className={`font-medium text-sm ${step.completed ? 'text-[#1F2D3D]' : 'text-[#64748B]'}`}>{step.label}</p>
                      {step.date && <p className="text-xs text-[#94A3B8]">{new Date(step.date).toLocaleDateString()}</p>}
                    </div>
                    <div>{step.completed ? <span className="text-green-500 text-lg">✓</span> : <span className="text-gray-400 text-lg">○</span>}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              {selectedCase.documents && selectedCase.documents.length > 0 ? (
                <button onClick={() => downloadReport(selectedCase._id)} className="flex-1 btn-primary">
                  Download Report
                </button>
              ) : (
                <div className="flex-1 py-3 bg-gray-100 text-[#64748B] rounded-xl font-semibold text-center">Report Pending</div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default PatientDashboard;