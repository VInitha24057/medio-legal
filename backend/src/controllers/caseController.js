const Case = require('../models/Case');
const Log = require('../models/Log');
const blockchainService = require('../services/blockchainService');
const aiService = require('../services/aiService');
const { clearCache } = require('../middleware/cache');
const path = require('path');
const fs = require('fs');

// @desc    Create new case
// @route   POST /api/cases
// @access  Private (Doctor or Police)
const createCase = async (req, res) => {
  try {
    const {
      caseType,
      title,
      description,
      patientName,
      patientId,
      patientAge,
      patientGender,
      patientPhone,
      injuryDescription,
      hospitalName,
      incidentDate,
      firNumber,
      firDate,
      assignedDoctorId
    } = req.body;

    // Build case object based on role
    const caseData = {
      caseType,
      title,
      description,
      patientName,
      patientId: patientId || null, // Store patientId for security
      patientAge,
      patientGender,
      patientPhone,
      injuryDescription,
      hospitalName,
      incidentDate,
      firNumber,
      firDate,
      status: 'Pending',
      verificationStatus: 'Pending'
    };

    // Doctor creates case - they are the treating physician
    if (req.user.role === 'doctor') {
      caseData.doctorId = req.user._id;
      caseData.doctorName = req.user.fullName;
    }
    // Police creates case - record police info
    else if (req.user.role === 'police') {
      caseData.policeId = req.user._id;
      caseData.policeName = req.user.fullName;
      caseData.status = 'Waiting Police Verification';
    }

    // If police assigned a doctor
    if (assignedDoctorId && req.user.role === 'police') {
      const User = require('../models/User');
      const doctor = await User.findById(assignedDoctorId);
      if (doctor && doctor.role === 'doctor') {
        caseData.assignedDoctorId = assignedDoctorId;
        caseData.doctorId = assignedDoctorId;
        caseData.doctorName = doctor.fullName;
        caseData.status = 'Waiting Police Verification';
      }
    }

    // Create case
    const newCase = await Case.create(caseData);

    // Auto-run AI indexing after case creation
    try {
      const caseText = `${newCase.description} ${newCase.injuryDescription || ''} ${newCase.caseType}`;
      const aiResult = await aiService.indexDocument(caseText);
      const aiData = aiResult.data;

      newCase.aiIndexing = {
        caseType: aiData.caseType || newCase.caseType,
        injury: aiData.injury || newCase.injuryDescription,
        keywords: aiData.keywords || [],
        extractedData: aiData.extractedData || {},
        indexedAt: Date.now()
      };
      await newCase.save();
    } catch (aiError) {
      console.error('Auto AI indexing error:', aiError);
    }

    // Auto-generate blockchain hash after case creation
    try {
      const documentData = {
        _id: newCase._id,
        documentType: 'Case',
        caseNumber: newCase.caseNumber,
        patientName: newCase.patientName,
        caseType: newCase.caseType,
        description: newCase.description,
        doctorName: newCase.doctorName,
        incidentDate: newCase.incidentDate,
        createdAt: newCase.createdAt
      };
      const result = await blockchainService.createBlock(documentData, newCase.doctorId);

      newCase.blockchainHash = result.hash;
      newCase.blockchainVerified = true;
      newCase.verificationStatus = 'Immutable';
      newCase.verifiedAt = Date.now();
      newCase.blockTimestamp = result.block.timestamp;
      await newCase.save();
    } catch (hashError) {
      console.error('Auto blockchain hash error:', hashError);
    }

    // Log case creation
    await Log.create({
      userId: req.user._id,
      username: req.user.username,
      action: 'CREATE_CASE',
      resourceType: 'Case',
      resourceId: newCase._id,
      description: `New case created: ${newCase.caseNumber}`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      status: 'success'
    });

    clearCache('/dashboard');

    // Fetch updated case with AI indexing and blockchain hash
    const updatedCase = await Case.findById(newCase._id);

    res.status(201).json({
      success: true,
      message: 'Case created successfully with AI indexing and blockchain verification',
      data: updatedCase
    });
  } catch (error) {
    console.error('Create case error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating case',
      error: error.message
    });
  }
};

