import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../App';
import { casesAPI, authAPI } from '../lib/api';
import { Sidebar, Navbar, DashboardCard, StatusBadge } from '../components';

interface Case {
  _id: string;
  caseNumber: string;
  title: string;
  caseType: string;
  patientName: string;
  patientAge?: number;
  patientGender?: string;
  patientPhone?: string;
  doctorName: string;
  doctorId?: string;
  hospitalName: string;
  description: string;
  injuryDescription?: string;
  incidentDate?: string;
  status: string;
  createdAt: string;
  blockchainVerified: boolean;
  blockchainHash?: string;
  blockTimestamp?: string;
  verificationStatus?: string;
  aiIndexing?: {
    caseType: string;
    injury: string;
    keywords: string[];
    extractedData: any;
    indexedAt: string;
  };
  documents?: Array<{
    fileName: string;
    filePath: string;
    fileType: string;
    uploadDate: string;
  }>;
  medicalDetails?: {
    examinationDate?: string;
    examinationFindings?: string;
    treatment?: string;
    prognosis?: string;
    recommendations?: string;
  };
  forwardedToJudiciary: boolean;
  forwardedToJudiciaryAt?: string;
  forwardedToJudge?: boolean;
  forwardedToJudgeAt?: string;
  judiciaryNotes?: string;
  judiciaryApproved?: boolean | null;
  judiciaryApprovedAt?: string;
  judiciaryRemarks?: string;
}

