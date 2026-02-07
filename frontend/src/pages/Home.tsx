import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
// @ts-ignore
import { useAuth } from '../context/AuthContext.js';
import { classes, timetables } from '../utils/api';

const Home: React.FC = () => {
  const { isAuthenticated, isAdmin, isFaculty, currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [allClasses, setAllClasses] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [timetableData, setTimetableData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<'landing' | 'viewer'>('landing');

  // Redirect authenticated users to their dashboards
  useEffect(() => {
    if (isAuthenticated && currentUser) {
      if (isAdmin) {
        navigate('/admin');
      } else if (isFaculty) {
        navigate('/faculty');
      }
    }
  }, [isAuthenticated, currentUser, isAdmin, isFaculty, navigate]);

  // Fetch all classes
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const response = await classes.getAll();
        setAllClasses(response.data.data || []);
      } catch (err) {
        console.error('Failed to load classes');
      } finally {
        setLoading(false);
      }
    };
    fetchClasses();
  }, []);

  // Fetch timetable when class is selected
  useEffect(() => {
    if (!selectedClass) {
      setTimetableData(null);
      return;
    }

    const fetchTimetable = async () => {
      try {
        setLoading(true);
        const response = await timetables.getByClass(selectedClass);
        // API returns { message: '...', data: timetable }
        const data = response.data?.data;
        if (data && data.schedule) {
          setTimetableData(data);
        } else {
          setTimetableData(null);
        }
      } catch (err) {
        console.error('Error fetching timetable:', err);
        setTimetableData(null);
      } finally {
        setLoading(false);
      }
    };
    fetchTimetable();
  }, [selectedClass]);

  const features = [
    {
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      title: 'AI-Powered Generation',
      description: 'Smart algorithms create conflict-free schedules automatically'
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: 'Time Optimization',
      description: 'Efficient scheduling minimizes gaps and maximizes productivity'
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      title: 'Faculty Management',
      description: 'Track availability and prevent double-bookings'
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      title: 'Reports & Export',
      description: 'Generate printable timetables and analytics'
    }
  ];

  // Landing page view
  if (viewMode === 'landing' && !selectedClass) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-primary-50">
        {/* Hero Section */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-600 to-primary-800"></div>
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}></div>
          </div>
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
            <div className="text-center">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
                AI Timetable
                <span className="block text-primary-200">Scheduler</span>
              </h1>
              <p className="text-xl text-primary-100 max-w-2xl mx-auto mb-10">
                Create intelligent, conflict-free academic schedules in minutes. 
                Powered by smart algorithms for optimal resource allocation.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/login"
                  className="btn bg-white text-primary-700 hover:bg-primary-50 px-8 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  Admin Login
                </Link>
                <button
                  onClick={() => setViewMode('viewer')}
                  className="btn bg-primary-500/30 text-white border-2 border-white/30 hover:bg-primary-500/50 px-8 py-3 text-lg font-semibold"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  View Timetables
                </button>
              </div>
            </div>
          </div>
          
          {/* Wave divider */}
          <div className="absolute bottom-0 left-0 right-0">
            <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="white" fillOpacity="0.1"/>
              <path d="M0 120L60 115C120 110 240 100 360 95C480 90 600 90 720 92.5C840 95 960 100 1080 100C1200 100 1320 95 1380 92.5L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" className="fill-slate-50"/>
            </svg>
          </div>
        </div>

        {/* Features Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-800 mb-4">Powerful Features</h2>
            <p className="text-slate-500 max-w-2xl mx-auto">
              Everything you need to create and manage academic timetables efficiently
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="card p-6 text-center hover:shadow-lg transition-shadow">
                <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-primary-600">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">{feature.title}</h3>
                <p className="text-slate-500 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Stats Section */}
        <div className="bg-slate-800 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div>
                <p className="text-4xl font-bold text-white mb-2">{allClasses.length}</p>
                <p className="text-slate-400">Classes</p>
              </div>
              <div>
                <p className="text-4xl font-bold text-white mb-2">6</p>
                <p className="text-slate-400">Days/Week</p>
              </div>
              <div>
                <p className="text-4xl font-bold text-white mb-2">8</p>
                <p className="text-slate-400">Periods/Day</p>
              </div>
              <div>
                <p className="text-4xl font-bold text-white mb-2">100%</p>
                <p className="text-slate-400">Conflict Free</p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="card bg-gradient-to-r from-primary-600 to-primary-700 p-12 text-center text-white">
            <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-primary-100 max-w-2xl mx-auto mb-8">
              Login as admin to start creating intelligent timetables for your institution
            </p>
            <Link to="/login" className="btn bg-white text-primary-700 hover:bg-primary-50 px-8 py-3 text-lg font-semibold">
              Get Started Now
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Timetable viewer
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <button
              onClick={() => {
                setViewMode('landing');
                setSelectedClass('');
              }}
              className="text-primary-600 hover:text-primary-700 text-sm font-medium mb-2 flex items-center"
            >
              <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Home
            </button>
            <h1 className="text-2xl font-bold text-slate-800">Public Timetable Viewer</h1>
            <p className="text-slate-500">Select a class to view its schedule</p>
          </div>
          
          <Link to="/login" className="btn btn-primary">
            Admin Login
          </Link>
        </div>

        {/* Class Selector */}
        <div className="card p-6 mb-8">
          <label className="form-label">Select Class</label>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="form-select max-w-md"
          >
            <option value="">-- Choose a Class --</option>
            {allClasses.map((cls) => (
              <option key={cls._id} value={cls._id}>
                {cls.name} {cls.section ? `(Section ${cls.section})` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-slate-600">Loading...</p>
          </div>
        )}

        {/* No timetable */}
        {!loading && selectedClass && !timetableData && (
          <div className="card p-12 text-center">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">No Timetable Found</h3>
            <p className="text-slate-500">This class doesn't have a generated timetable yet.</p>
          </div>
        )}

        {/* Timetable Display */}
        {!loading && timetableData && timetableData.schedule && (
          <div className="bg-white rounded-lg shadow-md border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
              <h2 className="text-xl font-semibold">
                {timetableData.class_id?.name || 'Class'} - {timetableData.academic_year || 'Timetable'}
              </h2>
            </div>
            <div className="p-6 overflow-x-auto">
              <table className="min-w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700">Day</th>
                    {Array.from({ length: timetableData.periods_per_day || 6 }, (_, i) => {
                      const periodNum = i + 1;
                      const timing = timetableData.period_timings?.[i];
                      return (
                        <th key={i} className="border border-gray-300 px-3 py-3 text-center font-semibold text-gray-700">
                          <div>Period {periodNum}</div>
                          {timing && !timing.is_break && (
                            <div className="text-xs text-gray-500 font-normal mt-1">
                              {timing.start_time} - {timing.end_time}
                            </div>
                          )}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].map(day => {
                    const daySchedule = timetableData.schedule[day] || [];
                    return (
                      <tr key={day} className="hover:bg-gray-50">
                        <td className="border border-gray-300 px-4 py-3 font-medium bg-gray-50 text-gray-900 capitalize">
                          {day}
                        </td>
                        {Array.from({ length: timetableData.periods_per_day || 6 }, (_, i) => {
                          const periodNum = i + 1;
                          const entry = daySchedule.find((e: any) => e.period === periodNum);
                          const isLab = entry?.is_lab || entry?.subject_details?.is_lab;
                          
                          return (
                            <td
                              key={i}
                              className={`border border-gray-300 px-3 py-4 text-center min-w-[150px] ${
                                isLab
                                  ? 'bg-purple-50'
                                  : entry
                                  ? 'bg-blue-50'
                                  : 'bg-white'
                              }`}
                            >
                              {entry ? (
                                <div className="space-y-1">
                                  <div className={`font-semibold text-sm ${
                                    isLab ? 'text-purple-800' : 'text-blue-800'
                                  }`}>
                                    {entry.subject_details?.name || entry.subject_id?.name || 'Subject'}
                                  </div>
                                  <div className="text-xs text-gray-600 font-medium">
                                    {entry.faculty_details?.name || entry.faculty_id?.name || 'Faculty'}
                                  </div>
                                  {isLab && (
                                    <span className="inline-block mt-1 px-2 py-0.5 bg-purple-200 text-purple-800 text-xs rounded">
                                      Lab
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-gray-300">-</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              
              {/* Legend */}
              <div className="mt-4 flex items-center space-x-4 text-sm text-gray-600">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-blue-50 border border-blue-200 mr-2"></div>
                  <span>Theory Class</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-purple-50 border border-purple-200 mr-2"></div>
                  <span>Lab Session</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Empty state for no class selected */}
        {!loading && !selectedClass && (
          <div className="card p-12 text-center">
            <div className="w-20 h-20 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Select a Class</h3>
            <p className="text-slate-500">Choose a class from the dropdown above to view its timetable</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
