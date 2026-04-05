const axios = require('axios');
const { aiIndexing } = require('../../ai-module/aiIndexing');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:5001';

// Extract entities and index document using AI
const indexDocument = async (text, fileType = 'text') => {
  try {
    const response = await axios.post(`${AI_SERVICE_URL}/api/nlp/extract`, {
      text,
      fileType
    }, {
      timeout: 30000
    });

    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('AI Service indexing error:', error.message);
    
    // Return fallback data if AI service is unavailable
    return {
      success: false,
      error: error.message,
      fallback: true,
      data: generateFallbackExtraction(text)
    };
  }
};

// Analyze document using AI
const analyzeDocument = async (text) => {
  try {
    const response = await axios.post(`${AI_SERVICE_URL}/api/nlp/analyze`, {
      text
    }, {
      timeout: 30000
    });

    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('AI Service analysis error:', error.message);
    
    return {
      success: false,
      error: error.message,
      fallback: true,
      data: generateFallbackAnalysis(text)
    };
  }
};

// Process uploaded file with AI OCR
const processFile = async (filePath, fileType) => {
  try {
    const formData = new FormData();
    
    // Read file and send to AI service
    const fs = require('fs');
    const fileBuffer = fs.readFileSync(filePath);
    const fileName = filePath.split('/').pop();
    
    formData.append('file', new Blob([fileBuffer]), fileName);
    
    if (fileType === 'application/pdf') {
      const response = await axios.post(`${AI_SERVICE_URL}/api/ocr/pdf`, formData, {
        headers: formData.getHeaders(),
        timeout: 60000
      });
      return { success: true, data: response.data };
    } else if (fileType.startsWith('image/')) {
      const response = await axios.post(`${AI_SERVICE_URL}/api/ocr/image`, formData, {
        headers: formData.getHeaders(),
        timeout: 60000
      });
      return { success: true, data: response.data };
    }
    
    throw new Error('Unsupported file type');
  } catch (error) {
    console.error('AI Service file processing error:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
};

// Check AI service health
const checkHealth = async () => {
  try {
    const response = await axios.get(`${AI_SERVICE_URL}/api/health`, {
      timeout: 5000
    });
    return { online: true, data: response.data };
  } catch (error) {
    return { online: false, error: error.message };
  }
};

// Fallback extraction when AI service is unavailable - uses compromise NLP
const generateFallbackExtraction = (text) => {
  // Use the new AI indexing module with compromise NLP
  const aiResult = aiIndexing(text);
  
  return {
    caseType: aiResult.caseType,
    injury: aiResult.injuryType,
    keywords: aiResult.keywords,
    extractedData: {
      severity: aiResult.severity,
      indexedAt: aiResult.indexedAt,
      notes: 'Indexed using local NLP module'
    }
  };
};

// Fallback analysis when AI service is unavailable
const generateFallbackAnalysis = (text) => {
  const wordCount = text.split(/\s+/).length;
  
  return {
    wordCount,
    summary: text.substring(0, 200) + '...',
    keywords: [],
    sentiment: 'neutral',
    entities: []
  };
};

module.exports = {
  indexDocument,
  analyzeDocument,
  processFile,
  checkHealth
};
