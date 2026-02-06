const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const Timetable = require('../models/Timetable');
const Class = require('../models/Class');
const Subject = require('../models/Subject');
const User = require('../models/User');
const { generateTimetableWithAI, isOpenAIAvailable } = require('../services/openai-service');

// @route   POST /api/ai/generate-timetable
// @desc    Generate a timetable using AI logic
// @access  Private/Admin
router.post('/generate-timetable', protect, authorize('admin'), async (req, res) => {
  try {
    console.log('AI Generate Request Body:', JSON.stringify(req.body, null, 2));
    const { timetable_id, faculty_subject_assignments } = req.body;
    
    if (!timetable_id || !faculty_subject_assignments) {
      console.log('Missing required fields:', { timetable_id, faculty_subject_assignments });
      return res.status(400).json({ message: 'Please provide timetable_id and faculty_subject_assignments' });
    }
    
    if (!Array.isArray(faculty_subject_assignments)) {
      console.log('faculty_subject_assignments is not an array:', typeof faculty_subject_assignments);
      return res.status(400).json({ message: 'faculty_subject_assignments must be an array' });
    }
    
    if (faculty_subject_assignments.length === 0) {
      console.log('faculty_subject_assignments is empty');
      return res.status(400).json({ message: 'At least one faculty-subject assignment is required' });
    }
    
    console.log('Looking up timetable with ID:', timetable_id);
    const timetable = await Timetable.findById(timetable_id);
    
    if (!timetable) {
      console.log('Timetable not found for ID:', timetable_id);
      return res.status(404).json({ message: 'Timetable not found' });
    }
    
    console.log('Timetable found:', {
      id: timetable._id,
      class_id: timetable.class_id,
      academic_year: timetable.academic_year,
      periods_per_day: timetable.periods_per_day,
      guidelines: timetable.guidelines
    });
    
    // Get the class details
    const classDetails = await Class.findById(timetable.class_id);
    
    if (!classDetails) {
      return res.status(404).json({ message: 'Class not found' });
    }
    
    // Validate faculty and subject assignments
    console.log('Validating assignments:', faculty_subject_assignments);
    for (const assignment of faculty_subject_assignments) {
      const { faculty_id, subject_id } = assignment;
      console.log('Validating assignment:', assignment);
      
      if (!faculty_id) {
        return res.status(400).json({ message: 'Faculty ID is required for all assignments' });
      }
      
      if (!subject_id) {
        return res.status(400).json({ message: 'Subject ID is required for all assignments' });
      }
      
      // Check if faculty exists
      const faculty = await User.findById(faculty_id);
      if (!faculty) {
        console.log(`Faculty not found: ${faculty_id}`);
        return res.status(400).json({ message: `Faculty with ID ${faculty_id} not found` });
      }
      
      // Check if subject exists
      const subject = await Subject.findById(subject_id);
      if (!subject) {
        console.log(`Subject not found: ${subject_id}`);
        return res.status(400).json({ message: `Subject with ID ${subject_id} not found` });
      }
      
      console.log(`Validation passed for: Faculty ${faculty.name}, Subject ${subject.name}`);
    }
    
    // AI Timetable Generation Logic
    console.log('Calling generateTimetable function...');
    const schedule = await generateTimetable(timetable, faculty_subject_assignments);
    
    console.log('Generate timetable result:', {
      success: schedule.success,
      message: schedule.message,
      hasData: !!schedule.data
    });
    
    if (!schedule.success) {
      console.log('Generation failed:', schedule.message);
      return res.status(400).json({ message: schedule.message });
    }
    
    // Update the timetable with the generated schedule
    timetable.schedule = schedule.data;
    timetable.last_generated = new Date();
    
    await timetable.save();
    
    res.status(200).json({
      message: 'Timetable generated successfully',
      data: timetable
    });
  } catch (error) {
    console.error('Full error details:', error);
    console.error('Error stack:', error.stack);
    
    // Check if it's a validation error
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation Error', 
        details: error.message,
        errors: error.errors 
      });
    }
    
    // Check if it's a MongoDB error
    if (error.name === 'CastError') {
      return res.status(400).json({ 
        message: 'Invalid ID format', 
        details: error.message 
      });
    }
    
    res.status(500).json({ 
      message: 'Error generating timetable', 
      error: error.message,
      type: error.name 
    });
  }
});

