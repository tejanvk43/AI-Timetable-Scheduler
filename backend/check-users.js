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

const checkUsers = async () => {
  try {
    console.log('Checking users in database...');
    
    const users = await User.find({}).select('+password');
    console.log('Found users:', users.length);
    
    for (const user of users) {
      console.log(`User: ${user.username}, Role: ${user.role}, Name: ${user.name}`);
      
      // Test password matching for admin user
      if (user.role === 'admin') {
        console.log('Testing admin password with admin123...');
        const isMatch1 = await bcrypt.compare('admin123', user.password);
        console.log('Password match result for admin123:', isMatch1);
        
        console.log('Testing admin password with urce123...');
        const isMatch2 = await bcrypt.compare('urce123', user.password);
        console.log('Password match result for urce123:', isMatch2);
        
        // Also test the model method
        const isMatchModel1 = await user.matchPassword('admin123');
        console.log('Model password match result for admin123:', isMatchModel1);
        
        const isMatchModel2 = await user.matchPassword('urce123');
        console.log('Model password match result for urce123:', isMatchModel2);
      }
    }
    
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('Error checking users:', error);
    process.exit(1);
  }
};

checkUsers();
