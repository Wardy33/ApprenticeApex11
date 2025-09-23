import bcrypt from 'bcryptjs';
import { User } from '../models/User';
import { connectToDatabase } from '../index';

async function createTestStudent() {
  try {
    console.log('🔧 Creating test student user...');
    
    // Connect to database
    await connectToDatabase();
    
    // Check if student already exists
    const existingStudent = await User.findOne({ 
      email: 'sarah.johnson@email.com' 
    });
    
    if (existingStudent) {
      console.log('✅ Test student already exists');
      console.log('📧 Email:', existingStudent.email);
      console.log('👤 Role:', existingStudent.role);
      return;
    }
    
    // Create test student user with plain password (will be hashed by pre-save middleware)
    const testStudent = new User({
      email: 'sarah.johnson@email.com',
      password: 'Password123',
      role: 'student',
      profile: {
        firstName: 'Sarah',
        lastName: 'Johnson',
        dateOfBirth: new Date('1995-06-15'),
        phone: '+44 7700 900123',
        location: {
          city: 'London',
          address: '123 Student Street',
          postcode: 'SW1A 1AA',
          coordinates: [-0.1276, 51.5074]
        },
        qualifications: [{
          institution: 'London University',
          qualification: 'A-Levels',
          subject: 'Computer Science, Mathematics, Physics',
          grade: 'A*AA',
          year: 2013
        }],
        skills: ['JavaScript', 'Python', 'HTML/CSS', 'React'],
        interests: ['Web Development', 'Software Engineering', 'Technology'],
        workExperience: [{
          company: 'TechStart Ltd',
          position: 'Junior Developer Intern',
          description: 'Developed web applications using React and Node.js',
          startDate: new Date('2023-06-01'),
          endDate: new Date('2023-08-31')
        }],
        preferences: {
          industries: ['Technology', 'Software Development'],
          locations: ['London', 'Remote'],
          apprenticeshipLevels: ['Level 3', 'Level 4'],
          salaryExpectation: {
            min: 18000,
            max: 25000
          }
        },
        cv: {
          filename: 'sarah_johnson_cv.pdf',
          uploadDate: new Date(),
          verified: true
        }
      },
      isEmailVerified: true,
      isActive: true,
      lastLogin: new Date()
    });
    
    await testStudent.save();
    console.log('✅ Test student created successfully!');
    console.log('📧 Email: sarah.johnson@email.com');
    console.log('🔑 Password: Password123');
    console.log('👤 Role: student');
    
  } catch (error) {
    console.error('❌ Error creating test student:', error.message);
  } finally {
    process.exit(0);
  }
}

createTestStudent();
