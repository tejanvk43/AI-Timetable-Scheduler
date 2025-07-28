import axios from 'axios';

// API base URL from environment variable or default to localhost:5000
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to every request if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Authentication API
export const auth = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getProfile: () => api.get('/auth/me'),
  changePassword: (passwordData) => api.put('/auth/change-password', passwordData)
};

// Users API
export const users = {
  getAll: () => api.get('/users'),
  getFaculty: () => api.get('/users/faculty'),
  getById: (id) => api.get(`/users/${id}`),
  create: (userData) => api.post('/users', userData),
  register: (userData) => api.post('/auth/register', userData),
  update: (id, userData) => api.put(`/users/${id}`, userData),
  delete: (id) => api.delete(`/users/${id}`),
  bulkCreate: (users) => api.post('/users/bulk', { users })
};

// Classes API
export const classes = {
  getAll: () => api.get('/classes'),
  getById: (id) => api.get(`/classes/${id}`),
  create: (classData) => api.post('/classes', classData),
  update: (id, classData) => api.put(`/classes/${id}`, classData),
  delete: (id) => api.delete(`/classes/${id}`),
  bulkCreate: (classes) => api.post('/classes/bulk', { classes })
};

// Subjects API
export const subjects = {
  getAll: () => api.get('/subjects'),
  getById: (id) => api.get(`/subjects/${id}`),
  create: (subjectData) => api.post('/subjects', subjectData),
  update: (id, subjectData) => api.put(`/subjects/${id}`, subjectData),
  delete: (id) => api.delete(`/subjects/${id}`),
  assignToFaculty: (assignData) => api.post('/subjects/assign', assignData),
  bulkCreate: (subjects) => api.post('/subjects/bulk', { subjects })
};

// Timetables API
export const timetables = {
  getAll: () => api.get('/timetables'),
  getById: (id) => api.get(`/timetables/${id}`),
  getByClass: (classId) => api.get(`/timetables/class/${classId}`),
  getByFaculty: (facultyId) => api.get(`/timetables/faculty/${facultyId}`),
  create: (timetableData) => api.post('/timetables', timetableData),
  update: (id, timetableData) => api.put(`/timetables/${id}`, timetableData),
  updateSchedule: (id, scheduleData) => api.put(`/timetables/${id}/schedule`, scheduleData),
  resetSchedule: (id) => api.put(`/timetables/${id}/reset`),
  delete: (id) => api.delete(`/timetables/${id}`)
};

// AI Timetable Generation API
export const aiGeneration = {
  generateTimetable: (generationData) => api.post('/ai/generate-timetable', generationData)
};

export default api;
