const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: '../backend/.env' });

const backupDatabase = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://admin:medico123@localhost:27017/medico?authSource=admin';
    
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();

    const backup = {
      timestamp: new Date().toISOString(),
      collections: {}
    };

    for (const collection of collections) {
      const data = await db.collection(collection.name).find({}).toArray();
      backup.collections[collection.name] = data;
      console.log(`📦 Backed up ${collection.name}: ${data.length} documents`);
    }

    const backupDir = path.join(__dirname, 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const filename = `backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    const filepath = path.join(backupDir, filename);
    
    fs.writeFileSync(filepath, JSON.stringify(backup, null, 2));
    console.log(`💾 Backup saved to: ${filepath}`);

    await mongoose.disconnect();
    console.log('✅ Backup completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Backup error:', error);
    process.exit(1);
  }
};

backupDatabase();