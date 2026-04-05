const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const Case = require('../models/Case');
const Report = require('../models/Report');
const User = require('../models/User');
const Log = require('../models/Log');
const blockchainService = require('../services/blockchainService');
const { clearCache } = require('../middleware/cache');

const getDashboard = async (req, res) => {
  try {
    let dashboardData = {};
    const userId = req.user._id;

    switch (req.user.role) {
      case 'doctor':
        const [doctorStats] = await Case.aggregate([
          { $match: { doctorId: userId } },
          { $group: { 
            _id: null, 
            totalCases: { $sum: 1 },
            pendingCases: { $sum: { $cond: [{ $eq: ['$status', 'Pending'] }, 1, 0] } },
            verifiedCases: { $sum: { $cond: [{ $eq: ['$status', 'Verified'] }, 1, 0] } }
          }}
        ]);
        
        const doctorReportsCount = await Report.countDocuments({ doctorId: userId });
        
        const recentDoctorCases = await Case.find({ doctorId: userId })
          .sort({ createdAt: -1 })
          .limit(5)
          .select('caseNumber title patientName status createdAt')
          .lean();
        
        dashboardData = {
          totalCases: doctorStats?.totalCases || 0,
          pendingCases: doctorStats?.pendingCases || 0,
          verifiedCases: doctorStats?.verifiedCases || 0,
          totalReports: doctorReportsCount,
          recentCases: recentDoctorCases
        };
        break;

      case 'police':
        const [policeStats] = await Case.aggregate([
          { $group: { 
            _id: null, 
            totalCases: { $sum: 1 },
            pendingCases: { $sum: { $cond: [{ $eq: ['$status', 'Pending'] }, 1, 0] } },
            verifiedCases: { $sum: { $cond: [{ $eq: ['$status', 'Verified'] }, 1, 0] } }
          }}
        ]);
        
        const recentPoliceCases = await Case.find()
          .sort({ createdAt: -1 })
          .limit(5)
          .select('caseNumber title patientName status createdAt')
          .lean();
        
        dashboardData = {
          totalCases: policeStats?.totalCases || 0,
          pendingCases: policeStats?.pendingCases || 0,
          verifiedCases: policeStats?.verifiedCases || 0,
          recentCases: recentPoliceCases
        };
        break;

      case 'judiciary':
        const recentJudiciaryCases = await Case.find({ 
          $or: [
            { status: 'FORWARDED_TO_JUDGE' },
            { status: 'forwarded_to_judge' },
            { status: 'Forwarded to Judge' },
            { status: 'Forwarded to Judiciary' }
          ]
        })
          .sort({ createdAt: -1 })
          .limit(5)
          .select('caseNumber title patientName status createdAt')
          .lean();
        
        const judiciaryCount = await Case.countDocuments({ 
          $or: [
            { status: 'FORWARDED_TO_JUDGE' },
            { status: 'forwarded_to_judge' },
            { status: 'Forwarded to Judge' },
            { status: 'Forwarded to Judiciary' }
          ]
        });
        
        dashboardData = {
          totalForwardedCases: judiciaryCount,
          recentCases: recentJudiciaryCases
        };
        break;

      case 'patient':
        const patientRecords = await Case.find({ patientId: userId })
          .select('caseNumber title caseType status createdAt')
          .lean();
        
        dashboardData = {
          totalRecords: patientRecords.length,
          records: patientRecords
        };
        break;

      case 'admin':
        const [caseStats, reportStats, userStats] = await Promise.all([
          Case.aggregate([
            { $group: { 
              _id: null, 
              totalCases: { $sum: 1 },
              verified: { $sum: { $cond: ['$blockchainVerified', 1, 0] } }
            }}
          ]),
          Report.estimatedDocumentCount(),
          User.aggregate([
            { $group: { 
              _id: '$role', 
              count: { $sum: 1 } 
            }}
          ])
        ]);
        
        const recentLogs = await Log.find()
          .sort({ createdAt: -1 })
          .limit(20)
          .populate('userId', 'username fullName')
          .lean();
        
        const blockchainStats = await blockchainService.getBlockchainStats();
        
        const roleCounts = {};
        userStats.forEach(u => { roleCounts[u._id === 'doctor' ? 'doctors' : u._id === 'police' ? 'police' : u._id === 'judiciary' ? 'judiciary' : u._id === 'patient' ? 'patients' : u._id === 'admin' ? 'admin' : 'other'] = u.count; });
        
        dashboardData = {
          totalCases: caseStats[0]?.totalCases || 0,
          totalReports: reportStats,
          totalUsers: caseStats[0]?.totalCases ? Object.values(roleCounts).reduce((a, b) => a + b, 0) : 0,
          usersByRole: {
            doctors: roleCounts.doctors || 0,
            police: roleCounts.police || 0,
            judiciary: roleCounts.judiciary || 0,
            patients: roleCounts.patients || 0,
            admin: roleCounts.admin || 0
          },
          blockchain: blockchainStats,
          recentActivity: recentLogs
        };
        break;

      default:
        dashboardData = { message: 'No specific dashboard for this role' };
    }

    res.json({
      success: true,
      data: dashboardData,
      userRole: req.user.role
    });
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard data',
      error: error.message
    });
  }
};

// @desc    Get activity logs
// @route   GET /api/dashboard/activity
// @access  Private/Admin
const getActivity = async (req, res) => {
  try {
    const { page = 1, limit = 50, action } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    if (action) query.action = action;

    const logs = await Log.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .populate('userId', 'username fullName role')
      .lean();

    const total = await Log.countDocuments(query);

    res.json({
      success: true,
      count: logs.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: logs
    });
  } catch (error) {
    console.error('Get activity error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching activity logs',
      error: error.message
    });
  }
};

// @desc    Get system health
// @route   GET /api/dashboard/health
// @access  Private
const getSystemHealth = async (req, res) => {
  try {
    const blockchainStats = await blockchainService.getBlockchainStats();
    
    const health = {
      status: 'healthy',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      database: 'connected',
      blockchain: blockchainStats
    };

    res.json({
      success: true,
      data: health
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error checking system health',
      error: error.message
    });
  }
};

router.get('/', protect, getDashboard);
router.get('/activity', protect, authorize('admin'), (req, res, next) => {
  clearCache('/dashboard');
  next();
}, getActivity);
router.get('/health', protect, getSystemHealth);

module.exports = router;
