import React, { useState, useEffect } from 'react';
import { classes, subjects, aiGeneration, timetables, users } from '../../utils/api';
import GuidelinesEditor from '../../components/GuidelinesEditor';
import TimetableChatbot from '../../components/TimetableChatbot';

interface TimetableEntry {
  period: number;
  subject_id: string;
  faculty_id: string;
  is_lab: boolean;
}

interface GeneratedSchedule {
  [key: string]: TimetableEntry[];
}

interface FacultySubjectAssignment {
  faculty_id: string;
  faculty_name: string;
  subject_id: string;
  subject_name: string;
  is_lab: boolean;
  periods_needed: number;
}

const GenerateTimetable: React.FC = () => {
  // States for form inputs
  const [classList, setClassList] = useState<any[]>([]);
  const [subjectList, setSubjectList] = useState<any[]>([]);
  const [facultyList, setFacultyList] = useState<any[]>([]);
  const [timetableList, setTimetableList] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedTimetable, setSelectedTimetable] = useState<string>('');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [facultySubjectAssignments, setFacultySubjectAssignments] = useState<any[]>([]);
  const [customInstructions, setCustomInstructions] = useState<string[]>([]);
  
  // States for UI
  const [loading, setLoading] = useState<boolean>(false);
  const [generating, setGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [timetableData, setTimetableData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<string>('generate');
  const [currentStep, setCurrentStep] = useState<number>(1); // Step-by-step process
  const [showGuidelinesEditor, setShowGuidelinesEditor] = useState<boolean>(false);
  const [showChatbot, setShowChatbot] = useState<boolean>(false);

  useEffect(() => {
    // Fetch initial data
    const fetchData = async () => {
      setLoading(true);
      try {
        const [classResponse, subjectResponse, facultyResponse, timetableResponse] = await Promise.all([
          classes.getAll(),
          subjects.getAll(),
          users.getFaculty(),
          timetables.getAll()
        ]);
        
        setClassList(classResponse.data.data);
        setSubjectList(subjectResponse.data.data);
        setFacultyList(facultyResponse.data.data);
        setTimetableList(timetableResponse.data.data);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load required data. Please refresh and try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Filter timetables based on selected class
  const filteredTimetables = timetableList.filter(tt => 
    !selectedClass || tt.class_id._id === selectedClass
  );

  // Handle class selection
  const handleClassSelect = (classId: string) => {
    setSelectedClass(classId);
    setSelectedTimetable('');
    setSelectedSubjects([]);
    setFacultySubjectAssignments([]);
    setCurrentStep(2);
  };

  // Handle timetable selection
  const handleTimetableSelect = (timetableId: string) => {
    setSelectedTimetable(timetableId);
    
    // Initialize faculty assignments based on selected subjects
    const assignments = selectedSubjects.map(subjectId => {
      const subject = subjectList.find(s => s._id === subjectId);
      return {
        subject_id: subjectId,
        subject_name: subject?.name || 'Unknown Subject',
        subject_code: subject?.code || '',
        is_lab: subject?.is_lab || false,
        periods_needed: subject?.default_duration_periods || 1,
        faculty_id: '',
        faculty_name: ''
      };
    });
    
    setFacultySubjectAssignments(assignments);
    setCurrentStep(4);
  };

  // Handle subject selection
  const handleSubjectSelect = (subjectId: string) => {
    setSelectedSubjects(prev => {
      if (prev.includes(subjectId)) {
        return prev.filter(id => id !== subjectId);
      } else {
        return [...prev, subjectId];
      }
    });
  };

  // Handle custom instruction from chatbot
  const handleCustomInstruction = (instruction: string) => {
    setCustomInstructions(prev => [...prev, instruction]);
  };

  // Handle guidelines save
  const handleGuidelinesSave = (newGuidelines: any) => {
    // In a real application, you would save these to the selected timetable
    console.log('Saving guidelines:', newGuidelines);
    setShowGuidelinesEditor(false);
    setSuccess('Guidelines updated successfully!');
  };

  // Handle proceeding to faculty mapping
  const handleProceedToMapping = () => {
    if (selectedSubjects.length === 0) {
      setError('Please select at least one subject.');
      return;
    }
    
    setError(null);
    setCurrentStep(3); // Go to Step 3: Select Timetable Template
  };

  // Note: Faculty assignment initialization is now handled in handleProceedToMapping

  // Handle faculty assignment change
  const handleFacultyAssignmentChange = (index: number, facultyId: string) => {
    const updatedAssignments = [...facultySubjectAssignments];
    const selectedFaculty = facultyList.find(f => f._id === facultyId);
    
    updatedAssignments[index].faculty_id = facultyId;
    updatedAssignments[index].faculty_name = selectedFaculty ? selectedFaculty.name : '';
    
    setFacultySubjectAssignments(updatedAssignments);
  };

  // Handle periods needed change
  const handlePeriodsChange = (index: number, periods: number) => {
    const updatedAssignments = [...facultySubjectAssignments];
    updatedAssignments[index].periods_needed = periods;
    setFacultySubjectAssignments(updatedAssignments);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedTimetable) {
      setError('Please select a timetable.');
      return;
    }

    // Validate all subjects have faculty assigned
    const unassignedSubjects = facultySubjectAssignments.filter(assignment => !assignment.faculty_id);
    if (unassignedSubjects.length > 0) {
      setError('Please assign faculty to all subjects before generating timetable.');
      return;
    }
    
    setError(null);
    setSuccess(null);
    setGenerating(true);

    try {
      // Prepare data for AI generation (format expected by backend)
      const generationData = {
        timetable_id: selectedTimetable,
        faculty_subject_assignments: facultySubjectAssignments.map(assignment => ({
          faculty_id: assignment.faculty_id,
          subject_id: assignment.subject_id,
          periods_needed: assignment.periods_needed
        }))
      };

      console.log('Sending generation data:', generationData);

      // Call AI generation endpoint
      const response = await aiGeneration.generateTimetable(generationData);
      
      setSuccess('Timetable generated successfully!');
      setTimetableData(response.data.data);
      setActiveTab('view');
      
    } catch (err: any) {
      console.error('Error generating timetable:', err);
      setError(err.response?.data?.message || 'Failed to generate timetable. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  // Render different steps
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center py-6">
              <h3 className="text-2xl font-semibold text-gray-800 mb-2">Step 1: Select a Class</h3>
              <p className="text-gray-600">Choose the class for which you want to generate a timetable</p>
            </div>
            
            {classList.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
                <p className="text-gray-500 text-lg">No classes found</p>
                <p className="text-gray-400 text-sm mt-2">Please create classes first in the Classes management section</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {classList.map(classItem => (
                  <div
                    key={classItem._id}
                    onClick={() => handleClassSelect(classItem._id)}
                    className={`relative p-6 rounded-xl border-2 cursor-pointer transition-all duration-200 hover:shadow-lg ${
                      selectedClass === classItem._id
                        ? 'border-blue-500 bg-blue-50 shadow-md transform scale-105'
                        : 'border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50'
                    }`}
                  >
                    {selectedClass === classItem._id && (
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                    
                    <div className="text-center">
                      <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                        </svg>
                      </div>
                      <h4 className="font-bold text-lg text-gray-800 mb-2">{classItem.name}</h4>
                      <div className="space-y-1 text-sm">
                        <p className="text-gray-600">{classItem.branch}</p>
                        <p className="text-gray-500">Year {classItem.year} • Section {classItem.section}</p>
                        {classItem.class_teacher_id && (
                          <p className="text-blue-600 font-medium">
                            Class Teacher: {classItem.class_teacher_id.name || 'Assigned'}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setCurrentStep(1)}
                className="flex items-center text-blue-600 hover:text-blue-800 transition-colors"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Class Selection
              </button>
              <div className="text-center">
                <h3 className="text-2xl font-semibold text-gray-800">Step 2: Select Subjects</h3>
                <p className="text-gray-600 mt-1">Choose the subjects for this class</p>
              </div>
              <div className="w-32"></div> {/* Spacer for centering */}
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">Subject Selection</h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <p>Select all subjects that should be included in the timetable for this class. You can select both theory and lab subjects.</p>
                    <p className="mt-1">Selected: <strong>{selectedSubjects.length}</strong> subjects</p>
                  </div>
                </div>
              </div>
            </div>

            {subjectList.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <p className="text-gray-500 text-lg">No subjects found</p>
                <p className="text-gray-400 text-sm mt-2">Please create subjects first in the Subjects management section</p>
              </div>
            ) : (
              <div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                  {subjectList.map(subject => (
                    <div
                      key={subject._id}
                      onClick={() => handleSubjectSelect(subject._id)}
                      className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:shadow-md ${
                        selectedSubjects.includes(subject._id)
                          ? 'border-green-500 bg-green-50 shadow-sm'
                          : 'border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            subject.is_lab ? 'bg-purple-100' : 'bg-blue-100'
                          }`}>
                            {subject.is_lab ? (
                              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                              </svg>
                            ) : (
                              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                              </svg>
                            )}
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-800">{subject.code}</h4>
                            <p className="text-sm text-gray-600">{subject.name}</p>
                            <p className="text-xs text-gray-500">
                              {subject.is_lab ? 'Lab' : 'Theory'} • {subject.default_duration_periods}h
                            </p>
                          </div>
                        </div>
                        {selectedSubjects.includes(subject._id) && (
                          <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-center">
                  <button
                    onClick={handleProceedToMapping}
                    disabled={selectedSubjects.length === 0}
                    className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                      selectedSubjects.length === 0
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    Continue to Timetable Selection
                    <svg className="w-4 h-4 ml-2 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setCurrentStep(2)}
                className="flex items-center text-blue-600 hover:text-blue-800 transition-colors"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Subject Selection
              </button>
              <div className="text-center">
                <h3 className="text-2xl font-semibold text-gray-800">Step 3: Select Timetable Template</h3>
                <p className="text-gray-600 mt-1">Choose a timetable structure for the selected class</p>
              </div>
              <div className="w-32"></div> {/* Spacer for centering */}
            </div>
            
            {filteredTimetables.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.888-.833-2.598 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <p className="text-gray-500 text-lg">No timetable templates found</p>
                <p className="text-gray-400 text-sm mt-2">Please create a timetable structure first for the selected class</p>
                <button 
                  onClick={() => setCurrentStep(1)}
                  className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm transition-colors"
                >
                  Select Different Class
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredTimetables.map(timetable => (
                  <div
                    key={timetable._id}
                    onClick={() => handleTimetableSelect(timetable._id)}
                    className={`p-6 rounded-xl border-2 cursor-pointer transition-all duration-200 hover:shadow-lg ${
                      selectedTimetable === timetable._id
                        ? 'border-blue-500 bg-blue-50 shadow-md'
                        : 'border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="font-bold text-lg text-gray-800">
                            {timetable.class_id.name} - {timetable.academic_year}
                          </h4>
                          <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                            <span className="flex items-center">
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {timetable.periods_per_day} periods per day
                            </span>
                            <span className="flex items-center">
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              {timetable.last_generated 
                                ? `Updated: ${new Date(timetable.last_generated).toLocaleDateString()}`
                                : 'Never generated'
                              }
                            </span>
                          </div>
                        </div>
                      </div>
                      {selectedTimetable === timetable._id && (
                        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                    
                    {/* Timetable Guidelines Preview */}
                    {timetable.guidelines && (
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                        <h5 className="font-medium text-gray-700 mb-2">Guidelines:</h5>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs text-gray-600">
                          {timetable.guidelines.minimize_consecutive_faculty_periods && (
                            <span className="flex items-center">
                              <span className="w-2 h-2 bg-green-400 rounded-full mr-1"></span>
                              Min consecutive periods
                            </span>
                          )}
                          {timetable.guidelines.labs_once_a_week && (
                            <span className="flex items-center">
                              <span className="w-2 h-2 bg-purple-400 rounded-full mr-1"></span>
                              Labs once per week
                            </span>
                          )}
                          {timetable.guidelines.sports_last_period_predefined_day && (
                            <span className="flex items-center">
                              <span className="w-2 h-2 bg-orange-400 rounded-full mr-1"></span>
                              Sports on {timetable.guidelines.sports_last_period_predefined_day}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setCurrentStep(3)}
                className="flex items-center text-blue-600 hover:text-blue-800 transition-colors"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Timetable Selection
              </button>
              <div className="text-center">
                <h3 className="text-2xl font-semibold text-gray-800">Step 4: Faculty Assignments</h3>
                <p className="text-gray-600 mt-1">Assign faculty members to teach each subject</p>
              </div>
              <div className="w-40"></div> {/* Spacer for centering */}
            </div>
            
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-blue-400 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="text-blue-800 font-medium">
                    Faculty Assignment Instructions
                  </p>
                  <p className="text-blue-700 mt-1 text-sm">
                    Please assign a faculty member to teach each subject. You can also adjust the number of periods per week for each subject. Lab subjects typically require 2-3 periods while theory subjects need 1 period.
                  </p>
                </div>
              </div>
            </div>

            {/* Assignment Progress */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-800">Assignment Progress</h4>
                <span className="text-sm text-gray-600">
                  {facultySubjectAssignments.filter(a => a.faculty_id).length} of {facultySubjectAssignments.length} assigned
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${(facultySubjectAssignments.filter(a => a.faculty_id).length / facultySubjectAssignments.length) * 100}%` 
                  }}
                ></div>
              </div>
            </div>

            <div className="space-y-4">
              {facultySubjectAssignments.map((assignment, index) => (
                <div key={index} className={`p-6 border-2 rounded-xl transition-all duration-200 ${
                  assignment.faculty_id 
                    ? 'border-green-200 bg-green-50' 
                    : 'border-red-200 bg-red-50'
                }`}>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Subject Information */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Subject Details
                      </label>
                      <div className="p-4 bg-white rounded-lg border border-gray-200">
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            assignment.is_lab 
                              ? 'bg-purple-100' 
                              : 'bg-blue-100'
                          }`}>
                            <svg className={`w-5 h-5 ${
                              assignment.is_lab 
                                ? 'text-purple-600' 
                                : 'text-blue-600'
                            }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              {assignment.is_lab ? (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                              ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                              )}
                            </svg>
                          </div>
                          <div>
                            <p className="font-bold text-gray-800">{assignment.subject_name}</p>
                            <p className="text-sm text-gray-600">
                              {assignment.is_lab ? 'Laboratory' : 'Theory'} • {assignment.periods_needed} period(s)/week
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Faculty Assignment */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Assign Faculty *
                      </label>
                      <select
                        value={assignment.faculty_id}
                        onChange={(e) => handleFacultyAssignmentChange(index, e.target.value)}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          assignment.faculty_id 
                            ? 'border-green-300 bg-white' 
                            : 'border-red-300 bg-red-50'
                        }`}
                        required
                      >
                        <option value="">-- Select Faculty --</option>
                        {facultyList.map(faculty => (
                          <option key={faculty._id} value={faculty._id}>
                            {faculty.name} ({faculty.faculty_id})
                          </option>
                        ))}
                      </select>
                      {assignment.faculty_id && (
                        <p className="text-green-600 text-sm mt-1 flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          Assigned to {assignment.faculty_name}
                        </p>
                      )}
                    </div>
                    
                    {/* Periods Configuration */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Periods per Week
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={assignment.periods_needed}
                        onChange={(e) => handlePeriodsChange(index, parseInt(e.target.value))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <p className="text-gray-500 text-sm mt-1">
                        Recommended: {assignment.is_lab ? '2-3' : '3-4'} periods
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Generate Button */}
            <div className="flex justify-center pt-6 border-t border-gray-200">
              <button
                onClick={handleSubmit}
                disabled={generating || facultySubjectAssignments.some(assignment => !assignment.faculty_id)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-4 px-8 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 flex items-center space-x-3"
              >
                {generating ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Generating Timetable...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span>Generate AI Timetable</span>
                  </>
                )}
              </button>
            </div>

            {/* Validation Summary */}
            {facultySubjectAssignments.some(assignment => !assignment.faculty_id) && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-yellow-400 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="text-yellow-800 font-medium">Incomplete Assignments</p>
                    <p className="text-yellow-700 text-sm mt-1">
                      Please assign faculty to all subjects before generating the timetable. 
                      Missing assignments: {facultySubjectAssignments.filter(a => !a.faculty_id).length}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <h1 className="text-3xl font-bold">Generate Timetable</h1>
          
          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowGuidelinesEditor(true)}
              className="flex items-center space-x-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
              </svg>
              <span className="text-sm">Guidelines</span>
            </button>
            
            <button
              onClick={() => setShowChatbot(true)}
              className="flex items-center space-x-2 px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span className="text-sm">AI Chat</span>
            </button>
          </div>
        </div>
        
        {/* Progress Indicator */}
        <div className="flex items-center space-x-2 text-sm">
          <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
            currentStep >= 1 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500'
          }`}>
            {currentStep > 1 ? '✓' : '1'}
          </div>
          <div className={`w-8 h-1 ${currentStep >= 2 ? 'bg-blue-500' : 'bg-gray-200'}`}></div>
          <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
            currentStep >= 2 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500'
          }`}>
            {currentStep > 2 ? '✓' : '2'}
          </div>
          <div className={`w-8 h-1 ${currentStep >= 3 ? 'bg-blue-500' : 'bg-gray-200'}`}></div>
          <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
            currentStep >= 3 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500'
          }`}>
            {currentStep > 3 ? '✓' : '3'}
          </div>
          <div className={`w-8 h-1 ${currentStep >= 4 ? 'bg-blue-500' : 'bg-gray-200'}`}></div>
          <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
            currentStep >= 4 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500'
          }`}>
            {currentStep > 4 ? '✓' : '4'}
          </div>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <p>{error}</p>
          </div>
        </div>
      )}
      
      {success && (
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6" role="alert">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <p>{success}</p>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-6">
        <button
          onClick={() => setActiveTab('generate')}
          className={`px-4 py-2 rounded-md font-medium ${
            activeTab === 'generate'
              ? 'bg-blue-100 text-blue-700'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Generate
        </button>
        <button
          onClick={() => setActiveTab('view')}
          className={`px-4 py-2 rounded-md font-medium ${
            activeTab === 'view'
              ? 'bg-blue-100 text-blue-700'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          disabled={!timetableData}
        >
          View Results
        </button>
      </div>

      {/* Generate Tab */}
      {activeTab === 'generate' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          {loading ? (
            <div className="flex justify-center my-12">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            renderStepContent()
          )}
        </div>
      )}

      {/* View Results Tab */}
      {activeTab === 'view' && timetableData && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Generated Timetable</h2>
          <TimetableVisualization 
            scheduleData={timetableData.schedule} 
            facultyList={facultyList}
            subjectList={subjectList}
            periodsPerDay={timetableData.periods_per_day}
          />
        </div>
      )}
      
      {/* Guidelines Editor Modal */}
      {showGuidelinesEditor && (
        <GuidelinesEditor
          guidelines={{
            minimize_consecutive_faculty_periods: true,
            labs_once_a_week: true,
            sports_last_period_predefined_day: 'friday',
            no_breaks_during_labs: true,
            max_periods_per_faculty_per_day: 6,
            preferred_lab_days: ['tuesday', 'wednesday', 'thursday'],
            avoid_first_period_labs: true,
            lunch_break_period: 4
          }}
          onSave={handleGuidelinesSave}
          onCancel={() => setShowGuidelinesEditor(false)}
        />
      )}
      
      {/* Chatbot Modal */}
      {showChatbot && (
        <TimetableChatbot
          onClose={() => setShowChatbot(false)}
          onInstructionSend={handleCustomInstruction}
        />
      )}
    </div>
  );
};

// Timetable Visualization Component
const TimetableVisualization: React.FC<{
  scheduleData: GeneratedSchedule;
  facultyList: any[];
  subjectList: any[];
  periodsPerDay: number;
}> = ({ scheduleData, facultyList, subjectList, periodsPerDay }) => {
  
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const periods = Array.from({ length: periodsPerDay }, (_, i) => i + 1);

  // Helper functions
  const getFacultyName = (facultyId: string) => {
    const faculty = facultyList.find(f => f._id === facultyId);
    return faculty ? faculty.name : 'Unknown Faculty';
  };

  const getSubjectDetails = (subjectId: string) => {
    const subject = subjectList.find(s => s._id === subjectId);
    return subject ? { name: subject.name, code: subject.code } : { name: 'Unknown Subject', code: 'N/A' };
  };

  const getPeriodData = (day: string, period: number) => {
    const daySchedule = scheduleData[day.toLowerCase()] || [];
    return daySchedule.find(entry => entry.period === period);
  };

  const getPeriodColor = (entry: TimetableEntry | undefined) => {
    if (!entry) return 'bg-gray-100 border-gray-200';
    
    if (entry.is_lab) {
      return 'bg-purple-100 border-purple-300';
    }
    
    // Color based on subject type (you can customize this)
    const colors = [
      'bg-blue-100 border-blue-300',
      'bg-green-100 border-green-300',
      'bg-yellow-100 border-yellow-300',
      'bg-pink-100 border-pink-300',
      'bg-indigo-100 border-indigo-300',
    ];
    
    const colorIndex = entry.subject_id.length % colors.length;
    return colors[colorIndex];
  };

  return (
    <div className="space-y-6">
      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-medium text-blue-800">Total Periods</h3>
          <p className="text-2xl font-bold text-blue-600">
            {Object.values(scheduleData).reduce((total, daySchedule) => total + daySchedule.length, 0)}
          </p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <h3 className="font-medium text-purple-800">Lab Sessions</h3>
          <p className="text-2xl font-bold text-purple-600">
            {Object.values(scheduleData).reduce((total, daySchedule) => 
              total + daySchedule.filter(entry => entry.is_lab).length, 0
            )}
          </p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="font-medium text-green-800">Theory Classes</h3>
          <p className="text-2xl font-bold text-green-600">
            {Object.values(scheduleData).reduce((total, daySchedule) => 
              total + daySchedule.filter(entry => !entry.is_lab).length, 0
            )}
          </p>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg">
          <h3 className="font-medium text-orange-800">Free Periods</h3>
          <p className="text-2xl font-bold text-orange-600">
            {(days.length * periodsPerDay) - Object.values(scheduleData).reduce((total, daySchedule) => total + daySchedule.length, 0)}
          </p>
        </div>
      </div>

      {/* Timetable Grid */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-50">
              <th className="border border-gray-300 px-4 py-3 text-left font-medium text-gray-700">
                Period / Day
              </th>
              {days.map(day => (
                <th key={day} className="border border-gray-300 px-4 py-3 text-center font-medium text-gray-700 min-w-[180px]">
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {periods.map(period => (
              <tr key={period} className="hover:bg-gray-50">
                <td className="border border-gray-300 px-4 py-3 font-medium text-gray-700 bg-gray-50">
                  Period {period}
                </td>
                {days.map(day => {
                  const periodData = getPeriodData(day, period);
                  return (
                    <td key={`${day}-${period}`} className={`border border-gray-300 p-2 ${getPeriodColor(periodData)}`}>
                      {periodData ? (
                        <div className="space-y-1">
                          <div className="font-medium text-sm text-gray-800">
                            {getSubjectDetails(periodData.subject_id).code}
                          </div>
                          <div className="text-xs text-gray-600">
                            {getSubjectDetails(periodData.subject_id).name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {getFacultyName(periodData.faculty_id)}
                          </div>
                          {periodData.is_lab && (
                            <div className="text-xs bg-purple-200 text-purple-800 px-1 py-0.5 rounded">
                              LAB
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-gray-400 text-xs text-center py-2">
                          Free Period
                        </div>
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
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="font-medium text-gray-800 mb-3">Legend</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-purple-100 border border-purple-300 rounded"></div>
            <span>Lab Sessions</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-blue-100 border border-blue-300 rounded"></div>
            <span>Theory Classes</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-gray-100 border border-gray-300 rounded"></div>
            <span>Free Periods</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-gradient-to-r from-blue-100 to-green-100 border border-gray-300 rounded"></div>
            <span>Color by Subject</span>
          </div>
        </div>
      </div>

      {/* Export Options */}
      <div className="flex justify-end space-x-3 pt-4 border-t">
        <button 
          onClick={() => window.print()}
          className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm"
        >
          Print Timetable
        </button>
        <button 
          onClick={() => {
            const dataStr = JSON.stringify(scheduleData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'timetable-data.json';
            link.click();
            URL.revokeObjectURL(url);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm"
        >
          Export JSON
        </button>
      </div>
    </div>
  );
};

export default GenerateTimetable;
