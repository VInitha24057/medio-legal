import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../App';
import { casesAPI } from '../lib/api';
import { Sidebar, Navbar, DashboardCard, StatusBadge, FileUpload, SearchBar } from '../components';

interface Case {
  _id: string;
  caseNumber: string;
  title: string;
  caseType: string;
  patientName: string;
  status: string;
  createdAt: string;
  blockchainVerified: boolean;
  blockchainHash?: string;
  blockTimestamp?: string;
  verificationStatus?: string;
  aiKeywords?: string[];
  aiIndexing?: {
    keywords?: string[];
    indexedAt?: string;
    caseType?: string;
    injury?: string;
  };
}

const DoctorDashboard = () => {
  const { user, logout } = useAuth();
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  useEffect(() => {
    if (activeTab === 'create-case') {
      setShowCreateModal(true);
      setActiveTab('dashboard');
    }
  }, [activeTab]);
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [uploading, setUploading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [newCase, setNewCase] = useState({
    caseType: 'Road Accident',
    customCaseType: '',
    title: '',
    description: '',
    patientName: '',
    patientAge: '',
    patientGender: 'Male',
    patientPhone: '',
    injuryDescription: '',
    incidentDate: ''
  });

  const caseTypes = [
    'Road Accident', 'Physical Assault', 'Burn Injury', 'Fall Injury',
    'Poisoning', 'Domestic Violence', 'Workplace Injury', 'Sexual Assault',
    'Child Abuse', 'Medical Malpractice', 'Suicide Attempt', 'Unknown', 'Other (Type Manually)'
  ];

  const [uploadFile, setUploadFile] = useState<File | null>(null);

  useEffect(() => {
    fetchCases();
  }, []);

  const fetchCases = useCallback(async () => {
    try {
      const response = await casesAPI.getAll();
      setCases(response.data.data || []);
    } catch (error) {
      console.error('Error fetching cases:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query);
    setLoading(true);
    try {
      const response = await casesAPI.getAll({ search: query });
      setCases(response.data.data || []);
    } catch (error) {
      console.error('Error searching cases:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleCreateCase = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const caseData: any = { ...newCase };
      if (newCase.caseType === 'Other (Type Manually)' && newCase.customCaseType) {
        caseData.caseType = newCase.customCaseType;
      }
      caseData.customCaseType = undefined;
      
      await casesAPI.create(caseData);
      setShowCreateModal(false);
      fetchCases();
      setNewCase({
        caseType: 'Road Accident', customCaseType: '', title: '', description: '',
        patientName: '', patientAge: '', patientGender: 'Male', patientPhone: '',
        injuryDescription: '', incidentDate: ''
      });
      alert('Case created successfully!');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error creating case');
    }
  }, [newCase, fetchCases]);

  const handleFileUpload = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile || !selectedCase) {
      alert('Please select a file to upload');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('document', uploadFile);
      await casesAPI.uploadDocument(selectedCase._id, formData);
      alert('File uploaded successfully!');
      setShowUploadModal(false);
      setUploadFile(null);
      fetchCases();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error uploading file');
    } finally {
      setUploading(false);
    }
  }, [uploadFile, selectedCase, fetchCases]);

  const handleAIIndex = useCallback(async (caseId: string) => {
    setActionLoading(caseId + '-ai');
    try {
      await casesAPI.aiIndex(caseId);
      alert('AI Indexing completed successfully!');
      fetchCases();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error during AI indexing');
    } finally {
      setActionLoading(null);
    }
  }, [fetchCases]);

  const handleGenerateHash = useCallback(async (caseId: string) => {
    setActionLoading(caseId + '-hash');
    try {
      const response = await casesAPI.generateHash(caseId);
      alert(`Blockchain hash generated!\n\nHash: ${response.data.data.hash.substring(0, 20)}...\nBlock: ${response.data.data.blockNumber}`);
      fetchCases();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error generating hash');
    } finally {
      setActionLoading(null);
    }
  }, [fetchCases]);

  const handleVerifyHash = useCallback(async (caseId: string) => {
    setActionLoading(caseId + '-verify');
    try {
      const response = await casesAPI.verifyHash(caseId);
      const data = response.data.data;
      if (data.verified) {
        alert(`✅ Document is Authentic!\n\nStored Hash: ${data.storedHash?.substring(0, 20)}...\nCurrent Hash: ${data.currentHash?.substring(0, 20)}...\nBlock: ${data.blockNumber}`);
      } else {
        alert(`⚠️ Document Has Been Tampered!\n\nStored Hash: ${data.storedHash?.substring(0, 20)}...\nCurrent Hash: ${data.currentHash?.substring(0, 20)}...`);
      }
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error verifying hash');
    } finally {
      setActionLoading(null);
    }
  }, []);

  const openUploadModal = useCallback((caseItem: Case) => {
    setSelectedCase(caseItem);
    setShowUploadModal(true);
  }, []);

  const verifiedCount = useMemo(() => cases.filter(c => c.blockchainVerified).length, [cases]);
  const pendingCount = useMemo(() => cases.filter(c => !c.blockchainVerified).length, [cases]);
  const aiIndexedCount = useMemo(() => cases.filter(c => (c.aiKeywords && c.aiKeywords.length > 0) || (c.aiIndexing && c.aiIndexing.keywords && c.aiIndexing.keywords.length > 0)).length, [cases]);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
      case 'create-case':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <DashboardCard title="Total Cases" value={cases.length} icon="📋" color="primary" description="All medico-legal cases" delay={0} />
              <DashboardCard title="Verified Records" value={verifiedCount} icon="✓" color="teal" description="Blockchain verified" delay={1} />
              <DashboardCard title="Pending Verification" value={pendingCount} icon="⏳" color="accent" description="Awaiting blockchain" delay={2} />
              <DashboardCard title="AI Indexed" value={aiIndexedCount} icon="🤖" color="purple" description="AI processed" delay={3} />
            </div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-[#1F2D3D]">Recent Medico-Legal Records</h3>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setShowCreateModal(true)} className="btn-primary text-sm py-2.5 px-4">
                    + New Case
                  </motion.button>
                </div>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-10 h-10 border-4 border-[#2E8B8B]/20 border-t-[#2E8B8B] rounded-full" />
                </div>
              ) : cases.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-[#F5F9FA] flex items-center justify-center">
                    <svg className="w-10 h-10 text-[#64748B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-[#64748B] text-lg">No records found</p>
                  <p className="text-[#94A3B8] text-sm">Create your first case to get started!</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-[#2E8B8B]/5 to-[#4F9DA6]/5">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-[#64748B] uppercase tracking-wider">Patient</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-[#64748B] uppercase tracking-wider">Type</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-[#64748B] uppercase tracking-wider">Case No.</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-[#64748B] uppercase tracking-wider">Date</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-[#64748B] uppercase tracking-wider">Status</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-[#64748B] uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {cases.slice(0, 10).map((c, index) => (
                        <motion.tr key={c._id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }} className="hover:bg-[#F5F9FA]/50">
                          <td className="px-6 py-4">
                            <div className="font-semibold text-[#1F2D3D]">{c.patientName}</div>
                            <div className="text-sm text-[#64748B]">{c.title}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-3 py-1.5 bg-[#2E8B8B]/10 text-[#2E8B8B] text-xs font-semibold rounded-full">
                              {c.caseType}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-[#64748B] font-medium">{c.caseNumber}</td>
                          <td className="px-6 py-4 text-sm text-[#64748B]">{new Date(c.createdAt).toLocaleDateString()}</td>
                          <td className="px-6 py-4"><StatusBadge status={c.blockchainVerified ? 'verified' : 'pending'} size="sm" /></td>
                          <td className="px-6 py-4">
                            <div className="flex gap-2">
                              <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => openUploadModal(c)} className="p-2 bg-[#F5F9FA] rounded-xl hover:bg-[#E8F4F4]" title="Upload">
                                <svg className="w-4 h-4 text-[#64748B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                </svg>
                              </motion.button>
                              <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => handleAIIndex(c._id)} disabled={actionLoading === c._id + '-ai'} className="p-2 bg-purple-100 rounded-xl hover:bg-purple-200 disabled:opacity-50" title="AI Index">
                                <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636a.5.5 0 01.364.636v2.027a.5.5 0 01-.364.636m0 0a.5.5 0 01-.364-.636v-2.027a.5.5 0 01.364-.636M5.727 5.727a.5.5 0 01.637-.051A7.5 7.5 0 0119 12c0 4.167-3.392 7.5-7.727 7.5a.5.5 0 01-.364-.636" />
                                </svg>
                              </motion.button>
                              <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => handleGenerateHash(c._id)} disabled={actionLoading === c._id + '-hash'} className="p-2 bg-[#2E8B8B]/10 rounded-xl hover:bg-[#2E8B8B]/20 disabled:opacity-50" title="Generate Hash">
                                <svg className="w-4 h-4 text-[#2E8B8B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                </svg>
                              </motion.button>
                              <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => handleVerifyHash(c._id)} disabled={actionLoading === c._id + '-verify'} className="p-2 bg-green-100 rounded-xl hover:bg-green-200 disabled:opacity-50" title="Verify">
                                <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                              </motion.button>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>
          </div>
        );

      case 'upload-reports':
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto">
            <div className="glass-card p-8">
              <h3 className="text-xl font-semibold text-[#1F2D3D] mb-6">Upload Medical Report</h3>
              <FileUpload onFileSelect={(file) => setUploadFile(file)} acceptedTypes={['.pdf', '.jpg', '.jpeg', '.png']} maxSize={10} />
            </div>
          </motion.div>
        );

      case 'medical-records':
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="glass-card overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-[#1F2D3D]">Medical Records</h3>
              </div>
              {cases.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-[#F5F9FA] flex items-center justify-center">
                    <svg className="w-10 h-10 text-[#64748B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-[#64748B]">No medical records found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-[#2E8B8B]/5 to-[#4F9DA6]/5">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-[#64748B] uppercase">Case ID</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-[#64748B] uppercase">Patient Name</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-[#64748B] uppercase">Case Type</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-[#64748B] uppercase">Upload Date</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-[#64748B] uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {cases.map((c) => (
                        <tr key={c._id} className="hover:bg-[#F5F9FA]/50">
                          <td className="px-6 py-4 text-sm text-[#64748B] font-medium">{c.caseNumber}</td>
                          <td className="px-6 py-4 font-semibold text-[#1F2D3D]">{c.patientName}</td>
                          <td className="px-6 py-4">
                            <span className="px-3 py-1.5 bg-[#2E8B8B]/10 text-[#2E8B8B] text-xs font-semibold rounded-full">{c.caseType}</span>
                          </td>
                          <td className="px-6 py-4 text-sm text-[#64748B]">{new Date(c.createdAt).toLocaleDateString()}</td>
                          <td className="px-6 py-4"><StatusBadge status={c.blockchainVerified ? 'verified' : 'pending'} size="sm" /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </motion.div>
        );

      case 'ai-analysis':
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="glass-card overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-[#1F2D3D]">AI Analysis</h3>
              </div>
              {cases.filter(c => (c.aiKeywords && c.aiKeywords.length > 0) || (c.aiIndexing && c.aiIndexing.keywords && c.aiIndexing.keywords.length > 0)).length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-purple-50 flex items-center justify-center">
                    <svg className="w-10 h-10 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636a.5.5 0 01.364.636v2.027a.5.5 0 01-.364.636m0 0a.5.5 0 01-.364-.636v-2.027a.5.5 0 01.364-.636M5.727 5.727a.5.5 0 01.637-.051A7.5 7.5 0 0119 12c0 4.167-3.392 7.5-7.727 7.5a.5.5 0 01-.364-.636" />
                    </svg>
                  </div>
                  <p className="text-[#64748B]">No AI analysis available</p>
                  <p className="text-[#94A3B8] text-sm">Run AI indexing on cases to see analysis</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {cases.filter(c => (c.aiKeywords && c.aiKeywords.length > 0) || (c.aiIndexing && c.aiIndexing.keywords && c.aiIndexing.keywords.length > 0)).map((c) => (
                    <div key={c._id} className="p-6 hover:bg-[#F5F9FA]/50">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h4 className="font-semibold text-[#1F2D3D]">{c.caseNumber}</h4>
                          <p className="text-sm text-[#64748B]">{c.patientName} - {c.caseType}</p>
                        </div>
                        <span className="px-3 py-1.5 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full">AI Analyzed</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 bg-[#2E8B8B]/5 rounded-xl">
                          <p className="text-xs font-medium text-[#64748B] mb-2">Extracted Keywords</p>
                          <div className="flex flex-wrap gap-2">
                            {c.aiIndexing?.keywords?.map((kw, i) => (
                              <span key={i} className="px-2 py-1 bg-white text-[#2E8B8B] text-xs rounded-lg border border-[#2E8B8B]/20">{kw}</span>
                            ))}
                          </div>
                        </div>
                        <div className="p-4 bg-[#4F9DA6]/5 rounded-xl">
                          <p className="text-xs font-medium text-[#64748B] mb-2">Case Type Prediction</p>
                          <p className="text-sm font-semibold text-[#1F2D3D]">{c.aiIndexing?.caseType || c.caseType}</p>
                        </div>
                        <div className="p-4 bg-purple-50 rounded-xl">
                          <p className="text-xs font-medium text-[#64748B] mb-2">AI Confidence</p>
                          <p className="text-sm font-semibold text-[#1F2D3D]">High (95%)</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        );

      case 'blockchain':
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="glass-card overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-[#1F2D3D]">Blockchain Verification</h3>
              </div>
              {cases.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-[#2E8B8B]/5 flex items-center justify-center">
                    <svg className="w-10 h-10 text-[#2E8B8B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                  </div>
                  <p className="text-[#64748B]">No cases for verification</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {cases.map((c) => (
                    <div key={c._id} className="p-6 hover:bg-[#F5F9FA]/50">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-[#1F2D3D]">{c.caseNumber}</h4>
                          <p className="text-sm text-[#64748B]">{c.patientName}</p>
                        </div>
                        <div className="text-right">
                          {c.blockchainHash ? (
                            <>
                              <p className="text-xs text-[#64748B] mb-1">Document Hash</p>
                              <p className="text-xs font-mono text-[#1F2D3D] bg-gray-100 px-2 py-1 rounded-lg">{c.blockchainHash.substring(0, 20)}...</p>
                              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-700 text-xs font-semibold rounded-full mt-2">
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                Verified
                              </span>
                            </>
                          ) : (
                            <span className="px-3 py-1.5 bg-orange-100 text-orange-700 text-xs font-semibold rounded-full">Not Verified</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        );

      case 'profile':
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto">
            <div className="glass-card p-8">
              <div className="text-center mb-6">
                <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-[#2E8B8B] to-[#4F9DA6] flex items-center justify-center mb-4 shadow-lg">
                  <span className="text-3xl text-white font-bold">{user?.fullName?.charAt(0).toUpperCase()}</span>
                </div>
                <h3 className="text-xl font-semibold text-[#1F2D3D]">{user?.fullName}</h3>
                <p className="text-[#64748B] capitalize">{user?.role}</p>
              </div>
              <div className="space-y-4">
                <div className="p-4 bg-[#F5F9FA] rounded-xl">
                  <p className="text-xs font-medium text-[#64748B] mb-1">Doctor Name</p>
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
                <div className="p-4 bg-[#F5F9FA] rounded-xl">
                  <p className="text-xs font-medium text-[#64748B] mb-1">Department</p>
                  <p className="text-sm font-semibold text-[#1F2D3D]">Medical</p>
                </div>
              </div>
            </div>
          </motion.div>
        );

      default:
        return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-[#F5F9FA] flex items-center justify-center">
              <svg className="w-10 h-10 text-[#64748B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <p className="text-[#64748B]">Coming Soon</p>
          </motion.div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F9FA]">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} onLogout={logout} />
      <div className="ml-64 p-6">
        <Navbar title="Doctor Dashboard" subtitle="Manage medico-legal records with AI & Blockchain" />
        <div className="mb-6">
          <SearchBar placeholder="Search by case number, patient name, or AI keywords (fracture, burn, assault...)" onSearch={handleSearch} />
        </div>
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </div>

      {showCreateModal && (
        <div className="modal-overlay">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-[#1F2D3D]">Create New Case</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-[#64748B] hover:text-[#1F2D3D] text-2xl">×</button>
            </div>
            <form onSubmit={handleCreateCase} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[#1F2D3D] mb-2">Case Type</label>
                  <select className="input-modern" value={newCase.caseType} onChange={(e) => setNewCase({ ...newCase, caseType: e.target.value })}>
                    {caseTypes.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#1F2D3D] mb-2">Incident Date</label>
                  <input type="date" className="input-modern" value={newCase.incidentDate} onChange={(e) => setNewCase({ ...newCase, incidentDate: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#1F2D3D] mb-2">Case Title</label>
                <input type="text" required className="input-modern" value={newCase.title} onChange={(e) => setNewCase({ ...newCase, title: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#1F2D3D] mb-2">Description</label>
                <textarea required className="input-modern" rows={3} value={newCase.description} onChange={(e) => setNewCase({ ...newCase, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[#1F2D3D] mb-2">Patient Name</label>
                  <input type="text" required className="input-modern" value={newCase.patientName} onChange={(e) => setNewCase({ ...newCase, patientName: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#1F2D3D] mb-2">Patient Age</label>
                  <input type="number" className="input-modern" value={newCase.patientAge} onChange={(e) => setNewCase({ ...newCase, patientAge: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[#1F2D3D] mb-2">Gender</label>
                  <select className="input-modern" value={newCase.patientGender} onChange={(e) => setNewCase({ ...newCase, patientGender: e.target.value })}>
                    <option>Male</option>
                    <option>Female</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#1F2D3D] mb-2">Phone</label>
                  <input type="text" className="input-modern" value={newCase.patientPhone} onChange={(e) => setNewCase({ ...newCase, patientPhone: e.target.value })} />
                </div>
              </div>
              {newCase.caseType === 'Other (Type Manually)' && (
                <div>
                  <label className="block text-sm font-semibold text-[#1F2D3D] mb-2">Enter Case Type</label>
                  <input type="text" required placeholder="Type custom case type" className="input-modern" value={newCase.customCaseType} onChange={(e) => setNewCase({ ...newCase, customCaseType: e.target.value })} />
                </div>
              )}
              <div className="flex gap-4 pt-4">
                <button type="submit" className="flex-1 btn-primary">Create Case</button>
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-6 py-3 bg-[#F5F9FA] text-[#64748B] rounded-xl font-semibold hover:bg-[#E8F4F4]">Cancel</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {showUploadModal && selectedCase && (
        <div className="modal-overlay">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl p-8 w-full max-w-lg shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-[#1F2D3D]">Upload Evidence</h2>
              <button onClick={() => setShowUploadModal(false)} className="text-[#64748B] hover:text-[#1F2D3D] text-2xl">×</button>
            </div>
            <div className="mb-6 p-4 bg-[#F5F9FA] rounded-xl">
              <p className="text-sm"><strong>Case:</strong> {selectedCase.caseNumber}</p>
              <p className="text-sm"><strong>Patient:</strong> {selectedCase.patientName}</p>
            </div>
            <form onSubmit={handleFileUpload} className="space-y-4">
              <FileUpload onFileSelect={(file) => setUploadFile(file)} acceptedTypes={['.pdf', '.jpg', '.jpeg', '.png']} maxSize={10} />
              <div className="flex gap-4">
                <button type="submit" disabled={uploading || !uploadFile} className="flex-1 btn-primary disabled:opacity-50">{uploading ? 'Uploading...' : 'Upload'}</button>
                <button type="button" onClick={() => setShowUploadModal(false)} className="px-6 py-3 bg-[#F5F9FA] text-[#64748B] rounded-xl font-semibold hover:bg-[#E8F4F4]">Cancel</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default DoctorDashboard;