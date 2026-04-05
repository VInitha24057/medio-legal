const express = require('express');
const router = express.Router();
const { getStats, getBlocks, getBlock, verifyDocument, getHistory } = require('../controllers/blockchainController');
const { protect, authorize } = require('../middleware/auth');

// Get blockchain statistics
router.get('/stats', protect, getStats);

// Get all blocks
router.get('/blocks', protect, getBlocks);

// Get single block
router.get('/blocks/:id', protect, getBlock);

// Verify document
router.post('/verify', protect, verifyDocument);

// Get blockchain history
router.get('/history/:documentId', protect, getHistory);

module.exports = router;
