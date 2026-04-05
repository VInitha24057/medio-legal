const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Report title is required'],
    trim: true
  },
  caseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Case',
    required: true
  },
  caseNumber: {
    type: String,
    required: true
  },
  patientName: {
    type: String,
    required: [true, 'Patient name is required']
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  reportType: {
    type: String,
    enum: ['Medical Certificate', 'Post Mortem', 'Injury Report', 'Treatment Record', 'Discharge Summary'],
    required: true
  },
  content: {
    type: String,
    required: [true, 'Report content is required']
  },
  filePath: {
    type: String
  },
  fileName: {
    type: String
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  doctorName: {
    type: String,
    required: true
  },
  hospitalName: {
    type: String,
    required: true
  },
  dateOfExamination: {
    type: Date,
    required: true
  },
  aiAnalysis: {
    extractedEntities: mongoose.Schema.Types.Mixed,
    keywords: [String],
    sentiment: String,
    analyzedAt: Date
  },
  blockchainHash: {
    type: String
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verifiedAt: Date,
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

reportSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Report', reportSchema);
