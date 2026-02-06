import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { timetables, classes, users, subjects } from '../../utils/api';
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

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (authLoading || !isAuthenticated || !currentUser) {
        setLoading(false);
        return;
      }

      try {
        const [timetablesRes, classesRes, facultyRes, subjectsRes] = await Promise.all([
          timetables.getAll(),
          classes.getAll(),
          users.getFaculty(),
          subjects.getAll()
        ]);

        setStats({
          facultyCount: facultyRes.data.count || facultyRes.data.data?.length || 0,
          classesCount: classesRes.data.count || classesRes.data.data?.length || 0,
          subjectsCount: subjectsRes.data.count || subjectsRes.data.data?.length || 0,
          timetablesCount: timetablesRes.data.count || timetablesRes.data.data?.length || 0,
        });

        setRecentTimetables(timetablesRes.data.data?.slice(0, 5) || []);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [authLoading, isAuthenticated, currentUser]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const quickActions = [
    {
      title: 'Generate Timetable',
      description: 'Create a new AI-powered timetable',
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      link: '/admin/generate',
      color: 'bg-gradient-to-br from-primary-500 to-primary-700',
      primary: true
    },
    {
      title: 'Add Class',
      description: 'Create new class/section',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      link: '/admin/classes',
      color: 'text-primary-600'
    },
    {
      title: 'Add Subject',
      description: 'Define new course',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      link: '/admin/subjects',
      color: 'text-success-600'
    },
    {
      title: 'Add Faculty',
      description: 'Register new teacher',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
        </svg>
      ),
      link: '/admin/faculty',
      color: 'text-warning-600'
    }
  ];

  const statCards = [
    { label: 'Classes', value: stats.classesCount, icon: '🏫', color: 'bg-blue-50 text-blue-700' },
    { label: 'Subjects', value: stats.subjectsCount, icon: '📚', color: 'bg-green-50 text-green-700' },
    { label: 'Faculty', value: stats.facultyCount, icon: '👨‍🏫', color: 'bg-purple-50 text-purple-700' },
    { label: 'Timetables', value: stats.timetablesCount, icon: '📅', color: 'bg-orange-50 text-orange-700' },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-800">
            Welcome back, {currentUser?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-slate-500 mt-1">Here's what's happening with your timetables</p>
        </div>

        {/* Quick Setup Guide - Show when no data */}
        {stats.classesCount === 0 && stats.subjectsCount === 0 && (
          <div className="card mb-8 border-2 border-dashed border-primary-200 bg-primary-50/50">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-primary-800 mb-4 flex items-center">
                <span className="mr-2">🚀</span> Quick Setup Guide
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                  { step: 1, title: 'Add Classes', desc: 'Create your class sections', link: '/admin/classes' },
                  { step: 2, title: 'Add Subjects', desc: 'Define courses to teach', link: '/admin/subjects' },
                  { step: 3, title: 'Add Faculty', desc: 'Register teachers', link: '/admin/faculty' },
                  { step: 4, title: 'Generate', desc: 'Create AI timetable', link: '/admin/generate' },
                ].map((item) => (
                  <Link 
                    key={item.step} 
                    to={item.link}
                    className="flex items-start p-4 bg-white rounded-lg border border-primary-100 hover:border-primary-300 hover:shadow-md transition-all"
                  >
                    <div className="step-indicator step-pending mr-3 flex-shrink-0 w-8 h-8 text-sm">
                      {item.step}
                    </div>
                    <div>
                      <h3 className="font-medium text-slate-800">{item.title}</h3>
                      <p className="text-xs text-slate-500">{item.desc}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map((stat) => (
            <div key={stat.label} className="card">
              <div className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                    <p className="text-3xl font-bold text-slate-800 mt-1">{stat.value}</p>
                  </div>
                  <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center text-2xl`}>
                    {stat.icon}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action) => (
              <Link
                key={action.title}
                to={action.link}
                className={`card hover:shadow-lg transition-all ${
                  action.primary 
                    ? 'bg-gradient-to-br from-primary-600 to-primary-700 text-white' 
                    : 'hover:border-primary-200'
                }`}
              >
                <div className="p-5">
                  <div className={`${action.primary ? 'text-white' : action.color} mb-3`}>
                    {action.icon}
                  </div>
                  <h3 className={`font-semibold ${action.primary ? 'text-white' : 'text-slate-800'}`}>
                    {action.title}
                  </h3>
                  <p className={`text-sm mt-1 ${action.primary ? 'text-primary-100' : 'text-slate-500'}`}>
                    {action.description}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Timetables & Workflow */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Timetables */}
          <div className="card">
            <div className="card-header flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-800">Recent Timetables</h2>
              <Link to="/admin/timetables" className="text-sm text-primary-600 hover:text-primary-700">
                View all →
              </Link>
            </div>
            <div className="card-body">
              {recentTimetables.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-slate-500">No timetables yet</p>
                  <Link to="/admin/generate" className="text-primary-600 text-sm hover:underline">
                    Generate your first timetable →
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentTimetables.map((tt) => (
                    <div key={tt._id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div>
                        <p className="font-medium text-slate-800">
                          {tt.class_id?.name || 'Unknown Class'}
                        </p>
                        <p className="text-sm text-slate-500">{tt.academic_year}</p>
                      </div>
                      <span className={`badge ${tt.last_generated ? 'badge-success' : 'badge-warning'}`}>
                        {tt.last_generated ? 'Generated' : 'Pending'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Workflow Guide */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold text-slate-800">How It Works</h2>
            </div>
            <div className="card-body">
              <div className="space-y-4">
                {[
                  { step: 1, title: 'Setup Data', desc: 'Add classes, subjects, and faculty members', done: stats.classesCount > 0 && stats.subjectsCount > 0 },
                  { step: 2, title: 'Create Structure', desc: 'Define timetable structure with period timings', done: stats.timetablesCount > 0 },
                  { step: 3, title: 'Assign Faculty', desc: 'Map faculty to subjects they will teach', done: stats.facultyCount > 0 },
                  { step: 4, title: 'Generate', desc: 'Let AI create optimized timetable', done: recentTimetables.some(t => t.last_generated) },
                ].map((item, index) => (
                  <div key={item.step} className="flex items-start">
                    <div className={`step-indicator flex-shrink-0 mr-4 ${
                      item.done ? 'step-completed' : 'step-pending'
                    }`}>
                      {item.done ? (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        item.step
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className={`font-medium ${item.done ? 'text-slate-400' : 'text-slate-800'}`}>
                        {item.title}
                      </h3>
                      <p className="text-sm text-slate-500">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
