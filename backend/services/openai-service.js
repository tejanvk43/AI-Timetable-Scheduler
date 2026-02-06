const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Generate timetable using OpenAI GPT-4
 * @param {Object} params - Generation parameters
 * @returns {Promise<Object>} Generated schedule
 */
async function generateTimetableWithAI(params) {
  const {
    timetable,
    faculty_subject_assignments,
    subjectDetailsMap,
    facultyDetailsMap
  } = params;

  const guidelines = timetable.guidelines || {};
  const periodsPerDay = timetable.periods_per_day;
  const workingDays = timetable.working_days || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

  // Prepare context for GPT
  const subjectsInfo = Array.from(subjectDetailsMap.values()).map(s => ({
    id: s.id,
    name: s.name,
    code: s.code,
    is_lab: s.is_lab,
    duration: s.default_duration_periods
  }));

  const facultyInfo = Array.from(facultyDetailsMap.values()).map(f => ({
    id: f.id,
    name: f.name,
    faculty_id: f.faculty_id
  }));

  const assignments = faculty_subject_assignments.map(a => {
    const subject = subjectDetailsMap.get(a.subject_id);
    const faculty = facultyDetailsMap.get(a.faculty_id);
    return {
      subject: subject.name,
      subject_id: a.subject_id,
      faculty: faculty.name,
      faculty_id: a.faculty_id,
      is_lab: subject.is_lab,
      duration: subject.default_duration_periods
    };
  });

  // Separate labs and theory subjects
  const labAssignments = assignments.filter(a => a.is_lab);
  const theoryAssignments = assignments.filter(a => !a.is_lab);

  const prompt = `You are an expert timetable scheduling AI. Generate a weekly class timetable with STRICT constraints.

**Working Days:** ${workingDays.join(', ')}
**Periods Per Day:** ${periodsPerDay}
**Total Slots Per Week:** ${workingDays.length * periodsPerDay}

**Faculty-Subject Assignments (with IDs - USE THESE EXACT IDs):**
${assignments.map(a => `- Subject: "${a.subject}" (ID: ${a.subject_id}) | Faculty: "${a.faculty}" (ID: ${a.faculty_id})${a.is_lab ? ' | TYPE: LAB (' + a.duration + ' consecutive periods)' : ' | TYPE: THEORY'}`).join('\n')}

**CRITICAL RULES - MUST FOLLOW:**
1. **NO REPEAT SAME DAY**: A theory subject can appear ONLY ONCE per day. Never schedule the same theory subject twice on the same day.
2. **LABS ONCE PER WEEK**: Each lab subject appears exactly ONCE per week with ${labAssignments.length > 0 ? labAssignments[0].duration : 2}-3 consecutive periods.
3. **DISTRIBUTE EVENLY**: Each theory subject should appear on 4-5 DIFFERENT days across the week.
4. **VARIETY**: Each day should have a good mix of different subjects, not the same subject repeated.
5. **USE EXACT IDs**: Use the exact subject_id and faculty_id strings provided above.

**Schedule Distribution Guide:**
- Total theory subjects: ${theoryAssignments.length}
- Total lab subjects: ${labAssignments.length}
- Each theory subject needs ~${Math.floor((workingDays.length * periodsPerDay - labAssignments.length * 3) / Math.max(theoryAssignments.length, 1))} periods per week
- Labs should be in afternoon (periods ${Math.ceil(periodsPerDay / 2)}-${periodsPerDay})

**Output Format:**
Return a valid JSON object. Each day must have exactly ${periodsPerDay} periods numbered 1 to ${periodsPerDay}:
{
  "monday": [
    {"period": 1, "subject_id": "exact_id", "faculty_id": "exact_id", "is_lab": false},
    {"period": 2, "subject_id": "different_id", "faculty_id": "exact_id", "is_lab": false}
  ],
  "tuesday": [...],
  ...
}

**VALIDATION CHECKLIST (verify your output):**
✓ No theory subject appears more than once on any single day
✓ Each lab appears exactly once per week (consecutive periods)
✓ All ${periodsPerDay} periods filled for each day
✓ Good variety - different subjects each period
✓ Only using the exact IDs provided above

Generate the optimal timetable JSON now:`;

  try {
    console.log('Calling OpenAI GPT-4 for timetable generation...');
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are an expert academic timetable scheduling assistant. Your PRIMARY rule is: NO subject should repeat on the same day (except labs which need consecutive periods). Create varied, balanced schedules. Always respond with valid JSON only.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.5,  // Lower temperature for more consistent output
      max_tokens: 4000,
      response_format: { type: 'json_object' }
    });

    const response = completion.choices[0].message.content;
    console.log('OpenAI Response received');
    
    // Parse the JSON response
    let schedule = JSON.parse(response);
    
    // Validate the schedule structure
    if (!schedule || typeof schedule !== 'object') {
      throw new Error('Invalid schedule format from AI');
    }

    // Get valid subject and faculty IDs
    const validSubjectIds = new Set(Array.from(subjectDetailsMap.keys()));
    const validFacultyIds = new Set(Array.from(facultyDetailsMap.keys()));
    
    // Build a map of subject to faculty for assignments
    const subjectToFaculty = new Map();
    for (const a of faculty_subject_assignments) {
      subjectToFaculty.set(a.subject_id, a.faculty_id);
    }
    
    // Post-process to remove invalid entries and fix duplicates
    for (const day of workingDays) {
      if (!schedule[day]) {
        schedule[day] = [];
        continue;
      }
      
      // Filter out invalid entries
      schedule[day] = schedule[day].filter(entry => {
        const hasValidSubject = entry.subject_id && validSubjectIds.has(entry.subject_id);
        const hasValidFaculty = entry.faculty_id && validFacultyIds.has(entry.faculty_id);
        
        if (!hasValidSubject || !hasValidFaculty) {
          console.log(`Removing invalid entry: period ${entry.period}, subject: ${entry.subject_id}, faculty: ${entry.faculty_id}`);
          return false;
        }
        return true;
      });
      
      // Check for duplicate theory subjects on same day and fix them
      const subjectsUsedToday = new Set();
      const theorySubjectIds = [...subjectDetailsMap.entries()]
        .filter(([id, s]) => !s.is_lab)
        .map(([id]) => id);
      
      for (let i = 0; i < schedule[day].length; i++) {
        const entry = schedule[day][i];
        const isLab = subjectDetailsMap.get(entry.subject_id)?.is_lab;
        
        if (!isLab && subjectsUsedToday.has(entry.subject_id)) {
          // This is a duplicate theory subject - replace with another
          console.log(`Fixing duplicate on ${day}: ${entry.subject_id} at period ${entry.period}`);
          
          // Find an unused theory subject
          const unusedSubject = theorySubjectIds.find(id => !subjectsUsedToday.has(id));
          if (unusedSubject) {
            entry.subject_id = unusedSubject;
            entry.faculty_id = subjectToFaculty.get(unusedSubject) || entry.faculty_id;
            console.log(`Replaced with: ${unusedSubject}`);
          }
        }
        
        if (!isLab) {
          subjectsUsedToday.add(entry.subject_id);
        }
      }
    }

    // Ensure all working days are present
    for (const day of workingDays) {
      if (!schedule[day]) {
        schedule[day] = [];
      }
    }

    return {
      success: true,
      data: schedule,
      method: 'openai-gpt4'
    };

  } catch (error) {
    console.error('OpenAI Generation Error:', error);
    
    // If OpenAI fails, return error to fall back to local algorithm
    return {
      success: false,
      message: `AI generation failed: ${error.message}. Falling back to local algorithm.`,
      error: error
    };
  }
}

/**
 * Check if OpenAI is configured and available
 */
function isOpenAIAvailable() {
  return !!process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.startsWith('sk-');
}

module.exports = {
  generateTimetableWithAI,
  isOpenAIAvailable
};
