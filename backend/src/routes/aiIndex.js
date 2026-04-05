/**
 * AI Indexing Routes
 * Provides endpoints for testing AI indexing functionality
 */

const express = require('express');
const router = express.Router();
const { aiIndexing } = require('../../ai-module/aiIndexing');
const { protect } = require('../middleware/auth');

// @route   POST /api/ai-index/analyze
// @desc    Analyze text and extract AI indexing data
// @access  Private (Doctor, Admin)
router.post('/analyze', protect, (req, res) => {
  try {
    const { text } = req.body;

    if (!text || typeof text !== 'string' || text.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Text is required for analysis'
      });
    }

    const result = aiIndexing(text);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('AI Indexing error:', error);
    res.status(500).json({
      success: false,
      message: 'AI indexing failed',
      error: error.message
    });
  }
});

// @route   GET /api/ai-index/test
// @desc    Test AI indexing with sample data
// @access  Private (Doctor, Admin)
router.get('/test', protect, (req, res) => {
  try {
    const testCases = [
      {
        description: 'Road accident with fractures',
        text: 'Patient suffered fracture in right arm due to road accident. Multiple injuries observed.'
      },
      {
        description: 'Physical assault',
        text: 'Victima was attacked and beaten with severe injuries to the head and body.'
      },
      {
        description: 'Burn injury',
        text: 'Patient sustained major burn injuries from fire accident at workplace.'
      },
      {
        description: 'Poisoning case',
        text: 'Patient consumed toxic substance accidentally. Showing symptoms of poisoning.'
      }
    ];

    const results = testCases.map(tc => ({
      description: tc.description,
      result: aiIndexing(tc.text)
    }));

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('AI Test error:', error);
    res.status(500).json({
      success: false,
      message: 'AI test failed',
      error: error.message
    });
  }
});

module.exports = router;
