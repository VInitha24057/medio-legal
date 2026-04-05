/**
 * Unified API Routes
 * Exposes exact endpoint names as per requirements:
 * - POST /upload-case
 * - GET /search-case
 * - POST /verify-hash
 * - POST /forward-case
 * - GET /patient-records
 * - GET /download-report
 */

const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const Case = require('../models/Case');
const blockchainService = require('../services/blockchainService');
const fs = require('fs');
const path = require('path');

// ============================================
// POST /upload-case - Upload medico legal report
// ============================================
router.post('/upload-case', protect, authorize('doctor'), async (req, res) => {
  try {
    const {
      caseId,
      caseType,
      title,
      description,
      patientName,
      patientAge,
      patientGender,
      patientPhone,
      injuryDescription,
      hospitalName,
      incidentDate,
      firNumber,
      firDate,
      documentData
    } = req.body;

    let medicoCase;

    // If caseId provided, update existing case
    if (caseId) {
      medicoCase = await Case.findById(caseId);
      if (!medicoCase) {
        return res.status(404).json({
          success: false,
          message: 'Case not found'
        });
      }

      // Verify doctor owns this case
      if (medicoCase.doctorId.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to upload to this case'
        });
      }

      // Update case details
      if (caseType) medicoCase.caseType = caseType;
      if (title) medicoCase.title = title;
      if (description) medicoCase.description = description;
      if (patientName) medicoCase.patientName = patientName;
      if (patientAge) medicoCase.patientAge = patientAge;
      if (patientGender) medicoCase.patientGender = patientGender;
      if (patientPhone) medicoCase.patientPhone = patientPhone;
      if (injuryDescription) medicoCase.injuryDescription = injuryDescription;
      if (hospitalName) medicoCase.hospitalName = hospitalName;
      if (incidentDate) medicoCase.incidentDate = incidentDate;
      if (firNumber) medicoCase.firNumber = firNumber;
      if (firDate) medicoCase.firDate = firDate;
    } else {
      // Create new case
      const caseData = {
        caseType: caseType || 'Other',
        title: title || 'Medico Legal Case',
        description: description || '',
        patientName: patientName || 'Unknown',
        patientAge,
        patientGender,
        patientPhone,
        injuryDescription,
        hospitalName: hospitalName || req.user.hospital || 'Unknown',
        incidentDate: incidentDate || new Date(),
        firNumber,
        firDate,
        status: 'Pending',
        doctorId: req.user._id,
        doctorName: req.user.fullName
      };

      medicoCase = await Case.create(caseData);
    }

    // If document data provided (base64), save it
    if (documentData) {
      // The actual file upload is handled by multer in the main route
      // This endpoint accepts case data with optional document
    }

    res.status(201).json({
      success: true,
      message: 'Case uploaded successfully',
      data: {
        caseId: medicoCase._id,
        caseNumber: medicoCase.caseNumber,
        status: medicoCase.status
      }
    });
  } catch (error) {
    console.error('Upload case error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading case',
      error: error.message
    });
  }
});

// ============================================
// GET /search-case - Search case by Case ID (Police only)
// ============================================
router.get('/search-case', protect, authorize('police', 'judiciary', 'admin'), async (req, res) => {
  try {
    const { caseId } = req.query;

    if (!caseId) {
      return res.status(400).json({
        success: false,
        message: 'Case ID is required'
      });
    }

    const medicoCase = await Case.findOne({
      $or: [
        { caseId: caseId },
        { caseNumber: caseId }
      ]
    })
      .populate('doctorId', 'fullName email')
      .populate('policeId', 'fullName badgeNumber');

    if (!medicoCase) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }

    res.json({
      success: true,
      data: {
        _id: medicoCase._id,
        caseId: medicoCase.caseId,
        caseNumber: medicoCase.caseNumber,
        caseType: medicoCase.caseType,
        title: medicoCase.title,
        description: medicoCase.description,
        patientName: medicoCase.patientName,
        patientAge: medicoCase.patientAge,
        patientGender: medicoCase.patientGender,
        injuryDescription: medicoCase.injuryDescription,
        hospitalName: medicoCase.hospitalName,
        doctorName: medicoCase.doctorName,
        incidentDate: medicoCase.incidentDate,
        status: medicoCase.status,
        blockchainHash: medicoCase.blockchainHash,
        blockchainVerified: medicoCase.blockchainVerified,
        verificationStatus: medicoCase.verificationStatus,
        aiIndexing: medicoCase.aiIndexing,
        documents: medicoCase.documents,
        policeVerified: medicoCase.policeVerified,
        forwardedToJudiciary: medicoCase.forwardedToJudiciary,
        createdAt: medicoCase.createdAt
      }
    });
  } catch (error) {
    console.error('Search case error:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching case',
      error: error.message
    });
  }
});

