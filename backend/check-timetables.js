const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI);

const Timetable = require('./models/Timetable');
const Class = require('./models/Class');

async function checkTimetables() {
  try {
    console.log('🔍 Checking Timetables in Database:\n');
    
    const timetables = await Timetable.find().populate('class_id', 'name branch year section');
    
    if (timetables.length === 0) {
      console.log('❌ NO TIMETABLES FOUND');
      console.log('📝 You need to create timetable structures first.\n');
      
      console.log('🏫 Available Classes:');
      const classes = await Class.find().select('name branch year section');
      
      if (classes.length === 0) {
        console.log('❌ No classes found either! Create classes first.');
      } else {
        classes.forEach((cls, index) => {
          console.log(`${index + 1}. ${cls.name} (${cls.branch} - Year ${cls.year}, Section ${cls.section})`);
        });
      }
    } else {
      console.log(`✅ Found ${timetables.length} timetable(s):\n`);
      
      timetables.forEach((tt, index) => {
        console.log(`${index + 1}. Timetable ID: ${tt._id}`);
        console.log(`   Class: ${tt.class_id.name}`);
        console.log(`   Academic Year: ${tt.academic_year}`);
        console.log(`   Periods per Day: ${tt.periods_per_day}`);
        console.log(`   Last Generated: ${tt.last_generated || 'Never'}`);
        console.log(`   Guidelines: ${JSON.stringify(tt.guidelines)}`);
        console.log('   ─────────────────────────────────────');
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    mongoose.disconnect();
  }
}

checkTimetables();
