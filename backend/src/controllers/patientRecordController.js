const Case = require('../models/Case');
const Report = require('../models/Report');
const path = require('path');
const fs = require('fs');

// @desc    Get all patient records (cases and reports)
// @route   GET /api/patient-records
// @access  Private (Patient only)
const getPatientRecords = async (req, res) => {
  try {
    // Only allow patients to access this endpoint
    if (req.user.role !== 'patient') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Patient role required.'
      });
    }

    // Use patientId from JWT token for security
    const patientId = req.user._id;
    const patientName = req.user.fullName;
    const { page = 1, limit = 20 } = req.query;

    // Get cases for this patient - filter by patientId for security
    const casesQuery = { 
      $or: [
        { patientId: patientId },
        { patientName: patientName }
      ]
    };
    
    let cases = [];
    try {
      cases = await Case.find(casesQuery)
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit))
        .lean();
    } catch (caseError) {
      console.error('Error fetching patient cases:', caseError);
      cases = [];
    }

    // Get reports for this patient - filter by patientId for security
    const reportsQuery = { 
      $or: [
        { patientId: patientId },
        { patientName: patientName }
      ]
    };
    
    let reports = [];
    try {
      reports = await Report.find(reportsQuery)
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit))
        .lean();
    } catch (reportError) {
      console.error('Error fetching patient reports:', reportError);
      reports = [];
    }

    // Format case data with all required fields
    const formattedCases = cases.map(c => ({
      _id: c._id || '',
      recordType: 'case',
      caseNumber: c.caseNumber || '',
      patientName: c.patientName || '',
      patientId: c.patientId || null,
      doctorName: c.doctorName || '',
      doctorDepartment: c.doctorName ? 'Medical' : '',
      hospitalName: c.hospitalName || '',
      caseType: c.caseType || '',
      date: c.incidentDate || c.createdAt,
      status: c.status || 'Pending',
      reportStatus: c.reportStatus || 'Pending',
      reportPath: c.reportPath || null,
      blockchainVerified: c.blockchainVerified || false,
      blockchainHash: c.blockchainHash || null,
      documents: c.documents || [],
      // Timeline fields
      createdAt: c.createdAt,
      submittedAt: c.submittedAt,
      verifiedAt: c.verifiedAt,
      closedAt: c.closedAt,
      forwardedToJudiciaryAt: c.forwardedToJudiciaryAt,
      judiciaryApprovedAt: c.judiciaryApprovedAt,
      // Police verification
      policeVerified: c.policeVerified || false,
      policeVerifiedAt: c.policeVerifiedAt,
      forwardedToJudge: c.forwardedToJudge || false,
      forwardedToJudgeAt: c.forwardedToJudgeAt
    }));

    // Format report data with doctor details
    const formattedReports = reports.map(r => ({
      _id: r._id || '',
      recordType: 'report',
      caseNumber: r.caseNumber || '',
      patientName: r.patientName || '',
      doctorName: r.doctorName || '',
      doctorDepartment: r.doctorName ? 'Medical' : '',
      hospitalName: r.hospitalName || '',
      caseType: r.reportType || '',
      date: r.dateOfExamination || r.createdAt,
      status: r.isVerified ? 'Verified' : 'Pending',
      reportStatus: r.isVerified ? 'Ready' : 'Pending',
      filePath: r.filePath || null,
      fileName: r.fileName || null,
      title: r.title || '',
      content: r.content || '',
      blockchainVerified: r.isVerified || false,
      blockchainHash: r.blockchainHash || null,
      createdAt: r.createdAt
    }));

    // Combine and sort by date
    const allRecords = [...formattedCases, ...formattedReports].sort(
      (a, b) => new Date(b.date || 0) - new Date(a.date || 0)
    );

    let totalCases = 0, totalReports = 0;
    try {
      totalCases = await Case.countDocuments(casesQuery);
      totalReports = await Report.countDocuments(reportsQuery);
    } catch (countError) {
      console.error('Error counting records:', countError);
    }
    const total = totalCases + totalReports;

    res.json({
      success: true,
      count: allRecords.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: allRecords
    });
  } catch (error) {
    console.error('Get patient records error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching patient records',
      error: error.message
    });
  }
};