// ============================================
// POST /verify-hash - Verify blockchain hash
// ============================================
router.post('/verify-hash', protect, authorize('police', 'judiciary', 'admin'), async (req, res) => {
  try {
    const { caseId } = req.body;

    if (!caseId) {
      return res.status(400).json({
        success: false,
        message: 'Case ID is required'
      });
    }

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

    // Prepare document data for verification
    const documentData = {
      _id: medicoCase._id,
      documentType: 'Case',
      caseNumber: medicoCase.caseNumber,
      patientName: medicoCase.patientName,
      caseType: medicoCase.caseType,
      description: medicoCase.description,
      doctorName: medicoCase.doctorName,
      hospitalName: medicoCase.hospitalName,
      incidentDate: medicoCase.incidentDate,
      createdAt: medicoCase.createdAt
    };

    // Verify with blockchain service
    const result = await blockchainService.verifyDocument(medicoCase._id, documentData);

    // Update status when hash is verified successfully to establish workflow continuity
    let saveStatus = "NOT_ATTEMPTED";
    if (result.verified && req.user.role === 'police') {
      try {
        medicoCase.status = 'Under Police Review';
        medicoCase.policeVerified = true;
        medicoCase.policeVerifiedAt = new Date();
        medicoCase.policeVerifiedBy = req.user._id;
        const savedDoc = await medicoCase.save();
        saveStatus = `SUCCESS: ${savedDoc.status}, policeVerified: ${savedDoc.policeVerified}`;
        console.log(`[DEBUG] Saved case successfully in verify-hash!`);
      } catch (saveErr) {
        saveStatus = `FAILED: ${saveErr.message}`;
        console.error(`[DEBUG] Failed to save case in verify-hash:`, saveErr);
      }
    } else {
        saveStatus = `SKIPPED: verified=${result.verified}, role=${req.user.role}`;
    }

    res.json({
      success: true,
      message: result.message,
      data: {
        caseId: medicoCase._id,
        caseNumber: medicoCase.caseNumber,
        isValid: result.verified,
        verified: result.verified,
        storedHash: result.storedHash,
        currentHash: result.currentHash,
        blockNumber: result.blockNumber,
        timestamp: result.timestamp,
        __debugSaveStatus: saveStatus
      }
    });
  } catch (error) {
    console.error('Verify hash error:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying blockchain hash',
      error: error.message
    });
  }
});

// ============================================
// POST /forward-case - Forward case to judiciary
// ============================================
router.post('/forward-case', protect, authorize('police'), async (req, res) => {
  try {
    const { caseId, notes } = req.body;

    if (!caseId) {
      return res.status(400).json({
        success: false,
        message: 'Case ID is required'
      });
    }

    const medicoCase = await Case.findById(caseId);

    if (!medicoCase) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }

    // Verify blockchain hash exists
    if (!medicoCase.blockchainHash) {
      return res.status(400).json({
        success: false,
        message: 'Cannot forward case. Blockchain hash must be generated first.'
      });
    }

    // Verify case can be forwarded
    const canForward = medicoCase.status === 'Under Police Review' || 
                       medicoCase.status === 'Submitted' ||
                       medicoCase.policeVerified === true;

    if (!canForward) {
      return res.status(400).json({
        success: false,
        message: 'Case must be verified by police before forwarding to judiciary'
      });
    }

    // Mark as police verified and forward
    medicoCase.policeVerified = true;
    medicoCase.policeVerifiedAt = new Date();
    medicoCase.policeVerifiedBy = req.user._id;
    medicoCase.forwardedToJudiciary = true;
    medicoCase.forwardedToJudiciaryAt = new Date();
    medicoCase.status = 'FORWARDED_TO_JUDGE';
    
    if (notes) {
      medicoCase.judiciaryNotes = notes;
    }

    await medicoCase.save();

    res.json({
      success: true,
      message: 'Case forwarded to judiciary successfully',
      data: {
        caseId: medicoCase._id,
        caseNumber: medicoCase.caseNumber,
        status: medicoCase.status,
        policeVerified: medicoCase.policeVerified,
        forwardedToJudiciary: medicoCase.forwardedToJudiciary,
        forwardedToJudiciaryAt: medicoCase.forwardedToJudiciaryAt
      }
    });
  } catch (error) {
    console.error('Forward case error:', error);
    res.status(500).json({
      success: false,
      message: 'Error forwarding case',
      error: error.message
    });
  }
});

// ============================================
// GET /patient-records - Get patient's own records
// ============================================
router.get('/patient-records', protect, authorize('patient'), async (req, res) => {
  try {
    const userId = req.user._id;

    // Get cases where patientId matches the logged-in patient
    const cases = await Case.find({ patientId: userId })
      .sort({ createdAt: -1 })
      .select('caseNumber caseType patientName doctorName hospitalName status reportStatus blockchainVerified blockchainHash createdAt documents medicalDetails aiIndexing');

    res.json({
      success: true,
      count: cases.length,
      data: cases
    });
  } catch (error) {
    console.error('Patient records error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching patient records',
      error: error.message
    });
  }
});

