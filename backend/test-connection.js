const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    console.log('Attempting to connect to MongoDB Atlas...');
    console.log('URI:', process.env.MONGODB_URI ? 'URI is set' : 'URI is NOT set');
    
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    
    console.log('✅ MongoDB Atlas connected successfully!');
    console.log(`📍 Connected to: ${conn.connection.host}`);
    console.log(`🗄️  Database: ${conn.connection.name}`);
    
    // Test basic operations
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`📊 Collections found: ${collections.length}`);
    collections.forEach(col => console.log(`   - ${col.name}`));
    
    process.exit(0);
  } catch (error) {
    console.error('❌ MongoDB Atlas connection failed:');
    console.error('Error:', error.message);
    
    if (error.message.includes('ENOTFOUND')) {
      console.log('\n💡 Troubleshooting tips:');
      console.log('1. Check your internet connection');
      console.log('2. Verify the cluster URL in MongoDB Atlas');
      console.log('3. Ensure your IP is whitelisted in Atlas Network Access');
    }
    
    if (error.message.includes('authentication failed')) {
      console.log('\n💡 Authentication tips:');
      console.log('1. Check username and password in the connection string');
      console.log('2. Verify database user exists in Atlas Database Access');
      console.log('3. Ensure the user has proper permissions');
    }
    
    process.exit(1);
  }
};

connectDB();
