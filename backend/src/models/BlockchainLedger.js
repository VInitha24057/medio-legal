const mongoose = require('mongoose');

const blockchainLedgerSchema = new mongoose.Schema({
  documentId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'documentType'
  },
  documentType: {
    type: String,
    enum: ['Case', 'Report'],
    required: true
  },
  caseNumber: {
    type: String,
    required: true
  },
  documentHash: {
    type: String,
    required: true
  },
  previousHash: {
    type: String,
    default: '0'
  },
  blockNumber: {
    type: Number,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  nonce: {
    type: Number,
    default: 0
  },
  hash: {
    type: String,
    required: true
  },
  verified: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  metadata: {
    fileName: String,
    fileType: String,
    fileSize: Number,
    uploadDate: Date
  },
  verificationHistory: [{
    verifiedAt: {
      type: Date,
      default: Date.now
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    isValid: Boolean,
    hashCompared: String
  }]
});

// Create index for efficient querying
blockchainLedgerSchema.index({ caseNumber: 1 });
blockchainLedgerSchema.index({ documentHash: 1 });
blockchainLedgerSchema.index({ blockNumber: 1 });

module.exports = mongoose.model('BlockchainLedger', blockchainLedgerSchema);
