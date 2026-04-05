const CryptoJS = require('crypto-js');
const BlockchainLedger = require('../models/BlockchainLedger');

// Generate SHA256 hash
const generateHash = (data) => {
  return CryptoJS.SHA256(JSON.stringify(data)).toString();
};

// Create a new block in the blockchain
const createBlock = async (documentData, userId) => {
  try {
    // Get the latest block
    const latestBlock = await BlockchainLedger.findOne().sort({ blockNumber: -1 });
    
    const previousHash = latestBlock ? latestBlock.hash : '0';
    const blockNumber = latestBlock ? latestBlock.blockNumber + 1 : 1;
    
    // Create document hash
    const documentHash = generateHash(documentData);
    
    // Create block data
    const blockData = {
      documentId: documentData._id,
      documentType: documentData.documentType || 'Case',
      caseNumber: documentData.caseNumber,
      documentHash,
      previousHash,
      blockNumber,
      timestamp: new Date(),
      nonce: 0,
      createdBy: userId,
      metadata: documentData.metadata || {}
    };
    
    // Generate block hash (including nonce for proof of work simulation)
    const blockString = JSON.stringify({
      ...blockData,
      nonce: blockData.nonce
    });
    
    const hash = CryptoJS.SHA256(blockString).toString();
    blockData.hash = hash;
    
    // Save to blockchain ledger
    const ledgerEntry = new BlockchainLedger(blockData);
    await ledgerEntry.save();
    
    return {
      success: true,
      block: ledgerEntry,
      hash: documentHash
    };
  } catch (error) {
    console.error('Blockchain createBlock error:', error);
    throw error;
  }
};

// Verify document integrity
const verifyDocument = async (documentId, currentData) => {
  try {
    // Get the blockchain record
    const ledgerEntry = await BlockchainLedger.findOne({ documentId });
    
    if (!ledgerEntry) {
      return {
        success: false,
        verified: false,
        message: 'No blockchain record found for this document'
      };
    }
    
    // Generate new hash from current data
    const newHash = generateHash(currentData);
    
    // Compare hashes
    const isValid = newHash === ledgerEntry.documentHash;
    
    // Add verification to history
    ledgerEntry.verificationHistory.push({
      verifiedAt: new Date(),
      isValid,
      hashCompared: newHash
    });
    
    await ledgerEntry.save();
    
    return {
      success: true,
      verified: isValid,
      message: isValid ? 'Document is authentic' : 'Document has been tampered',
      storedHash: ledgerEntry.documentHash,
      currentHash: newHash,
      blockNumber: ledgerEntry.blockNumber,
      timestamp: ledgerEntry.timestamp
    };
  } catch (error) {
    console.error('Blockchain verifyDocument error:', error);
    throw error;
  }
};

// Get blockchain history for a document
const getBlockchainHistory = async (documentId) => {
  try {
    const ledger = await BlockchainLedger.findOne({ documentId })
      .populate('createdBy', 'username fullName')
      .populate('verificationHistory.verifiedBy', 'username fullName');
    
    if (!ledger) {
      return null;
    }
    
    return ledger;
  } catch (error) {
    console.error('Blockchain getBlockchainHistory error:', error);
    throw error;
  }
};

// Get all blocks
const getAllBlocks = async (limit = 50, skip = 0) => {
  try {
    const blocks = await BlockchainLedger.find()
      .sort({ blockNumber: -1 })
      .limit(limit)
      .skip(skip)
      .populate('createdBy', 'username fullName');
    
    return blocks;
  } catch (error) {
    console.error('Blockchain getAllBlocks error:', error);
    throw error;
  }
};

// Get blockchain statistics
const getBlockchainStats = async () => {
  try {
    const totalBlocks = await BlockchainLedger.countDocuments();
    const verifiedCount = await BlockchainLedger.countDocuments({ verified: true });
    const latestBlock = await BlockchainLedger.findOne().sort({ blockNumber: -1 });
    
    return {
      totalBlocks,
      verifiedCount,
      latestBlockNumber: latestBlock ? latestBlock.blockNumber : 0,
      chainValid: totalBlocks > 0
    };
  } catch (error) {
    console.error('Blockchain getBlockchainStats error:', error);
    throw error;
  }
};

module.exports = {
  generateHash,
  createBlock,
  verifyDocument,
  getBlockchainHistory,
  getAllBlocks,
  getBlockchainStats
};
