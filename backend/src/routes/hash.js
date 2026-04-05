const express = require('express');
const router = express.Router();
const blockchainService = require('../services/blockchainService');
const Report = require('../models/Report');
const Case = require('../models/Case');
const { protect, authorize } = require('../middleware/auth');

// @desc    Generate hash for any document (report or case)
// @route   POST /api/generate-hash
// @access  Private (Doctor/Admin)
router.post('/generate-hash', protect, authorize('doctor', 'admin'), async (req, res) => {
  try {
    const { documentType, documentId } = req.body;

    // Validation
    if (!documentType || !documentId) {
      return res.status(400).json({
        success: false,
        message: 'documentType and documentId are required',
        example: { documentType: 'case|report', documentId: '507f1f77bcf86cd799439011' }
      });
    }

    let document;
    let documentData;

    if (documentType === 'report') {
      document = await Report.findById(documentId);
      if (!document) {
        return res.status(404).json({
          success: false,
          message: 'Report not found with the given ID'
        });
      }

      documentData = {
        _id: document._id.toString(),
        documentType: 'Report',
        caseNumber: document.caseNumber,
        title: document.title,
        patientName: document.patientName,
        reportType: document.reportType,
        content: document.content,
        doctorName: document.doctorName,
        hospitalName: document.hospitalName,
        dateOfExamination: document.dateOfExamination,
        createdAt: document.createdAt
      };
    } else if (documentType === 'case') {
      document = await Case.findById(documentId);
      if (!document) {
        return res.status(404).json({
          success: false,
          message: 'Case not found with the given ID'
        });
      }

      documentData = {
        _id: document._id.toString(),
        documentType: 'Case',
        caseNumber: document.caseNumber,
        patientName: document.patientName,
        injuryDescription: document.injuryDescription,
        doctorName: document.doctorName,
        hospitalName: document.hospitalName,
        caseType: document.caseType,
        status: document.status,
        createdAt: document.createdAt
      };
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid documentType. Use "report" or "case"'
      });
    }

    // Create blockchain block
    const result = await blockchainService.createBlock(documentData, req.user._id);

    // Update document with hash
    if (documentType === 'report') {
      document.blockchainHash = result.hash;
      document.isVerified = true;
      document.verifiedAt = new Date();
      document.verifiedBy = req.user._id;
      await document.save();
    } else if (documentType === 'case') {
      document.blockchainHash = result.hash;
      document.blockchainVerified = true;
      document.verifiedAt = new Date();
      document.verifiedBy = req.user._id;
      await document.save();
    }

    res.status(201).json({
      success: true,
      message: 'Blockchain hash generated successfully',
      data: {
        documentId: document._id,
        documentType,
        title: document.title || document.caseNumber,
        hash: result.hash,
        blockNumber: result.block.blockNumber,
        timestamp: result.block.timestamp
      }
    });
  } catch (error) {
    console.error('Generate hash error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating blockchain hash',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    Verify hash for any document
// @route   GET /api/verify-record
// @access  Private
router.get('/verify-record', protect, async (req, res) => {
  try {
    const { documentType, documentId } = req.query;

    // Validation
    if (!documentType || !documentId) {
      return res.status(400).json({
        success: false,
        message: 'documentType and documentId query parameters are required',
        example: '/api/verify-record?documentType=case&documentId=507f1f77bcf86cd799439011'
      });
    }

    let document;
    let documentData;

    if (documentType === 'report') {
      document = await Report.findById(documentId);
      if (!document) {
        return res.status(404).json({
          success: false,
          message: 'Report not found with the given ID'
        });
      }

      if (!document.blockchainHash) {
        return res.status(400).json({
          success: false,
          message: 'No blockchain hash found for this report. Generate hash first.'
        });
      }

      documentData = {
        _id: document._id.toString(),
        documentType: 'Report',
        caseNumber: document.caseNumber,
        title: document.title,
        patientName: document.patientName,
        reportType: document.reportType,
        content: document.content,
        doctorName: document.doctorName,
        hospitalName: document.hospitalName,
        dateOfExamination: document.dateOfExamination,
        createdAt: document.createdAt
      };
    } else if (documentType === 'case') {
      document = await Case.findById(documentId);
      if (!document) {
        return res.status(404).json({
          success: false,
          message: 'Case not found with the given ID'
        });
      }

      if (!document.blockchainHash) {
        return res.status(400).json({
          success: false,
          message: 'No blockchain hash found for this case. Generate hash first.'
        });
      }

      documentData = {
        _id: document._id.toString(),
        documentType: 'Case',
        caseNumber: document.caseNumber,
        patientName: document.patientName,
        injuryDescription: document.injuryDescription,
        doctorName: document.doctorName,
        hospitalName: document.hospitalName,
        caseType: document.caseType,
        status: document.status,
        createdAt: document.createdAt
      };
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid documentType. Use "report" or "case"'
      });
    }

    // Verify document
    const result = await blockchainService.verifyDocument(documentId, documentData);

    res.json({
      success: true,
      message: result.message,
      data: {
        documentId: document._id,
        documentType,
        title: document.title || document.caseNumber,
        verified: result.verified,
        storedHash: result.storedHash,
        currentHash: result.currentHash,
        blockNumber: result.blockNumber,
        timestamp: result.timestamp
      }
    });
  } catch (error) {
    console.error('Verify hash error:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying blockchain hash',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
