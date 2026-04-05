const mongoose = require('../backend/node_modules/mongoose');
const bcrypt = require('../backend/node_modules/bcryptjs');
const dotenv = require('../backend/node_modules/dotenv');

dotenv.config({ path: __dirname + '/backend/.env' });

process.env.MONGODB_URI = 'mongodb://localhost:27017/medico';

console.log('MONGODB_URI:', process.env.MONGODB_URI);

// User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, select: false },
  role: { type: String, enum: ['doctor', 'police', 'judiciary', 'patient', 'admin'], default: 'patient' },
  fullName: { type: String, required: true },
  phone: { type: String },
  department: { type: String },
  hospital: { type: String },
  badgeNumber: { type: String },
  courtName: { type: String },
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

const User = mongoose.model('User', userSchema);

// Case Schema
const caseSchema = new mongoose.Schema({
  caseNumber: { type: String, unique: true },
  caseType: { type: String, required: true, enum: ['Accident', 'Assault', 'Medical Malpractice', 'Suicide Attempt', 'Other'] },
  title: { type: String, required: true },
  description: { type: String, required: true },
  patientName: { type: String, required: true },
  patientAge: { type: Number },
  patientGender: { type: String, enum: ['Male', 'Female', 'Other'] },
  patientPhone: { type: String },
  injuryDescription: { type: String },
  hospitalName: { type: String, required: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  doctorName: { type: String, required: true },
  incidentDate: { type: Date, required: true },
  reportedDate: { type: Date, default: Date.now },
  status: { type: String, enum: ['Pending', 'Under Investigation', 'Verified', 'Closed'], default: 'Pending' },
  documents: [{ fileName: String, filePath: String, fileType: String, uploadDate: { type: Date, default: Date.now } }],
  aiIndexing: { caseType: String, injury: String, keywords: [String], indexedAt: Date },
  blockchainHash: { type: String },
  blockchainVerified: { type: Boolean, default: false },
  verifiedAt: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

caseSchema.pre('save', async function(next) {
  if (!this.caseNumber) {
    const count = await mongoose.model('Case').countDocuments();
    this.caseNumber = `MLC-${Date.now()}-${count + 1}`;
  }
  next();
});

const Case = mongoose.model('Case', caseSchema);

// Report Schema
const reportSchema = new mongoose.Schema({
  title: { type: String, required: true },
  caseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Case', required: true },
  caseNumber: { type: String, required: true },
  patientName: { type: String, required: true },
  reportType: { type: String, required: true },
  content: { type: String, required: true },
  filePath: { type: String },
  fileName: { type: String },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  doctorName: { type: String, required: true },
  hospitalName: { type: String, required: true },
  dateOfExamination: { type: Date, required: true },
  aiAnalysis: { extractedEntities: mongoose.Schema.Types.Mixed, keywords: [String], analyzedAt: Date },
  blockchainHash: { type: String },
  isVerified: { type: Boolean, default: false },
  verifiedAt: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Report = mongoose.model('Report', reportSchema);

// BlockchainLedger Schema
const blockchainLedgerSchema = new mongoose.Schema({
  documentId: { type: mongoose.Schema.Types.ObjectId, required: true },
  documentType: { type: String, enum: ['Case', 'Report'], required: true },
  caseNumber: { type: String, required: true },
  documentHash: { type: String, required: true },
  previousHash: { type: String, default: '0' },
  blockNumber: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now },
  nonce: { type: Number, default: 0 },
  hash: { type: String, required: true },
  verified: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  verificationHistory: [{ verifiedAt: Date, isValid: Boolean, hashCompared: String }]
});

const BlockchainLedger = mongoose.model('BlockchainLedger', blockchainLedgerSchema);

// Log Schema
const logSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  username: String,
  action: { type: String, required: true },
  resourceType: { type: String },
  resourceId: { type: mongoose.Schema.Types.ObjectId },
  description: String,
  ipAddress: String,
  userAgent: String,
  status: { type: String, enum: ['success', 'failure', 'warning'], default: 'success' },
  createdAt: { type: Date, default: Date.now }
});

const Log = mongoose.model('Log', logSchema);

// Seed data
const seedDatabase = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Case.deleteMany({});
    await Report.deleteMany({});
    await BlockchainLedger.deleteMany({});
    await Log.deleteMany({});
    console.log('🗑️ Cleared existing data');

    // Create users
    const users = await User.create([
      {
        username: 'admin',
        email: 'admin@medico.com',
        password: 'admin123',
        role: 'admin',
        fullName: 'System Administrator'
      },
      {
        username: 'doctor1',
        email: 'doctor@medico.com',
        password: 'doctor123',
        role: 'doctor',
        fullName: 'Dr. John Smith',
        department: 'Emergency Medicine',
        hospital: 'City General Hospital'
      },
      {
        username: 'police1',
        email: 'police@medico.com',
        password: 'police123',
        role: 'police',
        fullName: 'Officer James Wilson',
        badgeNumber: 'P-12345'
      },
      {
        username: 'judge1',
        email: 'judge@medico.com',
        password: 'judge123',
        role: 'judiciary',
        fullName: 'Hon. Justice Roberts',
        courtName: 'High Court'
      },
      {
        username: 'patient1',
        email: 'patient@medico.com',
        password: 'patient123',
        role: 'patient',
        fullName: 'Jane Doe'
      }
    ]);
    console.log('✅ Created users:', users.length);

    // Create sample case
    const sampleCase = await Case.create({
      caseType: 'Accident',
      title: 'Road Traffic Accident - Multiple Injuries',
      description: 'Patient was involved in a road traffic accident with multiple injuries including head trauma and fractures.',
      patientName: 'Jane Doe',
      patientAge: 35,
      patientGender: 'Female',
      patientPhone: '555-0123',
      injuryDescription: 'Multiple fractures, head injury, bruises',
      hospitalName: 'City General Hospital',
      doctorId: users[1]._id,
      doctorName: 'Dr. John Smith',
      incidentDate: new Date('2024-01-15'),
      status: 'Pending'
    });
    console.log('✅ Created sample case:', sampleCase.caseNumber);

    // Create sample report
    const sampleReport = await Report.create({
      title: 'Medical Certificate - Injury Assessment',
      caseId: sampleCase._id,
      caseNumber: sampleCase.caseNumber,
      patientName: 'Jane Doe',
      reportType: 'Medical Certificate',
      content: 'The patient presented with multiple injuries sustained in a road traffic accident. X-rays confirm fractures in the left arm and right leg. Head CT scan shows no intracranial bleeding. Patient is conscious and stable.',
      doctorId: users[1]._id,
      doctorName: 'Dr. John Smith',
      hospitalName: 'City General Hospital',
      dateOfExamination: new Date('2024-01-15')
    });
    console.log('✅ Created sample report:', sampleReport.title);

    // Create log entry
    await Log.create({
      userId: users[0]._id,
      username: 'admin',
      action: 'SEED_DATA',
      description: 'Database seeded with sample data',
      status: 'success'
    });
    console.log('✅ Created log entry');

    console.log('\n📋 Login Credentials:');
    console.log('   Admin: admin@medico.com / admin123');
    console.log('   Doctor: doctor@medico.com / doctor123');
    console.log('   Police: police@medico.com / police123');
    console.log('   Judge: judge@medico.com / judge123');
    console.log('   Patient: patient@medico.com / patient123');

    console.log('\n✅ Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
};

seedDatabase();