import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
// @ts-ignore
import { useAuth } from '../context/AuthContext.js';

const Navbar: React.FC = () => {
  const { currentUser, logout, isAdmin, isFaculty } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [manageDropdownOpen, setManageDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setMobileMenuOpen(false);
  };

  const isActive = (path: string) => location.pathname === path;
  const isActiveGroup = (paths: string[]) => paths.some(p => location.pathname.startsWith(p));

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setManageDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <nav className="fixed top-0 w-full bg-white border-b border-slate-200 shadow-sm z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl shadow-md">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="hidden sm:block">
              <span className="text-xl font-bold text-slate-800">TimeTable</span>
              <span className="text-xl font-bold text-primary-600">AI</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {currentUser && isAdmin && (
              <>
                <Link
                  to="/admin"
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                    isActive('/admin')
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Dashboard
                </Link>

                <Link
                  to="/admin/generate"
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                    isActive('/admin/generate')
                      ? 'bg-primary-600 text-white shadow-md'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span className="flex items-center space-x-1.5">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span>Generate</span>
                  </span>
                </Link>

                {/* Manage Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setManageDropdownOpen(!manageDropdownOpen)}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center space-x-1 ${
                      isActiveGroup(['/admin/faculty', '/admin/subjects', '/admin/classes', '/admin/timetables'])
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span>Manage</span>
                    <svg className={`w-4 h-4 transition-transform ${manageDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {manageDropdownOpen && (
                    <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-200 py-2 animate-fade-in">
                      <Link
                        to="/admin/classes"
                        onClick={() => setManageDropdownOpen(false)}
                        className="flex items-center px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                      >
                        <svg className="w-5 h-5 mr-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        Classes
                      </Link>
                      <Link
                        to="/admin/subjects"
                        onClick={() => setManageDropdownOpen(false)}
                        className="flex items-center px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                      >
                        <svg className="w-5 h-5 mr-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                        Subjects
                      </Link>
                      <Link
                        to="/admin/faculty"
                        onClick={() => setManageDropdownOpen(false)}
                        className="flex items-center px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                      >
                        <svg className="w-5 h-5 mr-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        Faculty
                      </Link>
                      <div className="border-t border-slate-100 my-2"></div>
                      <Link
                        to="/admin/timetables"
                        onClick={() => setManageDropdownOpen(false)}
                        className="flex items-center px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                      >
                        <svg className="w-5 h-5 mr-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        Timetable Structures
                      </Link>
                      <Link
                        to="/admin/academic-year"
                        onClick={() => setManageDropdownOpen(false)}
                        className="flex items-center px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                      >
                        <svg className="w-5 h-5 mr-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Academic Year
                      </Link>
                    </div>
                  )}
                </div>
              </>
            )}

            {currentUser && isFaculty && (
              <Link
                to="/faculty"
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                  isActive('/faculty')
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                My Timetable
              </Link>
            )}
          </div>

          {/* Right side - User menu */}
          <div className="flex items-center space-x-4">
            {currentUser ? (
              <div className="flex items-center space-x-3">
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-medium text-slate-700">{currentUser.name}</p>
                  <p className="text-xs text-slate-500 capitalize">{currentUser.role}</p>
                </div>
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-semibold text-primary-700">
                    {currentUser.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-error-600 hover:bg-error-50 rounded-lg transition-all"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="btn btn-primary"
              >
                Sign In
              </Link>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-slate-200 animate-fade-in">
          <div className="px-4 py-4 space-y-2">
            {currentUser && isAdmin && (
              <>
                <Link
                  to="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-lg"
                >
                  Dashboard
                </Link>
                <Link
                  to="/admin/generate"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-3 text-sm font-medium bg-primary-600 text-white rounded-lg"
                >
                  Generate Timetable
                </Link>
                <Link
                  to="/admin/classes"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-lg"
                >
                  Manage Classes
                </Link>
                <Link
                  to="/admin/subjects"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-lg"
                >
                  Manage Subjects
                </Link>
                <Link
                  to="/admin/faculty"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-lg"
                >
                  Manage Faculty
                </Link>
                <Link
                  to="/admin/timetables"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-lg"
                >
                  Timetable Structures
                </Link>
              </>
            )}
            {currentUser && isFaculty && (
              <Link
                to="/faculty"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-lg"
              >
                My Timetable
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
