import React, { useState, useEffect } from 'react';
import { timetables, classes } from '../../utils/api';

const ManageTimetables: React.FC = () => {
  const [timetableList, setTimetableList] = useState<any[]>([]);
  const [classList, setClassList] = useState<any[]>([]);
  const [showCreateForm, setShowCreateForm] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Form states
  const [formData, setFormData] = useState({
    class_id: '',
    academic_year: '',
    periods_per_day: 6,
    working_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
    period_timings: [
      { name: 'Period 1', start: '09:00', end: '09:50' },
      { name: 'Period 2', start: '09:50', end: '10:40' },
      { name: 'Break', start: '10:40', end: '11:00' },
      { name: 'Period 3', start: '11:00', end: '11:50' },
      { name: 'Period 4', start: '11:50', end: '12:40' },
      { name: 'Lunch Break', start: '12:40', end: '01:30' },
      { name: 'Period 5', start: '01:30', end: '02:20' },
      { name: 'Period 6', start: '02:20', end: '03:10' }
    ],
    guidelines: {
      minimize_consecutive_faculty_periods: true,
      labs_once_a_week: true,
      sports_last_period_predefined_day: 'friday',
      break_after_periods: [2, 4]
    }
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [timetableResponse, classResponse] = await Promise.all([
        timetables.getAll(),
        classes.getAll()
      ]);
      
      setTimetableList(timetableResponse.data.data);
      setClassList(classResponse.data.data);
    } catch (err: any) {
      setError('Failed to load data. Please refresh and try again.');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    if (!formData.class_id || !formData.academic_year) {
      setError('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    try {
      await timetables.create(formData);
      setSuccess('Timetable structure created successfully!');
      setShowCreateForm(false);
      resetForm();
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create timetable structure.');
      console.error('Error creating timetable:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this timetable structure?')) {
      return;
    }

    setLoading(true);
    try {
      await timetables.delete(id);
      setSuccess('Timetable structure deleted successfully!');
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete timetable structure.');
      console.error('Error deleting timetable:', err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      class_id: '',
      academic_year: '',
      periods_per_day: 6,
      working_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
      period_timings: [
        { name: 'Period 1', start: '09:00', end: '09:50' },
        { name: 'Period 2', start: '09:50', end: '10:40' },
        { name: 'Break', start: '10:40', end: '11:00' },
        { name: 'Period 3', start: '11:00', end: '11:50' },
        { name: 'Period 4', start: '11:50', end: '12:40' },
        { name: 'Lunch Break', start: '12:40', end: '01:30' },
        { name: 'Period 5', start: '01:30', end: '02:20' },
        { name: 'Period 6', start: '02:20', end: '03:10' }
      ],
      guidelines: {
        minimize_consecutive_faculty_periods: true,
        labs_once_a_week: true,
        sports_last_period_predefined_day: 'friday',
        break_after_periods: [2, 4]
      }
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Manage Timetable Structures</h1>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
        >
          {showCreateForm ? 'Cancel' : 'Create New Timetable Structure'}
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
          <p>{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6" role="alert">
          <p>{success}</p>
        </div>
      )}

      {/* Create Form */}
      {showCreateForm && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Create Timetable Structure</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Class *
                </label>
                <select
                  value={formData.class_id}
                  onChange={(e) => setFormData({ ...formData, class_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">-- Select Class --</option>
                  {classList.map(cls => (
                    <option key={cls._id} value={cls._id}>
                      {cls.name} ({cls.branch} - Year {cls.year})
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Academic Year *
                </label>
                <input
                  type="text"
                  value={formData.academic_year}
                  onChange={(e) => setFormData({ ...formData, academic_year: e.target.value })}
                  placeholder="e.g., 2024-25"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Periods per Day
                </label>
                <input
                  type="number"
                  min="4"
                  max="8"
                  value={formData.periods_per_day}
                  onChange={(e) => setFormData({ ...formData, periods_per_day: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Guidelines */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Timetable Guidelines</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.guidelines.minimize_consecutive_faculty_periods}
                    onChange={(e) => setFormData({
                      ...formData,
                      guidelines: {
                        ...formData.guidelines,
                        minimize_consecutive_faculty_periods: e.target.checked
                      }
                    })}
                    className="mr-2"
                  />
                  Minimize consecutive faculty periods
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.guidelines.labs_once_a_week}
                    onChange={(e) => setFormData({
                      ...formData,
                      guidelines: {
                        ...formData.guidelines,
                        labs_once_a_week: e.target.checked
                      }
                    })}
                    className="mr-2"
                  />
                  Labs once per week
                </label>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sports Day (Last Period)
                </label>
                <select
                  value={formData.guidelines.sports_last_period_predefined_day}
                  onChange={(e) => setFormData({
                    ...formData,
                    guidelines: {
                      ...formData.guidelines,
                      sports_last_period_predefined_day: e.target.value
                    }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="friday">Friday</option>
                  <option value="saturday">Saturday</option>
                  <option value="thursday">Thursday</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg disabled:opacity-50 transition-colors"
              >
                {loading ? 'Creating...' : 'Create Structure'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Timetables List */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold">Existing Timetable Structures</h2>
        </div>
        
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : timetableList.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
            <p className="text-gray-500 text-lg">No timetable structures found</p>
            <p className="text-gray-400 text-sm mt-2">Create a timetable structure to get started with AI generation</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {timetableList.map(timetable => (
              <div key={timetable._id} className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium">{timetable.class_id.name} - {timetable.academic_year}</h3>
                    <div className="mt-1 text-sm text-gray-600">
                      <span className="mr-4">{timetable.periods_per_day} periods/day</span>
                      <span className="mr-4">
                        {timetable.last_generated 
                          ? `Last generated: ${new Date(timetable.last_generated).toLocaleDateString()}`
                          : 'Never generated'
                        }
                      </span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleDelete(timetable._id)}
                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageTimetables;
