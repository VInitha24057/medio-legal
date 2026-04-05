const mongoose = require('mongoose');

const connectDB = async (retries = 3, delay = 5000) => {
  let mongoUri = process.env.MONGODB_URI || process.env.MONGO_URL || process.env.MONGO;
  
  const isValidMongoUri = mongoUri && (mongoUri.startsWith('mongodb://') || mongoUri.startsWith('mongodb+srv://'));
  
  if (!isValidMongoUri) {
    console.log('📦 MongoDB: No valid connection string - starting without database');
    return null;
  }
  
  console.log('📦 MongoDB: connection string detected');
  
  let currentDelay = delay;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`⏳ MongoDB Connection Attempt ${attempt}/${retries}...`);
      
      const conn = await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 8000,
        socketTimeoutMS: 30000,
        maxPoolSize: 5,
        bufferCommands: false
      });
      
      console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
      
      conn.connection.on('error', (err) => {
        console.error(`❌ MongoDB Error: ${err.message}`);
      });
      
      conn.connection.on('disconnected', () => {
        console.warn('⚠️ MongoDB disconnected');
      });
      
      return conn;
    } catch (error) {
      console.error(`❌ MongoDB Connection Attempt ${attempt} failed: ${error.message}`);
      
      if (attempt < retries) {
        console.log(`   Retrying in ${currentDelay/1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, currentDelay));
        currentDelay = Math.min(currentDelay * 1.5, 15000);
      } else {
        console.error('❌ All MongoDB connection attempts failed');
        console.log('   Server will start without database connection');
      }
    }
  }
};

module.exports = connectDB;
