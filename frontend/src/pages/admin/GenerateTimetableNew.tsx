import React, { useState, useEffect } from 'react';
import { classes, subjects, aiGeneration, timetables, users } from '../../utils/api';

const GenerateTimetable: React.FC = () => {
  // States for form inputs
  const [classList, setClassList] = useState<any[]>([]);
  const [subjectList, setSubjectList] = useState<any[]>([]);
  const [facultyList, setFacultyList] = useState<any[]>([]);
  const [timetableList, setTimetableList] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedTimetable, setSelectedTimetable] = useState<string>('');
  const [facultySubjectAssignments, setFacultySubjectAssignments] = useState<any[]>([]);
  
  // States for UI
  const [loading, setLoading] = useState<boolean>(false);
  const [generating, setGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [timetableData, setTimetableData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<string>('generate');
  const [currentStep, setCurrentStep] = useState<number>(1); // Step-by-step process

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
    setFacultySubjectAssignments([]);
    setCurrentStep(2);
  };

  // Handle timetable selection
  const handleTimetableSelect = (timetableId: string) => {
    setSelectedTimetable(timetableId);
    // Initialize faculty-subject assignments based on current assignments
    initializeFacultySubjectAssignments();
    setCurrentStep(3);
  };

  // Initialize faculty subject assignments
  const initializeFacultySubjectAssignments = () => {
    const assignments: any[] = [];
    
    // Get subjects that need to be assigned
    subjectList.forEach(subject => {
      // Find faculty already assigned to this subject
      const assignedFaculty = facultyList.filter(faculty => 
        faculty.subjects_taught && faculty.subjects_taught.includes(subject._id)
      );
      
      if (assignedFaculty.length > 0) {
        assignedFaculty.forEach(faculty => {
          assignments.push({
            faculty_id: faculty._id,
            faculty_name: faculty.name,
            subject_id: subject._id,
            subject_name: subject.name,
            is_lab: subject.is_lab,
            periods_needed: subject.default_duration_periods || 1
          });
        });
      } else {
        // Subject not assigned to any faculty
        assignments.push({
          faculty_id: '',
          faculty_name: '',
          subject_id: subject._id,
          subject_name: subject.name,
          is_lab: subject.is_lab,
          periods_needed: subject.default_duration_periods || 1
        });
      }
    });
    
    setFacultySubjectAssignments(assignments);
  };

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
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Step 1: Select Class</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {classList.map(classItem => (
                <button
                  key={classItem._id}
                  onClick={() => handleClassSelect(classItem._id)}
                  className={`p-4 rounded-lg border-2 text-left transition-colors ${
                    selectedClass === classItem._id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <h4 className="font-medium">{classItem.name}</h4>
                  <p className="text-sm text-gray-600">{classItem.branch} - Year {classItem.year}</p>
                  {classItem.section && <p className="text-sm text-gray-500">Section: {classItem.section}</p>}
                </button>
              ))}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setCurrentStep(1)}
                className="text-blue-600 hover:text-blue-800"
              >
                ← Back to Class Selection
              </button>
              <h3 className="text-lg font-medium">Step 2: Select Timetable</h3>
            </div>
            
            {filteredTimetables.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No timetables found for the selected class.</p>
                <p className="text-sm text-gray-400 mt-2">Please create a timetable structure first.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTimetables.map(timetable => (
                  <button
                    key={timetable._id}
                    onClick={() => handleTimetableSelect(timetable._id)}
                    className={`w-full p-4 rounded-lg border-2 text-left transition-colors ${
                      selectedTimetable === timetable._id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <h4 className="font-medium">
                      {timetable.class_id.name} - {timetable.academic_year}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {timetable.periods_per_day} periods per day
                    </p>
                    <p className="text-sm text-gray-500">
                      {timetable.last_generated 
                        ? `Last generated: ${new Date(timetable.last_generated).toLocaleDateString()}`
                        : 'Never generated'
                      }
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setCurrentStep(2)}
                className="text-blue-600 hover:text-blue-800"
              >
                ← Back to Timetable Selection
              </button>
              <h3 className="text-lg font-medium">Step 3: Assign Faculty to Subjects</h3>
            </div>
            
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
              <p className="text-yellow-800">
                <strong>Important:</strong> Please assign faculty members to each subject. 
                This determines who will teach each subject in the generated timetable.
              </p>
            </div>

            <div className="space-y-4">
              {facultySubjectAssignments.map((assignment, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Subject
                      </label>
                      <div className="p-2 bg-gray-50 rounded">
                        <p className="font-medium">{assignment.subject_name}</p>
                        <p className="text-sm text-gray-600">
                          {assignment.is_lab ? 'Lab' : 'Theory'} - {assignment.periods_needed} period(s)
                        </p>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Assign Faculty *
                      </label>
                      <select
                        value={assignment.faculty_id}
                        onChange={(e) => handleFacultyAssignmentChange(index, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        required
                      >
                        <option value="">-- Select Faculty --</option>
                        {facultyList.map(faculty => (
                          <option key={faculty._id} value={faculty._id}>
                            {faculty.name} ({faculty.faculty_id})
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Periods per Week
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={assignment.periods_needed}
                        onChange={(e) => handlePeriodsChange(index, parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleSubmit}
              disabled={generating}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-md disabled:opacity-50"
            >
              {generating ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Generating Timetable...
                </div>
              ) : 'Generate Timetable'}
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Generate Timetable</h1>
      
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
          <p>{error}</p>
        </div>
      )}
      
      {success && (
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6" role="alert">
          <p>{success}</p>
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
          <div className="text-center py-8 text-gray-500">
            <p>Timetable visualization will be implemented here.</p>
            <p className="text-sm mt-2">Generated data: {JSON.stringify(timetableData, null, 2)}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default GenerateTimetable;
