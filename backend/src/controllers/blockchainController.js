const BlockchainLedger = require('../models/BlockchainLedger');
const Case = require('../models/Case');
const Report = require('../models/Report');
const blockchainService = require('../services/blockchainService');

// @desc    Get blockchain statistics
// @route   GET /api/blockchain/stats
// @access  Private
const getStats = async (req, res) => {
  try {
    const stats = await blockchainService.getBlockchainStats();

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get blockchain stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching blockchain statistics',
      error: error.message
    });
  }
};

// @desc    Get all blockchain blocks
// @route   GET /api/blockchain/blocks
// @access  Private
const getBlocks = async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;

    const blocks = await blockchainService.getAllBlocks(parseInt(limit), skip);
    const total = await BlockchainLedger.countDocuments();

    res.json({
      success: true,
      count: blocks.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: blocks
    });
  } catch (error) {
    console.error('Get blocks error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching blockchain blocks',
      error: error.message
    });
  }
};

// @desc    Get single block
// @route   GET /api/blockchain/blocks/:id
// @access  Private
const getBlock = async (req, res) => {
  try {
    const block = await BlockchainLedger.findById(req.params.id)
      .populate('createdBy', 'username fullName')
      .populate('verificationHistory.verifiedBy', 'username fullName');

    if (!block) {
      return res.status(404).json({
        success: false,
        message: 'Block not found'
      });
    }

    res.json({
      success: true,
      data: block
    });
  } catch (error) {
    console.error('Get block error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching block',
      error: error.message
    });
  }
};

// @desc    Verify document by ID and type
// @route   POST /api/blockchain/verify
// @access  Private
const verifyDocument = async (req, res) => {
  try {
    const { documentId, documentType } = req.body;

    let document;
    let documentData;

    if (documentType === 'Case') {
      document = await Case.findById(documentId);
      if (document) {
        documentData = {
          _id: document._id,
          documentType: 'Case',
          caseNumber: document.caseNumber,
          patientName: document.patientName,
          caseType: document.caseType,
          description: document.description,
          doctorName: document.doctorName,
          hospitalName: document.hospitalName,
          incidentDate: document.incidentDate,
          createdAt: document.createdAt
        };
      }
    } else if (documentType === 'Report') {
      document = await Report.findById(documentId);
      if (document) {
        documentData = {
          _id: document._id,
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
      }
    }

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    const result = await blockchainService.verifyDocument(documentId, documentData);

    res.json({
      success: true,
      message: result.message,
      data: {
        documentId,
        documentType,
        verified: result.verified,
        storedHash: result.storedHash,
        currentHash: result.currentHash,
        blockNumber: result.blockNumber,
        timestamp: result.timestamp
      }
    });
  } catch (error) {
    console.error('Verify document error:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying document',
      error: error.message
    });
  }
};

// @desc    Get blockchain history for a document
// @route   GET /api/blockchain/history/:documentId
// @access  Private
const getHistory = async (req, res) => {
  try {
    const history = await blockchainService.getBlockchainHistory(req.params.documentId);

    if (!history) {
      return res.status(404).json({
        success: false,
        message: 'No blockchain history found for this document'
      });
    }

    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    console.error('Get blockchain history error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching blockchain history',
      error: error.message
    });
  }
};

module.exports = {
  getStats,
  getBlocks,
  getBlock,
  verifyDocument,
  getHistory
};
