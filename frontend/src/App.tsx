import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// Context
// @ts-ignore
import { AuthProvider } from './context/AuthContext.js';

// Components
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageFaculty from './pages/admin/ManageFaculty';
import ManageSubjects from './pages/admin/ManageSubjects';
import ManageClasses from './pages/admin/ManageClasses';
import ManageTimetables from './pages/admin/ManageTimetables';
import GenerateTimetable from './pages/admin/GenerateTimetable';
import TimetableCanvas from './pages/admin/TimetableCanvas';
import PeriodTimingCanvas from './pages/admin/PeriodTimingCanvas';
import AcademicYearSettings from './pages/admin/AcademicYearSettings';

// Faculty Pages
import FacultyDashboard from './pages/faculty/FacultyDashboard';
  
function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-100">
          <Navbar />
          <div className="pt-16">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />

              {/* Admin Routes */}
              <Route path="/admin" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              } />
              <Route path="/admin/faculty" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <ManageFaculty />
                </ProtectedRoute>
              } />
              <Route path="/admin/subjects" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <ManageSubjects />
                </ProtectedRoute>
              } />
              <Route path="/admin/classes" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <ManageClasses />
                </ProtectedRoute>
              } />
              <Route path="/admin/timetables" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <ManageTimetables />
                </ProtectedRoute>
              } />
              <Route path="/admin/generate" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <GenerateTimetable />
                </ProtectedRoute>
              } />
              <Route path="/admin/canvas" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <TimetableCanvas />
                </ProtectedRoute>
              } />
              <Route path="/admin/period-timing" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <PeriodTimingCanvas />
                </ProtectedRoute>
              } />
              <Route path="/admin/academic-year" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AcademicYearSettings />
                </ProtectedRoute>
              } />

              {/* Faculty Routes */}
              <Route path="/faculty" element={
                <ProtectedRoute allowedRoles={['faculty']}>
                  <FacultyDashboard />
                </ProtectedRoute>
              } />

              {/* Fallback Route */}
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </div>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
