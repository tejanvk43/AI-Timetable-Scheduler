const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI);

const Class = require('./models/Class');
const Timetable = require('./models/Timetable');

async function createSampleTimetables() {
  try {
    console.log('🎯 Creating Sample Timetable Structures...\n');
    
    // Get all classes
    const classes = await Class.find().limit(3);
    
    if (classes.length === 0) {
      console.log('❌ No classes found! Create classes first.');
      return;
    }
    
    console.log(`📚 Found ${classes.length} classes, creating timetables...\n`);
    
    for (const cls of classes) {
      // Check if timetable already exists
      const existing = await Timetable.findOne({ 
        class_id: cls._id, 
        academic_year: '2024-25' 
      });
      
      if (existing) {
        console.log(`⏭️  Timetable already exists for ${cls.name}`);
        continue;
      }
      
      // Create timetable structure
      const timetableData = {
        class_id: cls._id,
        academic_year: '2024-25',
        periods_per_day: 6,
        working_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
        period_timings: [
          { name: 'Period 1', start: '09:00', end: '09:50' },
          { name: 'Period 2', start: '09:50', end: '10:40' },
          { name: 'Break', start: '10:40', end: '11:00' },
          { name: 'Period 3', start: '11:00', end: '11:50' },
          { name: 'Period 4', start: '11:50', end: '12:40' },
          { name: 'Lunch Break', start: '12:40', end: '01:30' },
          { name: 'Period 5', start: '01:30', end: '02:20' },
          { name: 'Period 6', start: '02:20', end: '03:10' }
        ],
        guidelines: {
          minimize_consecutive_faculty_periods: true,
          labs_once_a_week: true,
          sports_last_period_predefined_day: 'friday',
          break_after_periods: [2, 4]
        },
        schedule: {
          monday: [],
          tuesday: [],
          wednesday: [],
          thursday: [],
          friday: [],
          saturday: []
        }
      };
      
      const timetable = await Timetable.create(timetableData);
      console.log(`✅ Created timetable for ${cls.name} (ID: ${timetable._id})`);
    }
    
    console.log('\n🎉 Sample timetable structures created successfully!');
    console.log('\n📋 Next Steps:');
    console.log('1. Go to Admin → Timetables to see the structures');
    console.log('2. Go to Admin → Generate AI to create AI timetables');
    console.log('3. Make sure you have subjects and faculty assigned');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    mongoose.disconnect();
  }
}

createSampleTimetables();