// @desc    Get all cases
// @route   GET /api/cases
// @access  Private
const getCases = async (req, res) => {
  try {
    const { status, caseType, search, page = 1, limit = 20 } = req.query;
    
    let query = {};

    // Filter by user role - STRICT DATA ISOLATION
    if (req.user.role === 'doctor') {
      // Doctors can view ONLY cases assigned to them (either as treating doctor or assigned doctor)
      query.$or = [
        { doctorId: req.user._id },
        { assignedDoctorId: req.user._id }
      ];
    } else if (req.user.role === 'patient') {
      // Patients can only see their own cases - STRICT filter by patientId from JWT
      query.patientId = req.user._id;
    } else if (req.user.role === 'police') {
      // Police can only see cases assigned to them or pending verification
      // They can see all cases that need police verification (status: 'Waiting Police Verification' or 'Under Police Review')
      query.status = { $in: ['Waiting Police Verification', 'Under Police Review'] };
    } else if (req.user.role === 'judiciary') {
      // Judiciary can only see cases forwarded to them by police
      query.$or = [
        { forwardedToJudiciary: true },
        { forwardedToJudge: true },
        { status: 'Forwarded to Judge' }
      ];
    }
    // Admin (role === 'admin') sees all cases - no filter needed

    // Apply filters
    if (status) query.status = status;
    if (caseType) query.caseType = caseType;
    if (search) {
      query.$or = [
        { caseNumber: { $regex: search, $options: 'i' } },
        { patientName: { $regex: search, $options: 'i' } },
        { title: { $regex: search, $options: 'i' } },
        { 'aiIndexing.keywords': { $regex: search, $options: 'i' } },
        { 'aiIndexing.injury': { $regex: search, $options: 'i' } },
        { 'aiIndexing.caseType': { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;
    
    const projection = 'caseNumber title caseType patientName patientAge patientGender status createdAt blockchainVerified blockchainHash aiIndexing doctorName';
    
    const [cases, total] = await Promise.all([
      Case.find(query, projection)
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip(skip)
        .lean(),
      Case.countDocuments(query)
    ]);

    res.json({
      success: true,
      count: cases.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: cases
    });
  } catch (error) {
    console.error('Get cases error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching cases',
      error: error.message
    });
  }
};

// @desc    Get single case
// @route   GET /api/cases/:id
// @access  Private
const getCase = async (req, res) => {
  try {
    const medicoCase = await Case.findById(req.params.id)
      .populate('doctorId', 'username fullName email')
      .populate('verifiedBy', 'username fullName');

    if (!medicoCase) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }

    // SECURITY: Role-based access control for single case retrieval
    const userRole = req.user.role;
    const userId = req.user._id.toString();
    
    let hasAccess = false;
    
    if (userRole === 'admin') {
      // Admin can access all cases
      hasAccess = true;
    } else if (userRole === 'doctor') {
      // Doctor can only access their own cases
      hasAccess = medicoCase.doctorId && medicoCase.doctorId._id.toString() === userId;
    } else if (userRole === 'patient') {
      // Patient can only access cases where patientName matches their fullName
      hasAccess = medicoCase.patientName === req.user.fullName;
    } else if (userRole === 'police') {
      // Police can only access cases pending verification or under review
      hasAccess = ['Submitted', 'Under Police Review'].includes(medicoCase.status);
    } else if (userRole === 'judiciary') {
      // Judiciary can only access cases forwarded to them (judiciary or judge)
      hasAccess = medicoCase.forwardedToJudiciary === true || medicoCase.forwardedToJudge === true;
    }
    
    if (!hasAccess) {
      // Log unauthorized access attempt
      await Log.create({
        userId: req.user._id,
        username: req.user.username,
        action: 'UNAUTHORIZED_CASE_ACCESS',
        resourceType: 'Case',
        resourceId: medicoCase._id,
        description: `Unauthorized access attempt on case: ${medicoCase.caseNumber} by ${userRole}`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        status: 'warning'
      });
      
      return res.status(403).json({
        success: false,
        message: 'Access denied. You do not have permission to view this case.'
      });
    }

    // Log case access
    await Log.create({
      userId: req.user._id,
      username: req.user.username,
      action: 'VIEW_CASE',
      resourceType: 'Case',
      resourceId: medicoCase._id,
      description: `Case viewed: ${medicoCase.caseNumber}`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      status: 'success'
    });

    res.json({
      success: true,
      data: medicoCase
    });
  } catch (error) {
    console.error('Get case error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching case',
      error: error.message
    });
  }
};

// @desc    Update case
// @route   PUT /api/cases/:id
// @access  Private (Doctor only for their cases)
const updateCase = async (req, res) => {
  try {
    let medicoCase = await Case.findById(req.params.id);

    if (!medicoCase) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }

    // Only the creator doctor can update
    if (req.user.role === 'doctor' && medicoCase.doctorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this case'
      });
    }

    const updatedCase = await Case.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );

    // Log case update
    await Log.create({
      userId: req.user._id,
      username: req.user.username,
      action: 'UPDATE_CASE',
      resourceType: 'Case',
      resourceId: updatedCase._id,
      description: `Case updated: ${updatedCase.caseNumber}`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      status: 'success'
    });

    res.json({
      success: true,
      message: 'Case updated successfully',
      data: updatedCase
    });
  } catch (error) {
    console.error('Update case error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating case',
      error: error.message
    });
  }
};

