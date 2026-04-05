const express = require('express');
const router = express.Router();
const { getPatientRecords, getPatientRecordById, downloadReport, getPatientNotifications, updatePatientProfile } = require('../controllers/patientRecordController');
const { protect, authorize } = require('../middleware/auth');

// @desc    Get all patient records (cases and reports)
// @route   GET /api/patient-records
// @access  Private (Patient only)
router.get('/', protect, authorize('patient'), getPatientRecords);

// @desc    Get patient MY cases only
// @route   GET /api/patient/mycases
// @access  Private (Patient only)
router.get('/mycases', protect, getPatientRecords);

// @desc    Get patient notifications
// @route   GET /api/patient/notifications
// @access  Private (Patient only)
router.get('/notifications', protect, getPatientNotifications);

// @desc    Update patient profile
// @route   PUT /api/patient/updateProfile
// @access  Private (Patient only)
router.put('/updateProfile', protect, updatePatientProfile);

// @desc    Download report document
// @route   GET /api/patient-records/:id/download
// @access  Private (Patient only)
router.get('/:id/download', protect, downloadReport);

// @desc    Get single patient record
// @route   GET /api/patient-records/:id
// @access  Private (Patient only)
router.get('/:id', protect, getPatientRecordById);

module.exports = router;
