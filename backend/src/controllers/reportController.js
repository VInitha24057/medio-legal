const Report = require('../models/Report');
const Case = require('../models/Case');
const Log = require('../models/Log');
const blockchainService = require('../services/blockchainService');
const aiService = require('../services/aiService');

// @desc    Create new report
// @route   POST /api/reports
// @access  Private (Doctor only)
const createReport = async (req, res) => {
  try {
    const {
      title,
      caseId,
      caseNumber,
      patientName,
      reportType,
      content,
      dateOfExamination
    } = req.body;

    // Verify case exists
    const medicoCase = await Case.findById(caseId);
    if (!medicoCase) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }

    // Create report
    const report = await Report.create({
      title,
      caseId,
      caseNumber: medicoCase.caseNumber,
      patientName,
      reportType,
      content,
      doctorId: req.user._id,
      doctorName: req.user.fullName,
      hospitalName: req.user.hospital || 'Not specified',
      dateOfExamination
    });

    // Log report creation
    await Log.create({
      userId: req.user._id,
      username: req.user.username,
      action: 'CREATE_CASE',
      resourceType: 'Report',
      resourceId: report._id,
      description: `Report created: ${report.title}`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      status: 'success'
    });

    res.status(201).json({
      success: true,
      message: 'Report created successfully',
      data: report
    });
  } catch (error) {
    console.error('Create report error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating report',
      error: error.message
    });
  }
};

// @desc    Get all reports
// @route   GET /api/reports
// @access  Private
const getReports = async (req, res) => {
  try {
    const { caseId, reportType, page = 1, limit = 20 } = req.query;
    
    let query = {};

    // Filter by user role
    if (req.user.role === 'doctor') {
      query.doctorId = req.user._id;
    }

    // Apply filters
    if (caseId) query.caseId = caseId;
    if (reportType) query.reportType = reportType;

    const skip = (page - 1) * limit;
    const reports = await Report.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .populate('doctorId', 'username fullName');

    const total = await Report.countDocuments(query);

    res.json({
      success: true,
      count: reports.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: reports
    });
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching reports',
      error: error.message
    });
  }
};

// @desc    Get single report
// @route   GET /api/reports/:id
// @access  Private
const getReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate('doctorId', 'username fullName email')
      .populate('caseId');

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    // Log report access
    await Log.create({
      userId: req.user._id,
      username: req.user.username,
      action: 'VIEW_CASE',
      resourceType: 'Report',
      resourceId: report._id,
      description: `Report viewed: ${report.title}`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      status: 'success'
    });

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Get report error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching report',
      error: error.message
    });
  }
};

// @desc    Upload report document
// @route   POST /api/reports/:id/upload
// @access  Private (Doctor only)
const uploadReportDocument = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    // Only the creator doctor can upload
    if (report.doctorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to upload to this report'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a file'
      });
    }

    report.filePath = `/uploads/reports/${req.file.filename}`;
    report.fileName = req.file.filename;
    await report.save();

    res.json({
      success: true,
      message: 'Document uploaded successfully',
      data: {
        fileName: report.fileName,
        filePath: report.filePath
      }
    });
  } catch (error) {
    console.error('Upload report document error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading document',
      error: error.message
    });
  }
};

// @desc    AI analyze report
// @route   POST /api/reports/:id/ai-analyze
// @access  Private (Doctor only)
const aiAnalyzeReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    // Call AI service for analysis
    const aiResult = await aiService.analyzeDocument(report.content);
    
    const aiData = aiResult.data;

    // Update report with AI analysis
    report.aiAnalysis = {
      extractedEntities: aiData.extractedEntities || {},
      keywords: aiData.keywords || [],
      sentiment: aiData.sentiment || 'neutral',
      analyzedAt: Date.now()
    };

    await report.save();

    res.json({
      success: true,
      message: 'AI analysis completed',
      data: report.aiAnalysis
    });
  } catch (error) {
    console.error('AI analyze report error:', error);
    res.status(500).json({
      success: false,
      message: 'Error performing AI analysis',
      error: error.message
    });
  }
};

// @desc    Generate blockchain hash for report
// @route   POST /api/reports/:id/generate-hash
// @access  Private (Doctor only)
const generateReportHash = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    // Only the creator doctor can generate hash
    if (report.doctorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to generate hash for this report'
      });
    }

    // Prepare document data for hashing
    const documentData = {
      _id: report._id,
      documentType: 'Report',
      caseNumber: report.caseNumber,
      title: report.title,
      patientName: report.patientName,
      reportType: report.reportType,
      content: report.content,
      doctorName: report.doctorName,
      hospitalName: report.hospitalName,
      dateOfExamination: report.dateOfExamination,
      createdAt: report.createdAt
    };

    // Create blockchain block
    const result = await blockchainService.createBlock(documentData, req.user._id);

    // Update report with hash
    report.blockchainHash = result.hash;
    report.isVerified = true;
    report.verifiedAt = Date.now();
    report.verifiedBy = req.user._id;
    await report.save();

    res.json({
      success: true,
      message: 'Blockchain hash generated successfully',
      data: {
        reportId: report._id,
        title: report.title,
        hash: result.hash,
        blockNumber: result.block.blockNumber,
        timestamp: result.block.timestamp
      }
    });
  } catch (error) {
    console.error('Generate report hash error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating blockchain hash',
      error: error.message
    });
  }
};

// @desc    Verify report blockchain hash
// @route   GET /api/reports/:id/verify-hash
// @access  Private
const verifyReportHash = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    if (!report.blockchainHash) {
      return res.status(400).json({
        success: false,
        message: 'No blockchain hash found for this report'
      });
    }

    // Prepare document data for verification
    const documentData = {
      _id: report._id,
      documentType: 'Report',
      caseNumber: report.caseNumber,
      title: report.title,
      patientName: report.patientName,
      reportType: report.reportType,
      content: report.content,
      doctorName: report.doctorName,
      hospitalName: report.hospitalName,
      dateOfExamination: report.dateOfExamination,
      createdAt: report.createdAt
    };

    // Verify with blockchain service
    const result = await blockchainService.verifyDocument(report._id, documentData);

    res.json({
      success: true,
      message: result.message,
      data: {
        reportId: report._id,
        title: report.title,
        verified: result.verified,
        storedHash: result.storedHash,
        currentHash: result.currentHash
      }
    });
  } catch (error) {
    console.error('Verify report hash error:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying blockchain hash',
      error: error.message
    });
  }
};

module.exports = {
  createReport,
  getReports,
  getReport,
  uploadReportDocument,
  aiAnalyzeReport,
  generateReportHash,
  verifyReportHash
};
