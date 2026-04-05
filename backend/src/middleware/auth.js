const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Log = require('../models/Log');

// Protect routes - verify JWT token
const protect = async (req, res, next) => {
  let token;

  // Check for Bearer token in Authorization header
  if (req.headers.authorization) {
    if (req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }
  }
  
  // Also check for token in query params (for download endpoints)
  if (!token && req.query.token) {
    token = req.query.token;
  }

  console.log('Auth - Token present:', !!token);
  console.log('Auth - Query token:', req.query.token ? 'yes: ' + req.query.token.substring(0, 20) : 'no');
  console.log('Auth - Header auth:', req.headers.authorization ? 'yes: ' + req.headers.authorization.substring(0, 30) : 'no');

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'No token provided. Authorization denied.'
    });
  }

  try {
    // Verify token with expiration check
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find user and get fresh data
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found. Token may be invalid.'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User account is deactivated. Please contact administrator.'
      });
    }

    // Attach user to request
    req.user = user;
    req.userId = user._id;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired. Please login again.',
        code: 'TOKEN_EXPIRED'
      });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. Please login again.',
        code: 'INVALID_TOKEN'
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route',
      code: 'AUTH_FAILED'
    });
  }
};

// Role-based authorization
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role '${req.user.role}' is not authorized to access this route. Required roles: ${roles.join(', ')}`
      });
    }
    next();
  };
};

// Log activity middleware
const logActivity = (action, resourceType = 'System') => {
  return async (req, res, next) => {
    const originalJson = res.json;

    res.json = function(data) {
      const logEntry = new Log({
        userId: req.user ? req.user._id : null,
        username: req.user ? req.user.username : 'Unknown',
        action,
        resourceType,
        resourceId: data?.data?._id || req.body.caseId || req.params.id || req.body.documentId,
        description: `${action} performed`,
        ipAddress: req.ip || req.connection?.remoteAddress || 'unknown',
        userAgent: req.headers['user-agent'] || 'unknown',
        status: res.statusCode >= 400 ? 'failure' : 'success',
        metadata: {
          method: req.method,
          path: req.originalUrl,
          statusCode: res.statusCode,
          body: req.method !== 'GET' ? req.body : undefined
        }
      });

      logEntry.save().catch(err => console.error('Log save error:', err));
      return originalJson.call(this, data);
    };

    next();
  };
};

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// Verify token without middleware (for specific routes)
const verifyToken = (token) => {
  try {
    return { valid: true, decoded: jwt.verify(token, process.env.JWT_SECRET) };
  } catch (error) {
    return { valid: false, error: error.message };
  }
};

module.exports = {
  protect,
  authorize,
  logActivity,
  generateToken,
  verifyToken
};
