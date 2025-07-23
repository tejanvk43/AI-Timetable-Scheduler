const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Subject = require('./models/Subject');

async function checkLabSubjects() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/timetable');
    console.log('Connected to MongoDB');

    const labSubjects = await Subject.find({ is_lab: true });
    console.log('Lab subjects found:');
    labSubjects.forEach(subject => {
      console.log(`- ${subject.name} (${subject.code}): ${subject.default_duration_periods} periods`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.disconnect();
  }
}

checkLabSubjects();