// @desc    Upload document to case
// @route   POST /api/cases/:id/documents
// @access  Private (Doctor only)
const uploadDocument = async (req, res) => {
  try {
    const medicoCase = await Case.findById(req.params.id);

    if (!medicoCase) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }

    // Only the creator doctor can upload documents
    if (medicoCase.doctorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to upload documents to this case'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a file'
      });
    }

    const filePath = req.file.path.replace(/\\/g, "/");
    const pathParts = filePath.split('/');
    const uploadsIndex = pathParts.indexOf('uploads');
    const relativePath = pathParts.slice(uploadsIndex).join('/');
    
    const document = {
      fileName: req.file.filename,
      filePath: relativePath,
      fileType: req.file.mimetype,
      uploadDate: Date.now()
    };

    medicoCase.documents.push(document);
    
    // Also set reportPath for easy access
    medicoCase.reportPath = req.file.path;
    
    // ==========================================
    // AUTOMATIC WORKFLOW: AI Indexing + Blockchain
    // ==========================================
    
    // Step 1: Trigger AI indexing automatically
    try {
      const caseText = `
        Case Type: ${medicoCase.caseType}
        Title: ${medicoCase.title}
        Description: ${medicoCase.description}
        Patient Name: ${medicoCase.patientName}
        Injury Description: ${medicoCase.injuryDescription}
        Hospital: ${medicoCase.hospitalName}
        Document File: ${document.fileName}
        Document Type: ${document.fileType}
      `;
      
      const aiResult = await aiService.indexDocument(caseText);
      const aiData = aiResult.data;
      
      // Store extracted metadata in aiIndexing field
      medicoCase.aiIndexing = {
        caseType: aiData.caseType || medicoCase.caseType,
        injury: aiData.injury || medicoCase.injuryDescription,
        injuryType: aiData.extractedData?.severity ? aiData.extractedData.severity : undefined, // New: injury type
        severity: aiData.extractedData?.severity || undefined, // New: severity level
        keywords: aiData.keywords || [],
        extractedData: aiData.extractedData || {},
        indexedAt: Date.now()
      };
      
      console.log('AI Indexing completed:', aiData.keywords);
    } catch (aiError) {
      console.error('AI Indexing failed:', aiError.message);
      // Continue with workflow even if AI fails - don't block the upload
    }

    // Step 2: Generate blockchain hash automatically
    try {
      const documentData = {
        _id: medicoCase._id,
        documentType: 'Case',
        caseNumber: medicoCase.caseNumber,
        patientName: medicoCase.patientName,
        caseType: medicoCase.caseType,
        description: medicoCase.description,
        doctorName: medicoCase.doctorName,
        hospitalName: medicoCase.hospitalName,
        incidentDate: medicoCase.incidentDate,
        createdAt: medicoCase.createdAt,
        documentFileName: document.fileName,
        documentPath: document.filePath,
        documentType: document.fileType,
        uploadDate: document.uploadDate
      };
      
      const result = await blockchainService.createBlock(documentData, req.user._id);
      
      // Store hash in blockchainHash field with timestamp and status
      medicoCase.blockchainHash = result.hash;
      medicoCase.blockchainVerified = true;
      medicoCase.blockTimestamp = Date.now(); // Timestamp when hash was generated
      medicoCase.verificationStatus = 'Immutable'; // Mark as immutable after verification
      medicoCase.verifiedAt = Date.now();
      medicoCase.verifiedBy = req.user._id;
      
      console.log('Blockchain hash generated:', result.hash);
    } catch (blockchainError) {
      console.error('Blockchain hash generation failed:', blockchainError.message);
      // Continue with workflow even if blockchain fails - don't block the upload
    }

    // Step 3: Save the updated record with all changes
    await medicoCase.save();

    // Step 4: Update report status to Ready so patient gets notified
    medicoCase.reportStatus = 'Ready';
    
    // Also update case status to reflect report is ready
    if (medicoCase.status === 'Under Review' || medicoCase.status === 'Submitted') {
      medicoCase.status = 'Report Ready';
    }
    
    await medicoCase.save();

    // Log document upload
    await Log.create({
      userId: req.user._id,
      username: req.user.username,
      action: 'UPLOAD_DOCUMENT',
      resourceType: 'Case',
      resourceId: medicoCase._id,
      description: `Document uploaded: ${document.fileName} | AI Indexed: ${!!medicoCase.aiIndexing?.keywords?.length} | Blockchain Verified: ${medicoCase.blockchainVerified}`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      status: 'success'
    });

    // Return the updated record with all fields
    res.json({
      success: true,
      message: 'Document uploaded successfully with AI indexing and blockchain verification',
      data: {
        document: document,
        aiIndexing: medicoCase.aiIndexing,
        blockchainHash: medicoCase.blockchainHash,
        blockTimestamp: medicoCase.blockTimestamp,
        verificationStatus: medicoCase.verificationStatus,
        blockchainVerified: medicoCase.blockchainVerified,
        verifiedAt: medicoCase.verifiedAt,
        case: {
          _id: medicoCase._id,
          caseNumber: medicoCase.caseNumber,
          title: medicoCase.title,
          caseType: medicoCase.caseType,
          status: medicoCase.status,
          documents: medicoCase.documents,
          aiIndexing: medicoCase.aiIndexing,
          blockchainHash: medicoCase.blockchainHash,
          blockTimestamp: medicoCase.blockTimestamp,
          verificationStatus: medicoCase.verificationStatus,
          blockchainVerified: medicoCase.blockchainVerified,
          verifiedAt: medicoCase.verifiedAt
        }
      }
    });
  } catch (error) {
    console.error('Upload document error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading document',
      error: error.message
    });
  }
};