// @route   PUT /api/ai/edit-timetable-entry
// @desc    Edit a specific timetable entry manually
// @access  Private/Admin
router.put('/edit-timetable-entry', protect, authorize('admin'), async (req, res) => {
  try {
    const { timetable_id, day, period, subject_id, faculty_id } = req.body;
    
    if (!timetable_id || !day || !period) {
      return res.status(400).json({ message: 'Please provide timetable_id, day, and period' });
    }
    
    const timetable = await Timetable.findById(timetable_id);
    if (!timetable) {
      return res.status(404).json({ message: 'Timetable not found' });
    }
    
    // Validate subject and faculty if provided
    if (subject_id) {
      const subject = await Subject.findById(subject_id);
      if (!subject) {
        return res.status(400).json({ message: 'Subject not found' });
      }
    }
    
    if (faculty_id) {
      const faculty = await User.findById(faculty_id);
      if (!faculty) {
        return res.status(400).json({ message: 'Faculty not found' });
      }
    }
    
    // Initialize schedule if it doesn't exist
    if (!timetable.schedule) {
      timetable.schedule = {
        monday: [],
        tuesday: [],
        wednesday: [],
        thursday: [],
        friday: [],
        saturday: []
      };
    }
    
    // Find and update or create the entry
    const daySchedule = timetable.schedule[day] || [];
    const existingEntryIndex = daySchedule.findIndex(entry => entry.period === period);
    
    if (subject_id && faculty_id) {
      // Add or update entry
      const newEntry = {
        period,
        subject_id,
        faculty_id,
        is_lab: false // Can be updated based on subject type
      };
      
      if (existingEntryIndex >= 0) {
        daySchedule[existingEntryIndex] = newEntry;
      } else {
        daySchedule.push(newEntry);
        daySchedule.sort((a, b) => a.period - b.period);
      }
    } else {
      // Remove entry if no subject/faculty provided
      if (existingEntryIndex >= 0) {
        daySchedule.splice(existingEntryIndex, 1);
      }
    }
    
    timetable.schedule[day] = daySchedule;
    await timetable.save();
    
    res.status(200).json({
      message: 'Timetable entry updated successfully',
      data: timetable
    });
  } catch (error) {
    console.error('Error editing timetable entry:', error);
    res.status(500).json({ 
      message: 'Error editing timetable entry', 
      error: error.message 
    });
  }
});

// @route   POST /api/ai/regenerate-all-timetables
// @desc    Regenerate ALL timetables sequentially to avoid faculty conflicts
// @access  Private/Admin
router.post('/regenerate-all-timetables', protect, authorize('admin'), async (req, res) => {
  try {
    console.log('Starting sequential regeneration of all timetables...');
    
    // Get all timetables that have been generated before
    const allTimetables = await Timetable.find({ schedule: { $exists: true } });
    
    if (allTimetables.length === 0) {
      return res.status(400).json({ message: 'No timetables found to regenerate' });
    }
    
    console.log(`Found ${allTimetables.length} timetables to regenerate`);
    
    const results = [];
    
    for (const timetable of allTimetables) {
      try {
        // Extract existing faculty-subject assignments
        const existingAssignments = [];
        const assignmentSet = new Set();
        
        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        for (const day of days) {
          const daySchedule = timetable.schedule[day] || [];
          for (const entry of daySchedule) {
            if (entry.faculty_id && entry.subject_id) {
              const key = `${entry.faculty_id}-${entry.subject_id}`;
              if (!assignmentSet.has(key)) {
                assignmentSet.add(key);
                existingAssignments.push({
                  faculty_id: entry.faculty_id.toString(),
                  subject_id: entry.subject_id.toString()
                });
              }
            }
          }
        }
        
        if (existingAssignments.length === 0) {
          console.log(`Skipping timetable ${timetable._id} - no assignments found`);
          results.push({ id: timetable._id, status: 'skipped', reason: 'No assignments' });
          continue;
        }
        
        // Clear the schedule and save BEFORE regenerating
        timetable.schedule = {
          monday: [],
          tuesday: [],
          wednesday: [],
          thursday: [],
          friday: [],
          saturday: []
        };
        await timetable.save();
        
        // Regenerate with conflict detection (now sees other timetables)
        const newSchedule = await generateTimetable(timetable, existingAssignments);
        
        if (newSchedule.success) {
          timetable.schedule = newSchedule.data;
          timetable.last_generated = new Date();
          await timetable.save();
          console.log(`✅ Regenerated timetable ${timetable._id}`);
          results.push({ id: timetable._id, status: 'success' });
        } else {
          console.log(`❌ Failed to regenerate timetable ${timetable._id}: ${newSchedule.message}`);
          results.push({ id: timetable._id, status: 'failed', reason: newSchedule.message });
        }
      } catch (innerError) {
        console.error(`Error regenerating timetable ${timetable._id}:`, innerError);
        results.push({ id: timetable._id, status: 'error', reason: innerError.message });
      }
    }
    
    res.status(200).json({
      message: 'All timetables regenerated',
      results
    });
  } catch (error) {
    console.error('Error in regenerate-all-timetables:', error);
    res.status(500).json({ 
      message: 'Error regenerating timetables', 
      error: error.message 
    });
  }
});

