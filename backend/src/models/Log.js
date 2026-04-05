const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  username: String,
  action: {
    type: String,
    required: true,
    enum: [
      'LOGIN',
      'LOGOUT',
      'LOGIN_FAILED',
      'REGISTER',
      'CREATE_CASE',
      'VIEW_CASE',
      'UPDATE_CASE',
      'DELETE_CASE',
      'UPLOAD_DOCUMENT',
      'VIEW_DOCUMENT',
      'AI_INDEX',
      'GENERATE_HASH',
      'VERIFY_HASH',
      'USER_CREATE',
      'USER_UPDATE',
      'USER_DELETE',
      'ROLE_CHANGE',
      'FORWARD_TO_JUDICIARY',
      'APPROVE_CASE',
      'REJECT_CASE',
      'ADD_INVESTIGATION_NOTE'
    ]
  },
  resourceType: {
    type: String,
    enum: ['User', 'Case', 'Report', 'Blockchain', 'System']
  },
  resourceId: {
    type: mongoose.Schema.Types.ObjectId
  },
  description: {
    type: String
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  },
  status: {
    type: String,
    enum: ['success', 'failure', 'warning'],
    default: 'success'
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient querying
logSchema.index({ userId: 1, createdAt: -1 });
logSchema.index({ action: 1 });
logSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Log', logSchema);
