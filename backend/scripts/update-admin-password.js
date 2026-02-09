const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/timetable_scheduler';

async function updateAdminPassword() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const newPassword = 'admin1234';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    const result = await mongoose.connection.db.collection('users').updateOne(
      { username: 'admin' },
      { $set: { password: hashedPassword } }
    );

    console.log(`Updated ${result.modifiedCount} user(s) password to 'admin1234'`);
  } catch (error) {
    console.error('Error updating password:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Disconnected from MongoDB');
  }
}

updateAdminPassword();
