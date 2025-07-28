import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
// @ts-ignore
import { useAuth } from '../context/AuthContext.js';
import { classes, timetables } from '../utils/api';

const Home: React.FC = () => {
  const { isAuthenticated, isAdmin, isFaculty, isStudent, currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [allClasses, setAllClasses] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [timetableData, setTimetableData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Redirect authenticated users to their respective dashboards on initial load
  useEffect(() => {
    if (isAuthenticated && currentUser) {
      if (isAdmin) {
        navigate('/admin');
      } else if (isFaculty) {
        navigate('/faculty');
      } else if (isStudent) {
        navigate('/student');
      }
    }
  }, [isAuthenticated, currentUser, isAdmin, isFaculty, isStudent, navigate]);

  // Fetch all classes on component mount
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const response = await classes.getAll();
        setAllClasses(response.data.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to load classes. Please try again later.');
        setLoading(false);
      }
    };

    fetchClasses();
  }, []);

  // Fetch timetable when a class is selected
  useEffect(() => {
    if (!selectedClass) return;

    const fetchTimetable = async () => {
      try {
        setLoading(true);
        const response = await timetables.getByClass(selectedClass);
        setTimetableData(response.data.data[0]); // Get first timetable
        setError(null);
      } catch (err) {
        setError('No timetable found for this class or an error occurred.');
        setTimetableData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchTimetable();
  }, [selectedClass]);

  // Handle class selection
  const handleClassChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedClass(e.target.value);
  };

  return (
    <div>
      {/* Hero Section */}
      {!selectedClass && (
        <div className="relative bg-gradient-to-r from-indigo-600 to-blue-500 py-28 text-white">
          <div className="container mx-auto px-4">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              AI-Powered Timetable Scheduler
            </h1>
            <p className="text-xl md:text-2xl max-w-2xl mb-8">
              Efficiently create and manage academic timetables with our intelligent scheduling system.
            </p>
            {!isAuthenticated && (
              <div className="flex flex-wrap gap-4">
                <Link
                  to="/login"
                  className="bg-white text-indigo-600 hover:bg-gray-100 px-6 py-3 rounded-md font-medium text-base shadow-md transition-colors"
                >
                  Login to Access
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-center mb-8">
          {selectedClass ? 'Class Timetable' : 'Public Timetable Viewer'}
        </h1>

        {/* Class Selection Dropdown */}
        <div className="mb-8">
          <label htmlFor="class-select" className="block text-lg font-medium text-gray-700 mb-2">
            Select Class/Year & Branch
          </label>
          <select
            id="class-select"
            value={selectedClass}
            onChange={handleClassChange}
            className="w-full md:w-1/2 p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">-- Select a Class --</option>
            {allClasses.map((classItem) => (
              <option key={classItem._id} value={classItem._id}>
                {classItem.name} {classItem.section ? `(${classItem.section})` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center my-8">
            <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        {/* Error Message */}
        {error && !loading && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-8" role="alert">
            <p>{error}</p>
          </div>
        )}

        {/* Timetable Display */}
        {timetableData && !loading && (
          <div>
            {/* Class Information */}
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
              <h2 className="text-2xl font-bold mb-2">
                {timetableData.class_id?.name} {timetableData.class_id?.section}
              </h2>
              <p><strong>Class Teacher:</strong> {timetableData.class_id?.class_teacher_id?.name || 'Not Assigned'}</p>
            </div>
            
            {/* Timetable Grid */}
            <div className="overflow-x-auto mb-8">
              <table className="min-w-full bg-white border border-gray-300">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="py-3 px-4 border text-center">Day / Period</th>
                    {Array.from({ length: timetableData.periods_per_day || 7 }, (_, i) => (
                      <th key={i} className="py-3 px-4 border text-center">
                        Period {i + 1}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(timetableData.schedule || {}).map(([day, periods]: [string, any]) => (
                    <tr key={day}>
                      <td className="py-3 px-4 border font-medium text-left capitalize">
                        {day}
                      </td>
                      {Array.from({ length: timetableData.periods_per_day || 7 }, (_, i) => {
                        const periodNum = i + 1;
                        const slot = periods?.[periodNum];
                        
                        return (
                          <td 
                            key={i}
                            className="py-3 px-4 border"
                          >
                            {slot ? (
                              <div>
                                <div className="font-medium">{slot.subject_name || 'Unknown'}</div>
                                <div className="text-sm text-gray-600">{slot.faculty_name || 'TBA'}</div>
                              </div>
                            ) : (
                              <div className="text-gray-400">Free</div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Features Section */}
        {!selectedClass && (
          <div className="mt-16">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">Key Features</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Our intelligent scheduling system makes academic timetable creation simple, efficient, and conflict-free.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="bg-indigo-100 p-3 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">AI-Powered Generation</h3>
                <p className="text-gray-600">
                  Automatically create optimal timetables based on your requirements and constraints without conflicts.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="bg-indigo-100 p-3 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Customizable Constraints</h3>
                <p className="text-gray-600">
                  Define specific scheduling rules like avoiding back-to-back labs or distributing subjects evenly.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="bg-indigo-100 p-3 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Role-Based Access</h3>
                <p className="text-gray-600">
                  Specialized dashboards for administrators, faculty, and students with appropriate permissions.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8 mt-16">
        <div className="container mx-auto px-4 text-center">
          <p>&copy; {new Date().getFullYear()} AI Timetable Scheduler. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