// @desc    AI Index case
// @route   POST /api/cases/:id/ai-index
// @access  Private (Doctor only)
const aiIndexCase = async (req, res) => {
  try {
    const medicoCase = await Case.findById(req.params.id);

    if (!medicoCase) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }

    // Combine case text for AI indexing
    const caseText = `
      Case Type: ${medicoCase.caseType}
      Title: ${medicoCase.title}
      Description: ${medicoCase.description}
      Patient Name: ${medicoCase.patientName}
      Injury Description: ${medicoCase.injuryDescription}
      Hospital: ${medicoCase.hospitalName}
    `;

    // Call AI service
    const aiResult = await aiService.indexDocument(caseText);
    
    const aiData = aiResult.data;

    // Update case with AI indexing
    const keywords = aiData.keywords || [];
    medicoCase.aiKeywords = keywords;
    medicoCase.aiIndexing = {
      caseType: aiData.caseType || medicoCase.caseType,
      injury: aiData.injury || medicoCase.injuryDescription,
      keywords: keywords,
      extractedData: aiData.extractedData || {},
      indexedAt: Date.now()
    };

    await medicoCase.save({ validateBeforeSave: false });

    // Log AI indexing
    await Log.create({
      userId: req.user._id,
      username: req.user.username,
      action: 'AI_INDEX',
      resourceType: 'Case',
      resourceId: medicoCase._id,
      description: `AI indexing performed on case: ${medicoCase.caseNumber}`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      status: 'success'
    });

    res.json({
      success: true,
      message: 'AI indexing completed',
      data: medicoCase.aiIndexing
    });
  } catch (error) {
    console.error('AI Index case error:', error);
    res.status(500).json({
      success: false,
      message: 'Error performing AI indexing',
      error: error.message
    });
  }
};

