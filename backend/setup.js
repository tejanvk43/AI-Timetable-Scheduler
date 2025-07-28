const mongoose = require('mongoose');
const Admin = require('./models/Admin');
require('dotenv').config();

const createInitialAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/notice-board');
    console.log('Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email: 'admin@college.edu' });
    if (existingAdmin) {
      console.log('Admin already exists with email: admin@college.edu');
      process.exit(0);
    }

    // Create initial admin
    const admin = new Admin({
      email: 'admin@college.edu',
      password: 'admin123', // This will be hashed automatically
      name: 'System Administrator'
    });

    await admin.save();
    console.log('Initial admin created successfully!');
    console.log('Email: admin@college.edu');
    console.log('Password: admin123');
    console.log('Please change the password after first login.');

  } catch (error) {
    console.error('Error creating initial admin:', error);
  } finally {
    mongoose.connection.close();
    process.exit(0);
  }
};

createInitialAdmin();