const JudiciaryDashboard = () => {
  const { user, logout } = useAuth();
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [showDecisionModal, setShowDecisionModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [decisionType, setDecisionType] = useState<'approve' | 'reject'>('approve');
  const [remarks, setRemarks] = useState('');
  const [verificationResult, setVerificationResult] = useState<{isValid: boolean; message: string; storedHash?: string; calculatedHash?: string} | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => { fetchCases(); }, []);

  const fetchCases = async () => {
    try {
      setLoading(true);
      const response = await casesAPI.getJudgeCases();
      setCases(response.data.data || []);
    } catch (error) {
      try {
        const fallbackResponse = await casesAPI.getAll();
        const allCases = fallbackResponse.data.data || [];
        const judiciaryCases = allCases.filter((c: Case) => 
          c.status === 'Forwarded to Judiciary' || 
          c.status === 'forwarded_to_judge' ||
          c.status === 'Forwarded to Judge' ||
          c.forwardedToJudiciary ||
          c.forwardedToJudge
        );
        setCases(judiciaryCases);
      } catch (fallbackError) { console.error('Fallback also failed:', fallbackError); }
    } finally { setLoading(false); }
  };

  const handleVerify = (caseItem: Case) => { setSelectedCase(caseItem); setVerificationResult(null); setShowVerifyModal(true); };
  const openDecisionModal = (caseItem: Case, type: 'approve' | 'reject') => { setSelectedCase(caseItem); setDecisionType(type); setRemarks(''); setShowDecisionModal(true); };
  const openDetailsModal = (caseItem: Case) => { setSelectedCase(caseItem); setShowDetailsModal(true); };

  const performVerification = async () => {
    if (!selectedCase) return;
    setActionLoading('verify');
    try {
      const response = await casesAPI.verifyHash(selectedCase._id);
      const result = response.data.data;
      const isValid = result.isValid || result.verified || false;
      setVerificationResult({ isValid, message: isValid ? '✅ Record Authentic and Verified' : '⚠️ Warning: Record May Have Been Tampered', storedHash: result.storedHash || selectedCase.blockchainHash || '', calculatedHash: result.currentHash || result.recalculatedHash || '' });
    } catch (error: any) { setVerificationResult({ isValid: false, message: error.response?.data?.message || 'Error during verification' }); }
    finally { setActionLoading(null); }
  };

  const handleDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCase) return;
    setActionLoading('decision');
    try {
      if (decisionType === 'approve') { await casesAPI.approveCase(selectedCase._id, remarks); alert('Case approved successfully!'); }
      else { await casesAPI.rejectCase(selectedCase._id, remarks); alert('Case rejected.'); }
      setShowDecisionModal(false);
      fetchCases();
    } catch (error: any) { alert(error.response?.data?.message || 'Error processing decision'); }
    finally { setActionLoading(null); }
  };

  const getApprovalStatus = (caseItem: Case) => {
    if (caseItem.judiciaryApproved === true) return <StatusBadge status="approved" />;
    else if (caseItem.judiciaryApproved === false) return <StatusBadge status="rejected" />;
    else if (caseItem.forwardedToJudiciary) return <StatusBadge status="pending" />;
    return <StatusBadge status="inactive" />;
  };

  const approvedCount = cases.filter(c => c.judiciaryApproved === true).length;
  const rejectedCount = cases.filter(c => c.judiciaryApproved === false).length;

  const renderContent = () => {
    if (activeTab === 'profile') {
      return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto">
          <div className="glass-card p-8">
            <div className="text-center mb-6">
              <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-purple-500 to-violet-500 flex items-center justify-center mb-4 shadow-lg">
                <span className="text-3xl text-white font-bold">{user?.fullName?.charAt(0).toUpperCase()}</span>
              </div>
              <h3 className="text-xl font-semibold text-[#1F2D3D]">{user?.fullName}</h3>
              <p className="text-[#64748B] capitalize">{user?.role}</p>
            </div>
            <div className="space-y-4">
              <div className="p-4 bg-[#F5F9FA] rounded-xl"><p className="text-xs font-medium text-[#64748B] mb-1">Court Name</p><p className="text-sm font-semibold text-[#1F2D3D]">High Court</p></div>
              <div className="p-4 bg-[#F5F9FA] rounded-xl"><p className="text-xs font-medium text-[#64748B] mb-1">Email</p><p className="text-sm font-semibold text-[#1F2D3D]">{user?.email || 'N/A'}</p></div>
              <div className="p-4 bg-[#F5F9FA] rounded-xl"><p className="text-xs font-medium text-[#64748B] mb-1">Role</p><p className="text-sm font-semibold text-[#1F2D3D] capitalize">{user?.role}</p></div>
            </div>
          </div>
        </motion.div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <DashboardCard title="Total Cases" value={cases.length} icon="📋" color="primary" description="Forwarded cases" delay={0} />
          <DashboardCard title="Approved" value={approvedCount} icon="✓" color="teal" description="Evidence approved" delay={1} />
          <DashboardCard title="Rejected" value={rejectedCount} icon="✗" color="red" description="Evidence rejected" delay={2} />
          <DashboardCard title="Verified" value={cases.filter(c => c.blockchainVerified).length} icon="🔗" color="purple" description="Blockchain verified" delay={3} />
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <h3 className="text-lg font-semibold text-[#1F2D3D] mb-4">Cases for Review</h3>
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-10 h-10 border-4 border-purple-200 border-t-purple-600 rounded-full" />
            </div>
          ) : cases.length === 0 ? (
            <div className="glass-card p-10 text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-purple-50 flex items-center justify-center">
                <svg className="w-10 h-10 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2M6 7l6 2M4 7h.01M8 7h.01M12 7h.01M16 7h.01M20 7h.01" />
                </svg>
              </div>
              <p className="text-[#64748B] text-lg">No cases forwarded yet</p>
              <p className="text-[#94A3B8] text-sm">Cases from police will appear here.</p>
            </div>
          ) : (
            <div className="grid gap-6">
              {cases.map((c, index) => (
                <motion.div key={c._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }} className="glass-card overflow-hidden">
                  <div className="bg-gradient-to-r from-purple-600 to-violet-600 p-4">
                    <div className="flex items-center justify-between">
                      <div><h4 className="text-white font-semibold">{c.title}</h4><p className="text-purple-200 text-sm">Case: {c.caseNumber}</p></div>
                      {getApprovalStatus(c)}
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div><p className="text-xs text-[#64748B]">Patient</p><p className="font-semibold text-[#1F2D3D]">{c.patientName}</p></div>
                      <div><p className="text-xs text-[#64748B]">Doctor</p><p className="font-semibold text-[#1F2D3D]">{c.doctorName || 'N/A'}</p></div>
                      <div><p className="text-xs text-[#64748B]">Type</p><p className="font-semibold text-[#1F2D3D]">{c.caseType}</p></div>
                      <div><p className="text-xs text-[#64748B]">Date</p><p className="font-semibold text-[#1F2D3D]">{new Date(c.createdAt).toLocaleDateString()}</p></div>
                    </div>
                    <div className="flex gap-3 mb-4">
                      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => openDetailsModal(c)} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold">View Details</motion.button>
                      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => handleVerify(c)} className="px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-semibold">Verify Hash</motion.button>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
                      <div className="flex items-center gap-3">
                        <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                        <div><p className="font-medium text-purple-800">Blockchain Integrity</p><p className={`text-sm ${c.blockchainVerified ? 'text-green-600' : 'text-red-500'}`}>{c.blockchainVerified ? '✓ Hash Verified' : '✗ Not Verified'}</p></div>
                      </div>
                    </div>
                    {!c.judiciaryApproved && (
                      <div className="flex gap-4 mt-4">
                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => openDecisionModal(c, 'approve')} className="flex-1 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2">✓ Approve Evidence</motion.button>
                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => openDecisionModal(c, 'reject')} className="flex-1 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2">✗ Reject Evidence</motion.button>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F5F9FA]">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} onLogout={logout} />
      <div className="ml-64 p-6">
        <Navbar title="Judiciary Dashboard" subtitle="Verify evidence & approve cases" showNotifications={false} />
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </div>

      {showDetailsModal && selectedCase && (
        <div className="modal-overlay">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl p-8 w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-[#1F2D3D]">Case Details</h2>
              <button onClick={() => setShowDetailsModal(false)} className="text-[#64748B] hover:text-[#1F2D3D] text-2xl">×</button>
            </div>
            <div className="mb-6 p-5 bg-blue-50 rounded-xl">
              <h3 className="text-lg font-semibold text-blue-800 mb-3">Case Information</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><strong>Case Number:</strong> {selectedCase.caseNumber}</div>
                <div><strong>Case Type:</strong> {selectedCase.caseType}</div>
                <div><strong>Title:</strong> {selectedCase.title}</div>
                <div><strong>Status:</strong> {selectedCase.status}</div>
              </div>
            </div>
            <div className="mb-6 p-5 bg-green-50 rounded-xl">
              <h3 className="text-lg font-semibold text-green-800 mb-3">Medical Report</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><strong>Patient Name:</strong> {selectedCase.patientName}</div>
                {selectedCase.patientAge && <div><strong>Age:</strong> {selectedCase.patientAge}</div>}
                {selectedCase.patientGender && <div><strong>Gender:</strong> {selectedCase.patientGender}</div>}
                <div><strong>Hospital:</strong> {selectedCase.hospitalName}</div>
                <div><strong>Doctor:</strong> {selectedCase.doctorName || 'N/A'}</div>
                <div><strong>Created:</strong> {new Date(selectedCase.createdAt).toLocaleDateString()}</div>
              </div>
              <div className="mt-3 text-sm"><strong>Description:</strong> {selectedCase.description}</div>
            </div>
            {selectedCase.aiIndexing && (
              <div className="mb-6 p-5 bg-purple-50 rounded-xl">
                <h3 className="text-lg font-semibold text-purple-800 mb-3">AI Indexing Results</h3>
                {selectedCase.aiIndexing.keywords && <div className="flex flex-wrap gap-2 mt-2">{selectedCase.aiIndexing.keywords.map((kw, idx) => (<span key={idx} className="px-2 py-1 bg-purple-200 text-purple-800 text-xs rounded-full">{kw}</span>))}</div>}
              </div>
            )}
            <div className="mb-6 p-5 bg-amber-50 rounded-xl">
              <h3 className="text-lg font-semibold text-amber-800 mb-3">Blockchain Verification</h3>
              {selectedCase.blockchainHash ? (<div><p className={`text-sm font-semibold ${selectedCase.blockchainVerified ? 'text-green-600' : 'text-red-500'}`}>{selectedCase.blockchainVerified ? '✓ Verified' : '✗ Not Verified'}</p><p className="font-mono text-xs break-all mt-2 p-2 bg-white rounded">{selectedCase.blockchainHash}</p></div>) : (<p className="text-[#64748B] text-sm">No blockchain hash available</p>)}
            </div>
            <div className="flex gap-4">
              <button onClick={() => { setShowDetailsModal(false); handleVerify(selectedCase); }} className="flex-1 btn-primary bg-gradient-to-r from-purple-500 to-purple-600">Verify Hash</button>
              <button onClick={() => setShowDetailsModal(false)} className="px-6 py-3 bg-[#F5F9FA] text-[#64748B] rounded-xl font-semibold hover:bg-[#E8F4F4]">Close</button>
            </div>
          </motion.div>
        </div>
      )}

      {showVerifyModal && selectedCase && (
        <div className="modal-overlay">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl p-8 w-full max-w-2xl shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-[#1F2D3D]">Verify Blockchain Hash</h2>
              <button onClick={() => setShowVerifyModal(false)} className="text-[#64748B] hover:text-[#1F2D3D] text-2xl">×</button>
            </div>
            <div className="mb-6 p-4 bg-purple-50 rounded-xl">
              <p className="text-sm"><strong>Case:</strong> {selectedCase.caseNumber}</p>
              <p className="text-sm"><strong>Patient:</strong> {selectedCase.patientName}</p>
            </div>
            {!verificationResult ? (
              <motion.button onClick={performVerification} disabled={actionLoading === 'verify'} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full btn-primary bg-gradient-to-r from-purple-500 to-purple-600">{actionLoading === 'verify' ? 'Verifying...' : 'Perform Verification'}</motion.button>
            ) : (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`p-6 rounded-xl border-2 ${verificationResult.isValid ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                <p className={`text-lg font-bold mb-4 ${verificationResult.isValid ? 'text-green-700' : 'text-red-700'}`}>{verificationResult.message}</p>
                {verificationResult.storedHash && <div className="mb-2"><p className="font-medium text-sm text-[#64748B]">Stored Hash:</p><p className="font-mono text-xs break-all bg-white p-2 rounded">{verificationResult.storedHash}</p></div>}
                {verificationResult.calculatedHash && <div><p className="font-medium text-sm text-[#64748B]">Calculated Hash:</p><p className="font-mono text-xs break-all bg-white p-2 rounded">{verificationResult.calculatedHash}</p></div>}
              </motion.div>
            )}
            <button onClick={() => setShowVerifyModal(false)} className="mt-6 w-full py-3 bg-[#F5F9FA] text-[#64748B] rounded-xl font-semibold hover:bg-[#E8F4F4]">Close</button>
          </motion.div>
        </div>
      )}

      {showDecisionModal && selectedCase && (
        <div className="modal-overlay">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl p-8 w-full max-w-lg shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-[#1F2D3D]">{decisionType === 'approve' ? '✓ Approve Evidence' : '✗ Reject Evidence'}</h2>
              <button onClick={() => setShowDecisionModal(false)} className="text-[#64748B] hover:text-[#1F2D3D] text-2xl">×</button>
            </div>
            <div className="mb-6 p-4 bg-[#F5F9FA] rounded-xl">
              <p className="text-sm"><strong>Case:</strong> {selectedCase.caseNumber}</p>
              <p className="text-sm"><strong>Patient:</strong> {selectedCase.patientName}</p>
            </div>
            <form onSubmit={handleDecision}>
              <div className="mb-6">
                <label className="block text-sm font-semibold text-[#1F2D3D] mb-2">{decisionType === 'approve' ? 'Approval Remarks (Optional)' : 'Rejection Reason (Required)'}</label>
                <textarea className="input-modern" rows={4} value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder={decisionType === 'approve' ? 'Add remarks about your approval...' : 'Explain why this evidence is being rejected...'} required={decisionType === 'reject'} />
              </div>
              <div className="flex gap-4">
                <button type="submit" disabled={actionLoading === 'decision'} className={`flex-1 py-3 text-white rounded-xl font-semibold disabled:opacity-50 ${decisionType === 'approve' ? 'bg-gradient-to-r from-green-500 to-green-600' : 'bg-gradient-to-r from-red-500 to-red-600'}`}>{actionLoading === 'decision' ? 'Processing...' : decisionType === 'approve' ? '✓ Approve' : '✗ Reject'}</button>
                <button type="button" onClick={() => setShowDecisionModal(false)} className="px-6 py-3 bg-[#F5F9FA] text-[#64748B] rounded-xl font-semibold hover:bg-[#E8F4F4]">Cancel</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default JudiciaryDashboard;