// @route   POST /api/ai/regenerate-timetable
// @desc    Regenerate an existing timetable
// @access  Private/Admin
router.post('/regenerate-timetable', protect, authorize('admin'), async (req, res) => {
  try {
    console.log('Regenerate timetable request received:', {
      path: req.path,
      originalUrl: req.originalUrl,
      body: req.body
    });
    
    const { timetable_id } = req.body;
    
    if (!timetable_id) {
      return res.status(400).json({ message: 'Please provide timetable_id' });
    }
    
    const timetable = await Timetable.findById(timetable_id);
    if (!timetable) {
      return res.status(404).json({ message: 'Timetable not found' });
    }
    
    // Get existing faculty-subject assignments from the current schedule
    const existingAssignments = [];
    const schedule = timetable.schedule || {};
    
    for (const [day, entries] of Object.entries(schedule)) {
      for (const entry of entries) {
        if (entry.subject_id && entry.faculty_id && entry.subject_id !== 'study_period') {
          const existing = existingAssignments.find(a => 
            a.faculty_id === entry.faculty_id && a.subject_id === entry.subject_id
          );
          if (!existing) {
            existingAssignments.push({
              faculty_id: entry.faculty_id,
              subject_id: entry.subject_id,
              periods_needed: 4 // Default
            });
          }
        }
      }
    }
    
    if (existingAssignments.length === 0) {
      return res.status(400).json({ message: 'No existing assignments found to regenerate from' });
    }
    
    // Clear existing schedule
    timetable.schedule = {
      monday: [],
      tuesday: [],
      wednesday: [],
      thursday: [],
      friday: [],
      saturday: []
    };
    
    // IMPORTANT: Save the cleared schedule BEFORE regenerating
    // This ensures generateTimetable doesn't see this timetable's old schedule as a conflict
    await timetable.save();
    console.log('Cleared schedule saved, now regenerating...');
    
    // Regenerate with existing assignments
    const newSchedule = await generateTimetable(timetable, existingAssignments);
    
    if (!newSchedule.success) {
      return res.status(400).json({ message: newSchedule.message });
    }
    
    timetable.schedule = newSchedule.data;
    timetable.last_generated = new Date();
    await timetable.save();
    
    res.status(200).json({
      message: 'Timetable regenerated successfully',
      data: timetable
    });
  } catch (error) {
    console.error('Error regenerating timetable:', error);
    res.status(500).json({ 
      message: 'Error regenerating timetable', 
      error: error.message 
    });
  }
});

