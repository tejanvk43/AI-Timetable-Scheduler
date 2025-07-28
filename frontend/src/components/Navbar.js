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
  };

  return (
    <nav className="fixed top-0 w-full bg-indigo-600 text-white shadow-md z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and brand */}
          <div className="flex-shrink-0">
            <Link to="/" className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-xl font-bold">AI Timetable</span>
            </Link>
          </div>

          {/* Desktop navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-center space-x-4">
              <Link 
                to="/" 
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  location.pathname === '/' 
                    ? 'bg-indigo-700' 
                    : 'hover:bg-indigo-500'
                }`}
              >
                Home
              </Link>

              {isAdmin && (
                <>
                  <Link 
                    to="/admin" 
                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                      location.pathname === '/admin' 
                        ? 'bg-indigo-700' 
                        : 'hover:bg-indigo-500'
                    }`}
                  >
                    Dashboard
                  </Link>
                  <Link 
                    to="/admin/faculty" 
                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                      location.pathname === '/admin/faculty' 
                        ? 'bg-indigo-700' 
                        : 'hover:bg-indigo-500'
                    }`}
                  >
                    Faculty
                  </Link>
                  <Link 
                    to="/admin/subjects" 
                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                      location.pathname === '/admin/subjects' 
                        ? 'bg-indigo-700' 
                        : 'hover:bg-indigo-500'
                    }`}
                  >
                    Subjects
                  </Link>
                  <Link 
                    to="/admin/classes" 
                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                      location.pathname === '/admin/classes' 
                        ? 'bg-indigo-700' 
                        : 'hover:bg-indigo-500'
                    }`}
                  >
                    Classes
                  </Link>
                  <Link 
                    to="/admin/timetables" 
                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                      location.pathname === '/admin/timetables' 
                        ? 'bg-indigo-700' 
                        : 'hover:bg-indigo-500'
                    }`}
                  >
                    Timetables
                  </Link>
                  <Link 
                    to="/admin/generate" 
                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                      location.pathname === '/admin/generate' 
                        ? 'bg-indigo-700' 
                        : 'hover:bg-indigo-500'
                    }`}
                  >
                    Generate AI
                  </Link>
                  <Link 
                    to="/admin/canvas" 
                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                      location.pathname === '/admin/canvas' 
                        ? 'bg-indigo-700' 
                        : 'hover:bg-indigo-500'
                    }`}
                  >
                    Canvas
                  </Link>
                </>
              )}

              {isFaculty && (
                <Link 
                  to="/faculty" 
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    location.pathname === '/faculty' 
                      ? 'bg-indigo-700' 
                      : 'hover:bg-indigo-500'
                  }`}
                >
                  Dashboard
                </Link>
              )}
            </div>
          </div>

          {/* User menu */}
          <div className="hidden md:block">
            <div className="ml-4 flex items-center md:ml-6">
              {currentUser ? (
                <div className="relative ml-3">
                  <div className="flex items-center">
                    <span className="mr-4">{currentUser.name}</span>
                    <button
                      onClick={handleLogout}
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-700 hover:bg-indigo-800 focus:outline-none"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Logout
                    </button>
                  </div>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-700 hover:bg-indigo-800 focus:outline-none"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Login
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
