const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI);

const User = require('./models/User');

async function listFaculty() {
  try {
    console.log('📋 Current Faculty Members:\n');
    
    const faculty = await User.find({ role: 'faculty' })
      .select('username name faculty_id')
      .sort({ faculty_id: 1 });
    
    console.log('Found', faculty.length, 'faculty members:');
    console.log('═'.repeat(80));
    console.log('Username'.padEnd(20), 'Faculty ID'.padEnd(15), 'Name');
    console.log('═'.repeat(80));
    
    faculty.forEach(f => {
      const username = (f.username || 'N/A').padEnd(20);
      const facultyId = (f.faculty_id || 'N/A').padEnd(15);
      const name = f.name || 'N/A';
      console.log(username, facultyId, name);
    });
    
    console.log('═'.repeat(80));
    console.log('\n💡 Tips for Excel class_teacher_id column:');
    console.log('• Use values from the "Faculty ID" column above');
    console.log('• Or use values from the "Username" column');
    console.log('• Leave empty if no class teacher assigned');
    console.log('• Do NOT use values like "99NG1A1252" unless they appear above');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    mongoose.disconnect();
  }
}

listFaculty();
