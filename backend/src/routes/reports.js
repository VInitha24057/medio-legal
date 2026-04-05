const express = require('express');
const router = express.Router();
const { 
  createReport, 
  getReports, 
  getReport, 
  uploadReportDocument,
  aiAnalyzeReport,
  generateReportHash,
  verifyReportHash
} = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../config/multer');

// Get all reports
router.get('/', protect, getReports);

// Get single report
router.get('/:id', protect, getReport);

// Doctor-only routes
router.post('/', protect, authorize('doctor'), createReport);

// Document upload
router.post('/:id/upload', protect, authorize('doctor'), upload.single('file'), uploadReportDocument);

// AI Analysis
router.post('/:id/ai-analyze', protect, authorize('doctor'), aiAnalyzeReport);

// Blockchain operations
router.post('/:id/generate-hash', protect, authorize('doctor'), generateReportHash);
router.get('/:id/verify-hash', protect, verifyReportHash);

module.exports = router;
