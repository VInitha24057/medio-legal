const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: '../backend/.env' });

const restoreDatabase = async (backupFile) => {
  try {
    if (!backupFile) {
      console.error('❌ Please provide a backup file path');
      console.log('Usage: node restore.js backups/backup-2024-01-15.json');
      process.exit(1);
    }

    const filepath = path.resolve(backupFile);
    if (!fs.existsSync(filepath)) {
      console.error(`❌ Backup file not found: ${filepath}`);
      process.exit(1);
    }

    const mongoUri = process.env.MONGODB_URI || 'mongodb://admin:medico123@localhost:27017/medico?authSource=admin';
    
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    const backup = JSON.parse(fs.readFileSync(filepath, 'utf8'));
    console.log(`📂 Backup timestamp: ${backup.timestamp}`);

    const db = mongoose.connection.db;

    // Clear existing collections
    const collections = await db.listCollections().toArray();
    for (const collection of collections) {
      await db.collection(collection.name).deleteMany({});
      console.log(`🗑️ Cleared collection: ${collection.name}`);
    }

    // Restore data
    for (const [collectionName, data] of Object.entries(backup.collections)) {
      if (Array.isArray(data) && data.length > 0) {
        await db.collection(collectionName).insertMany(data);
        console.log(`📥 Restored ${collectionName}: ${data.length} documents`);
      }
    }

    await mongoose.disconnect();
    console.log('✅ Restore completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Restore error:', error);
    process.exit(1);
  }
};

const backupFile = process.argv[2];
restoreDatabase(backupFile);