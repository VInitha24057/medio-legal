import axios, { AxiosInstance, AxiosError } from 'axios';

// Get API URL from environment or use relative path
const API_URL = import.meta.env.VITE_API_URL || '/api';

const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 30000
});

// Request interceptor - add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      const isLoginPage = window.location.pathname === '/login';
      if (!isLoginPage) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Helper function to handle API errors
const handleApiError = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || error.message || 'An error occurred';
  }
  return 'An unexpected error occurred';
};

// Auth API
export const authAPI = {
  register: (data: {
    username: string;
    email: string;
    password: string;
    role?: string;
    fullName: string;
    phone?: string;
    department?: string;
    hospital?: string;
    badgeNumber?: string;
    courtName?: string;
  }) => api.post('/auth/register', data),
  
  login: (data: { email: string; password: string }) => 
    api.post('/auth/login', data),
  
  getProfile: () => api.get('/auth/profile'),
  
  updateProfile: (data: {
    fullName?: string;
    phone?: string;
    department?: string;
    hospital?: string;
    badgeNumber?: string;
    courtName?: string;
  }) => api.put('/auth/profile', data),
  
  getAllUsers: () => api.get('/auth/users'),
  getDoctors: () => api.get('/auth/doctors'),
  
  deleteUser: (id: string) => api.delete(`/auth/users/${id}`)
};

// Records API (new unified endpoints)
export const recordsAPI = {
  getAll: (params?: { type?: string; status?: string; page?: number; limit?: number }) => 
    api.get('/records', { params }),
  
  getById: (id: string) => api.get(`/records/${id}`),
  
  uploadRecord: (formData: FormData) => 
    api.post('/upload-record', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
};

// Cases API
export const casesAPI = {
  getAll: (params?: any) => api.get('/cases', { params }),
  getById: (id: string) => api.get(`/cases/${id}`),
  getPatientCases: (patientId: string) => api.get(`/cases/patient/${patientId}`),
  getJudgeCases: () => api.get('/cases/judge-cases'),
  downloadCase: (caseId: string) => api.get(`/cases/download/${caseId}`, {
    responseType: 'blob'
  }),
  searchByCaseId: (caseId: string) => api.get(`/cases/search/${caseId}`),
  getByCaseId: (caseId: string) => api.get(`/cases/search/${caseId}`),
  aiSearch: (query: string) => api.get(`/cases/ai-search?query=${encodeURIComponent(query)}`),
  create: (data: any) => api.post('/cases', data),
  update: (id: string, data: any) => api.put(`/cases/${id}`, data),
  uploadDocument: (id: string, formData: any) => 
    api.post(`/cases/${id}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  aiIndex: (id: string) => api.post(`/cases/${id}/ai-index`),
  generateHash: (id: string) => api.post(`/cases/${id}/generate-hash`),
  verifyHash: (id: string) => api.get(`/cases/${id}/verify-hash`),
  submitCase: (id: string) => api.post(`/cases/${id}/submit`),
  updateMedicalDetails: (id: string, data: any) => api.put(`/cases/${id}/medical-details`, data),
  addInvestigationNote: (id: string, note: string) => 
    api.post(`/cases/${id}/investigation-note`, { note }),
  forwardToJudiciary: (id: string, notes?: string) => 
    api.post(`/cases/${id}/forward-judiciary`, { notes }),
  approveCase: (id: string, remarks?: string) => 
    api.post(`/cases/${id}/approve`, { remarks }),
  rejectCase: (id: string, remarks: string) => 
    api.post(`/cases/${id}/reject`, { remarks }),
  // Police verification and forward
  verifyCase: (caseId: string) => api.post(`/cases/verify/${caseId}`),
  forwardToJudge: (caseId: string, notes?: string) => api.post(`/cases/forward/${caseId}`, { notes })
};

// Reports API
export const reportsAPI = {
  getAll: (params?: any) => api.get('/reports', { params }),
  getById: (id: string) => api.get(`/reports/${id}`),
  create: (data: any) => api.post('/reports', data),
  uploadDocument: (id: string, formData: any) =>
    api.post(`/reports/${id}/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  aiAnalyze: (id: string) => api.post(`/reports/${id}/ai-analyze`),
  generateHash: (id: string) => api.post(`/reports/${id}/generate-hash`),
  verifyHash: (id: string) => api.get(`/reports/${id}/verify-hash`)
};

// Blockchain API
export const blockchainAPI = {
  getStats: () => api.get('/blockchain/stats'),
  getBlocks: (params?: any) => api.get('/blockchain/blocks', { params }),
  getBlock: (id: string) => api.get(`/blockchain/blocks/${id}`),
  verify: (data: any) => api.post('/blockchain/verify', data),
  getHistory: (documentId: string) => api.get(`/blockchain/history/${documentId}`)
};

// Dashboard API
export const dashboardAPI = {
  getData: () => api.get('/dashboard'),
  getActivity: (params?: any) => api.get('/dashboard/activity', { params }),
  getHealth: () => api.get('/dashboard/health')
};

// Patient Records API
export const patientRecordsAPI = {
  getRecords: (params?: any) => api.get('/patient-records', { params }),
  getMyCases: (params?: any) => api.get('/patient/mycases', { params }),
  getNotifications: (params?: any) => api.get('/patient/notifications', { params }),
  updateProfile: (data: any) => api.put('/patient/updateProfile', data),
  getRecordById: (id: string) => api.get(`/patient-records/${id}`),
  downloadReport: (id: string) => api.get(`/patient-records/${id}/download`, {
    responseType: 'blob'
  })
};

// Hash/Verification API
export const hashAPI = {
  generateHash: (documentType: string, documentId: string) => 
    api.post('/generate-hash', { documentType, documentId }),
  verifyRecord: (documentType: string, documentId: string) => 
    api.get('/verify-record', { params: { documentType, documentId } })
};

export { handleApiError };
export default api;

// Unified API Endpoints as per requirements
export const unifiedAPI = {
  uploadCase: (data: any) => api.post('/upload-case', data),
  searchCase: (caseId: string) => api.get(`/search-case?caseId=${encodeURIComponent(caseId)}`),
  verifyHash: (caseId: string) => api.post('/verify-hash', { caseId }),
  forwardCase: (caseId: string, notes?: string) => api.post('/forward-case', { caseId, notes }),
  getPatientRecords: () => api.get('/patient-records'),
  downloadReport: (caseId: string) => api.get(`/download-report?caseId=${caseId}`, {
    responseType: 'blob'
  })
};