// @desc    Generate blockchain hash for case
// @route   POST /api/cases/:id/generate-hash
// @access  Private (Doctor only)
const generateHash = async (req, res) => {
  try {
    const medicoCase = await Case.findById(req.params.id);

    if (!medicoCase) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }

    // Only the creator doctor can generate hash
    if (medicoCase.doctorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to generate hash for this case'
      });
    }

    // Prepare document data for hashing
    const documentData = {
      _id: medicoCase._id,
      documentType: 'Case',
      caseNumber: medicoCase.caseNumber,
      patientName: medicoCase.patientName,
      caseType: medicoCase.caseType,
      description: medicoCase.description,
      doctorName: medicoCase.doctorName,
      hospitalName: medicoCase.hospitalName,
      incidentDate: medicoCase.incidentDate,
      createdAt: medicoCase.createdAt
    };

    // Create blockchain block
    const result = await blockchainService.createBlock(documentData, req.user._id);

    // Update case with hash
    medicoCase.blockchainHash = result.hash;
    medicoCase.blockchainVerified = true;
    medicoCase.verificationStatus = 'Immutable';
    medicoCase.verifiedAt = Date.now();
    medicoCase.blockTimestamp = result.block.timestamp;
    medicoCase.verifiedBy = req.user._id;
    await medicoCase.save({ validateBeforeSave: false });

    // Log hash generation
    await Log.create({
      userId: req.user._id,
      username: req.user.username,
      action: 'GENERATE_HASH',
      resourceType: 'Case',
      resourceId: medicoCase._id,
      description: `Blockchain hash generated for case: ${medicoCase.caseNumber}`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      status: 'success'
    });

    res.json({
      success: true,
      message: 'Blockchain hash generated successfully',
      data: {
        caseId: medicoCase._id,
        caseNumber: medicoCase.caseNumber,
        hash: result.hash,
        blockNumber: result.block.blockNumber,
        timestamp: result.block.timestamp
      }
    });
  } catch (error) {
    console.error('Generate hash error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating blockchain hash',
      error: error.message
    });
  }
};

// @desc    Verify blockchain hash for case
// @route   GET /api/cases/:id/verify-hash
// @access  Private
const verifyHash = async (req, res) => {
  try {
    const medicoCase = await Case.findById(req.params.id);

    if (!medicoCase) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }

    if (!medicoCase.blockchainHash) {
      return res.status(400).json({
        success: false,
        message: 'No blockchain hash found for this case'
      });
    }

    // Prepare document data for verification
    const documentData = {
      _id: medicoCase._id,
      documentType: 'Case',
      caseNumber: medicoCase.caseNumber,
      patientName: medicoCase.patientName,
      caseType: medicoCase.caseType,
      description: medicoCase.description,
      doctorName: medicoCase.doctorName,
      hospitalName: medicoCase.hospitalName,
      incidentDate: medicoCase.incidentDate,
      createdAt: medicoCase.createdAt
    };

    // Verify with blockchain service
    const result = await blockchainService.verifyDocument(medicoCase._id, documentData);

    // Update status to Under Police Review when hash is verified successfully
    if (result.verified) {
      medicoCase.status = 'Under Police Review';
      medicoCase.policeVerified = true;
      medicoCase.policeVerifiedAt = new Date();
      medicoCase.policeVerifiedBy = req.user._id;
      await medicoCase.save();
    }

    // Log verification
    await Log.create({
      userId: req.user._id,
      username: req.user.username,
      action: 'VERIFY_HASH',
      resourceType: 'Case',
      resourceId: medicoCase._id,
      description: `Blockchain verification for case: ${medicoCase.caseNumber}`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      status: result.verified ? 'success' : 'warning'
    });

    res.json({
      success: true,
      message: result.message,
      data: {
        caseId: medicoCase._id,
        caseNumber: medicoCase.caseNumber,
        isValid: result.verified,
        verified: result.verified,
        storedHash: result.storedHash,
        currentHash: result.currentHash,
        blockNumber: result.blockNumber,
        timestamp: result.timestamp
      }
    });
  } catch (error) {
    console.error('Verify hash error:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying blockchain hash',
      error: error.message
    });
  }
};

