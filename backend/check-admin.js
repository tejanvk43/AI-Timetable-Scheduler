const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const User = require('./models/User');

async function checkUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/timetable');
    console.log('Connected to MongoDB');

    const users = await User.find({ role: 'admin' }).select('username name role');
    console.log('Admin users found:', users);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.disconnect();
  }
}

checkUsers();
