const mongoose = require('mongoose');

const caseSchema = new mongoose.Schema({
  caseId: {
    type: String,
    unique: true,
    trim: true,
    index: true
  },
  caseNumber: {
    type: String,
    unique: true,
    trim: true
  },
  caseType: {
    type: String,
    required: [true, 'Case type is required'],
    enum: ['Road Accident', 'Physical Assault', 'Burn Injury', 'Fall Injury', 'Poisoning', 'Domestic Violence', 'Workplace Injury', 'Sexual Assault', 'Child Abuse', 'Medical Malpractice', 'Suicide Attempt', 'Unknown', 'Other', 'Accident', 'Assault']
  },
  title: {
    type: String,
    required: [true, 'Case title is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Description is required']
  },
  patientName: {
    type: String,
    required: [true, 'Patient name is required'],
    trim: true
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  patientAge: {
    type: Number
  },
  patientGender: {
    type: String,
    enum: ['Male', 'Female', 'Other']
  },
  patientPhone: {
    type: String
  },
  injuryDescription: {
    type: String
  },
  hospitalName: {
    type: String
  },
  policeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  policeName: {
    type: String
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  doctorName: {
    type: String
  },
  assignedDoctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  firNumber: {
    type: String
  },
  firDate: {
    type: Date
  },
  incidentDate: {
    type: Date,
    required: [true, 'Incident date is required']
  },
  reportedDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['Draft', 'Submitted', 'Under Review', 'Correction Requested', 'Verified', 'Report Ready', 'Pending', 'Waiting Police Verification', 'Under Police Review', 'Forwarded to Judiciary', 'Forwarded to Judge', 'forwarded_to_judge', 'approved_by_judge', 'APPROVED_BY_JUDGE', 'FORWARDED_TO_JUDGE', 'VERIFIED_BY_JUDGE', 'Closed'],
    default: 'Pending'
  },
  isSubmitted: {
    type: Boolean,
    default: false
  },
  submittedAt: Date,
  medicalDetails: {
    examinationDate: Date,
    examinationFindings: String,
    treatment: String,
    prognosis: String,
    recommendations: String
  },
  documents: [{
    fileName: String,
    filePath: String,
    fileType: String,
    uploadDate: {
      type: Date,
      default: Date.now
    }
  }],
  aiKeywords: {
    type: [String],
    default: []
  },
  aiIndexing: {
    caseType: String,
    injury: String,
    injuryType: String, // From AI - type of injury identified
    keywords: [String],
    severity: String, // From AI - severity level
    extractedData: mongoose.Schema.Types.Mixed,
    indexedAt: Date
  },
  blockchainHash: {
    type: String,
    default: null
    // Hash is immutable once set - cannot be modified
  },
  reportStatus: {
    type: String,
    enum: ['Pending', 'Ready'],
    default: 'Pending'
  },
  reportPath: {
    type: String,
    default: null
  },
  blockchainVerified: {
    type: Boolean,
    default: false
  },
  policeVerified: {
    type: Boolean,
    default: false
  },
  policeVerifiedAt: Date,
  policeVerifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  judiciaryVerified: {
    type: Boolean,
    default: false
  },
  judiciaryVerifiedAt: Date,
  judgeVerified: {
    type: Boolean,
    default: false
  },
  judgeVerifiedAt: Date,
  blockTimestamp: {
    type: Date,
    default: null
    // Timestamp when blockchain hash was generated
  },
  verificationStatus: {
    type: String,
    enum: ['Pending', 'Verified', 'Failed', 'Immutable'],
    default: 'Pending'
    // Status of blockchain verification - 'Immutable' means verified and locked
  },
  verifiedAt: Date,
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  accessLogs: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    action: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    ipAddress: String
  }],
  investigationNotes: [{
    note: String,
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    addedByName: String,
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  forwardedToJudiciary: {
    type: Boolean,
    default: false
  },
  forwardedToJudiciaryAt: Date,
  forwardedToJudge: {
    type: Boolean,
    default: false
  },
  forwardedToJudgeAt: Date,
  forwardedAt: Date,
  approvedAt: Date,
  judiciaryNotes: String,
  judiciaryApproved: {
    type: Boolean,
    default: null
  },
  judiciaryApprovedAt: Date,
  judiciaryApprovedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  judiciaryRemarks: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Generate case number and caseId before saving
caseSchema.pre('save', async function(next) {
  if (!this.caseNumber) {
    this.caseNumber = `MLC-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  }
  // Generate user-friendly caseId (shorter format)
  if (!this.caseId) {
    let nextNum = 1;
    try {
      const lastCase = await this.constructor.findOne({}, {}, { sort: { 'createdAt' : -1 } });
      if (lastCase && lastCase.caseId) {
        const parts = lastCase.caseId.split('-');
        if (parts.length > 1 && !isNaN(parseInt(parts[1]))) {
          nextNum = parseInt(parts[1]) + 1;
        } else {
          nextNum = (await this.constructor.countDocuments()) + 1;
        }
      }
    } catch (err) {
      nextNum = (await this.constructor.countDocuments()) + 1;
    }
    
    // Additional uniqueness check
    let uniqueStr = String(nextNum).padStart(3, '0');
    // To ensure no collision if still problematic
    uniqueStr += '-' + Math.floor(Math.random() * 100).toString().padStart(2, '0');
    
    this.caseId = `MLC-${uniqueStr}`;
  }
  this.updatedAt = Date.now();
  next();
});

// Ensure blockchain hash is immutable once set
caseSchema.pre('save', function(next) {
  // Only check if document already exists and blockchainHash is being modified
  if (this.isNew || !this.blockchainHash) {
    return next();
  }
  
  // Get the original document from database if this is an update
  this.constructor.findById(this._id).then(doc => {
    if (doc && doc.blockchainHash && doc.blockchainHash !== this.blockchainHash) {
      const err = new Error('Blockchain hash is immutable and cannot be modified once set');
      return next(err);
    }
    next();
  }).catch(err => next(err));
});

// Static method to verify blockchain hash integrity
caseSchema.statics.verifyHash = async function(caseId) {
  const medicoCase = await this.findById(caseId);
  if (!medicoCase || !medicoCase.blockchainHash) {
    return { isValid: false, message: 'No blockchain hash found' };
  }
  
  // Check if verification status is Immutable
  if (medicoCase.verificationStatus === 'Immutable') {
    return {
      isValid: true,
      hash: medicoCase.blockchainHash,
      timestamp: medicoCase.blockTimestamp,
      status: medicoCase.verificationStatus,
      message: 'Hash is immutable and verified'
    };
  }
  
  return {
    isValid: false,
    hash: medicoCase.blockchainHash,
    timestamp: medicoCase.blockTimestamp,
    status: medicoCase.verificationStatus,
    message: 'Hash verification pending'
  };
};

caseSchema.index({ caseNumber: 'text', patientName: 'text', title: 'text' });

caseSchema.index({ doctorId: 1 });
caseSchema.index({ patientId: 1 });
caseSchema.index({ policeId: 1 });
caseSchema.index({ status: 1 });
caseSchema.index({ createdAt: -1 });
caseSchema.index({ blockchainVerified: 1 });
caseSchema.index({ forwardedToJudiciary: 1 });
caseSchema.index({ forwardedToJudge: 1 });

module.exports = mongoose.model('Case', caseSchema);
