const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const Timetable = require('../models/Timetable');
const Class = require('../models/Class');
const Subject = require('../models/Subject');
const User = require('../models/User');

// @route   GET /api/timetables
// @desc    Get all timetables
// @access  Public
router.get('/', async (req, res) => {
  try {
    const timetables = await Timetable.find()
      .populate('class_id', 'name branch year')
      .select('class_id academic_year periods_per_day last_generated');
    
    res.status(200).json({
      message: 'Timetables retrieved successfully',
      count: timetables.length,
      data: timetables
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error retrieving timetables', error: error.message });
  }
});

// @route   GET /api/timetables/:id
// @desc    Get timetable by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const timetableDoc = await Timetable.findById(req.params.id)
      .populate('class_id', 'name branch year class_teacher_id')
      .populate({
        path: 'class_id',
        populate: {
          path: 'class_teacher_id',
          select: 'name faculty_id phone_number'
        }
      });
    
    if (!timetableDoc) {
      return res.status(404).json({ message: 'Timetable not found' });
    }
    
    // Convert to plain object to allow modifications
    const timetable = timetableDoc.toObject();
    
    // Populate schedule details with subject and faculty info
    if (timetable.schedule) {
      const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      
      for (const day of days) {
        if (timetable.schedule[day] && timetable.schedule[day].length > 0) {
          for (let i = 0; i < timetable.schedule[day].length; i++) {
            const entry = timetable.schedule[day][i];
            
            if (entry.subject_id) {
              const subject = await Subject.findById(entry.subject_id);
              if (subject) {
                timetable.schedule[day][i].subject_details = {
                  name: subject.name,
                  code: subject.code,
                  is_lab: subject.is_lab
                };
              }
            }
            
            if (entry.faculty_id) {
              const faculty = await User.findById(entry.faculty_id);
              if (faculty) {
                timetable.schedule[day][i].faculty_details = {
                  name: faculty.name,
                  faculty_id: faculty.faculty_id
                };
              }
            }
          }
        }
      }
    }
    
    res.status(200).json({
      message: 'Timetable retrieved successfully',
      data: timetable
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error retrieving timetable', error: error.message });
  }
});

// @route   GET /api/timetables/class/:classId
// @desc    Get timetable by class ID
// @access  Public
router.get('/class/:classId', async (req, res) => {
  try {
    const timetable = await Timetable.findOne({ class_id: req.params.classId })
      .populate('class_id', 'name branch year class_teacher_id')
      .populate({
        path: 'class_id',
        populate: {
          path: 'class_teacher_id',
          select: 'name faculty_id phone_number'
        }
      });
    
    if (!timetable) {
      return res.status(404).json({ message: 'Timetable not found for this class' });
    }
    
    // Populate schedule details with subject and faculty info (same as above)
    if (timetable.schedule) {
      const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      
      for (const day of days) {
        if (timetable.schedule[day] && timetable.schedule[day].length > 0) {
          for (let i = 0; i < timetable.schedule[day].length; i++) {
            const entry = timetable.schedule[day][i];
            
            if (entry.subject_id) {
              const subject = await Subject.findById(entry.subject_id);
              if (subject) {
                timetable.schedule[day][i].subject_details = {
                  name: subject.name,
                  code: subject.code,
                  is_lab: subject.is_lab
                };
              }
            }
            
            if (entry.faculty_id) {
              const faculty = await User.findById(entry.faculty_id);
              if (faculty) {
                timetable.schedule[day][i].faculty_details = {
                  name: faculty.name,
                  faculty_id: faculty.faculty_id
                };
              }
            }
          }
        }
      }
    }
    
    res.status(200).json({
      message: 'Timetable retrieved successfully',
      data: timetable
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error retrieving timetable', error: error.message });
  }
});

// @route   GET /api/timetables/faculty/:facultyId
// @desc    Get timetable for a faculty member
// @access  Private
router.get('/faculty/:facultyId', protect, async (req, res) => {
  try {
    // Check if requesting user is the faculty or an admin
    if (req.user.role !== 'admin' && req.user._id.toString() !== req.params.facultyId) {
      return res.status(403).json({ message: 'Not authorized to access this timetable' });
    }
    
    const faculty = await User.findById(req.params.facultyId);
    
    if (!faculty) {
      return res.status(404).json({ message: 'Faculty not found' });
    }
    
    // Normalize facultyId for comparison (handle both ObjectId and string)
    const facultyIdStr = req.params.facultyId.toString();
    
    console.log(`Fetching timetable for faculty: ${facultyIdStr} (${faculty.name})`);
    
    // Find all timetables
    const timetables = await Timetable.find()
      .populate('class_id', 'name branch year');
    
    console.log(`Found ${timetables.length} timetables to search`);
    
    // Extract faculty schedule from all timetables
    const facultySchedule = {
      monday: [],
      tuesday: [],
      wednesday: [],
      thursday: [],
      friday: [],
      saturday: []
    };
    
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    let totalEntriesChecked = 0;
    let matchingEntries = 0;
    
    for (const timetable of timetables) {
      const classInfo = timetable.class_id;
      
      for (const day of days) {
        if (timetable.schedule && timetable.schedule[day] && Array.isArray(timetable.schedule[day]) && timetable.schedule[day].length > 0) {
          for (const entry of timetable.schedule[day]) {
            totalEntriesChecked++;
            
            // Normalize entry.faculty_id for comparison
            let entryFacultyId = null;
            if (entry.faculty_id) {
              // Handle both ObjectId and string formats
              if (typeof entry.faculty_id === 'object' && entry.faculty_id.toString) {
                entryFacultyId = entry.faculty_id.toString();
              } else if (typeof entry.faculty_id === 'string') {
                entryFacultyId = entry.faculty_id;
              }
            }
            
            // Compare normalized IDs
            if (entryFacultyId && entryFacultyId === facultyIdStr) {
              matchingEntries++;
              const subject = await Subject.findById(entry.subject_id);
              
              facultySchedule[day].push({
                period: entry.period,
                subject_name: subject ? subject.name : 'Unknown Subject',
                subject_code: subject ? subject.code : '',
                is_lab: subject ? subject.is_lab : false,
                class_name: classInfo ? classInfo.name : 'Unknown Class',
                period_timing: timetable.period_timings && timetable.period_timings[entry.period - 1] 
                  ? timetable.period_timings[entry.period - 1] 
                  : null
              });
            }
          }
        }
      }
    }
    
    console.log(`Checked ${totalEntriesChecked} entries, found ${matchingEntries} matching entries for faculty ${facultyIdStr}`);
    
    // Sort each day's schedule by period
    for (const day of days) {
      facultySchedule[day].sort((a, b) => a.period - b.period);
    }
    
    res.status(200).json({
      message: 'Faculty timetable retrieved successfully',
      faculty: {
        name: faculty.name,
        faculty_id: faculty.faculty_id
      },
      schedule: facultySchedule
    });
  } catch (error) {
    console.error('Error retrieving faculty timetable:', error);
    res.status(500).json({ message: 'Error retrieving faculty timetable', error: error.message });
  }
});

// Removed duplicate POST route - see line 413 for the active POST route with proper authentication

// @route   PUT /api/timetables/:id
// @desc    Update timetable structure or guidelines
// @access  Private/Admin
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const {
      periods_per_day,
      period_names,
      period_timings,
      break_timings,
      guidelines
    } = req.body;
    
    let timetable = await Timetable.findById(req.params.id);
    
    if (!timetable) {
      return res.status(404).json({ message: 'Timetable not found' });
    }
    
    // Update timetable structure
    if (periods_per_day) timetable.periods_per_day = periods_per_day;
    if (period_names) timetable.period_names = period_names;
    if (period_timings) timetable.period_timings = period_timings;
    if (break_timings) timetable.break_timings = break_timings;
    
    // Update guidelines
    if (guidelines) {
      timetable.guidelines = {
        ...timetable.guidelines,
        ...guidelines
      };
    }
    
    await timetable.save();
    
    res.status(200).json({
      message: 'Timetable updated successfully',
      data: timetable
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating timetable', error: error.message });
  }
});

// @route   PUT /api/timetables/:id/schedule
// @desc    Update timetable schedule
// @access  Private/Admin
router.put('/:id/schedule', protect, authorize('admin'), async (req, res) => {
  try {
    const { schedule } = req.body;
    
    if (!schedule) {
      return res.status(400).json({ message: 'Please provide schedule' });
    }
    
    let timetable = await Timetable.findById(req.params.id);
    
    if (!timetable) {
      return res.status(404).json({ message: 'Timetable not found' });
    }
    
    // Update schedule
    timetable.schedule = schedule;
    timetable.last_generated = new Date();
    
    await timetable.save();
    
    res.status(200).json({
      message: 'Timetable schedule updated successfully',
      data: timetable
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating timetable schedule', error: error.message });
  }
});

// @route   PUT /api/timetables/:id/reset
// @desc    Reset timetable schedule
// @access  Private/Admin
router.put('/:id/reset', protect, authorize('admin'), async (req, res) => {
  try {
    let timetable = await Timetable.findById(req.params.id);
    
    if (!timetable) {
      return res.status(404).json({ message: 'Timetable not found' });
    }
    
    // Reset schedule to empty
    timetable.schedule = {
      monday: [],
      tuesday: [],
      wednesday: [],
      thursday: [],
      friday: [],
      saturday: []
    };
    
    await timetable.save();
    
    res.status(200).json({
      message: 'Timetable schedule reset successfully',
      data: timetable
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error resetting timetable schedule', error: error.message });
  }
});

// @route   POST /api/timetables
// @desc    Create new timetable structure
// @access  Private/Admin
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    console.log('=== CREATE TIMETABLE REQUEST ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('User:', req.user ? req.user._id : 'No user');
    
    const { 
      class_id, 
      academic_year, 
      periods_per_day, 
      working_days, 
      period_timings, 
      guidelines,
      template_id 
    } = req.body;
    
    if (!class_id || !academic_year) {
      console.error('Missing required fields:', { class_id, academic_year });
      return res.status(400).json({ message: 'Class ID and academic year are required' });
    }
    
    // Check if class exists
    const classExists = await Class.findById(class_id);
    if (!classExists) {
      console.error('Class not found:', class_id);
      return res.status(404).json({ message: 'Class not found' });
    }
    
    // Check if timetable already exists for this class and academic year - delete if exists
    const existingTimetable = await Timetable.findOne({ 
      class_id: class_id, 
      academic_year: academic_year 
    });
    
    if (existingTimetable) {
      console.log('Found existing timetable, deleting:', { class_id, academic_year });
      await Timetable.findByIdAndDelete(existingTimetable._id);
      console.log('Old timetable deleted, creating new one');
    }
    
    // If template_id is provided, load template data
    let templateData = null;
    if (template_id) {
      const Template = require('../models/Template');
      templateData = await Template.findById(template_id);
      
      if (!templateData) {
        console.error('Template not found:', template_id);
        return res.status(404).json({ message: 'Template not found' });
      }
      
      console.log('Using template:', templateData.name);
    }
    
    // Create new timetable structure
    const timetable = await Timetable.create({
      class_id,
      academic_year,
      template_id: template_id || null,
      periods_per_day: periods_per_day || templateData?.periods_per_day || 6,
      working_days: working_days || templateData?.days || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
      period_names: period_timings ? 
        period_timings.filter(p => !p.is_break).map(p => p.name) :
        Array.from({ length: periods_per_day || 6 }, (_, i) => `Period ${i + 1}`),
      period_timings: period_timings || templateData?.guidelines?.period_timings || [
        { name: 'Period 1', start_time: '09:00', end_time: '09:50' },
        { name: 'Period 2', start_time: '09:50', end_time: '10:40' },
        { name: 'Break', start_time: '10:40', end_time: '11:00', is_break: true, break_duration: 20 },
        { name: 'Period 3', start_time: '11:00', end_time: '11:50' },
        { name: 'Period 4', start_time: '11:50', end_time: '12:40' },
        { name: 'Lunch Break', start_time: '12:40', end_time: '01:30', is_break: true, break_duration: 50 },
        { name: 'Period 5', start_time: '01:30', end_time: '02:20' },
        { name: 'Period 6', start_time: '02:20', end_time: '03:10' }
      ],
      guidelines: guidelines || templateData?.guidelines || {
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
    });
    
    console.log('Timetable created successfully:', timetable._id);
    
    // Populate the response
    const populatedTimetable = await Timetable.findById(timetable._id)
      .populate('class_id', 'name branch year section');
    
    res.status(201).json({
      message: 'Timetable structure created successfully',
      data: populatedTimetable
    });
  } catch (error) {
    console.error('=== TIMETABLE CREATION ERROR ===');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: validationErrors 
      });
    }
    
    res.status(500).json({ message: 'Error creating timetable structure', error: error.message });
  }
});

// @route   DELETE /api/timetables/:id
// @desc    Delete timetable
// @access  Private/Admin
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const timetable = await Timetable.findById(req.params.id);
    
    if (!timetable) {
      return res.status(404).json({ message: 'Timetable not found' });
    }
    
    await Timetable.findByIdAndDelete(req.params.id);
    
    res.status(200).json({
      message: 'Timetable deleted successfully',
      data: {}
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error deleting timetable', error: error.message });
  }
});

module.exports = router;
