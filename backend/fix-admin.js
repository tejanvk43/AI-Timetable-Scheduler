const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/timetable_scheduler')
.then(() => console.log('Connected to MongoDB'))
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

const fixAdminUser = async () => {
  try {
    console.log('Fixing admin user...');
    
    // Delete existing admin user
    await User.deleteOne({ role: 'admin' });
    console.log('Deleted existing admin user');
    
    // Create new admin user
    const admin = new User({
      username: '1001',
      password: 'admin123',
      role: 'admin',
      name: 'System Administrator'
    });
    
    await admin.save();
    console.log('Created new admin user with username: 1001, password: admin123');
    
    // Test the login
    const testUser = await User.findOne({ username: '1001' }).select('+password');
    if (testUser) {
      const isMatch = await testUser.matchPassword('admin123');
      console.log('Password verification test:', isMatch);
    }
    
    await mongoose.disconnect();
    console.log('Admin user fixed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error fixing admin user:', error);
    process.exit(1);
  }
};

fixAdminUser();