// @desc    Get single patient record
// @route   GET /api/patient-records/:id
// @access  Private (Patient only)
const getPatientRecordById = async (req, res) => {
  try {
    if (req.user.role !== 'patient') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Patient role required.'
      });
    }

    // Use patientId from JWT token for security
    const patientId = req.user._id;
    const patientName = req.user.fullName;
    const { id } = req.params;

    // Try to find in cases first - filter by patientId
    let record = await Case.findOne({ 
      _id: id, 
      $or: [
        { patientId: patientId },
        { patientName: patientName }
      ]
    });
    
    if (record) {
      return res.json({
        success: true,
        data: {
          _id: record._id,
          recordType: 'case',
          caseNumber: record.caseNumber,
          doctorName: record.doctorName,
          hospitalName: record.hospitalName,
          caseType: record.caseType,
          date: record.incidentDate,
          status: record.status,
          description: record.description,
          injuryDescription: record.injuryDescription,
          blockchainVerified: record.blockchainVerified,
          documents: record.documents,
          createdAt: record.createdAt
        }
      });
    }

    // Try to find in reports
    record = await Report.findOne({ _id: id, patientName });
    
    if (record) {
      return res.json({
        success: true,
        data: {
          _id: record._id,
          recordType: 'report',
          caseNumber: record.caseNumber,
          doctorName: record.doctorName,
          hospitalName: record.hospitalName,
          caseType: record.reportType,
          date: record.dateOfExamination,
          status: record.isVerified ? 'Verified' : 'Pending',
          content: record.content,
          filePath: record.filePath,
          fileName: record.fileName,
          title: record.title,
          blockchainVerified: record.isVerified,
          createdAt: record.createdAt
        }
      });
    }

    res.status(404).json({
      success: false,
      message: 'Record not found'
    });
  } catch (error) {
    console.error('Get patient record error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching patient record',
      error: error.message
    });
  }
};

// @desc    Download report document
// @route   GET /api/patient-records/:id/download
// @access  Private (Patient only)
const downloadReport = async (req, res) => {
  try {
    if (req.user.role !== 'patient') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Patient role required.'
      });
    }

    // Use patientId from JWT token for security
    const patientId = req.user._id;
    const patientName = req.user.fullName;
    const { id } = req.params;

    // Try to find in reports - filter by patientId
    const report = await Report.findOne({ 
      _id: id, 
      $or: [
        { patientId: patientId },
        { patientName: patientName }
      ]
    });
    
    if (!report) {
      // Try to find in cases and get document - filter by patientId
      const medicalCase = await Case.findOne({ 
        _id: id, 
        $or: [
          { patientId: patientId },
          { patientName: patientName }
        ]
      });
      if (!medicalCase) {
        return res.status(404).json({
          success: false,
          message: 'Record not found'
        });
      }

      // If case has documents, download the first one
      if (medicalCase.documents && medicalCase.documents.length > 0) {
        const doc = medicalCase.documents[0];
        const uploadsDir = path.join(__dirname, '../uploads');
        const filePath = path.join(uploadsDir, 'cases', doc.fileName);
        
        if (fs.existsSync(filePath)) {
          return res.download(filePath, doc.fileName);
        }
      }

      return res.status(404).json({
        success: false,
        message: 'No document available for download'
      });
    }

    // Download report file
    if (report.filePath) {
      const uploadsDir = path.join(__dirname, '../uploads');
      const filePath = path.join(uploadsDir, 'reports', report.fileName || report.filePath.split('/').pop());
      
      if (fs.existsSync(filePath)) {
        return res.download(filePath, report.fileName || 'report.pdf');
      }
    }

    res.status(404).json({
      success: false,
      message: 'No document available for download'
    });
  } catch (error) {
    console.error('Download report error:', error);
    res.status(500).json({
      success: false,
      message: 'Error downloading report',
      error: error.message
    });
  }
};

// @desc    Get patient notifications based on report status
// @route   GET /api/patient/notifications
// @access  Private (Patient only)
const getPatientNotifications = async (req, res) => {
  try {
    if (req.user.role !== 'patient') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Patient role required.'
      });
    }

    // Get cases for this patient with report status
    const cases = await Case.find({ patientId: req.user._id })
      .sort({ createdAt: -1 })
      .select('caseNumber caseType reportStatus blockchainHash createdAt');

    // Build notifications based on report status
    const notifications = cases.map(c => ({
      id: c._id,
      caseNumber: c.caseNumber,
      caseType: c.caseType,
      reportStatus: c.reportStatus || 'Pending',
      message: c.reportStatus === 'Ready' 
        ? 'Your medical report is ready. Click to view.'
        : 'Your medical report is not ready yet.',
      date: c.createdAt
    }));

    res.json({
      success: true,
      count: notifications.length,
      data: notifications
    });
  } catch (error) {
    console.error('Get patient notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching notifications',
      error: error.message
    });
  }
};

// @desc    Update patient profile
// @route   PUT /api/patient/updateProfile
// @access  Private (Patient only)
const updatePatientProfile = async (req, res) => {
  try {
    if (req.user.role !== 'patient') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Patient role required.'
      });
    }

    const { fullName, phone, department, hospital } = req.body;

    // Build update object
    const updateData = {};
    if (fullName) updateData.fullName = fullName;
    if (phone) updateData.phone = phone;
    if (department) updateData.department = department;
    if (hospital) updateData.hospital = hospital;

    // Update user profile
    const User = require('../models/User');
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      success: true,
      message: 'Profile Updated Successfully',
      data: updatedUser
    });
  } catch (error) {
    console.error('Update patient profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating profile',
      error: error.message
    });
  }
};

module.exports = {
  getPatientRecords,
  getPatientRecordById,
  downloadReport,
  getPatientNotifications,
  updatePatientProfile
};
