const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/timetable_scheduler')
.then(() => console.log('Connected to MongoDB'))
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

const setupDatabase = async () => {
  try {
    console.log('Setting up fresh database...');
    
    // Check if admin user already exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    
    if (existingAdmin) {
      console.log('Admin user already exists:', existingAdmin.username);
      console.log('Use clear-database.js script first if you want to start fresh.');
      await mongoose.disconnect();
      process.exit(0);
    }
    
    // Create new admin user
    const admin = new User({
      username: '1001',
      password: 'admin123',
      role: 'admin',
      name: 'System Administrator'
    });
    
    await admin.save();
    console.log('✓ Created admin user');
    console.log('  Username: 1001');
    console.log('  Password: admin123');
    console.log('  Role: admin');
    
    console.log('');
    console.log('Database setup complete!');
    console.log('You can now login to the system with the admin credentials.');
    console.log('');
    console.log('Next steps:');
    console.log('1. Start the backend server: npm run dev');
    console.log('2. Start the frontend server: npm start (in frontend folder)');
    console.log('3. Login with username: 1001, password: admin123');
    
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('Error setting up database:', error);
    process.exit(1);
  }
};

// Run the setup function
setupDatabase();
