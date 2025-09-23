const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Connect to MongoDB
async function connectDatabase() {
  try {
    await mongoose.connect('mongodb://localhost:27017/test');
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
}

// User schema (simplified version)
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['student', 'company', 'admin', 'master_admin'], default: 'student' },
  isMasterAdmin: { type: Boolean, default: false },
  isEmailVerified: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  adminPermissions: {
    canViewAllUsers: { type: Boolean, default: false },
    canViewFinancials: { type: Boolean, default: false },
    canModerateContent: { type: Boolean, default: false },
    canAccessSystemLogs: { type: Boolean, default: false },
    canExportData: { type: Boolean, default: false },
    canManageAdmins: { type: Boolean, default: false },
    canConfigureSystem: { type: Boolean, default: false }
  },
  profile: {
    firstName: String,
    lastName: String,
    position: String,
    department: String,
    permissions: {
      users: { type: Boolean, default: false },
      content: { type: Boolean, default: false },
      financial: { type: Boolean, default: false },
      analytics: { type: Boolean, default: false },
      system: { type: Boolean, default: false }
    },
    lastAccess: Date,
    twoFactorEnabled: { type: Boolean, default: false },
    adminLevel: String
  },
  lastLogin: Date,
  lastAccessedAdminPanel: Date,
  adminLoginAttempts: { type: Number, default: 0 },
  adminLoginLockedUntil: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

async function setupMasterAdmin() {
  try {
    await connectDatabase();

    // Check if master admin already exists
    const existingAdmin = await User.findOne({ role: 'master_admin' });
    if (existingAdmin) {
      console.log('✅ Master admin already exists:', existingAdmin.email);
      process.exit(0);
    }

    // Create master admin
    const masterAdmin = new User({
      email: 'admin@apprenticeapex.com',
      password: 'MasterAdmin2024!',
      role: 'master_admin',
      isMasterAdmin: true,
      isEmailVerified: true,
      isActive: true,
      adminPermissions: {
        canViewAllUsers: true,
        canViewFinancials: true,
        canModerateContent: true,
        canAccessSystemLogs: true,
        canExportData: true,
        canManageAdmins: true,
        canConfigureSystem: true
      },
      profile: {
        firstName: 'Master',
        lastName: 'Admin',
        position: 'Platform Administrator',
        department: 'System Administration',
        permissions: {
          users: true,
          content: true,
          financial: true,
          analytics: true,
          system: true
        },
        lastAccess: new Date(),
        twoFactorEnabled: false,
        adminLevel: 'master_admin'
      }
    });

    await masterAdmin.save();
    console.log('✅ Master admin created successfully!');
    console.log('📧 Email: admin@apprenticeapex.com');
    console.log('🔐 Password: MasterAdmin2024!');
    console.log('🛡️  Admin Code: APEX2024');

  } catch (error) {
    console.error('❌ Failed to create master admin:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

setupMasterAdmin();
