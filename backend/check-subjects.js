const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI);

const Subject = require('./models/Subject');

async function checkSubjects() {
  try {
    console.log('📚 Checking Subjects in Database:\n');
    
    const subjects = await Subject.find().select('name code is_lab default_duration_periods');
    
    if (subjects.length === 0) {
      console.log('❌ NO SUBJECTS FOUND');
      console.log('📝 You need to create subjects first.\n');
      console.log('💡 Sample subjects you should create:');
      console.log('- Data Structures (Theory, 1 period)');
      console.log('- Data Structures Lab (Lab, 2 periods)');
      console.log('- Database Management Systems (Theory, 1 period)');
      console.log('- DBMS Lab (Lab, 2 periods)');
      console.log('- Operating Systems (Theory, 1 period)');
      console.log('- Computer Networks (Theory, 1 period)');
      console.log('- Sports (Theory, 1 period)');
    } else {
      console.log(`✅ Found ${subjects.length} subject(s):\n`);
      
      subjects.forEach((subject, index) => {
        console.log(`${index + 1}. ${subject.name} (${subject.code})`);
        console.log(`   Type: ${subject.is_lab ? 'Laboratory' : 'Theory'}`);
        console.log(`   Duration: ${subject.default_duration_periods} period(s)`);
        console.log('   ─────────────────────────────────────');
      });
      
      console.log('\n💡 You can now proceed to AI generation!');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    mongoose.disconnect();
  }
}

checkSubjects();
