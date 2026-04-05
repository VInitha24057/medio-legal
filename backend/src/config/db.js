const mongoose = require('mongoose');

const connectDB = async (retries = 5, delay = 3000) => {
  let mongoUri = process.env.MONGODB_URI;
  
  if (!mongoUri) {
    mongoUri = process.env.MONGO_URL || 'mongodb://localhost:27017/medico';
  }
  
  const isProduction = process.env.NODE_ENV === 'production';
  let currentDelay = delay;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`⏳ MongoDB Connection Attempt ${attempt}/${retries}...`);
      
      const conn = await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
        maxPoolSize: 10,
        bufferCommands: false
      });
      
      console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
      console.log(`   Database: ${conn.connection.name}`);
      
      conn.connection.on('error', (err) => {
        console.error(`❌ MongoDB Error: ${err.message}`);
      });
      
      conn.connection.on('disconnected', () => {
        console.warn('⚠️ MongoDB disconnected - attempting reconnect...');
      });
      
      conn.connection.on('reconnected', () => {
        console.log('✅ MongoDB reconnected');
      });
      
      conn.connection.on('close', () => {
        console.log('ℹ️ MongoDB connection closed');
      });
      
      return conn;
    } catch (error) {
      console.error(`❌ MongoDB Connection Attempt ${attempt} failed: ${error.message}`);
      
      if (attempt < retries) {
        console.log(`   Retrying in ${currentDelay/1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, currentDelay));
        currentDelay = Math.min(currentDelay * 1.5, 30000);
      } else {
        console.error('❌ All MongoDB connection attempts failed');
        console.log('   Please ensure MongoDB is running on localhost:27017');
        console.log('   Or check MONGODB_URI in your .env file');
        process.exit(1);
      }
    }
  }
};

module.exports = connectDB;