// Timetable Generation Algorithm
async function generateTimetable(timetable, faculty_subject_assignments) {
  try {
    // Get all required data
    const guidelines = timetable.guidelines || {};
    const periodsPerDay = timetable.periods_per_day;
    
    console.log('Generation parameters:', {
      periodsPerDay,
      guidelines,
      assignmentsCount: faculty_subject_assignments.length
    });
    
    if (!periodsPerDay || periodsPerDay < 1) {
      return {
        success: false,
        message: 'Invalid periods per day configuration in timetable'
      };
    }
    
    // ===== FETCH EXISTING FACULTY COMMITMENTS FROM OTHER TIMETABLES =====
    // This prevents scheduling a faculty in two classes at the same time
    const existingFacultyCommitments = {};
    const otherTimetables = await Timetable.find({ 
      _id: { $ne: timetable._id },  // Exclude current timetable
      schedule: { $exists: true }
    });
    
    console.log(`Found ${otherTimetables.length} other timetables to check for conflicts`);
    
    const allDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    for (const day of allDays) {
      existingFacultyCommitments[day] = {};
      for (let period = 1; period <= periodsPerDay; period++) {
        existingFacultyCommitments[day][period] = new Set();
      }
    }
    
    // Populate existing commitments from other timetables
    for (const otherTimetable of otherTimetables) {
      if (!otherTimetable.schedule) continue;
      
      for (const day of allDays) {
        const daySchedule = otherTimetable.schedule[day] || [];
        for (const entry of daySchedule) {
          if (entry.faculty_id) {
            const facultyIdStr = entry.faculty_id.toString();
            // Mark this faculty as busy for this period (and consecutive periods for labs)
            existingFacultyCommitments[day][entry.period]?.add(facultyIdStr);
            
            // If it's a lab (2 periods), mark the next period too
            if (entry.is_lab && entry.period + 1 <= periodsPerDay) {
              existingFacultyCommitments[day][entry.period + 1]?.add(facultyIdStr);
            }
          }
        }
      }
    }
    
    console.log('Loaded existing faculty commitments from other timetables');
    
    // Create a map of faculty to subjects they teach
    const facultySubjectsMap = new Map();
    const subjectDetailsMap = new Map();
    const facultyDetailsMap = new Map();
    
    for (const assignment of faculty_subject_assignments) {
      const { faculty_id, subject_id } = assignment;
      
      if (!facultySubjectsMap.has(faculty_id)) {
        facultySubjectsMap.set(faculty_id, []);
        
        // Get faculty details
        const faculty = await User.findById(faculty_id);
        if (!faculty) {
          return {
            success: false,
            message: `Faculty with ID ${faculty_id} not found during generation`
          };
        }
        
        facultyDetailsMap.set(faculty_id, {
          id: faculty_id,
          name: faculty.name,
          faculty_id: faculty.faculty_id
        });
      }
      
      facultySubjectsMap.get(faculty_id).push(subject_id);
      
      // Get subject details if not already fetched
      if (!subjectDetailsMap.has(subject_id)) {
        const subject = await Subject.findById(subject_id);
        if (!subject) {
          return {
            success: false,
            message: `Subject with ID ${subject_id} not found during generation`
          };
        }
        
        subjectDetailsMap.set(subject_id, {
          id: subject_id,
          name: subject.name,
          code: subject.code,
          is_lab: subject.is_lab,
          default_duration_periods: subject.default_duration_periods || 1
        });
      }
    }

    // Try OpenAI first if available
    if (isOpenAIAvailable()) {
      console.log('🤖 Using OpenAI GPT-4 for intelligent timetable generation...');
      
      const aiResult = await generateTimetableWithAI({
        timetable,
        faculty_subject_assignments,
        subjectDetailsMap,
        facultyDetailsMap
      });

      if (aiResult.success) {
        console.log('✅ OpenAI generation successful!');
        return aiResult;
      } else {
        console.log('⚠️ OpenAI generation failed, falling back to local algorithm...');
        console.log('Error:', aiResult.message);
        // Continue to local algorithm below
      }
    } else {
      console.log('ℹ️ OpenAI not configured, using local constraint-based algorithm...');
    }

    // ===== LOCAL CONSTRAINT-BASED ALGORITHM =====
    console.log('Starting local generation algorithm...');
    
    // Initialize empty schedule
    const schedule = {
      monday: [],
      tuesday: [],
      wednesday: [],
      thursday: [],
      friday: [],
      saturday: []
    };
    
    // Helper function to shuffle array (Fisher-Yates algorithm) for randomization
    const shuffleArray = (array) => {
      const shuffled = [...array];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    };
    
    // Use working_days from timetable config, or default to all 6 days including Saturday
    const workingDays = timetable.working_days || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const labDays = [...workingDays]; // Labs can be on any working day
    const theoryDays = [...workingDays]; // Theory classes on all working days including Saturday
    const days = [...workingDays]; // Use working days for overall processing
    
    // Track faculty availability for each day and period
    const facultyAvailability = {};
    labDays.forEach(day => { // Use labDays for faculty availability tracking
      facultyAvailability[day] = {};
      for (let period = 1; period <= periodsPerDay; period++) {
        facultyAvailability[day][period] = new Set([...facultySubjectsMap.keys()]);
      }
    });
    
    // Track subjects assigned to a class on each day to avoid repetition
    const dailySubjects = {};
    labDays.forEach(day => { // Use labDays for daily subject tracking
      dailySubjects[day] = new Set();
    });
    
    // Function to check if a faculty is available at a given time
    // Now also checks existing commitments from other timetables
    const isFacultyAvailable = (faculty_id, day, period) => {
      const facultyIdStr = faculty_id.toString();
      // Check if faculty is busy in another class's timetable
      if (existingFacultyCommitments[day] && 
          existingFacultyCommitments[day][period] &&
          existingFacultyCommitments[day][period].has(facultyIdStr)) {
        return false;
      }
      // Check if faculty is available in current timetable
      return facultyAvailability[day][period].has(faculty_id);
    };
    
    // Function to mark faculty as unavailable
    const markFacultyUnavailable = (faculty_id, day, period) => {
      facultyAvailability[day][period].delete(faculty_id);
    };
    
    // Function to check if a subject has already been assigned on a day
    const isSubjectAssignedToday = (subject_id, day) => {
      return dailySubjects[day].has(subject_id);
    };
    
    // Function to mark a subject as assigned on a day
    const markSubjectAssigned = (subject_id, day) => {
      dailySubjects[day].add(subject_id);
    };
    
    // Function to remove daily subject restriction temporarily for filling gaps
    const relaxSubjectConstraint = (subject_id, day) => {
      dailySubjects[day].delete(subject_id);
    };
    
    // Function to find the optimal faculty for a subject at a given time
    const findOptimalFaculty = (subject_id, day, period) => {
      const eligibleFaculty = [];
      
      for (const [faculty_id, subjects] of facultySubjectsMap.entries()) {
        if (subjects.includes(subject_id) && isFacultyAvailable(faculty_id, day, period)) {
          eligibleFaculty.push(faculty_id);
        }
      }
      
      if (eligibleFaculty.length === 0) {
        return null; // No faculty available
      }
      
      // Count consecutive periods for each faculty to minimize consecutive teaching
      if (guidelines.minimize_consecutive_faculty_periods && period > 1) {
        // Sort eligible faculty by whether they taught in the previous period
        eligibleFaculty.sort((a, b) => {
          const aTaughtPrevious = !isFacultyAvailable(a, day, period - 1);
          const bTaughtPrevious = !isFacultyAvailable(b, day, period - 1);
          
          if (aTaughtPrevious && !bTaughtPrevious) return 1;
          if (!aTaughtPrevious && bTaughtPrevious) return -1;
          return 0;
        });
      }
      
      // Add randomization among equally suitable faculty
      if (eligibleFaculty.length > 1) {
        const shuffled = shuffleArray(eligibleFaculty);
        return shuffled[0];
      }
      
      return eligibleFaculty[0];
    };
    
    // Process lab subjects first (they have more constraints)
    const labSubjectIds = [...subjectDetailsMap.entries()]
      .filter(([_, subject]) => subject.is_lab)
      .map(([id, _]) => id);
    
    // Function to schedule labs with simplified approach
    const scheduleLabs = () => {
      console.log('Starting lab scheduling for', labSubjectIds.length, 'labs');
      console.log('Available days:', days);
      console.log('Periods per day:', periodsPerDay);
      
      // Shuffle lab order for different timetables for each class
      const shuffledLabIds = shuffleArray(labSubjectIds);
      
      // Sort labs by duration (shorter first to be easier to fit) but maintain some randomness
      const sortedLabIds = [...shuffledLabIds].sort((a, b) => {
        const durationA = subjectDetailsMap.get(a).default_duration_periods;
        const durationB = subjectDetailsMap.get(b).default_duration_periods;
        return durationA - durationB;
      });
      
      console.log('Labs to schedule:', sortedLabIds.map(id => {
        const subject = subjectDetailsMap.get(id);
        return `${subject.name} (${subject.default_duration_periods} periods)`;
      }));
      
      for (const subject_id of sortedLabIds) {
        const subject = subjectDetailsMap.get(subject_id);
        const labDuration = subject.default_duration_periods;
        
        console.log(`\nScheduling lab: ${subject.name} (duration: ${labDuration} periods)`);
        
        // Find all faculty who can teach this subject
        const availableFacultyForSubject = shuffleArray([...facultySubjectsMap.entries()]
          .filter(([faculty_id, subjects]) => subjects.includes(subject_id))
          .map(([faculty_id]) => faculty_id));
          
        console.log('Faculty who can teach this subject:', availableFacultyForSubject.map(id => 
          facultyDetailsMap.get(id).name
        ));
        
        let labAssigned = false;
        
        // Shuffle days to get different schedules for different classes
        const shuffledLabDays = shuffleArray(labDays);
        
        // Try to assign lab once a week - try all days and all valid time slots
        const attempts = [];
        for (const day of shuffledLabDays) {
          console.log(`  Checking ${day}...`);
          
          if (isSubjectAssignedToday(subject_id, day)) {
            console.log(`    Skipping ${day} - subject already assigned today`);
            continue;
          }
          
          for (let startPeriod = 1; startPeriod <= periodsPerDay - labDuration + 1; startPeriod++) {
            // Prefer afternoon sessions for labs (after period 4 for 8-period days)
            const afternoonPreference = periodsPerDay >= 6 ? Math.floor(periodsPerDay / 2) + 1 : 1;
            const isAfternoonSlot = startPeriod >= afternoonPreference;
            
            const periodRange = Array.from({ length: labDuration }, (_, i) => startPeriod + i);
            console.log(`    Checking periods ${periodRange.join('-')}... ${isAfternoonSlot ? '[AFTERNOON PREFERRED]' : '[MORNING]'}`);
            
            // Check if periods are already occupied
            let periodsOccupied = false;
            for (let i = 0; i < labDuration; i++) {
              const period = startPeriod + i;
              if (schedule[day].some(entry => entry.period === period)) {
                periodsOccupied = true;
                console.log(`      Period ${period} already occupied`);
                break;
              }
            }
            
            if (periodsOccupied) {
              continue;
            }
            
            // Find faculty available for all periods of the lab
            const available_faculty = availableFacultyForSubject
              .filter(faculty_id => {
                const canTeach = facultySubjectsMap.get(faculty_id).includes(subject_id);
                const allPeriodsAvailable = periodRange.every(p => isFacultyAvailable(faculty_id, day, p));
                
                console.log(`      Faculty ${facultyDetailsMap.get(faculty_id).name}: canTeach=${canTeach}, allPeriodsAvailable=${allPeriodsAvailable}`);
                
                return canTeach && allPeriodsAvailable;
              });
            
            console.log(`      Available faculty for periods ${periodRange.join('-')}: ${available_faculty.length}`);
            
            if (available_faculty.length > 0) {
              attempts.push({
                day,
                startPeriod,
                faculty_id: available_faculty[0],
                priority: isAfternoonSlot ? startPeriod : startPeriod + 100, // Prefer afternoon slots
                isAfternoon: isAfternoonSlot
              });
              console.log(`      ✓ Found valid slot: ${day} periods ${periodRange.join('-')} with ${facultyDetailsMap.get(available_faculty[0]).name}`);
            }
          }
        }
        
        console.log(`  Total attempts found: ${attempts.length}`);
        
        // Sort attempts by priority (prefer afternoon slots, then earlier periods within afternoon)
        attempts.sort((a, b) => {
          // First prioritize afternoon slots
          if (a.isAfternoon && !b.isAfternoon) return -1;
          if (!a.isAfternoon && b.isAfternoon) return 1;
          // Then by period within the same session type
          return a.priority - b.priority;
        });
        
        if (attempts.length > 0) {
          const bestAttempt = attempts[0];
          const faculty_id = bestAttempt.faculty_id;
          const facultyName = facultyDetailsMap.get(faculty_id).name;
          const day = bestAttempt.day;
          const startPeriod = bestAttempt.startPeriod;
          const endPeriod = startPeriod + labDuration - 1;
          
          console.log(`  ✅ ASSIGNING ${subject.name} to ${facultyName} on ${day} periods ${startPeriod}-${endPeriod}`);
          
          // Schedule the lab
          for (let i = 0; i < labDuration; i++) {
            const period = startPeriod + i;
            
            schedule[day].push({
              period,
              subject_id,
              faculty_id,
              is_lab: true
            });
            
            markFacultyUnavailable(faculty_id, day, period);
            console.log(`    Marked faculty ${facultyName} unavailable for ${day} period ${period}`);
          }
          
          markSubjectAssigned(subject_id, day);
          labAssigned = true;
        }
        
        if (!labAssigned) {
          console.log(`❌ FAILED to assign lab ${subject.name} - no valid slots found`);
          console.log('Current schedule state:', JSON.stringify(schedule, null, 2));
          return {
            success: false,
            message: `Could not assign lab ${subject.name} due to constraints.`
          };
        }
      }
      
      console.log('✅ All labs scheduled successfully');
      return { success: true };
    };
    
    // Schedule labs
    const labResult = scheduleLabs();
    if (!labResult.success) {
      return labResult;
    }
    
    // Function to schedule theory subjects
    const scheduleTheorySubjects = () => {
      console.log('Starting theory subject scheduling...');
      
      // Shuffle theory subjects for different schedules per class
      const theorySubjectIds = shuffleArray([...subjectDetailsMap.entries()]
        .filter(([_, subject]) => !subject.is_lab)
        .map(([id, _]) => id));
      
      console.log('Theory subjects to schedule:', theorySubjectIds.map(id => {
        const subject = subjectDetailsMap.get(id);
        return `${subject.name} (${subject.code})`;
      }));
      
      // Calculate how many periods each subject needs per week
      // Adjust based on number of working days
      const totalPeriodsPerWeek = theoryDays.length * periodsPerDay;
      const periodsPerSubject = Math.max(3, Math.floor(totalPeriodsPerWeek / theorySubjectIds.length));
      
      const periodsNeededPerSubject = new Map();
      theorySubjectIds.forEach(subject_id => {
        // Allocate periods per week based on available slots
        periodsNeededPerSubject.set(subject_id, periodsPerSubject);
      });
      
      // Track consecutive subject assignments to avoid same subject back-to-back
      const lastSubjectPerDay = new Map();
      theoryDays.forEach(day => { // Only initialize for theory days
        lastSubjectPerDay.set(day, null);
      });
      
      // Define special subject like sports to be on Friday's last period
      const sportsSubjectId = theorySubjectIds.find(id => {
        const subject = subjectDetailsMap.get(id);
        return subject.name.toLowerCase().includes('sport');
      });
      
      if (sportsSubjectId && guidelines.sports_last_period_predefined_day) {
        const day = guidelines.sports_last_period_predefined_day.toLowerCase();
        if (theoryDays.includes(day)) { // Make sure it's a theory day
          const lastPeriod = periodsPerDay;
          
          // Find faculty for sports
          const availableFaculty = shuffleArray([...facultySubjectsMap.keys()]
            .filter(faculty_id => {
              return facultySubjectsMap.get(faculty_id).includes(sportsSubjectId) &&
                isFacultyAvailable(faculty_id, day, lastPeriod);
            }));
          
          if (availableFaculty.length > 0) {
            const faculty_id = availableFaculty[0];
            
            schedule[day].push({
              period: lastPeriod,
              subject_id: sportsSubjectId,
              faculty_id,
              is_lab: false
            });
            
            markFacultyUnavailable(faculty_id, day, lastPeriod);
            markSubjectAssigned(sportsSubjectId, day);
            
            // Reduce needed periods for sports
            periodsNeededPerSubject.set(
              sportsSubjectId,
              Math.max(0, periodsNeededPerSubject.get(sportsSubjectId) - 1)
            );
            
            console.log(`Assigned sports subject ${subjectDetailsMap.get(sportsSubjectId).name} to ${day} period ${lastPeriod}`);
          }
        }
      }
      
      // Schedule remaining theory subjects to fill all periods
      console.log('Filling remaining periods with theory subjects...');
      
      // Shuffle the order of days to create variation between classes
      const shuffledTheoryDays = shuffleArray(theoryDays);
      
      for (const day of shuffledTheoryDays) { // Schedule theory on all working days including Saturday
        console.log(`\nProcessing ${day}:`);
        
        for (let period = 1; period <= periodsPerDay; period++) {
          // Skip if period already has something assigned
          if (schedule[day].some(entry => entry.period === period)) {
            console.log(`  Period ${period}: Already assigned`);
            continue;
          }
          
          console.log(`  Period ${period}: Finding subject to assign...`);
          
          // Find subjects that can be assigned to this period (shuffle for randomness)
          const availableSubjects = shuffleArray(theorySubjectIds.filter(subject_id => {
            const hasRemainingPeriods = periodsNeededPerSubject.get(subject_id) > 0;
            const notAssignedToday = !isSubjectAssignedToday(subject_id, day);
            const notConsecutive = lastSubjectPerDay.get(day) !== subject_id;
            
            return hasRemainingPeriods && notAssignedToday && notConsecutive;
          }));
          
          if (availableSubjects.length === 0) {
            console.log(`    No subjects with remaining periods, trying to use any available subject...`);
            // No subjects with remaining periods, but we must fill this slot to avoid free periods
            const allTheorySubjects = shuffleArray(theorySubjectIds.filter(subject_id => {
              const notAssignedToday = !isSubjectAssignedToday(subject_id, day);
              const notConsecutive = lastSubjectPerDay.get(day) !== subject_id;
              return notAssignedToday && notConsecutive;
            }));
            
            if (allTheorySubjects.length > 0) {
              // Prioritize subjects with fewer total assignments so far
              const subjectAssignmentCounts = new Map();
              for (const subjectId of allTheorySubjects) {
                let count = 0;
                for (const dayName of theoryDays) { // Only count from theory days
                  count += schedule[dayName].filter(entry => entry.subject_id === subjectId).length;
                }
                subjectAssignmentCounts.set(subjectId, count);
              }
              
              allTheorySubjects.sort((a, b) => 
                subjectAssignmentCounts.get(a) - subjectAssignmentCounts.get(b)
              );
              
              for (const subject_id of allTheorySubjects) {
                const faculty_id = findOptimalFaculty(subject_id, day, period);
                
                if (faculty_id) {
                  const subjectName = subjectDetailsMap.get(subject_id).name;
                  const facultyName = facultyDetailsMap.get(faculty_id).name;
                  
                  // Assign subject to this period (even if it exceeds weekly requirement)
                  schedule[day].push({
                    period,
                    subject_id,
                    faculty_id,
                    is_lab: false
                  });
                  
                  markFacultyUnavailable(faculty_id, day, period);
                  markSubjectAssigned(subject_id, day);
                  lastSubjectPerDay.set(day, subject_id);
                  
                  console.log(`    ✅ Assigned extra ${subjectName} with ${facultyName} to avoid free period`);
                  break;
                }
              }
            } else {
              console.log(`    No theory subjects available, trying any subject with available faculty...`);
              // Last resort: pick any subject-faculty combo that works
              for (const [faculty_id, subjects] of facultySubjectsMap.entries()) {
                if (isFacultyAvailable(faculty_id, day, period)) {
                  // Pick first available subject this faculty teaches
                  const subject_id = subjects[0];
                  const facultyName = facultyDetailsMap.get(faculty_id).name;
                  const subjectName = subjectDetailsMap.get(subject_id).name;
                  
                  schedule[day].push({
                    period,
                    subject_id,
                    faculty_id,
                    is_lab: subjectDetailsMap.get(subject_id).is_lab || false
                  });
                  
                  markFacultyUnavailable(faculty_id, day, period);
                  console.log(`    ✅ Assigned ${subjectName} with ${facultyName} as fallback`);
                  break;
                }
              }
            }
            continue;
          }
          
          // Sort subjects by priority (highest remaining periods needed first)
          availableSubjects.sort((a, b) => 
            periodsNeededPerSubject.get(b) - periodsNeededPerSubject.get(a)
          );
          
          for (const subject_id of availableSubjects) {
            const faculty_id = findOptimalFaculty(subject_id, day, period);
            
            if (faculty_id) {
              const subjectName = subjectDetailsMap.get(subject_id).name;
              const facultyName = facultyDetailsMap.get(faculty_id).name;
              
              // Assign subject to this period
              schedule[day].push({
                period,
                subject_id,
                faculty_id,
                is_lab: false
              });
              
              markFacultyUnavailable(faculty_id, day, period);
              markSubjectAssigned(subject_id, day);
              lastSubjectPerDay.set(day, subject_id);
              
              // Reduce needed periods for this subject
              periodsNeededPerSubject.set(
                subject_id,
                periodsNeededPerSubject.get(subject_id) - 1
              );
              
              console.log(`    ✅ Assigned ${subjectName} with ${facultyName} (${periodsNeededPerSubject.get(subject_id)} periods remaining)`);
              break;
            }
          }
        }
      }
      
      // Final validation: Check if we successfully filled all periods (no free periods)
      let totalScheduledPeriods = 0;
      let emptyPeriods = [];
      
      console.log('\nFinal schedule validation:');
      for (const day of theoryDays) { // Only validate theory days for completeness
        const dayScheduledPeriods = schedule[day].length;
        totalScheduledPeriods += dayScheduledPeriods;
        
        console.log(`${day}: ${dayScheduledPeriods}/${periodsPerDay} periods filled`);
        
        // Check for missing periods (free periods)
        for (let period = 1; period <= periodsPerDay; period++) {
          const hasEntry = schedule[day].some(entry => entry.period === period);
          if (!hasEntry) {
            emptyPeriods.push(`${day} Period ${period}`);
            console.log(`  ❌ Free period detected: ${day} Period ${period}`);
          }
        }
      }
      
      // Also count Saturday lab periods (but don't require them to be filled)
      if (schedule['saturday'] && schedule['saturday'].length > 0) {
        const saturdayPeriods = schedule['saturday'].length;
        totalScheduledPeriods += saturdayPeriods;
        console.log(`saturday: ${saturdayPeriods} lab periods scheduled`);
      }
      
      console.log(`\nTotal periods scheduled: ${totalScheduledPeriods} (Theory days: ${theoryDays.length * periodsPerDay}, Labs can be on any day)`);
      
      if (emptyPeriods.length > 0) {
        console.warn('❌ Free periods still exist:', emptyPeriods);
        return {
          success: false,
          message: `Timetable has ${emptyPeriods.length} free periods: ${emptyPeriods.join(', ')}`
        };
      }
      
      // Check remaining subject requirements (informational only)
      const underAllocatedSubjects = [...periodsNeededPerSubject.entries()]
        .filter(([_, periodsNeeded]) => periodsNeeded > 0);
      
      if (underAllocatedSubjects.length > 0) {
        const underAllocatedNames = underAllocatedSubjects.map(([id, periodsNeeded]) => {
          const subject = subjectDetailsMap.get(id);
          return `${subject.name} (needs ${periodsNeeded} more periods)`;
        }).join(', ');
        
        console.warn('⚠️ Some subjects are under-allocated:', underAllocatedNames);
        // Don't fail here - we prioritize no free periods over exact weekly requirements
      }
      
      console.log(`✅ Timetable completed successfully with ${totalScheduledPeriods} periods scheduled`);
      return { success: true };
    };
    
    // Schedule theory subjects
    const theoryResult = scheduleTheorySubjects();
    if (!theoryResult.success) {
      return theoryResult;
    }
    
    // Sort schedule entries by period for each day
    for (const day of days) {
      schedule[day].sort((a, b) => a.period - b.period);
    }
    
    return {
      success: true,
      message: 'Timetable generated successfully',
      data: schedule
    };
  } catch (error) {
    console.error('Error in timetable generation:', error);
    return {
      success: false,
      message: 'Internal error during timetable generation'
    };
  }
}

