const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');
require('dotenv').config();

const setupDatabase = async () => {
  try {
    console.log('🔗 Connecting to MongoDB...');
    
    // Connect to MongoDB (works with both local and Atlas)
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/notice-board';
    await mongoose.connect(mongoUri);
    
    if (mongoUri.includes('mongodb+srv')) {
      console.log('✅ Connected to MongoDB Atlas (Cloud Database)');
    } else {
      console.log('✅ Connected to Local MongoDB');
    }

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email: 'admin@college.edu' });
    if (existingAdmin) {
      console.log('👤 Admin account already exists!');
      console.log('📧 Email: admin@college.edu');
      console.log('🔑 Password: admin123');
      console.log('');
      console.log('🌐 Login at: http://localhost:3000/admin/login');
      process.exit(0);
    }

    // Create admin account
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);

    const admin = new Admin({
      name: 'College Administrator',
      email: 'admin@college.edu',
      password: hashedPassword,
      role: 'admin'
    });

    await admin.save();
    console.log('✅ Admin account created successfully!');
    console.log('📧 Email: admin@college.edu');
    console.log('🔑 Password: admin123');
    console.log('');
    console.log('You can now login to the admin dashboard at: http://localhost:3000/admin/login');

  } catch (error) {
    console.error('❌ Error setting up database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  }
};

setupDatabase();
