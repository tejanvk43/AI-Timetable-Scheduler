const mongoose = require('mongoose');
const User = require('../models/User');
const Class = require('../models/Class');
const Subject = require('../models/Subject');
const Timetable = require('../models/Timetable');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/timetable_scheduler')
.then(() => console.log('Connected to MongoDB'))
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

// Clear all dummy/seed data
const clearDatabase = async () => {
  try {
    console.log('Clearing all data from database...');
    
    // Clear all collections
    const userResult = await User.deleteMany({});
    console.log(`Deleted ${userResult.deletedCount} users`);
    
    const classResult = await Class.deleteMany({});
    console.log(`Deleted ${classResult.deletedCount} classes`);
    
    const subjectResult = await Subject.deleteMany({});
    console.log(`Deleted ${subjectResult.deletedCount} subjects`);
    
    const timetableResult = await Timetable.deleteMany({});
    console.log(`Deleted ${timetableResult.deletedCount} timetables`);
    
    console.log('Database cleared successfully!');
    console.log('');
    console.log('Note: You will need to create a new admin user to access the system.');
    console.log('You can use the fix-admin.js script to create a new admin user.');
    
    // Disconnect from the database
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    
    process.exit(0);
  } catch (error) {
    console.error('Error clearing database:', error);
    process.exit(1);
  }
};

// Run the clear function
clearDatabase();