// @route   POST /api/ai/generate-from-template
// @desc    Generate a timetable from a template
// @access  Private/Admin
router.post('/generate-from-template', protect, authorize('admin'), async (req, res) => {
  try {
    const { template_id, class_id, academic_year, subject_faculty_mapping } = req.body;
    
    if (!template_id || !class_id || !academic_year || !subject_faculty_mapping) {
      return res.status(400).json({ 
        message: 'Please provide template_id, class_id, academic_year, and subject_faculty_mapping' 
      });
    }
    
    // Get template
    const Template = require('../models/Template');
    const template = await Template.findById(template_id);
    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }
    
    // Get class details
    const classDetails = await Class.findById(class_id);
    if (!classDetails) {
      return res.status(404).json({ message: 'Class not found' });
    }
    
    // Get subjects and faculty details
    const subjectIds = Object.keys(subject_faculty_mapping);
    const facultyIds = Object.values(subject_faculty_mapping);
    
    const [subjects, faculty] = await Promise.all([
      Subject.find({ _id: { $in: subjectIds } }),
      User.find({ _id: { $in: facultyIds } })
    ]);
    
    // Create subject and faculty maps
    const subjectMap = new Map(subjects.map(s => [s._id.toString(), s]));
    const facultyMap = new Map(faculty.map(f => [f._id.toString(), f]));
    
    // Generate timetable based on template
    const schedule = {};
    
    // Initialize schedule for each day
    template.days.forEach(day => {
      schedule[day] = [];
    });
    
    // Apply template schedule
    const scheduleTemplate = template.schedule_template || {};
    
    for (const [day, dayEntries] of Object.entries(scheduleTemplate)) {
      if (!Array.isArray(dayEntries)) continue;
      
      for (const entry of dayEntries) {
        // Find actual subject and faculty for placeholders
        const subject = subjects.find(s => 
          s.name.toLowerCase().includes(entry.subject_placeholder.toLowerCase()) ||
          entry.subject_placeholder.toLowerCase().includes(s.name.toLowerCase())
        );
        
        if (subject && subject_faculty_mapping[subject._id]) {
          const facultyId = subject_faculty_mapping[subject._id];
          const facultyMember = facultyMap.get(facultyId);
          
          if (facultyMember) {
            schedule[day].push({
              period: entry.period,
              subject_id: subject._id,
              subject_name: subject.name,
              subject_code: subject.code,
              faculty_id: facultyId,
              faculty_name: facultyMember.name,
              is_lab: entry.is_lab || subject.is_lab,
              is_fixed: entry.is_fixed || false
            });
          }
        }
      }
    }
    
    // Sort schedule by period for each day
    Object.keys(schedule).forEach(day => {
      schedule[day].sort((a, b) => a.period - b.period);
    });
    
    // Create timetable object
    const timetableData = {
      class_id: class_id,
      academic_year: academic_year,
      template_id: template_id,
      periods_per_day: template.periods_per_day,
      working_days: template.days,
      guidelines: template.guidelines,
      schedule: schedule,
      generated_by: req.user.id,
      created_at: new Date()
    };
    
    res.status(200).json({
      success: true,
      message: 'Timetable generated from template successfully',
      timetable: timetableData
    });
    
  } catch (error) {
    console.error('Error generating timetable from template:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating timetable from template',
      error: error.message
    });
  }
});

module.exports = router;
