import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
// @ts-ignore
import { useAuth } from '../context/AuthContext.js';

const Navbar = () => {
  const { currentUser, logout, isAdmin, isFaculty } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setMobileMenuOpen(false);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const isActiveLink = (path) => {
    return location.pathname === path;
  };

  const getLinkClasses = (path, isMobile = false) => {
    const baseClasses = isMobile
      ? 'block px-6 py-4 text-base font-medium transition-all duration-300 border-l-4 border-transparent'
      : 'px-5 py-2.5 text-sm font-semibold rounded-xl transition-all duration-300 relative overflow-hidden';
    
    const activeClasses = isMobile
      ? 'text-purple-700 bg-gradient-to-r from-purple-50 to-blue-50 border-l-purple-500'
      : 'text-white bg-gradient-to-r from-purple-600 to-blue-600 shadow-lg transform scale-105';
    
    const inactiveClasses = isMobile
      ? 'text-gray-700 hover:text-purple-600 hover:bg-gray-50'
      : 'text-gray-700 hover:text-purple-600 hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50 hover:shadow-md transform hover:scale-105';

    return `${baseClasses} ${isActiveLink(path) ? activeClasses : inactiveClasses}`;
  };

  return (
    <>
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-lg border-b border-gray-200/50 shadow-lg z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-18">
            {/* Logo and brand - Left aligned */}
            <div className="flex items-center flex-shrink-0">
              <Link to="/" className="flex items-center space-x-3" onClick={closeMobileMenu}>
                <div className="relative flex items-center justify-center w-12 h-12 bg-gradient-to-tr from-purple-600 via-blue-600 to-cyan-600 rounded-2xl shadow-lg transform hover:scale-105 transition-transform duration-200">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full animate-pulse"></div>
                </div>
                <div className="hidden sm:block">
                  <div className="flex flex-col">
                    <span className="text-2xl font-extrabold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                      AI Timetable
                    </span>
                    <div className="text-xs font-medium text-gray-500 -mt-1 tracking-wider uppercase">
                      Smart Scheduler
                    </div>
                  </div>
                </div>
                <div className="sm:hidden">
                  <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                    AI Timetable
                  </span>
                </div>
              </Link>
            </div>

            {/* Desktop navigation */}
            <div className="hidden lg:flex items-center justify-center flex-1 space-x-2 ml-8">
              <Link to="/" className={getLinkClasses('/')}>
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  <span>Home</span>
                </div>
              </Link>

              {isAdmin && (
                <>
                  <Link to="/admin" className={getLinkClasses('/admin')}>
                    <div className="flex items-center space-x-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      <span>Dashboard</span>
                    </div>
                  </Link>
                  
                  {/* Dropdown for Admin Tools */}
                  <div className="relative group">
                    <button className="px-5 py-2.5 text-sm font-semibold rounded-xl transition-all duration-300 text-gray-700 hover:text-purple-600 hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50 hover:shadow-md transform hover:scale-105 flex items-center space-x-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                      </svg>
                      <span>Manage</span>
                      <svg className="w-3 h-3 transition-transform duration-200 group-hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    
                    <div className="absolute top-full left-0 mt-2 w-56 bg-white/90 backdrop-blur-lg rounded-2xl shadow-xl border border-gray-200/50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 z-50">
                      <div className="p-2">
                        <Link to="/admin/faculty" className="flex items-center space-x-3 px-4 py-3 text-sm font-medium text-gray-700 hover:text-purple-600 hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50 rounded-xl transition-all duration-200" onClick={closeMobileMenu}>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                          </svg>
                          <span>Faculty Management</span>
                        </Link>
                        <Link to="/admin/subjects" className="flex items-center space-x-3 px-4 py-3 text-sm font-medium text-gray-700 hover:text-purple-600 hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50 rounded-xl transition-all duration-200" onClick={closeMobileMenu}>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                          <span>Subject Management</span>
                        </Link>
                        <Link to="/admin/classes" className="flex items-center space-x-3 px-4 py-3 text-sm font-medium text-gray-700 hover:text-purple-600 hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50 rounded-xl transition-all duration-200" onClick={closeMobileMenu}>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          <span>Class Management</span>
                        </Link>
                        <Link to="/admin/timetables" className="flex items-center space-x-3 px-4 py-3 text-sm font-medium text-gray-700 hover:text-purple-600 hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50 rounded-xl transition-all duration-200" onClick={closeMobileMenu}>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span>Timetable Builder</span>
                        </Link>
                        <Link to="/admin/period-timing" className="flex items-center space-x-3 px-4 py-3 text-sm font-medium text-gray-700 hover:text-purple-600 hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50 rounded-xl transition-all duration-200" onClick={closeMobileMenu}>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>Period Timing</span>
                        </Link>
                        <div className="border-t border-gray-200/50 my-2"></div>
                        <Link to="/admin/academic-year" className="flex items-center space-x-3 px-4 py-3 text-sm font-medium text-gray-700 hover:text-purple-600 hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50 rounded-xl transition-all duration-200" onClick={closeMobileMenu}>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span>Academic Year Settings</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {isFaculty && (
                <Link to="/faculty" className={getLinkClasses('/faculty')}>
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <span>Dashboard</span>
                  </div>
                </Link>
              )}
            </div>

            {/* Desktop user menu */}
            <div className="hidden lg:flex items-center space-x-4 flex-shrink-0">
              {currentUser ? (
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-4 bg-white/70 backdrop-blur-sm rounded-2xl px-4 py-2 shadow-lg border border-gray-200/50">
                    <div className="relative">
                      <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-tr from-purple-500 via-blue-500 to-cyan-500 rounded-xl shadow-lg">
                        <span className="text-white text-sm font-bold">
                          {currentUser.name?.charAt(0)?.toUpperCase() || 'U'}
                        </span>
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                    </div>
                    <div className="hidden xl:block">
                      <div className="text-sm font-semibold text-gray-900">{currentUser.name}</div>
                      <div className="text-xs font-medium text-purple-600">
                        {isAdmin ? '👑 Administrator' : isFaculty ? '👨‍🏫 Faculty' : '👤 User'}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="inline-flex items-center px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-red-500 to-pink-600 rounded-xl hover:from-red-600 hover:to-pink-700 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-red-500 shadow-lg transform hover:scale-105"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Logout
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="inline-flex items-center px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 rounded-xl hover:from-purple-700 hover:via-blue-700 hover:to-cyan-700 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-lg transform hover:scale-105"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Sign In
                </Link>
              )}
            </div>

            {/* Mobile hamburger button */}
            <div className="lg:hidden flex items-center space-x-3 flex-shrink-0">
              {currentUser && (
                <div className="flex items-center justify-center w-9 h-9 bg-gradient-to-tr from-purple-500 via-blue-500 to-cyan-500 rounded-xl shadow-lg mr-2">
                  <span className="text-white text-sm font-bold">
                    {currentUser.name?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </div>
              )}
              <button
                onClick={toggleMobileMenu}
                className="inline-flex items-center justify-center p-3 rounded-xl text-gray-600 hover:text-purple-600 hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-sm"
                aria-expanded="false"
              >
                <span className="sr-only">Open main menu</span>
                {!mobileMenuOpen ? (
                  <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                  </svg>
                ) : (
                  <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <div className={`lg:hidden transition-all duration-500 ease-in-out ${mobileMenuOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
          <div className="bg-white/95 backdrop-blur-lg border-t border-gray-200/50 shadow-2xl">
            <div className="px-4 pt-4 pb-3 space-y-2">
              <Link 
                to="/" 
                className={getLinkClasses('/', true)}
                onClick={closeMobileMenu}
              >
                <div className="flex items-center space-x-4">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  <span>Home</span>
                </div>
              </Link>

              {isAdmin && (
                <>
                  <Link 
                    to="/admin" 
                    className={getLinkClasses('/admin', true)}
                    onClick={closeMobileMenu}
                  >
                    <div className="flex items-center space-x-4">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      <span>Admin Dashboard</span>
                    </div>
                  </Link>
                  
                  <div className="ml-6 space-y-1">
                    <Link 
                      to="/admin/faculty" 
                      className="block px-6 py-3 text-sm font-medium text-gray-600 hover:text-purple-600 hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50 transition-all duration-300 rounded-xl"
                      onClick={closeMobileMenu}
                    >
                      <div className="flex items-center space-x-3">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                        </svg>
                        <span>Faculty Management</span>
                      </div>
                    </Link>
                    <Link 
                      to="/admin/subjects" 
                      className="block px-6 py-3 text-sm font-medium text-gray-600 hover:text-purple-600 hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50 transition-all duration-300 rounded-xl"
                      onClick={closeMobileMenu}
                    >
                      <div className="flex items-center space-x-3">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                        <span>Subject Management</span>
                      </div>
                    </Link>
                    <Link 
                      to="/admin/classes" 
                      className="block px-6 py-3 text-sm font-medium text-gray-600 hover:text-purple-600 hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50 transition-all duration-300 rounded-xl"
                      onClick={closeMobileMenu}
                    >
                      <div className="flex items-center space-x-3">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        <span>Class Management</span>
                      </div>
                    </Link>
                    <Link 
                      to="/admin/timetables" 
                      className="block px-6 py-3 text-sm font-medium text-gray-600 hover:text-purple-600 hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50 transition-all duration-300 rounded-xl"
                      onClick={closeMobileMenu}
                    >
                      <div className="flex items-center space-x-3">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>Timetable Builder</span>
                      </div>
                    </Link>
                    <Link 
                      to="/admin/period-timing" 
                      className="block px-6 py-3 text-sm font-medium text-gray-600 hover:text-purple-600 hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50 transition-all duration-300 rounded-xl"
                      onClick={closeMobileMenu}
                    >
                      <div className="flex items-center space-x-3">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Period Timing</span>
                      </div>
                    </Link>
                    <div className="border-t border-gray-200/50 my-2 mx-6"></div>
                    <Link 
                      to="/admin/academic-year" 
                      className="block px-6 py-3 text-sm font-medium text-gray-600 hover:text-purple-600 hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50 transition-all duration-300 rounded-xl"
                      onClick={closeMobileMenu}
                    >
                      <div className="flex items-center space-x-3">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>Academic Year Settings</span>
                      </div>
                    </Link>
                  </div>
                </>
              )}

              {isFaculty && (
                <Link 
                  to="/faculty" 
                  className={getLinkClasses('/faculty', true)}
                  onClick={closeMobileMenu}
                >
                  <div className="flex items-center space-x-4">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <span>Faculty Dashboard</span>
                  </div>
                </Link>
              )}
            </div>

            {/* Mobile user section */}
            <div className="pt-6 pb-4 border-t border-gray-200/50">
              {currentUser ? (
                <div className="px-4">
                  <div className="flex items-center space-x-4 mb-4 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl">
                    <div className="relative">
                      <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-tr from-purple-500 via-blue-500 to-cyan-500 rounded-xl shadow-lg">
                        <span className="text-white font-bold text-lg">
                          {currentUser.name?.charAt(0)?.toUpperCase() || 'U'}
                        </span>
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                    </div>
                    <div>
                      <div className="text-base font-bold text-gray-900">{currentUser.name}</div>
                      <div className="text-sm font-medium text-purple-600">
                        {isAdmin ? '👑 Administrator' : isFaculty ? '👨‍🏫 Faculty' : '👤 User'}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center px-6 py-4 text-base font-semibold text-white bg-gradient-to-r from-red-500 to-pink-600 rounded-xl hover:from-red-600 hover:to-pink-700 transition-all duration-300 shadow-lg"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Sign Out
                  </button>
                </div>
              ) : (
                <div className="px-4">
                  <Link
                    to="/login"
                    className="w-full flex items-center justify-center px-6 py-4 text-base font-semibold text-white bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 rounded-xl hover:from-purple-700 hover:via-blue-700 hover:to-cyan-700 transition-all duration-300 shadow-lg"
                    onClick={closeMobileMenu}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Sign In
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Spacer for fixed navbar */}
      <div className="h-18"></div>
    </>
  );
};

export default Navbar;