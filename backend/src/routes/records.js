const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Case = require('../models/Case');
const Report = require('../models/Report');
const { protect, authorize } = require('../middleware/auth');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../../uploads/records');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'record-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype) || file.mimetype.includes('image/') || file.mimetype === 'application/pdf';
    
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only images and PDF files are allowed'));
  }
});

// @desc    Upload a new record (case or report)
// @route   POST /api/upload-record
// @access  Private (Doctor only)
router.post('/upload-record', protect, authorize('doctor'), upload.single('document'), async (req, res) => {
  try {
    const { recordType, caseType, title, description, patientName, patientAge, patientGender, patientPhone, injuryDescription, hospitalName, incidentDate, reportType, content, caseNumber } = req.body;

    if (!recordType) {
      return res.status(400).json({
        success: false,
        message: 'Record type is required (case or report)'
      });
    }

    if (recordType === 'case') {
      // Create a new case
      if (!caseType || !title || !description || !patientName || !hospitalName || !incidentDate) {
        return res.status(400).json({
          success: false,
          message: 'Please provide caseType, title, description, patientName, hospitalName, and incidentDate'
        });
      }

      const newCase = await Case.create({
        caseType,
        title,
        description,
        patientName,
        patientAge: patientAge || null,
        patientGender: patientGender || null,
        patientPhone: patientPhone || '',
        injuryDescription: injuryDescription || '',
        hospitalName,
        incidentDate: new Date(incidentDate),
        doctorId: req.user._id,
        doctorName: req.user.fullName,
        status: 'Pending'
      });

      // Add document if uploaded
      if (req.file) {
        newCase.documents.push({
          fileName: req.file.originalname,
          filePath: `/uploads/records/${req.file.filename}`,
          fileType: req.file.mimetype,
          uploadDate: new Date()
        });
        await newCase.save();
      }

      return res.status(201).json({
        success: true,
        message: 'Case created successfully',
        data: newCase
      });

    } else if (recordType === 'report') {
      // Create a new report
      if (!title || !content || !reportType || !caseNumber || !patientName || !hospitalName) {
        return res.status(400).json({
          success: false,
          message: 'Please provide title, content, reportType, caseNumber, patientName, and hospitalName'
        });
      }

      // Find the case by caseNumber
      const existingCase = await Case.findOne({ caseNumber });
      if (!existingCase) {
        return res.status(404).json({
          success: false,
          message: `Case with case number ${caseNumber} not found`
        });
      }

      const newReport = await Report.create({
        title,
        caseId: existingCase._id,
        caseNumber,
        patientName,
        reportType,
        content,
        doctorId: req.user._id,
        doctorName: req.user.fullName,
        hospitalName,
        dateOfExamination: new Date()
      });

      // Add file if uploaded
      if (req.file) {
        newReport.filePath = `/uploads/records/${req.file.filename}`;
        newReport.fileName = req.file.originalname;
        await newReport.save();
      }

      return res.status(201).json({
        success: true,
        message: 'Report created successfully',
        data: newReport
      });

    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid record type. Use "case" or "report"'
      });
    }

  } catch (error) {
    console.error('Upload record error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading record',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    Get all records (cases and reports)
// @route   GET /api/records
// @access  Private
router.get('/records', protect, async (req, res) => {
  try {
    const { type, status, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    let cases = [];
    let reports = [];

    // Role-based filtering
    if (req.user.role === 'doctor') {
      cases = await Case.find({ doctorId: req.user._id })
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip(skip);
      
      reports = await Report.find({ doctorId: req.user._id })
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip(skip);
    } else if (req.user.role === 'patient') {
      cases = await Case.find({ patientId: req.user._id })
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip(skip);
      
      reports = await Report.find({ patientId: req.user._id })
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip(skip);
    } else if (req.user.role === 'police' || req.user.role === 'judiciary' || req.user.role === 'admin') {
      // All records for other roles
      cases = await Case.find()
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip(skip);
      
      reports = await Report.find()
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip(skip);
    }

    // Filter by type if specified
    if (type === 'case') {
      reports = [];
    } else if (type === 'report') {
      cases = [];
    }

    // Filter by status if specified
    if (status) {
      cases = cases.filter(c => c.status === status);
      reports = reports.filter(r => r.isVerified === (status === 'Verified'));
    }

    // Format response
    const formattedCases = cases.map(c => ({
      _id: c._id,
      type: 'case',
      caseNumber: c.caseNumber,
      title: c.title,
      patientName: c.patientName,
      caseType: c.caseType,
      status: c.status,
      doctorName: c.doctorName,
      hospitalName: c.hospitalName,
      blockchainVerified: c.blockchainVerified,
      createdAt: c.createdAt
    }));

    const formattedReports = reports.map(r => ({
      _id: r._id,
      type: 'report',
      caseNumber: r.caseNumber,
      title: r.title,
      patientName: r.patientName,
      reportType: r.reportType,
      status: r.isVerified ? 'Verified' : 'Pending',
      doctorName: r.doctorName,
      hospitalName: r.hospitalName,
      blockchainVerified: r.isVerified,
      createdAt: r.createdAt
    }));

    const allRecords = [...formattedCases, ...formattedReports].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    const totalCases = await Case.countDocuments(
      req.user.role === 'doctor' ? { doctorId: req.user._id } :
      req.user.role === 'patient' ? { patientId: req.user._id } : {}
    );
    
    const totalReports = await Report.countDocuments(
      req.user.role === 'doctor' ? { doctorId: req.user._id } :
      req.user.role === 'patient' ? { patientId: req.user._id } : {}
    );

    res.json({
      success: true,
      count: allRecords.length,
      total: totalCases + totalReports,
      page: parseInt(page),
      pages: Math.ceil((totalCases + totalReports) / limit),
      data: allRecords
    });
  } catch (error) {
    console.error('Get records error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching records',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    Get single record by ID
// @route   GET /api/records/:id
// @access  Private
router.get('/records/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;

    // Try case first
    let record = await Case.findById(id);
    let recordType = 'case';

    if (!record) {
      // Try report
      record = await Report.findById(id);
      recordType = 'report';
    }

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Record not found'
      });
    }

    // Check access rights for patients
    if (req.user.role === 'patient' && record.patientName !== req.user.fullName) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: {
        ...record.toObject(),
        recordType
      }
    });
  } catch (error) {
    console.error('Get record error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching record',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;