// @desc    Add investigation note to case
// @route   POST /api/cases/:id/investigation-note
// @access  Private (Police only)
const addInvestigationNote = async (req, res) => {
  try {
    const { note } = req.body;
    
    if (!note) {
      return res.status(400).json({
        success: false,
        message: 'Note content is required'
      });
    }

    const medicoCase = await Case.findById(req.params.id);

    if (!medicoCase) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }

    // Add investigation note
    medicoCase.investigationNotes.push({
      note,
      addedBy: req.user._id,
      addedByName: req.user.fullName,
      addedAt: Date.now()
    });

    await medicoCase.save();

    // Log the action
    await Log.create({
      userId: req.user._id,
      username: req.user.username,
      action: 'ADD_INVESTIGATION_NOTE',
      resourceType: 'Case',
      resourceId: medicoCase._id,
      description: `Investigation note added to case: ${medicoCase.caseNumber}`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      status: 'success'
    });

    res.json({
      success: true,
      message: 'Investigation note added successfully',
      data: medicoCase.investigationNotes
    });
  } catch (error) {
    console.error('Add investigation note error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding investigation note',
      error: error.message
    });
  }
};

// @desc    Forward case to judiciary
// @route   POST /api/cases/:id/forward-judiciary
// @access  Private (Police only)
const forwardToJudiciary = async (req, res) => {
  try {
    const { notes } = req.body;

    const medicoCase = await Case.findById(req.params.id);

    if (!medicoCase) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }

    // Verify blockchain hash is valid before forwarding
    if (!medicoCase.blockchainHash) {
      return res.status(400).json({
        success: false,
        message: 'Cannot forward case. Blockchain hash must be generated first.'
      });
    }

    // Verify case has blockchain verified flag or is under police review
    const canForward = medicoCase.status === 'Under Police Review' || 
                       medicoCase.status === 'Pending Police Verification' ||
                       medicoCase.status === 'Submitted' ||
                       medicoCase.policeVerified === true;
    
    if (!canForward) {
      return res.status(400).json({
        success: false,
        message: 'Case must be verified by police before forwarding to judiciary'
      });
    }

    // Mark as police verified
    medicoCase.policeVerified = true;
    medicoCase.policeVerifiedAt = new Date();
    medicoCase.policeVerifiedBy = req.user._id;

    // Forward to judiciary
    medicoCase.forwardedToJudiciary = true;
    medicoCase.forwardedToJudge = true;
    medicoCase.forwardedToJudiciaryAt = new Date();
    medicoCase.status = 'FORWARDED_TO_JUDGE';
    
    if (notes) {
      medicoCase.judiciaryNotes = notes;
    }

    await medicoCase.save();

    // Log the action
    await Log.create({
      userId: req.user._id,
      username: req.user.username,
      action: 'FORWARD_TO_JUDICIARY',
      resourceType: 'Case',
      resourceId: medicoCase._id,
      description: `Case forwarded to judiciary: ${medicoCase.caseNumber} | Police Verified: true`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      status: 'success'
    });

    res.json({
      success: true,
      message: 'Case forwarded to judiciary successfully',
      data: {
        caseNumber: medicoCase.caseNumber,
        status: medicoCase.status,
        policeVerified: medicoCase.policeVerified,
        forwardedToJudiciary: medicoCase.forwardedToJudiciary,
        forwardedToJudiciaryAt: medicoCase.forwardedToJudiciaryAt
      }
    });
  } catch (error) {
    console.error('Forward to judiciary error:', error);
    res.status(500).json({
      success: false,
      message: 'Error forwarding case to judiciary',
      error: error.message
    });
  }
};

