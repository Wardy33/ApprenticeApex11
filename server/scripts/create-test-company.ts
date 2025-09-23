import { User } from '../models/User';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Fix for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function createTestCompany() {
  try {
    // Connect to database
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/test';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to database');

    // Check if test company already exists
    const existingCompany = await User.findOne({ 
      email: 'test@company.com',
      role: 'company' 
    });

    if (existingCompany) {
      console.log('✅ Test company already exists:', existingCompany.email);
      console.log('📋 Company profile:', existingCompany.profile);
      return;
    }

    // Create test company user
    const testCompanyData = {
      email: 'test@company.com',
      password: 'Password123',
      role: 'company',
      profile: {
        companyName: 'Test Technology Ltd',
        industry: 'Technology',
        companySize: '11-50',
        website: 'https://test-company.com',
        description: 'A test technology company for development and testing purposes.',
        location: {
          city: 'London',
          address: '123 Tech Street',
          postcode: 'SW1A 1AA',
          coordinates: [-0.1276, 51.5074]
        },
        contactPerson: {
          firstName: 'Test',
          lastName: 'Manager',
          position: 'HR Manager',
          phone: '020 1234 5678',
          email: 'hr@test-company.com'
        },
        socialLinks: {
          linkedin: 'https://linkedin.com/company/test-tech',
          twitter: 'https://twitter.com/testtech',
          facebook: 'https://facebook.com/testtech'
        },
        benefits: [
          'Health Insurance',
          'Pension Scheme',
          'Flexible Working',
          'Learning Budget',
          'Free Lunch'
        ],
        culture: [
          'Innovation',
          'Collaboration',
          'Growth Mindset',
          'Work-Life Balance'
        ],
        isVerified: true,
        verificationDate: new Date(),
        subscriptionPlan: 'basic',
        jobPostingLimit: 10,
        jobPostingsUsed: 0,
        notificationSettings: {
          applicationAlerts: true,
          weeklyReports: true,
          marketingEmails: false
        }
      },
      isEmailVerified: true,
      isActive: true
    };

    const testCompany = new User(testCompanyData);
    await testCompany.save();

    console.log('✅ Test company created successfully!');
    console.log('📧 Email:', testCompany.email);
    console.log('🏢 Company Name:', testCompany.profile.companyName);
    console.log('🔑 Password: Password123');
    console.log('🆔 User ID:', testCompany._id);

  } catch (error) {
    console.error('❌ Error creating test company:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from database');
  }
}

// Run the script
createTestCompany();
