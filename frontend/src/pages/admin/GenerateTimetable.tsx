import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../utils/api';

interface ClassData {
  _id: string;
  name: string;
  branch: string;
  year: number;
}

interface Template {
  _id: string;
  name: string;
  periods_per_day: number;
  working_days: string[];
  period_timings: Array<{
    name: string;
    start_time?: string;
    end_time?: string;
    start?: string;
    end?: string;
    is_break?: boolean;
    break_duration?: number;
  }>;
  guidelines?: any;
}

interface Subject {
  _id: string;
  name: string;
  code: string;
  is_lab: boolean;
  default_duration_periods: number;
}

interface Faculty {
  _id: string;
  name: string;
  faculty_id: string;
  department: string;
}

interface FacultySubjectAssignment {
  faculty_id: string;
  faculty_name: string;
  subject_id: string;
  subject_name: string;
  is_lab: boolean;
}

interface GeneratedSchedule {
  [day: string]: Array<{
    period: number;
    subject_id: string;
    faculty_id: string;
    is_lab: boolean;
    subject_details?: {
      name: string;
      code: string;
      is_lab: boolean;
    };
    faculty_details?: {
      name: string;
      faculty_id: string;
    };
  }>;
}

const GenerateTimetable: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Data
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [faculty, setFaculty] = useState<Faculty[]>([]);

  // Selections
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [academicYear, setAcademicYear] = useState<string>('2024-2025');
  const [assignments, setAssignments] = useState<FacultySubjectAssignment[]>([]);

  // Generated timetable
  const [generatedSchedule, setGeneratedSchedule] = useState<GeneratedSchedule | null>(null);
  const [timetableId, setTimetableId] = useState<string>('');

  // Fetch initial data
  useEffect(() => {
    fetchClasses();
    fetchTemplates();
    fetchSubjects();
    fetchFaculty();
    
    // Pre-select class from URL if provided
    const classFromUrl = searchParams.get('class');
    if (classFromUrl) {
      setSelectedClass(classFromUrl);
    }
  }, [searchParams]);

  const fetchClasses = async () => {
    try {
      const response = await api.get('/classes');
      setClasses(response.data.data || response.data || []);
    } catch (err) {
      console.error('Error fetching classes:', err);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await api.get('/templates');
      setTemplates(response.data.data || response.data || []);
    } catch (err) {
      console.error('Error fetching templates:', err);
    }
  };

  const fetchSubjects = async () => {
    try {
      const response = await api.get('/subjects');
      setSubjects(response.data.data || response.data || []);
    } catch (err) {
      console.error('Error fetching subjects:', err);
    }
  };

  const fetchFaculty = async () => {
    try {
      const response = await api.get('/users?role=faculty');
      setFaculty(response.data.data || response.data || []);
    } catch (err) {
      console.error('Error fetching faculty:', err);
    }
  };

  // Get selected class and template objects
  const selectedClassObj = classes.find(c => c._id === selectedClass);
  const selectedTemplateObj = templates.find(t => t._id === selectedTemplate);

  // Add a new assignment
  const addAssignment = () => {
    setAssignments([...assignments, {
      faculty_id: '',
      faculty_name: '',
      subject_id: '',
      subject_name: '',
      is_lab: false
    }]);
  };

  // Update an assignment
  const updateAssignment = (index: number, field: string, value: string) => {
    const updated = [...assignments];
    
    if (field === 'faculty_id') {
      const facultyObj = faculty.find(f => f._id === value);
      updated[index].faculty_id = value;
      updated[index].faculty_name = facultyObj?.name || '';
    } else if (field === 'subject_id') {
      const subjectObj = subjects.find(s => s._id === value);
      updated[index].subject_id = value;
      updated[index].subject_name = subjectObj?.name || '';
      updated[index].is_lab = subjectObj?.is_lab || false;
    }
    
    setAssignments(updated);
  };

  // Remove an assignment
  const removeAssignment = (index: number) => {
    setAssignments(assignments.filter((_, i) => i !== index));
  };

  // Create timetable structure and generate
  const handleGenerate = async () => {
    if (!selectedClass || !selectedTemplate || assignments.length === 0) {
      setError('Please complete all selections and add at least one faculty-subject assignment');
      return;
    }

    // Validate all assignments are complete
    const incompleteAssignments = assignments.filter(a => !a.faculty_id || !a.subject_id);
    if (incompleteAssignments.length > 0) {
      setError('Please complete all faculty-subject assignments');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const template = selectedTemplateObj;
      if (!template) {
        throw new Error('Template not found');
      }

      // Extract period timings from template (could be in period_timings or guidelines.period_timings)
      const sourcePeriodTimings = template.period_timings || template.guidelines?.period_timings || [];
      
      const periodTimings = sourcePeriodTimings
        .filter(pt => !pt.is_break && pt.period_name) // Only non-break periods with names
        .map(pt => ({
          name: pt.period_name || pt.name,
          start_time: pt.start_time || pt.start,
          end_time: pt.end_time || pt.end,
          is_break: pt.is_break || false,
          break_duration: pt.break_duration || 0
        }));

      console.log('Extracted period timings:', periodTimings);

      // Step 1: Create the timetable structure
      const timetableData = {
        class_id: selectedClass,
        academic_year: academicYear,
        template_id: selectedTemplate,
        periods_per_day: template.periods_per_day,
        working_days: template.working_days || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
        period_timings: periodTimings,
        guidelines: template.guidelines || {
          minimize_consecutive_faculty_periods: true,
          labs_once_a_week: true,
          sports_last_period_predefined_day: 'friday'
        }
      };

      console.log('Creating timetable structure:', timetableData);
      const createResponse = await api.post('/timetables', timetableData);
      const newTimetableId = createResponse.data.data._id;
      setTimetableId(newTimetableId);

      // Step 2: Generate the timetable with AI
      const generateData = {
        timetable_id: newTimetableId,
        faculty_subject_assignments: assignments.map(a => ({
          faculty_id: a.faculty_id,
          subject_id: a.subject_id
        }))
      };

      console.log('Generating timetable:', generateData);
      const generateResponse = await api.post('/ai/generate-timetable', generateData);
      
      if (generateResponse.data.data?.schedule) {
        setGeneratedSchedule(generateResponse.data.data.schedule);
        setSuccess('Timetable generated successfully!');
        setCurrentStep(4);
      } else {
        throw new Error('No schedule returned from generation');
      }

    } catch (err: any) {
      console.error('Generation error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to generate timetable');
    } finally {
      setLoading(false);
    }
  };

  // Render step indicator
  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {[1, 2, 3, 4].map((step) => (
        <React.Fragment key={step}>
          <div
            className={`flex items-center justify-center w-10 h-10 rounded-full border-2 font-semibold transition-all ${
              currentStep >= step
                ? 'bg-indigo-600 border-indigo-600 text-white'
                : 'border-gray-300 text-gray-400 dark:border-gray-600'
            }`}
          >
            {step}
          </div>
          {step < 4 && (
            <div
              className={`w-16 h-1 mx-2 rounded ${
                currentStep > step ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );

  // Render step labels
  const renderStepLabels = () => (
    <div className="flex justify-center gap-8 mb-8 text-sm">
      <span className={currentStep >= 1 ? 'text-indigo-600 font-medium' : 'text-gray-400'}>
        1. Select Class
      </span>
      <span className={currentStep >= 2 ? 'text-indigo-600 font-medium' : 'text-gray-400'}>
        2. Select Template
      </span>
      <span className={currentStep >= 3 ? 'text-indigo-600 font-medium' : 'text-gray-400'}>
        3. Assign Faculty
      </span>
      <span className={currentStep >= 4 ? 'text-indigo-600 font-medium' : 'text-gray-400'}>
        4. View Timetable
      </span>
    </div>
  );

  // Step 1: Select Class
  const renderStep1 = () => (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
        Step 1: Select Class
      </h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        Choose the class for which you want to generate the timetable.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {classes.map((cls) => (
          <div
            key={cls._id}
            onClick={() => setSelectedClass(cls._id)}
            className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
              selectedClass === cls._id
                ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30'
                : 'border-gray-200 dark:border-gray-600 hover:border-indigo-300'
            }`}
          >
            <h3 className="font-semibold text-gray-900 dark:text-white">{cls.name}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {cls.branch} - Year {cls.year}
            </p>
          </div>
        ))}
      </div>

      {classes.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No classes found. Please create classes first.
        </div>
      )}

      <div className="mt-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Academic Year
        </label>
        <select
          value={academicYear}
          onChange={(e) => setAcademicYear(e.target.value)}
          className="w-full md:w-64 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="2024-2025">2024-2025</option>
          <option value="2025-2026">2025-2026</option>
          <option value="2026-2027">2026-2027</option>
        </select>
      </div>

      <div className="mt-8 flex justify-end">
        <button
          onClick={() => setCurrentStep(2)}
          disabled={!selectedClass}
          className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          Next: Select Template →
        </button>
      </div>
    </div>
  );

  // Step 2: Select Template
  const renderStep2 = () => (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
        Step 2: Select Template
      </h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        Choose a template that defines the period timings and structure.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {templates.map((template) => (
          <div
            key={template._id}
            onClick={() => setSelectedTemplate(template._id)}
            className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
              selectedTemplate === template._id
                ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30'
                : 'border-gray-200 dark:border-gray-600 hover:border-indigo-300'
            }`}
          >
            <h3 className="font-semibold text-gray-900 dark:text-white">{template.name}</h3>
            <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              <p>Periods: {template.periods_per_day} per day</p>
              <p>Days: {template.working_days?.join(', ')}</p>
            </div>
            {template.period_timings && template.period_timings.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Period Timings:</p>
                <div className="space-y-1">
                  {template.period_timings.slice(0, 4).map((pt, idx) => (
                    <div key={idx} className="text-xs text-gray-500 dark:text-gray-400">
                      {pt.name}: {pt.start_time || pt.start} - {pt.end_time || pt.end}
                    </div>
                  ))}
                  {template.period_timings.length > 4 && (
                    <div className="text-xs text-gray-400">
                      +{template.period_timings.length - 4} more...
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {templates.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No templates found. Please create a template first in Manage Timetables.
        </div>
      )}

      <div className="mt-8 flex justify-between">
        <button
          onClick={() => setCurrentStep(1)}
          className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          ← Back
        </button>
        <button
          onClick={() => setCurrentStep(3)}
          disabled={!selectedTemplate}
          className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          Next: Assign Faculty →
        </button>
      </div>
    </div>
  );

  // Step 3: Faculty-Subject Assignments
  const renderStep3 = () => (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
        Step 3: Assign Faculty to Subjects
      </h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        Map each subject to a faculty member who will teach it.
      </p>

      {/* Summary */}
      <div className="bg-indigo-50 dark:bg-indigo-900/30 rounded-lg p-4 mb-6">
        <div className="flex flex-wrap gap-4 text-sm">
          <div>
            <span className="text-gray-600 dark:text-gray-400">Class: </span>
            <span className="font-semibold text-gray-900 dark:text-white">
              {selectedClassObj?.name}
            </span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">Template: </span>
            <span className="font-semibold text-gray-900 dark:text-white">
              {selectedTemplateObj?.name}
            </span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">Academic Year: </span>
            <span className="font-semibold text-gray-900 dark:text-white">
              {academicYear}
            </span>
          </div>
        </div>
      </div>

      {/* Assignments Table */}
      <div className="space-y-4 mb-6">
        {assignments.map((assignment, index) => (
          <div
            key={index}
            className="flex flex-wrap gap-4 items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
          >
            <div className="flex-1 min-w-48">
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                Subject
              </label>
              <select
                value={assignment.subject_id}
                onChange={(e) => updateAssignment(index, 'subject_id', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
              >
                <option value="">Select Subject</option>
                {subjects.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name} {s.is_lab ? '(Lab)' : ''} - {s.code}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center text-gray-400">→</div>

            <div className="flex-1 min-w-48">
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                Faculty
              </label>
              <select
                value={assignment.faculty_id}
                onChange={(e) => updateAssignment(index, 'faculty_id', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
              >
                <option value="">Select Faculty</option>
                {faculty.map((f) => (
                  <option key={f._id} value={f._id}>
                    {f.name} ({f.faculty_id})
                  </option>
                ))}
              </select>
            </div>

            {assignment.is_lab && (
              <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 text-xs rounded">
                Lab
              </span>
            )}

            <button
              onClick={() => removeAssignment(index)}
              className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
              title="Remove assignment"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={addAssignment}
        className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-indigo-300 dark:border-indigo-600 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        Add Faculty-Subject Assignment
      </button>

      {error && (
        <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="mt-8 flex justify-between">
        <button
          onClick={() => setCurrentStep(2)}
          className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          ← Back
        </button>
        <button
          onClick={handleGenerate}
          disabled={loading || assignments.length === 0}
          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Generating...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Generate Timetable
            </>
          )}
        </button>
      </div>
    </div>
  );

  // Step 4: View Generated Timetable
  const renderStep4 = () => {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const periodCount = selectedTemplateObj?.periods_per_day || 6;
    const periods = Array.from({ length: periodCount }, (_, i) => i + 1);

    // Helper to get subject name by ID
    const getSubjectName = (subjectId: string) => {
      const subject = subjects.find(s => s._id === subjectId);
      return subject?.name || 'Unknown';
    };

    // Helper to get faculty name by ID
    const getFacultyName = (facultyId: string) => {
      const facultyMember = faculty.find(f => f._id === facultyId);
      return facultyMember?.name || 'Unknown';
    };

    // Helper to check if subject is a lab
    const isSubjectLab = (subjectId: string) => {
      const subject = subjects.find(s => s._id === subjectId);
      return subject?.is_lab || false;
    };

    // Get slot info for a day and period
    const getSlot = (day: string, period: number) => {
      if (!generatedSchedule || !generatedSchedule[day]) return null;
      return generatedSchedule[day].find(s => s.period === period);
    };

    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Generated Timetable
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {selectedClassObj?.name} - {academicYear}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate('/admin/timetables')}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              View All Timetables
            </button>
            <button
              onClick={() => {
                setCurrentStep(1);
                setGeneratedSchedule(null);
                setTimetableId('');
                setAssignments([]);
                setSelectedClass('');
                setSelectedTemplate('');
              }}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Create Another
            </button>
          </div>
        </div>

        {success && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-300 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {success}
          </div>
        )}

        {/* Timetable Grid */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="p-3 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-left font-semibold text-gray-700 dark:text-gray-300">
                  Day / Period
                </th>
                {periods.map((period) => (
                  <th
                    key={period}
                    className="p-3 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-center font-semibold text-gray-700 dark:text-gray-300 min-w-28"
                  >
                    Period {period}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {days.map((day) => (
                <tr key={day}>
                  <td className="p-3 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 font-medium text-gray-700 dark:text-gray-300 capitalize">
                    {day}
                  </td>
                  {periods.map((period) => {
                    const slot = getSlot(day, period);
                    return (
                      <td
                        key={period}
                        className={`p-2 border border-gray-200 dark:border-gray-600 text-center ${
                          slot?.is_lab || (slot && isSubjectLab(slot.subject_id))
                            ? 'bg-purple-50 dark:bg-purple-900/30'
                            : slot
                            ? 'bg-white dark:bg-gray-800'
                            : 'bg-gray-100 dark:bg-gray-700'
                        }`}
                      >
                        {slot ? (
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white text-sm">
                              {slot.subject_details?.name || getSubjectName(slot.subject_id)}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {slot.faculty_details?.name || getFacultyName(slot.faculty_id)}
                            </div>
                            {(slot.is_lab || isSubjectLab(slot.subject_id)) && (
                              <span className="inline-block mt-1 px-1.5 py-0.5 bg-purple-200 dark:bg-purple-800 text-purple-700 dark:text-purple-300 text-xs rounded">
                                Lab
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="mt-6 flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded"></div>
            <span className="text-gray-600 dark:text-gray-400">Theory Class</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-purple-50 dark:bg-purple-900/30 border border-purple-300 dark:border-purple-700 rounded"></div>
            <span className="text-gray-600 dark:text-gray-400">Lab Session</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded"></div>
            <span className="text-gray-600 dark:text-gray-400">Free Period</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Generate Timetable
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Create a new timetable using AI-powered scheduling
          </p>
        </div>

        {/* Step Indicator */}
        {renderStepIndicator()}
        {renderStepLabels()}

        {/* Step Content */}
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
        {currentStep === 4 && renderStep4()}
      </div>
    </div>
  );
};

export default GenerateTimetable;
