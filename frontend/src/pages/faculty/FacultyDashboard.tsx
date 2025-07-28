import React, { useState, useEffect } from 'react';
// @ts-ignore
import { useAuth } from '../../context/AuthContext.js';
import { timetables, subjects } from '../../utils/api';

const FacultyDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [myTimetables, setMyTimetables] = useState<any[]>([]);
  const [mySubjects, setMySubjects] = useState<any[]>([]);
  const [selectedTimetable, setSelectedTimetable] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'week' | 'day'>('week');
  const [selectedDay, setSelectedDay] = useState<string>('Monday');

  const workingDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser?._id) return;

      try {
        setLoading(true);
        
        // Fetch faculty timetables
        const timetableResponse = await timetables.getByFaculty(currentUser._id);
        setMyTimetables(timetableResponse.data.data);
        
        // Fetch faculty subjects
        const subjectsResponse = await subjects.getAll();
        // Filter subjects assigned to this faculty
        const facultySubjects = subjectsResponse.data.data.filter(
          (subject: any) => subject.faculty && subject.faculty.includes(currentUser._id)
        );
        setMySubjects(facultySubjects);
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching faculty data:', err);
        setError('Failed to load your data. Please try again later.');
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser]);

  const handleTimetableSelect = (timetableId: string) => {
    const selected = myTimetables.find(t => t._id === timetableId);
    if (selected) {
      setSelectedTimetable(selected);
      // Default to the first day if we switch to day view
      if (selected.schedule && Object.keys(selected.schedule).length > 0) {
        setSelectedDay(Object.keys(selected.schedule)[0]);
      }
    }
  };

  // Get all scheduled periods for the current faculty
  const getAllScheduledPeriods = () => {
    if (!selectedTimetable || !selectedTimetable.schedule) return [];
    
    const periods: any[] = [];
    
    Object.entries(selectedTimetable.schedule).forEach(([day, daySchedule]: [string, any]) => {
      Object.entries(daySchedule).forEach(([period, slot]: [string, any]) => {
        if (slot && slot.faculty === currentUser?._id) {
          periods.push({
            day,
            period: parseInt(period),
            subject: slot.subject,
            class: selectedTimetable.class_id,
            duration: slot.duration || 1
          });
        }
      });
    });
    
    return periods;
  };

  // Function to group classes by day for weekly view
  const getScheduleByDay = () => {
    if (!selectedTimetable?.schedule) return {};
    
    // Filter the schedule to only include slots assigned to this faculty
    const facultySchedule: any = {};
    
    Object.entries(selectedTimetable.schedule).forEach(([day, daySchedule]: [string, any]) => {
      facultySchedule[day] = {};
      
      Object.entries(daySchedule).forEach(([period, slot]: [string, any]) => {
        if (slot && slot.faculty === currentUser?._id) {
          facultySchedule[day][period] = slot;
        }
      });
    });
    
    return facultySchedule;
  };

  // Get subject name by ID
  const getSubjectName = (subjectId: string) => {
    const subject = mySubjects.find(s => s._id === subjectId);
    return subject ? subject.name : 'Unknown Subject';
  };

  // Get class name by ID
  const getClassName = (classId: string) => {
    const timetable = myTimetables.find(t => t.class_id._id === classId);
    if (timetable && timetable.class_id) {
      return `${timetable.class_id.name} ${timetable.class_id.section || ''}`;
    }
    return 'Unknown Class';
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">Faculty Dashboard</h1>
      <p className="text-gray-600 mb-8">
        Welcome back, {currentUser?.name || 'Faculty'}!
      </p>
      
      {loading ? (
        <div className="flex justify-center my-12">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : error ? (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
          <p>{error}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Sidebar */}
          <div className="md:col-span-1 space-y-6">
            {/* My Subjects Card */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">My Subjects</h2>
              
              {mySubjects.length > 0 ? (
                <ul className="space-y-2">
                  {mySubjects.map(subject => (
                    <li key={subject._id} className="p-3 bg-gray-50 rounded-md">
                      <p className="font-medium">{subject.name}</p>
                      <p className="text-sm text-gray-500">
                        {subject.code || 'No code'} • {subject.is_lab ? 'Lab' : 'Theory'}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500">No subjects assigned yet.</p>
              )}
            </div>
            
            {/* My Classes Card */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">My Classes</h2>
              
              {myTimetables.length > 0 ? (
                <ul className="space-y-2">
                  {myTimetables.map(timetable => (
                    <li key={timetable._id}>
                      <button
                        onClick={() => handleTimetableSelect(timetable._id)}
                        className={`w-full p-3 rounded-md text-left transition-colors ${
                          selectedTimetable?._id === timetable._id
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-50 hover:bg-gray-100'
                        }`}
                      >
                        <p className="font-medium">
                          {timetable.class_id.name} {timetable.class_id.section || ''}
                        </p>
                        <p className="text-sm text-gray-500">
                          {getAllScheduledPeriods().filter(p => p.class === timetable.class_id._id).length} periods
                        </p>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500">No classes assigned yet.</p>
              )}
            </div>
          </div>
          
          {/* Main Content */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              {/* Timetable Header */}
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">
                  {selectedTimetable ? (
                    `Timetable: ${selectedTimetable.class_id.name} ${selectedTimetable.class_id.section || ''}`
                  ) : (
                    'My Schedule'
                  )}
                </h2>
                
                {selectedTimetable && (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setViewMode('week')}
                      className={`px-3 py-1 text-sm rounded-md ${
                        viewMode === 'week'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      Week View
                    </button>
                    <button
                      onClick={() => setViewMode('day')}
                      className={`px-3 py-1 text-sm rounded-md ${
                        viewMode === 'day'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      Day View
                    </button>
                  </div>
                )}
              </div>
              
              {/* Select a timetable message */}
              {!selectedTimetable && myTimetables.length > 0 && (
                <div className="text-center py-12 text-gray-500">
                  <p>Please select a class from the sidebar to view the timetable.</p>
                </div>
              )}
              
              {/* No timetables message */}
              {!selectedTimetable && myTimetables.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <p>You haven't been assigned to any classes yet.</p>
                </div>
              )}
              
              {/* Week View */}
              {selectedTimetable && viewMode === 'week' && (
                <div>
                  {Object.keys(getScheduleByDay()).length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full border-collapse">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
                              Day
                            </th>
                            <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
                              Schedule
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(getScheduleByDay()).map(([day, periods]: [string, any]) => (
                            <tr key={day}>
                              <td className="py-4 px-6 text-sm font-medium text-gray-900 border border-gray-200 whitespace-nowrap">
                                {day}
                              </td>
                              <td className="py-4 px-6 text-sm text-gray-500 border border-gray-200">
                                {Object.keys(periods).length > 0 ? (
                                  <div className="flex flex-wrap gap-2">
                                    {Object.entries(periods).map(([period, slot]: [string, any]) => (
                                      <div 
                                        key={period}
                                        className={`px-3 py-2 rounded-md ${
                                          slot.duration > 1 ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'
                                        }`}
                                      >
                                        <div className="font-medium">Period {period}</div>
                                        <div className="text-sm">{getSubjectName(slot.subject)}</div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-gray-400">No classes</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-center py-8 text-gray-500">
                      You don't have any classes scheduled for this timetable.
                    </p>
                  )}
                </div>
              )}
              
              {/* Day View */}
              {selectedTimetable && viewMode === 'day' && (
                <div>
                  {/* Day Selector */}
                  <div className="mb-6 flex flex-wrap gap-2">
                    {workingDays.filter(day => selectedTimetable.schedule && selectedTimetable.schedule[day]).map(day => (
                      <button
                        key={day}
                        onClick={() => setSelectedDay(day)}
                        className={`px-3 py-1 text-sm rounded-md ${
                          selectedDay === day
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                  
                  {/* Day Schedule */}
                  {selectedTimetable.schedule && selectedTimetable.schedule[selectedDay] ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full border-collapse">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
                              Period
                            </th>
                            <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
                              Subject
                            </th>
                            <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
                              Type
                            </th>
                            <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
                              Class
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(selectedTimetable.schedule[selectedDay])
                            .filter(([_, slot]) => slot && (slot as any).faculty === currentUser?._id)
                            .map(([period, slot]) => {
                              const typedSlot = slot as any;
                              const subject = mySubjects.find(s => s._id === typedSlot.subject);
                              
                              return (
                                <tr key={period}>
                                  <td className="py-3 px-4 text-sm font-medium text-gray-900 border border-gray-200">
                                    Period {period}
                                    {typedSlot.duration > 1 && ` - ${parseInt(period) + typedSlot.duration - 1}`}
                                  </td>
                                  <td className="py-3 px-4 text-sm text-gray-900 border border-gray-200">
                                    {getSubjectName(typedSlot.subject)}
                                  </td>
                                  <td className="py-3 px-4 text-sm text-gray-500 border border-gray-200">
                                    {subject?.is_lab ? (
                                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                        Lab
                                      </span>
                                    ) : (
                                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                        Theory
                                      </span>
                                    )}
                                  </td>
                                  <td className="py-3 px-4 text-sm text-gray-500 border border-gray-200">
                                    {getClassName(selectedTimetable.class_id._id)}
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-center py-8 text-gray-500">
                      You don't have any classes scheduled for {selectedDay}.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FacultyDashboard;