// @desc    Approve case by judiciary
// @route   POST /api/cases/:id/approve
// @access  Private (Judiciary only)
const approveCase = async (req, res) => {
  try {
    const { remarks } = req.body;

    const medicoCase = await Case.findById(req.params.id);

    if (!medicoCase) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }

    if (medicoCase.status !== 'FORWARDED_TO_JUDGE') {
      return res.status(400).json({
        success: false,
        message: 'Case not ready for judge approval'
      });
    }

    // Approve the case
    medicoCase.judiciaryApproved = true;
    medicoCase.judiciaryVerified = true;
    medicoCase.judiciaryVerifiedAt = new Date();
    medicoCase.judgeVerified = true;
    medicoCase.judgeVerifiedAt = new Date();
    medicoCase.status = 'APPROVED_BY_JUDGE';
    medicoCase.approvedAt = new Date();
    medicoCase.judiciaryApprovedAt = new Date();
    medicoCase.judiciaryApprovedBy = req.user._id;
    if (remarks) {
      medicoCase.judiciaryRemarks = remarks;
    }

    await medicoCase.save();

    // Log the action
    await Log.create({
      userId: req.user._id,
      username: req.user.username,
      action: 'APPROVE_CASE',
      resourceType: 'Case',
      resourceId: medicoCase._id,
      description: `Case approved by judiciary: ${medicoCase.caseNumber}`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      status: 'success'
    });

    res.json({
      success: true,
      message: 'Case approved successfully',
      data: {
        judiciaryApproved: medicoCase.judiciaryApproved,
        judiciaryApprovedAt: medicoCase.judiciaryApprovedAt
      }
    });
  } catch (error) {
    console.error('Approve case error:', error);
    res.status(500).json({
      success: false,
      message: 'Error approving case',
      error: error.message
    });
  }
};

// @desc    Reject case by judiciary
// @route   POST /api/cases/:id/reject
// @access  Private (Judiciary only)
const rejectCase = async (req, res) => {
  try {
    const { remarks } = req.body;

    if (!remarks) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required'
      });
    }

    const medicoCase = await Case.findById(req.params.id);

    if (!medicoCase) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }

    if (medicoCase.status !== 'FORWARDED_TO_JUDGE') {
      return res.status(400).json({
        success: false,
        message: 'Case not ready for judge approval'
      });
    }

    // Reject the case
    medicoCase.judiciaryApproved = false;
    medicoCase.judiciaryApprovedAt = Date.now();
    medicoCase.judiciaryApprovedBy = req.user._id;
    medicoCase.judiciaryRemarks = remarks;

    await medicoCase.save();

    // Log the action
    await Log.create({
      userId: req.user._id,
      username: req.user.username,
      action: 'REJECT_CASE',
      resourceType: 'Case',
      resourceId: medicoCase._id,
      description: `Case rejected by judiciary: ${medicoCase.caseNumber}`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      status: 'success'
    });

    res.json({
      success: true,
      message: 'Case rejected',
      data: {
        judiciaryApproved: medicoCase.judiciaryApproved,
        judiciaryApprovedAt: medicoCase.judiciaryApprovedAt
      }
    });
  } catch (error) {
    console.error('Reject case error:', error);
    res.status(500).json({
      success: false,
      message: 'Error rejecting case',
      error: error.message
    });
  }
};

// @desc    Download case report
// @route   GET /api/cases/download-report/:caseId
// @access  Private
const downloadReport = async (req, res) => {
  try {
    const Case = require("../models/Case");
    const caseData = await Case.findById(req.params.caseId);

    if(!caseData){
      return res.status(404).json({message:"Case not found"});
    }

    const filePath = require("path").resolve(caseData.reportPath);

    res.download(filePath);
  } catch (error) {
    console.error("Download error:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching case"
    });
  }
};

module.exports = {
  createCase,
  getCases,
  getCase,
  updateCase,
  uploadDocument,
  aiIndexCase,
  generateHash,
  verifyHash,
  addInvestigationNote,
  forwardToJudiciary,
  approveCase,
  rejectCase,
  downloadReport
};
