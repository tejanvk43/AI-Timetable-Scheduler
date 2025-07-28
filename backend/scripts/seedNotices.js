const mongoose = require('mongoose');
const Notice = require('../models/Notice');
const Admin = require('../models/Admin');
require('dotenv').config();

const sampleNotices = [
  {
    title: 'Mid-Semester Examination Schedule',
    description: 'The mid-semester examinations for all courses will be conducted from March 15, 2024, to March 25, 2024. Students are required to check their individual exam schedules on the student portal. All students must carry their valid ID cards during the examination. No electronic devices are allowed in the examination hall except for calculators where explicitly permitted. Students arriving more than 30 minutes late will not be allowed to enter the examination hall.',
    targetAudience: 'All',
    expiryDate: new Date('2024-03-30'),
    priority: 'Urgent',
    tags: ['examination', 'schedule', 'academic']
  },
  {
    title: 'Computer Science Department Seminar',
    description: 'Join us for an exciting seminar on "Artificial Intelligence and Machine Learning in Modern Applications" by Dr. Sarah Johnson from MIT. The seminar will cover current trends in AI, practical applications in industry, and future research directions. This is a great opportunity for CSE students to learn about cutting-edge technology and network with professionals. Light refreshments will be provided after the session.',
    targetAudience: 'CSE',
    expiryDate: new Date('2024-04-15'),
    priority: 'High',
    tags: ['seminar', 'AI', 'machine learning', 'CSE']
  },
  {
    title: 'Library New Book Collection',
    description: 'The college library has acquired over 500 new books covering various subjects including latest editions of computer science, engineering, mathematics, and literature. Students can now access these books for borrowing. The new collection includes bestsellers, research papers, and reference materials. Extended borrowing period of 21 days is available for final year students for their project work.',
    targetAudience: 'Library',
    expiryDate: new Date('2024-05-01'),
    priority: 'Medium',
    tags: ['library', 'books', 'collection', 'resources']
  },
  {
    title: 'Annual Sports Tournament Registration',
    description: 'Registration is now open for the Annual Inter-College Sports Tournament 2024. Events include cricket, football, basketball, volleyball, badminton, table tennis, and athletics. Individual and team registrations are welcome. Last date for registration is March 20, 2024. Entry fee: ₹100 per individual event, ₹500 per team event. Winners will receive cash prizes and certificates. Contact the Sports Committee for more details.',
    targetAudience: 'Sports',
    expiryDate: new Date('2024-03-20'),
    priority: 'High',
    tags: ['sports', 'tournament', 'registration', 'inter-college']
  },
  {
    title: 'Cultural Fest 2024 - Talent Hunt',
    description: 'Get ready for the biggest cultural festival of the year! We are looking for talented students in music, dance, drama, poetry, and other performing arts. Auditions will be held next week. This is your chance to showcase your talent and represent the college. Multiple categories available including solo and group performances. Winners will get featured in the main cultural fest and receive exciting prizes.',
    targetAudience: 'Cultural',
    expiryDate: new Date('2024-04-10'),
    priority: 'Medium',
    tags: ['cultural fest', 'talent hunt', 'auditions', 'performing arts']
  },
  {
    title: 'Hostel Mess Menu Changes',
    description: 'Based on student feedback, we are implementing changes to the hostel mess menu starting from next week. New vegetarian and non-vegetarian options will be added. Special dietary requirements for students with allergies or medical conditions can be accommodated - please contact the hostel administration. The new menu includes regional cuisines and healthy options. Feedback forms are available at the mess reception.',
    targetAudience: 'Hostel',
    expiryDate: new Date('2024-04-05'),
    priority: 'Low',
    tags: ['hostel', 'mess', 'menu', 'food']
  }
];

const seedNotices = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/college_notice_board');
    console.log('Connected to MongoDB');

    // Find the admin user
    const admin = await Admin.findOne({ email: 'admin@college.edu' });
    if (!admin) {
      console.log('❌ Admin account not found. Please run setup.js first.');
      process.exit(1);
    }

    // Check if notices already exist
    const existingNotices = await Notice.countDocuments();
    if (existingNotices > 0) {
      console.log(`📋 ${existingNotices} notices already exist in the database.`);
      console.log('Skipping seeding to avoid duplicates.');
      process.exit(0);
    }

    // Add createdBy field to all notices
    const noticesWithCreator = sampleNotices.map(notice => ({
      ...notice,
      createdBy: admin._id,
      isActive: true
    }));

    // Insert sample notices
    await Notice.insertMany(noticesWithCreator);
    
    console.log('✅ Sample notices created successfully!');
    console.log(`📋 Added ${sampleNotices.length} notices to the database.`);
    console.log('');
    console.log('You can now view the notices at: http://localhost:3000');
    console.log('Admin dashboard: http://localhost:3000/admin/login');

  } catch (error) {
    console.error('❌ Error seeding notices:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  }
};

seedNotices();
