const express = require('express');
const router = express.Router();
const Case = require('../models/Case');
const fs = require('fs');
const path = require('path');
const { 
  createCase, 
  getCases, 
  getCase, 
  updateCase, 
  uploadDocument,
  aiIndexCase,
  generateHash,
  verifyHash,
  addInvestigationNote,
  forwardToJudiciary,
  approveCase,
  rejectCase,
  downloadReport
} = require('../controllers/caseController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../config/multer');

// Public health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Cases API is running' });
});

// Case CRUD operations
router.get('/', protect, getCases);

// Download report route - MUST be before /:id to avoid being caught by catch-all
router.get('/download-report/:caseId', protect, downloadReport);

// Judge Cases - get only forwarded cases (must be before /:id route)
router.get('/judge-cases', protect, async (req, res) => {
  try {
    if (req.user.role !== 'judiciary' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Judge role required.'
      });
    }
    
    const cases = await Case.find({ 
      $or: [
        { forwardedToJudge: true },
        { forwardedToJudiciary: true },
        { status: 'Forwarded to Judge' }
      ]
    }).sort({ forwardedToJudgeAt: -1, forwardedToJudiciaryAt: -1 });
    
    res.json({
      success: true,
      count: cases.length,
      data: cases
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Patient-specific cases
router.get('/patient/:patientId', protect, async (req, res) => {
  try {
    const { patientId } = req.params;
    
    if (req.user.role !== 'patient' || req.user._id.toString() !== patientId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view your own records.'
      });
    }
    
    const cases = await Case.find({ patientId: patientId })
      .sort({ createdAt: -1 })
      .select('caseId caseNumber caseType patientName doctorName hospitalName status reportStatus blockchainVerified blockchainHash createdAt documents medicalDetails');
    
    res.json({
      success: true,
      count: cases.length,
      data: cases
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Download case document
router.get('/download/:caseId', protect, async (req, res) => {
  try {
    const { caseId } = req.params;
    
    const medicoCase = await Case.findById(caseId);
    
    if (!medicoCase) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }
    
    const isPatient = req.user.role === 'patient' && (
      (medicoCase.patientId && medicoCase.patientId.toString() === req.user._id.toString()) ||
      (medicoCase.patientName === req.user.fullName)
    );
    const isDoctor = req.user.role === 'doctor' && medicoCase.doctorId && medicoCase.doctorId.toString() === req.user._id.toString();
    const isAuthorized = req.user.role === 'police' || req.user.role === 'judiciary' || req.user.role === 'admin' || isPatient || isDoctor;
    
    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    if (!medicoCase.documents || medicoCase.documents.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No document available for download'
      });
    }
    
    const doc = medicoCase.documents[0];
    const uploadsDir = path.join(__dirname, '../../uploads');
    const filePath = path.join(uploadsDir, 'cases', doc.fileName);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'File not found on server'
      });
    }
    
    res.download(filePath, doc.fileName, (err) => {
      if (err) {
        console.error('Download error:', err);
        if (!res.headersSent) {
          return res.status(500).json({
            success: false,
            message: 'Download failed'
          });
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Police Case Search by Case ID - searches by caseId, caseNumber, or _id
router.get('/search/:caseId', protect, async (req, res) => {
  try {
    const { caseId } = req.params;
    let searchTerm = caseId.replace(/Case:\s*/i, '').trim();
    
    console.log('Searching for case:', searchTerm);
    
    if (!searchTerm) {
      return res.status(400).json({
        success: false,
        message: 'Search term is required'
      });
    }
    
    let medicoCase = null;
    
    // 1. Try to find by caseId (exact match, case-insensitive)
    try {
      medicoCase = await Case.findOne({ 
        caseId: new RegExp('^' + searchTerm + '$', 'i')
      });
    } catch (e) {
      console.log('CaseId search error:', e.message);
    }
    
    // 2. If not found, try to find by caseNumber (exact match, case-insensitive)
    if (!medicoCase) {
      try {
        medicoCase = await Case.findOne({ 
          caseNumber: new RegExp('^' + searchTerm + '$', 'i')
        });
      } catch (e) {
        console.log('CaseNumber search error:', e.message);
      }
    }
    
    // 3. If not found, try to find by MongoDB _id
    if (!medicoCase) {
      try {
        const mongoose = require('mongoose');
        if (mongoose.Types.ObjectId.isValid(searchTerm)) {
          medicoCase = await Case.findById(searchTerm);
        }
      } catch (e) {
        console.log('ObjectId search error:', e.message);
      }
    }
    
    // 4. If still not found, try partial match on caseId or caseNumber
    if (!medicoCase) {
      try {
        medicoCase = await Case.findOne({ 
          $or: [
            { caseId: new RegExp(searchTerm, 'i') },
            { caseNumber: new RegExp(searchTerm, 'i') }
          ]
        });
      } catch (e) {
        console.log('Partial match search error:', e.message);
      }
    }
    
    if (!medicoCase) {
      return res.status(404).json({
        success: false,
        message: 'Case not found: "' + searchTerm + '"',
        hint: 'Enter Case ID (e.g., MLC-001) or Case Number (e.g., MLC-1234567890-1)'
      });
    }
    
    console.log('Found case:', medicoCase.caseId, medicoCase.caseNumber);
    
    res.json({
      success: true,
      data: medicoCase
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching for case',
      error: error.message
    });
  }
});

// Police AI Search
router.get('/ai-search', protect, async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }
    
    const searchRegex = new RegExp(query, 'i');
    const cases = await Case.find({
      $or: [
        { caseId: searchRegex },
        { caseNumber: searchRegex },
        { patientName: searchRegex },
        { caseType: searchRegex },
        { 'aiIndexing.injury': searchRegex },
        { 'aiIndexing.caseType': searchRegex },
        { description: searchRegex }
      ]
    }).limit(10);
    
    res.json({
      success: true,
      count: cases.length,
      data: cases
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

router.get('/:id', protect, getCase);

// Doctor-only routes
router.post('/', protect, authorize('doctor'), createCase);
router.put('/:id', protect, authorize('doctor'), updateCase);

// Document upload
router.post('/:id/documents', protect, authorize('doctor'), upload.single('document'), uploadDocument);

// AI Indexing
router.post('/:id/ai-index', protect, authorize('doctor'), aiIndexCase);

// Blockchain operations
router.post('/:id/generate-hash', protect, authorize('doctor'), generateHash);
router.get('/:id/verify-hash', protect, authorize('police'), verifyHash);

// Police operations
router.post('/', protect, authorize('police'), createCase);
router.put('/:id/assign-doctor', protect, authorize('police'), updateCase);
router.post('/:id/investigation-note', protect, authorize('police'), addInvestigationNote);

// Police verification and forward to judge - new routes
router.post('/verify/:caseId', protect, authorize('police'), async (req, res) => {
  try {
    const { caseId } = req.params;
    const medicoCase = await Case.findById(caseId);
    
    if (!medicoCase) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }
    
    if (!medicoCase.blockchainHash) {
      return res.status(400).json({
        success: false,
        message: 'No blockchain hash found for this case'
      });
    }
    
    medicoCase.blockchainVerified = true;
    medicoCase.policeVerified = true;
    medicoCase.policeVerifiedAt = new Date();
    medicoCase.policeVerifiedBy = req.user._id;
    await medicoCase.save();
    
    res.json({
      success: true,
      message: 'Case verified successfully',
      data: {
        blockchainVerified: medicoCase.blockchainVerified,
        policeVerified: medicoCase.policeVerified,
        policeVerifiedAt: medicoCase.policeVerifiedAt
      }
    });
  } catch (error) {
    console.error('Police verify error:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying case',
      error: error.message
    });
  }
});

router.post('/forward/:caseId', protect, authorize('police'), async (req, res) => {
  try {
    const { caseId } = req.params;
    const { notes } = req.body;
    const medicoCase = await Case.findById(caseId);
    
    if (!medicoCase) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }
    
    if (!medicoCase.blockchainVerified) {
      return res.status(400).json({
        success: false,
        message: 'Case must be blockchain verified before forwarding to judge'
      });
    }
    
    medicoCase.status = 'forwarded_to_judge';
    medicoCase.forwardedToJudge = true;
    medicoCase.forwardedAt = new Date();
    
    if (notes) {
      medicoCase.judiciaryNotes = notes;
    }
    
    await medicoCase.save();
    
    res.json({
      success: true,
      message: 'Case forwarded to judge successfully',
      data: {
        status: medicoCase.status,
        forwardedToJudge: medicoCase.forwardedToJudge,
        forwardedToJudgeAt: medicoCase.forwardedToJudgeAt
      }
    });
  } catch (error) {
    console.error('Forward to judge error:', error);
    res.status(500).json({
      success: false,
      message: 'Error forwarding case',
      error: error.message
    });
  }
});

router.post('/:id/forward-judiciary', protect, authorize('police'), forwardToJudiciary);

// Doctor operations
router.put('/:id/medical-details', protect, authorize('doctor'), async (req, res) => {
  const { examinationDate, examinationFindings, treatment, prognosis, recommendations } = req.body;
  try {
    const medicoCase = await require('../models/Case').findById(req.params.id);
    if (!medicoCase) return res.status(404).json({ success: false, message: 'Case not found' });
    if (medicoCase.doctorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    if (medicoCase.isSubmitted) {
      return res.status(400).json({ success: false, message: 'Case already submitted, cannot edit' });
    }
    medicoCase.medicalDetails = { examinationDate, examinationFindings, treatment, prognosis, recommendations };
    await medicoCase.save();
    res.json({ success: true, data: medicoCase });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/:id/submit', protect, authorize('doctor'), async (req, res) => {
  try {
    const medicoCase = await require('../models/Case').findById(req.params.id);
    if (!medicoCase) return res.status(404).json({ success: false, message: 'Case not found' });
    if (medicoCase.doctorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    if (medicoCase.isSubmitted) {
      return res.status(400).json({ success: false, message: 'Case already submitted' });
    }
    if (!medicoCase.documents || medicoCase.documents.length === 0) {
      return res.status(400).json({ success: false, message: 'Please upload medical report before submitting' });
    }
    medicoCase.isSubmitted = true;
    medicoCase.submittedAt = new Date();
    medicoCase.status = 'Waiting Police Verification';
    await medicoCase.save();
    res.json({ success: true, message: 'Case submitted successfully', data: medicoCase });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Judiciary operations
router.post('/:id/approve', protect, authorize('judiciary'), approveCase);
router.post('/:id/reject', protect, authorize('judiciary'), rejectCase);

module.exports = router;
