import React, { useState, useEffect } from 'react';
import { timetables, classes, users } from '../../utils/api';
// @ts-ignore
import { useAuth } from '../../context/AuthContext.js';

const AdminDashboard: React.FC = () => {
  const { currentUser, isAuthenticated, loading: authLoading } = useAuth();
  const [stats, setStats] = useState({
    facultyCount: 0,
    classesCount: 0,
    subjectsCount: 0,
    timetablesCount: 0,
  });
  const [recentTimetables, setRecentTimetables] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      // Don't fetch data if not authenticated or still loading auth
      if (authLoading || !isAuthenticated || !currentUser) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Fetch timetables
        const timetablesRes = await timetables.getAll();
        
        // Fetch classes
        const classesRes = await classes.getAll();
        
        // Fetch faculty
        const facultyRes = await users.getFaculty();
        
        // Calculate stats
        setStats({
          facultyCount: facultyRes.data.count || 0,
          classesCount: classesRes.data.count || 0,
          subjectsCount: 0, // This will be updated in the next API call
          timetablesCount: timetablesRes.data.count || 0,
        });
        
        // Sort timetables by last_generated (most recent first)
        const sortedTimetables = [...timetablesRes.data.data].sort((a, b) => {
          // If last_generated is null, put it at the end
          if (!a.last_generated) return 1;
          if (!b.last_generated) return -1;
          
          return new Date(b.last_generated).getTime() - new Date(a.last_generated).getTime();
        });
        
        // Get only the most recent 5
        setRecentTimetables(sortedTimetables.slice(0, 5));
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try again later.');
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [authLoading, isAuthenticated, currentUser]);

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not generated yet';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
      
      {/* Show loading if auth is still loading */}
      {authLoading ? (
        <div className="flex justify-center my-12">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : !isAuthenticated ? (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-8" role="alert">
          <p>Please login to access the admin dashboard.</p>
        </div>
      ) : loading ? (
        <div className="flex justify-center my-12">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : error ? (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-8" role="alert">
          <p>{error}</p>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <h2 className="text-lg font-medium text-gray-600">Faculty Members</h2>
              <p className="text-3xl font-bold text-indigo-600 mt-2">{stats.facultyCount}</p>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <h2 className="text-lg font-medium text-gray-600">Classes</h2>
              <p className="text-3xl font-bold text-indigo-600 mt-2">{stats.classesCount}</p>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <h2 className="text-lg font-medium text-gray-600">Timetables</h2>
              <p className="text-3xl font-bold text-indigo-600 mt-2">{stats.timetablesCount}</p>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <h2 className="text-lg font-medium text-gray-600">Current Academic Year</h2>
              <p className="text-2xl font-bold text-indigo-600 mt-2">
                {recentTimetables[0]?.academic_year || "Not set"}
              </p>
            </div>
          </div>
          
          {/* Recent Timetables */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Recent Timetables</h2>
            
            {recentTimetables.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Class
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Academic Year
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Last Generated
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {recentTimetables.map((timetable) => (
                      <tr key={timetable._id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {timetable.class_id?.name || "Unknown Class"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {timetable.academic_year}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(timetable.last_generated)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            timetable.last_generated 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {timetable.last_generated ? 'Generated' : 'Not Generated'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 py-4">No timetables have been generated yet.</p>
            )}
          </div>
          
          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <a 
                href="/admin/generate-timetable"
                className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-md text-center"
              >
                Generate Timetable
              </a>
              
              <a 
                href="/admin/manage-faculty"
                className="inline-block bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md text-center"
              >
                Manage Faculty
              </a>
              
              <a 
                href="/admin/manage-subjects"
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md text-center"
              >
                Manage Subjects
              </a>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminDashboard;
