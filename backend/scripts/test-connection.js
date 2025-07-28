const mongoose = require('mongoose');
require('dotenv').config();

const testConnection = async () => {
  try {
    console.log('🔗 Testing MongoDB connection...');
    console.log('📍 Connection URI:', process.env.MONGODB_URI?.replace(/\/\/.*:.*@/, '//***:***@'));
    
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/notice-board');
    
    if (process.env.MONGODB_URI?.includes('mongodb+srv')) {
      console.log('✅ Successfully connected to MongoDB Atlas (Cloud Database)!');
    } else {
      console.log('✅ Successfully connected to Local MongoDB!');
    }
    
    // Test database operations
    const testCollection = mongoose.connection.db.collection('test');
    await testCollection.insertOne({ test: 'connection', timestamp: new Date() });
    console.log('✅ Database write test successful!');
    
    await testCollection.deleteOne({ test: 'connection' });
    console.log('✅ Database delete test successful!');
    
    console.log('🎉 All database tests passed!');
    
  } catch (error) {
    console.error('❌ Database connection failed:');
    console.error('Error:', error.message);
    
    if (error.message.includes('Authentication failed')) {
      console.log('\n💡 Troubleshooting:');
      console.log('1. Check your username and password in the connection string');
      console.log('2. Make sure you created a database user in MongoDB Atlas');
      console.log('3. Verify the user has "Read and write to any database" permissions');
    }
    
    if (error.message.includes('IP not in whitelist')) {
      console.log('\n💡 Troubleshooting:');
      console.log('1. Go to MongoDB Atlas → Network Access');
      console.log('2. Add your current IP address or use 0.0.0.0/0 for testing');
    }
    
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from database');
    process.exit(0);
  }
};

testConnection();
