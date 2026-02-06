const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Models
const User = require('./models/User');
const Subject = require('./models/Subject');
const Class = require('./models/Class');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/timetable_db';

const seedDatabase = async () => {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Create Admin User
    console.log('\n📝 Creating admin user...');
    const existingAdmin = await User.findOne({ username: 'admin' });
    
    if (!existingAdmin) {
      // Don't hash password here - the User model pre-save hook does it automatically
      const admin = new User({
        username: 'admin',
        name: 'Administrator',
        password: 'admin123',  // Will be hashed by pre-save hook
        role: 'admin',
        faculty_id: 'ADMIN001'
      });
      await admin.save();
      console.log('✅ Admin user created');
      console.log('   Username: admin');
      console.log('   Password: admin123');
    } else {
      console.log('ℹ️  Admin user already exists');
    }

    // Create Sample Subjects
    console.log('\n📚 Creating sample subjects...');
    const subjects = [
      { name: 'Data Structures', code: 'CS201', is_lab: false, credit_hours: 3, department: 'CSE' },
      { name: 'Data Structures Lab', code: 'CS201L', is_lab: true, credit_hours: 2, department: 'CSE' },
      { name: 'Database Management Systems', code: 'CS301', is_lab: false, credit_hours: 3, department: 'CSE' },
      { name: 'DBMS Lab', code: 'CS301L', is_lab: true, credit_hours: 2, department: 'CSE' },
      { name: 'Computer Networks', code: 'CS401', is_lab: false, credit_hours: 3, department: 'CSE' },
      { name: 'Operating Systems', code: 'CS302', is_lab: false, credit_hours: 3, department: 'CSE' },
      { name: 'Mathematics III', code: 'MA201', is_lab: false, credit_hours: 4, department: 'Mathematics' },
      { name: 'Digital Electronics', code: 'EC201', is_lab: false, credit_hours: 3, department: 'ECE' },
    ];

    for (const subjectData of subjects) {
      const existing = await Subject.findOne({ code: subjectData.code });
      if (!existing) {
        await Subject.create(subjectData);
        console.log(`   ✅ Created: ${subjectData.name}`);
      }
    }

    // Create Sample Faculty
    console.log('\n👨‍🏫 Creating sample faculty...');
    const faculty = [
      { username: 'john.smith', name: 'Dr. John Smith', faculty_id: 'FAC001', role: 'faculty' },
      { username: 'sarah.johnson', name: 'Dr. Sarah Johnson', faculty_id: 'FAC002', role: 'faculty' },
      { username: 'michael.brown', name: 'Prof. Michael Brown', faculty_id: 'FAC003', role: 'faculty' },
      { username: 'emily.davis', name: 'Dr. Emily Davis', faculty_id: 'FAC004', role: 'faculty' },
      { username: 'robert.wilson', name: 'Prof. Robert Wilson', faculty_id: 'FAC005', role: 'faculty' },
    ];

    for (const facultyData of faculty) {
      const existing = await User.findOne({ username: facultyData.username });
      if (!existing) {
        // Don't hash password here - the User model pre-save hook does it automatically
        await User.create({
          ...facultyData,
          password: 'faculty123'  // Will be hashed by pre-save hook
        });
        console.log(`   ✅ Created: ${facultyData.name}`);
      }
    }

    // Create Sample Classes
    console.log('\n🏫 Creating sample classes...');
    const classes = [
      { name: 'CSE-A 2nd Year', branch: 'CSE', year: 2, section: 'A', total_students: 60 },
      { name: 'CSE-B 2nd Year', branch: 'CSE', year: 2, section: 'B', total_students: 60 },
      { name: 'CSE-A 3rd Year', branch: 'CSE', year: 3, section: 'A', total_students: 55 },
      { name: 'ECE-A 2nd Year', branch: 'ECE', year: 2, section: 'A', total_students: 50 },
    ];

    for (const classData of classes) {
      const existing = await Class.findOne({ name: classData.name });
      if (!existing) {
        await Class.create(classData);
        console.log(`   ✅ Created: ${classData.name}`);
      }
    }

    console.log('\n✨ Database seeding completed!');
    console.log('\n📋 Quick Start:');
    console.log('   1. Start the server: npm run dev');
    console.log('   2. Login with username: admin / password: admin123');
    console.log('   3. Create a timetable structure for a class');
    console.log('   4. Generate AI timetable!\n');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
};

seedDatabase();
