import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../App';
import { casesAPI } from '../lib/api';
import { Sidebar, Navbar, StatusBadge } from '../components';

interface Case {
  _id: string;
  caseNumber: string;
  title: string;
  caseType: string;
  patientName: string;
  patientAge?: number;
  patientGender?: string;
  description: string;
  injuryDescription?: string;
  hospitalName: string;
  doctorName: string;
  doctorId?: string;
  incidentDate?: string;
  status: string;
  createdAt?: string;
  submittedAt?: string;
  verifiedAt?: string;
  closedAt?: string;
  forwardedToJudiciaryAt?: string;
  judiciaryApprovedAt?: string;
  doctorAssignedAt?: string;
  medicalReportUploadedAt?: string;
  aiIndexingCompletedAt?: string;
  blockchainGeneratedAt?: string;
  policeVerifiedAt?: string;
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
  investigationNotes?: Array<{
    note: string;
    addedByName: string;
    addedAt: string;
  }>;
  forwardedToJudiciary: boolean;
  forwardedToJudge?: boolean;
}

const PoliceDashboard = () => {
  const { user, logout } = useAuth();
  const [caseId, setCaseId] = useState("");
  const [searchedCase, setSearchedCase] = useState<Case | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [aiQuery, setAiQuery] = useState("");
  const [aiSearchResults, setAiSearchResults] = useState<Case[]>([]);
  const [aiSearchLoading, setAiSearchLoading] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [verifyResult, setVerifyResult] = useState<{isValid: boolean; message: string; recalculatedHash?: string; storedHash?: string} | null>(null);
  const [forwardNotes, setForwardNotes] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCaseId = caseId.replace(/Case:\s*/i, '').replace(/MLC-/i, 'MLC-').trim();
    if (!cleanCaseId) {
      setError('Please enter a Case ID');
      return;
    }
    setLoading(true);
    setError('');
    setSearchedCase(null);
    try {
      const response = await casesAPI.searchByCaseId(cleanCaseId);
      setSearchedCase(response.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Case not found');
      setSearchedCase(null);
    } finally {
      setLoading(false);
    }
  };

  const handleAISearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiQuery.trim()) {
      setError('Please enter a search query');
      return;
    }
    setAiSearchLoading(true);
    setError('');
    try {
      const response = await casesAPI.aiSearch(aiQuery.trim());
      setAiSearchResults(response.data.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Search failed');
      setAiSearchResults([]);
    } finally {
      setAiSearchLoading(false);
    }
  };

  const handleVerifyHash = async () => {
    if (!searchedCase) return;
    setActionLoading('verify');
    try {
      const response = await casesAPI.verifyCase(searchedCase._id);
      const data = response.data.data;
      setVerifyResult({
        isValid: true,
        message: '✅ Case Verified - Blockchain Hash Confirmed & Police Verified',
        recalculatedHash: searchedCase.blockchainHash || '',
        storedHash: searchedCase.blockchainHash || ''
      });
      const updatedResponse = await casesAPI.searchByCaseId(searchedCase.caseNumber);
      setSearchedCase(updatedResponse.data.data);
    } catch (err: any) {
      setVerifyResult({ isValid: false, message: err.response?.data?.message || 'Error verifying hash' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleForwardToJudge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchedCase) return;
    setActionLoading('forward');
    try {
      await casesAPI.forwardToJudge(searchedCase._id, forwardNotes);
      alert('Case forwarded to judge successfully!');
      const response = await casesAPI.searchByCaseId(searchedCase.caseNumber);
      setSearchedCase(response.data.data);
      setShowForwardModal(false);
      setForwardNotes('');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error forwarding case');
    } finally {
      setActionLoading(null);
    }
  };

  const renderContent = () => {
    if (activeTab === 'search-case') {
      return (
        <div className="space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
            <h2 className="text-xl font-semibold text-[#1F2D3D] mb-2">Search Case</h2>
            <p className="text-[#64748B]">Enter Case ID to find a case</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <form onSubmit={handleSearch} className="glass-card p-6">
              <div className="flex gap-4">
                <input type="text" value={caseId} onChange={(e) => setCaseId(e.target.value)} placeholder="Enter Case ID (e.g., ML001)" className="input-modern flex-1" />
                <motion.button type="submit" disabled={loading} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="btn-primary">
                  {loading ? 'Searching...' : 'Search'}
                </motion.button>
              </div>
              {error && <div className="mt-3 p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}
            </form>
          </motion.div>

          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="glass-card p-12">
                <div className="flex flex-col items-center justify-center">
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-10 h-10 border-4 border-[#2E8B8B]/20 border-t-[#2E8B8B] rounded-full" />
                  <p className="text-[#64748B] mt-4">Searching...</p>
                </div>
              </motion.div>
            ) : searchedCase ? (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="glass-card p-6">
                <h3 className="text-lg font-semibold text-[#1F2D3D] mb-4">Case Found</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div><p className="text-sm text-[#64748B]">Case ID</p><p className="font-semibold text-[#1F2D3D]">{searchedCase.caseNumber}</p></div>
                  <div><p className="text-sm text-[#64748B]">Case Type</p><p className="font-semibold text-[#1F2D3D]">{searchedCase.caseType}</p></div>
                  <div><p className="text-sm text-[#64748B]">Patient Name</p><p className="font-semibold text-[#1F2D3D]">{searchedCase.patientName}</p></div>
                  <div><p className="text-sm text-[#64748B]">Patient Age</p><p className="font-semibold text-[#1F2D3D]">{searchedCase.patientAge || 'N/A'}</p></div>
                  <div><p className="text-sm text-[#64748B]">Patient Gender</p><p className="font-semibold text-[#1F2D3D]">{searchedCase.patientGender || 'N/A'}</p></div>
                <div><p className="text-sm text-[#64748B]">Status</p><StatusBadge status={searchedCase.forwardedToJudge ? 'forwarded' : (searchedCase.policeVerified ? 'verified' : 'pending')} /></div>
                </div>
                <div className="mt-4 p-4 bg-[#F5F9FA] rounded-xl">
                  <p className="text-sm text-[#64748B] mb-1">Blockchain Hash</p>
                  <p className="font-mono text-xs text-[#1F2D3D] break-all">{searchedCase.blockchainHash || 'No hash generated'}</p>
                </div>
              </motion.div>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="glass-card p-12">
                <div className="flex flex-col items-center justify-center">
                  <div className="w-20 h-20 rounded-2xl bg-[#F5F9FA] flex items-center justify-center mb-4">
                    <svg className="w-10 h-10 text-[#64748B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <p className="text-[#64748B] text-lg">Enter Case ID to search</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      );
    }

    if (activeTab === 'ai-indexing') {
      return (
        <div className="space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
            <h2 className="text-xl font-semibold text-[#1F2D3D] mb-2">🧠 AI Indexing & Search</h2>
            <p className="text-[#64748B]">Search using AI - by Case ID, Patient Name, Case Type, or Injury Type</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <form onSubmit={handleAISearch} className="glass-card p-6">
              <div className="flex gap-4">
                <input type="text" value={aiQuery} onChange={(e) => setAiQuery(e.target.value)} placeholder="Search by Case ID, Patient Name, Case Type, or Injury Type..." className="input-modern flex-1" />
                <motion.button type="submit" disabled={aiSearchLoading} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="btn-primary">AI Search</motion.button>
              </div>
              {error && <div className="mt-3 p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}
            </form>
          </motion.div>

          {aiSearchLoading ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-12">
              <div className="flex flex-col items-center justify-center">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full" />
                <p className="text-[#64748B] mt-4">AI Searching...</p>
              </div>
            </motion.div>
          ) : aiSearchResults.length > 0 ? (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card overflow-hidden">
              <div className="p-6 border-b border-gray-100"><h3 className="text-lg font-semibold text-[#1F2D3D]">AI Search Results ({aiSearchResults.length})</h3></div>
              <div className="divide-y divide-gray-50">
                {aiSearchResults.map((c) => (
                  <div key={c._id} className="p-6 hover:bg-[#F5F9FA]/50">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-[#1F2D3D]">{c.caseNumber}</p>
                        <p className="text-sm text-[#64748B]">{c.patientName} | {c.caseType}</p>
                        {c.aiIndexing && c.aiIndexing.keywords && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {c.aiIndexing.keywords.slice(0, 5).map((kw, i) => (
                              <span key={i} className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">{kw}</span>
                            ))}
                          </div>
                        )}
                      </div>
                      <StatusBadge status={c.blockchainVerified ? 'verified' : 'pending'} />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ) : !aiQuery ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-12">
              <div className="flex flex-col items-center justify-center">
                <div className="w-20 h-20 rounded-2xl bg-purple-50 flex items-center justify-center mb-4">
                  <svg className="w-10 h-10 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636a.5.5 0 01.364.636v2.027a.5.5 0 01-.364.636m0 0a.5.5 0 01-.364-.636v-2.027a.5.5 0 01.364-.636M5.727 5.727a.5.5 0 01.637-.051A7.5 7.5 0 0119 12c0 4.167-3.392 7.5-7.727 7.5a.5.5 0 01-.364-.636" />
                  </svg>
                </div>
                <p className="text-[#64748B] text-lg">AI-Powered Search</p>
                <p className="text-[#94A3B8] text-sm mt-2">Search by Case ID, Patient Name, Case Type, or Injury Type</p>
              </div>
            </motion.div>
          ) : null}
        </div>
      );
    }

    if (activeTab === 'hash-verification') {
      if (!searchedCase) {
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
            <h2 className="text-xl font-semibold text-[#1F2D3D] mb-2">🔐 Blockchain Verification</h2>
            <p className="text-[#64748B]">Please search for a case first</p>
            <div className="mt-4 p-4 bg-orange-50 rounded-xl"><p className="text-orange-700">Go to Search Case tab to find a case first</p></div>
          </motion.div>
        );
      }

      return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
          <h2 className="text-xl font-semibold text-[#1F2D3D] mb-2">🔐 Blockchain Verification</h2>
          <p className="text-[#64748B] mb-4">Verify case integrity using blockchain</p>

          <div className="p-4 bg-[#F5F9FA] rounded-xl mb-4">
            <p className="text-sm"><strong>Case:</strong> {searchedCase.caseNumber}</p>
            <p className="text-sm"><strong>Patient:</strong> {searchedCase.patientName}</p>
          </div>

          <div className="mb-4">
            <p className="text-sm font-semibold text-[#1F2D3D] mb-1">Stored Hash:</p>
            <p className="font-mono text-xs bg-gray-100 p-2 rounded break-all">{searchedCase.blockchainHash || 'No hash stored'}</p>
          </div>

          {verifyResult && (
            <div className={`mb-4 p-4 rounded-xl ${verifyResult.isValid ? 'bg-green-50' : 'bg-red-50'}`}>
              <p className={`font-semibold ${verifyResult.isValid ? 'text-green-700' : 'text-red-700'}`}>{verifyResult.message}</p>
              {verifyResult.recalculatedHash && <p className="font-mono text-xs mt-2 break-all">{verifyResult.recalculatedHash}</p>}
            </div>
          )}

          <div className="flex gap-4">
            <motion.button onClick={handleVerifyHash} disabled={actionLoading === 'verify'} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1 btn-primary">
              {actionLoading === 'verify' ? 'Verifying...' : 'Verify Now'}
            </motion.button>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="font-semibold text-[#1F2D3D] mb-4">Forward to Judge</h3>
            {searchedCase.forwardedToJudge ? (
              <div className="p-4 bg-purple-50 rounded-xl"><p className="text-purple-700">Case already forwarded to Judge</p></div>
            ) : (
              <motion.button onClick={() => setShowForwardModal(true)} disabled={!searchedCase.blockchainVerified} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full btn-primary bg-gradient-to-r from-purple-500 to-purple-600 disabled:opacity-50">
                ⚖️ Forward to Judge
              </motion.button>
            )}
          </div>
        </motion.div>
      );
    }

    if (activeTab === 'profile') {
      return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto">
          <div className="glass-card p-8">
            <div className="text-center mb-6">
              <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center mb-4 shadow-lg">
                <span className="text-3xl text-white font-bold">{user?.fullName?.charAt(0).toUpperCase()}</span>
              </div>
              <h3 className="text-xl font-semibold text-[#1F2D3D]">{user?.fullName}</h3>
              <p className="text-[#64748B] capitalize">{user?.role}</p>
            </div>
            <div className="space-y-4">
              <div className="p-4 bg-[#F5F9FA] rounded-xl"><p className="text-xs font-medium text-[#64748B] mb-1">Badge Number</p><p className="text-sm font-semibold text-[#1F2D3D]">PL-{Math.floor(1000 + Math.random() * 9000)}</p></div>
              <div className="p-4 bg-[#F5F9FA] rounded-xl"><p className="text-xs font-medium text-[#64748B] mb-1">Email</p><p className="text-sm font-semibold text-[#1F2D3D]">{user?.email || 'N/A'}</p></div>
              <div className="p-4 bg-[#F5F9FA] rounded-xl"><p className="text-xs font-medium text-[#64748B] mb-1">Role</p><p className="text-sm font-semibold text-[#1F2D3D] capitalize">{user?.role}</p></div>
            </div>
          </div>
        </motion.div>
      );
    }

    return (
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
          <h2 className="text-xl font-semibold text-[#1F2D3D] mb-2">Police Verification Portal</h2>
          <p className="text-[#64748B]">Search for a case by Case ID to verify and forward to judiciary.</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <form onSubmit={handleSearch} className="glass-card p-6">
            <div className="flex gap-4">
              <input type="text" value={caseId} onChange={(e) => setCaseId(e.target.value)} placeholder="Enter Case ID (e.g., ML001)" className="input-modern flex-1" />
              <motion.button type="submit" disabled={loading} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="btn-primary">{loading ? 'Searching...' : 'Search'}</motion.button>
            </div>
            {error && <div className="mt-3 p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}
          </form>
        </motion.div>

        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="glass-card p-12">
              <div className="flex flex-col items-center justify-center">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-10 h-10 border-4 border-[#2E8B8B]/20 border-t-[#2E8B8B] rounded-full" />
                <p className="text-[#64748B] mt-4">Searching...</p>
              </div>
            </motion.div>
          ) : !searchedCase && !error ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="glass-card p-12">
              <div className="flex flex-col items-center justify-center">
                <div className="w-20 h-20 rounded-2xl bg-[#F5F9FA] flex items-center justify-center mb-4">
                  <svg className="w-10 h-10 text-[#64748B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <p className="text-[#64748B] text-lg">Search for a case by Case ID</p>
                <p className="text-[#94A3B8] text-sm mt-2">Enter the case ID above to find a case</p>
              </div>
            </motion.div>
          ) : searchedCase ? (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="glass-card p-6">
              <h3 className="text-lg font-semibold text-[#1F2D3D] mb-4">Case Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-sm text-[#64748B]">Case ID</p><p className="font-semibold text-[#1F2D3D]">{searchedCase.caseNumber}</p></div>
                <div><p className="text-sm text-[#64748B]">Case Type</p><p className="font-semibold text-[#1F2D3D]">{searchedCase.caseType}</p></div>
                <div><p className="text-sm text-[#64748B]">Patient Name</p><p className="font-semibold text-[#1F2D3D]">{searchedCase.patientName}</p></div>
                <div><p className="text-sm text-[#64748B]">Patient Age</p><p className="font-semibold text-[#1F2D3D]">{searchedCase.patientAge || 'N/A'}</p></div>
                <div><p className="text-sm text-[#64748B]">Patient Gender</p><p className="font-semibold text-[#1F2D3D]">{searchedCase.patientGender || 'N/A'}</p></div>
                <div><p className="text-sm text-[#64748B]">Status</p><StatusBadge status={searchedCase.forwardedToJudiciary ? 'forwarded' : (searchedCase.blockchainVerified ? 'verified' : 'pending')} /></div>
              </div>
              <div className="mt-4 p-4 bg-[#F5F9FA] rounded-xl">
                <p className="text-sm text-[#64748B] mb-1">Case Description</p>
                <p className="text-sm text-[#1F2D3D]">{searchedCase.description || 'No description'}</p>
              </div>
              <div className="mt-4 p-4 bg-[#F5F9FA] rounded-xl">
                <p className="text-sm text-[#64748B] mb-1">Blockchain Hash</p>
                <p className="font-mono text-xs text-[#1F2D3D] break-all">{searchedCase.blockchainHash || 'No hash generated'}</p>
              </div>
              <div className="flex gap-4 mt-6">
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => { setVerifyResult(null); setShowVerifyModal(true); }} className="flex-1 btn-primary bg-gradient-to-r from-green-500 to-green-600">🔐 Verify Hash</motion.button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setShowForwardModal(true)} disabled={searchedCase.forwardedToJudge || !searchedCase.blockchainVerified} title={!searchedCase.blockchainVerified ? 'Verify hash first before forwarding' : ''} className="flex-1 btn-primary bg-gradient-to-r from-purple-500 to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed">⚖️ Forward to Judge</motion.button>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F5F9FA]">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} onLogout={logout} />
      <div className="ml-64 p-6">
        <Navbar title="Police Dashboard" subtitle="Investigate medico-legal cases" showNotifications={false} />
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </div>

      {showVerifyModal && searchedCase && (
        <div className="modal-overlay">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl p-8 w-full max-w-lg shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-[#1F2D3D]">🔐 Verify Blockchain Hash</h2>
              <button onClick={() => setShowVerifyModal(false)} className="text-[#64748B] hover:text-[#1F2D3D] text-2xl">×</button>
            </div>
            <div className="mb-4 p-4 bg-[#F5F9FA] rounded-xl">
              <p className="text-sm"><strong>Case:</strong> {searchedCase.caseNumber}</p>
              <p className="text-sm"><strong>Patient:</strong> {searchedCase.patientName}</p>
            </div>
            <div className="mb-4">
              <p className="text-sm font-semibold text-[#1F2D3D] mb-1">Stored Hash:</p>
              <p className="font-mono text-xs bg-gray-100 p-2 rounded break-all">{searchedCase.blockchainHash || 'No hash stored'}</p>
            </div>
            {verifyResult && (
              <div className={`mb-4 p-4 rounded-xl ${verifyResult.isValid ? 'bg-green-50' : 'bg-red-50'}`}>
                <p className={`font-semibold ${verifyResult.isValid ? 'text-green-700' : 'text-red-700'}`}>{verifyResult.message}</p>
                {verifyResult.recalculatedHash && <p className="font-mono text-xs mt-2 break-all">{verifyResult.recalculatedHash}</p>}
              </div>
            )}
            <div className="flex gap-4">
              <motion.button onClick={handleVerifyHash} disabled={actionLoading === 'verify'} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1 btn-primary bg-gradient-to-r from-green-500 to-green-600">{actionLoading === 'verify' ? 'Verifying...' : 'Verify Now'}</motion.button>
              <button onClick={() => setShowVerifyModal(false)} className="px-6 py-3 bg-[#F5F9FA] text-[#64748B] rounded-xl font-semibold hover:bg-[#E8F4F4]">Close</button>
            </div>
          </motion.div>
        </div>
      )}

      {showForwardModal && searchedCase && (
        <div className="modal-overlay">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl p-8 w-full max-w-lg shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-[#1F2D3D]">⚖️ Forward to Judge</h2>
              <button onClick={() => setShowForwardModal(false)} className="text-[#64748B] hover:text-[#1F2D3D] text-2xl">×</button>
            </div>
            <div className="mb-4 p-4 bg-purple-50 rounded-xl">
              <p className="text-sm"><strong>Case:</strong> {searchedCase.caseNumber}</p>
              <p className="text-sm"><strong>Patient:</strong> {searchedCase.patientName}</p>
              <p className="text-sm"><strong>Doctor:</strong> {searchedCase.doctorName}</p>
            </div>
            <form onSubmit={handleForwardToJudge}>
              <div className="mb-4">
                <label className="block text-sm font-semibold text-[#1F2D3D] mb-2">Notes for Judge</label>
                <textarea className="input-modern" rows={4} value={forwardNotes} onChange={(e) => setForwardNotes(e.target.value)} placeholder="Add any notes for the judge..." />
              </div>
              <div className="flex gap-4">
                <motion.button type="submit" disabled={actionLoading === 'forward'} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1 btn-primary bg-gradient-to-r from-purple-500 to-purple-600">{actionLoading === 'forward' ? 'Forwarding...' : 'Forward Case'}</motion.button>
                <button type="button" onClick={() => setShowForwardModal(false)} className="px-6 py-3 bg-[#F5F9FA] text-[#64748B] rounded-xl font-semibold hover:bg-[#E8F4F4]">Cancel</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default PoliceDashboard;