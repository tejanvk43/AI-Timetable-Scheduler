const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const Timetable = require('../models/Timetable');
const Class = require('../models/Class');
const Subject = require('../models/Subject');
const User = require('../models/User');

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
    
    // Initialize empty schedule
    const schedule = {
      monday: [],
      tuesday: [],
      wednesday: [],
      thursday: [],
      friday: [],
      saturday: []
    };
    
    // Define days we'll work with (exclude Saturday if not needed)
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    
    // Track faculty availability for each day and period
    const facultyAvailability = {};
    days.forEach(day => {
      facultyAvailability[day] = {};
      for (let period = 1; period <= periodsPerDay; period++) {
        facultyAvailability[day][period] = new Set([...facultySubjectsMap.keys()]);
      }
    });
    
    // Track subjects assigned to a class on each day to avoid repetition
    const dailySubjects = {};
    days.forEach(day => {
      dailySubjects[day] = new Set();
    });
    
    // Function to check if a faculty is available at a given time
    const isFacultyAvailable = (faculty_id, day, period) => {
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
    
    // Function to mark subject as assigned for the day
    const markSubjectAssigned = (subject_id, day) => {
      dailySubjects[day].add(subject_id);
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
      
      // Sort labs by duration (shorter first to be easier to fit)
      const sortedLabIds = [...labSubjectIds].sort((a, b) => {
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
        const availableFacultyForSubject = [...facultySubjectsMap.entries()]
          .filter(([faculty_id, subjects]) => subjects.includes(subject_id))
          .map(([faculty_id]) => faculty_id);
          
        console.log('Faculty who can teach this subject:', availableFacultyForSubject.map(id => 
          facultyDetailsMap.get(id).name
        ));
        
        let labAssigned = false;
        
        // Try to assign lab once a week - try all days and all valid time slots
        const attempts = [];
        for (const day of days) {
          console.log(`  Checking ${day}...`);
          
          if (isSubjectAssignedToday(subject_id, day)) {
            console.log(`    Skipping ${day} - subject already assigned today`);
            continue;
          }
          
          for (let startPeriod = 1; startPeriod <= periodsPerDay - labDuration + 1; startPeriod++) {
            const periodRange = Array.from({ length: labDuration }, (_, i) => startPeriod + i);
            console.log(`    Checking periods ${periodRange.join('-')}...`);
            
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
                priority: startPeriod // Earlier periods get higher priority
              });
              console.log(`      ✓ Found valid slot: ${day} periods ${periodRange.join('-')} with ${facultyDetailsMap.get(available_faculty[0]).name}`);
            }
          }
        }
        
        console.log(`  Total attempts found: ${attempts.length}`);
        
        // Sort attempts by priority (prefer earlier periods)
        attempts.sort((a, b) => a.priority - b.priority);
        
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
      const theorySubjectIds = [...subjectDetailsMap.entries()]
        .filter(([_, subject]) => !subject.is_lab)
        .map(([id, _]) => id);
      
      // Calculate how many periods each subject needs per week
      const periodsNeededPerSubject = new Map();
      theorySubjectIds.forEach(subject_id => {
        // Allocate between 3-5 periods per week depending on subject importance
        periodsNeededPerSubject.set(subject_id, 4); // Default to 4, can be adjusted
      });
      
      // Define special subject like sports to be on Friday's last period
      const sportsSubjectId = theorySubjectIds.find(id => {
        const subject = subjectDetailsMap.get(id);
        return subject.name.toLowerCase().includes('sport');
      });
      
      if (sportsSubjectId && guidelines.sports_last_period_predefined_day) {
        const day = guidelines.sports_last_period_predefined_day.toLowerCase();
        if (days.includes(day)) {
          const lastPeriod = periodsPerDay;
          
          // Find faculty for sports
          const availableFaculty = [...facultySubjectsMap.keys()]
            .filter(faculty_id => {
              return facultySubjectsMap.get(faculty_id).includes(sportsSubjectId) &&
                isFacultyAvailable(faculty_id, day, lastPeriod);
            });
          
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
          }
        }
      }
      
      // Schedule remaining theory subjects
      for (const day of days) {
        for (let period = 1; period <= periodsPerDay; period++) {
          // Skip if period already has a lab assigned
          if (schedule[day].some(entry => entry.period === period)) {
            continue;
          }
          
          // Find subjects that can be assigned to this period
          const availableSubjects = theorySubjectIds.filter(subject_id => {
            return periodsNeededPerSubject.get(subject_id) > 0 &&
              !isSubjectAssignedToday(subject_id, day);
          });
          
          if (availableSubjects.length === 0) {
            continue; // No subjects available for this slot
          }
          
          // Find the subject with the highest remaining periods needed
          availableSubjects.sort((a, b) => 
            periodsNeededPerSubject.get(b) - periodsNeededPerSubject.get(a)
          );
          
          for (const subject_id of availableSubjects) {
            const faculty_id = findOptimalFaculty(subject_id, day, period);
            
            if (faculty_id) {
              // Assign subject to this period
              schedule[day].push({
                period,
                subject_id,
                faculty_id,
                is_lab: false
              });
              
              markFacultyUnavailable(faculty_id, day, period);
              markSubjectAssigned(subject_id, day);
              
              // Reduce needed periods for this subject
              periodsNeededPerSubject.set(
                subject_id,
                periodsNeededPerSubject.get(subject_id) - 1
              );
              
              break;
            }
          }
        }
      }
      
      // Check if all subjects have been allocated enough periods
      const unallocatedSubjects = [...periodsNeededPerSubject.entries()]
        .filter(([_, periodsNeeded]) => periodsNeeded > 0);
      
      if (unallocatedSubjects.length > 0) {
        const unallocatedNames = unallocatedSubjects.map(([id, periodsNeeded]) => {
          const subject = subjectDetailsMap.get(id);
          return `${subject.name} (needs ${periodsNeeded} more periods)`;
        }).join(', ');
        
        return {
          success: false,
          message: `Could not allocate all required periods for: ${unallocatedNames}`
        };
      }
      
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

module.exports = router;
