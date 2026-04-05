const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const http = require('http');

dotenv.config();

const authRoutes = require('./routes/auth');
const caseRoutes = require('./routes/cases');
const reportRoutes = require('./routes/reports');
const blockchainRoutes = require('./routes/blockchain');
const dashboardRoutes = require('./routes/dashboard');
const patientRecordRoutes = require('./routes/patientRecords');
const hashRoutes = require('./routes/hash');
const recordsRoutes = require('./routes/records');
const aiIndexRoutes = require('./routes/aiIndex');
const unifiedApiRoutes = require('./routes/unifiedApi');

const connectDB = require('./config/db');
const { cacheMiddleware } = require('./middleware/cache');

const app = express();

app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const PORT = parseInt(process.env.PORT, 10) || 5000;

if (isNaN(PORT) || PORT < 1 || PORT > 65535) {
  console.error('❌ Invalid port configuration. Using default port 5000.');
}

const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('✅ Created uploads directory');
}
console.log('📁 Uploads directory:', uploadsDir);

app.use('/uploads', express.static(uploadsDir));
app.use('/api/uploads', express.static(uploadsDir));

const startServer = async () => {
  try {
    console.log('⏳ Starting Medico Legal System API...');
    console.log(`   Port: ${PORT}`);
    console.log(`   Node Env: ${process.env.NODE_ENV || 'development'}`);
    
    try {
      await connectDB();
      console.log('✅ Database connected');
    } catch (err) {
      console.warn('⚠️ Database not connected - starting server anyway');
    }

    app.use('/api/auth', authRoutes);
    app.use('/api/cases', caseRoutes);
    app.use('/api/reports', reportRoutes);
    app.use('/api/blockchain', blockchainRoutes);
    app.use('/api/dashboard', cacheMiddleware(30000), dashboardRoutes);
    app.use('/api/patient-records', patientRecordRoutes);
    app.use('/api/patient', patientRecordRoutes);
    app.use('/api', hashRoutes);
    app.use('/api', recordsRoutes);
    app.use('/api/ai-index', aiIndexRoutes);
    app.use('/api', unifiedApiRoutes);

    app.get('/', (req, res) => {
      res.status(200).json({
        success: true,
        message: 'Welcome to Medico Legal System API',
        version: '1.0.0',
        docs: 'Visit /api for available endpoints'
      });
    });

    app.get('/api', (req, res) => {
      res.status(200).json({
        success: true,
        message: 'Medico Legal System API',
        version: '1.0.0',
        endpoints: {
          auth: '/api/auth',
          cases: '/api/cases',
          reports: '/api/reports',
          blockchain: '/api/blockchain',
          dashboard: '/api/dashboard',
          patientRecords: '/api/patient-records',
          patient: '/api/patient',
          hash: '/api/hash',
          records: '/api/records',
          aiIndex: '/api/ai-index',
          health: '/api/health',
          uploads: '/api/uploads'
        }
      });
    });

    app.get('/api/health', (req, res) => {
      res.status(200).json({
        status: 'success',
        message: 'Medico Legal System API is running',
        timestamp: new Date().toISOString(),
        mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        uptime: process.uptime()
      });
    });

    app.use((err, req, res, next) => {
      console.error('❌ Error:', err.message);
      if (process.env.NODE_ENV === 'development') {
        console.error('   Stack:', err.stack);
      }
      
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'File size exceeds 10MB limit'
        });
      }
      
      if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).json({
          success: false,
          message: 'Unexpected file field'
        });
      }

      if (err.name === 'ValidationError') {
        return res.status(400).json({
          success: false,
          message: 'Validation Error',
          errors: Object.values(err.errors).map(e => e.message)
        });
      }

      if (err.name === 'CastError') {
        return res.status(400).json({
          success: false,
          message: 'Invalid ID format'
        });
      }

      if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Invalid token'
        });
      }

      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token expired'
        });
      }

      if (err.code === 'ECONNREFUSED') {
        return res.status(503).json({
          success: false,
          message: 'Service unavailable'
        });
      }

      const statusCode = err.statusCode || 500;
      const message = statusCode === 500 ? 'Internal Server Error' : err.message;
      
      res.status(statusCode).json({
        success: false,
        message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
      });
    });

    app.use((req, res, next) => {
      if (!req.route) {
        return res.status(404).json({
          success: false,
          message: `Route ${req.originalUrl} not found`
        });
      }
      next();
    });

    const server = http.createServer(app);

    server.listen(PORT, '0.0.0.0', () => {
      console.log(`\n🟢 ========================================`);
      console.log(`   Server running on Railway`);
      console.log(`   Port: ${PORT}`);
      console.log(`   ✅ ========================================\n`);
    });

    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use!`);
        console.log(`   Try running: npx kill-port ${PORT}`);
        process.exit(1);
      }
      console.error('❌ Server error:', error.message);
    });

    const gracefulShutdown = (signal) => {
      console.log(`\n⚠️ Received ${signal}. Starting graceful shutdown...`);
      server.close(async () => {
        console.log('✅ HTTP server closed');
        try {
          await mongoose.connection.close();
          console.log('✅ MongoDB connection closed');
        } catch (err) {
          console.error('❌ Error closing MongoDB:', err.message);
        }
        process.exit(0);
      });
      
      setTimeout(() => {
        console.error('❌ Graceful shutdown timeout. Forcing exit...');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
};

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Promise Rejection:', reason);
  console.log('🔄 Attempting to restart server...');
  setTimeout(() => {
    process.exit(1);
  }, 1000);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error.message);
  console.error(error.stack);
  console.log('🔄 Attempting to restart server...');
  setTimeout(() => {
    process.exit(1);
  }, 1000);
});

startServer();

module.exports = app;