// ============================================
// GET /download-report - Download medical report
// ============================================
router.get('/download-report', protect, async (req, res) => {
  try {
    const { caseId } = req.query;

    if (!caseId) {
      return res.status(400).json({
        success: false,
        message: 'Case ID is required'
      });
    }

    const medicoCase = await Case.findById(caseId);

    if (!medicoCase) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }

    // Security check - only allow patient to download their own case
    if (req.user.role === 'patient') {
      const userId = req.user._id.toString();
      const casePatientId = medicoCase.patientId ? medicoCase.patientId.toString() : '';
      
      // Allow if patientId matches OR patientName matches user's fullName
      const patientNameMatch = medicoCase.patientName && 
        medicoCase.patientName.toLowerCase() === req.user.fullName.toLowerCase();
      
      if (casePatientId === userId || patientNameMatch) {
        // Authorized - proceed with download
      } else {
        console.log('Access denied - userId:', userId, 'casePatientId:', casePatientId);
        return res.status(403).json({
          success: false,
          message: 'Access denied. You can only download your own medical reports.'
        });
      }
    }
    // Doctor can download cases they created
    else if (req.user.role === 'doctor') {
      if (!medicoCase.doctorId || medicoCase.doctorId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }
    }
    // Police, judiciary, admin have full access
    else if (!['police', 'judiciary', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Check if case has documents OR reportPath
    if ((!medicoCase.documents || medicoCase.documents.length === 0) && !medicoCase.reportPath) {
      return res.status(404).json({
        success: false,
        message: 'No document available for download'
      });
    }

    const uploadsDir = path.join(__dirname, '../../uploads');
    let filePath;
    let fileName = 'report.pdf';

    // Try reportPath first
    if (medicoCase.reportPath) {
      filePath = path.join(uploadsDir, medicoCase.reportPath);
      fileName = path.basename(medicoCase.reportPath);
    } 
    // Fall back to documents array
    else if (medicoCase.documents && medicoCase.documents.length > 0) {
      const doc = medicoCase.documents[0];
      fileName = doc.fileName;
      if (doc.filePath && !doc.filePath.includes('..')) {
        filePath = path.join(uploadsDir, doc.filePath);
      } else {
        filePath = path.join(uploadsDir, 'cases', doc.fileName);
      }
    } else {
      return res.status(404).json({ success: false, message: 'No file found' });
    }

    console.log('Downloading file:', filePath);

    // Use res.download to return the file
    res.download(filePath, fileName, (err) => {
      if (err) {
        console.error('Download error:', err);
        if (!res.headersSent) {
          return res.status(500).json({ success: false, message: 'Download failed' });
        }
      }
    });
  } catch (error) {
    console.error('Download report error:', error);
    res.status(500).json({
      success: false,
      message: 'Error downloading report',
      error: error.message
    });
  }
});

const authMiddleware = protect;

router.get("/download-report/:caseId", authMiddleware, async (req,res)=>{
 try {
   const Case = require("../models/Case");
   const caseData = await Case.findById(req.params.caseId);

   if(!caseData){
     return res.status(404).json({message:"Case not found"});
   }
   
   if(!caseData.reportPath && (!caseData.documents || caseData.documents.length === 0)) {
     return res.status(404).json({message:"Report path not found on this case"});
   }

   let storedPath = caseData.reportPath;
   
   // Fallback to documents array if reportPath is null
   if (!storedPath && caseData.documents && caseData.documents.length > 0) {
     const doc = caseData.documents[0];
     // Use filePath if available, else use fileName
     storedPath = doc.filePath || doc.fileName;
   }

   const path = require("path");
   const fs = require("fs");
   let filePath = path.resolve(storedPath);
   
   console.log("Download Report API invoked:");
   console.log("- original storedPath:", storedPath);
   console.log("- resolved filePath:", filePath);
   console.log("- file exists?:", fs.existsSync(filePath));

   if (!fs.existsSync(filePath)) {
     // Try looking in medico/uploads if it was saved there relative to project root
     const medicoUploads = path.join(__dirname, '../../../uploads', path.basename(storedPath));
     const medicoCasesUploads = path.join(__dirname, '../../../uploads/cases', path.basename(storedPath));
     
     // Try looking in backend/uploads
     const backendUploads = path.join(__dirname, '../../uploads', path.basename(storedPath));
     const backendCasesUploads = path.join(__dirname, '../../uploads/cases', path.basename(storedPath));
     
     if (fs.existsSync(medicoUploads)) {
       filePath = medicoUploads;
     } else if (fs.existsSync(medicoCasesUploads)) {
       filePath = medicoCasesUploads;
     } else if (fs.existsSync(backendUploads)) {
       filePath = backendUploads;
     } else if (fs.existsSync(backendCasesUploads)) {
       filePath = backendCasesUploads;
     } else {
       if (!res.headersSent) {
         // Use 404 instead of 500 so Chrome displays the error message JSON
         return res.status(404).json({
           success: false, 
           message: "File not found on disk. The physical file may have been moved or deleted.", 
           pathTried: filePath
         });
       }
     }
   }

   res.download(filePath, (err) => {
     if (err) {
       console.error("Download Error from express:", err);
       if (!res.headersSent) {
         res.status(500).json({message:"Error streaming file to client"});
       }
     }
   });
 } catch (error) {
   console.error("API Error in /download-report/:caseId :", error);
   if (!res.headersSent) {
     res.status(500).json({message:"Internal Server Error"});
   }
 }
});

module.exports = router;