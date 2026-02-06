import React, { useState, useEffect } from 'react';
import { academicYears as academicYearsAPI } from '../../utils/api';

interface AcademicYear {
  _id?: string;
  year: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  semester1Start: string;
  semester1End: string;
  semester2Start: string;
  semester2End: string;
  description?: string;
}

const AcademicYearSettings: React.FC = () => {
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [showEditForm, setShowEditForm] = useState<boolean>(false);
  const [currentYear, setCurrentYear] = useState<AcademicYear | null>(null);
  
  // Form data
  const [formData, setFormData] = useState<AcademicYear>({
    year: '',
    startDate: '',
    endDate: '',
    isActive: false,
    semester1Start: '',
    semester1End: '',
    semester2Start: '',
    semester2End: '',
    description: ''
  });

  useEffect(() => {
    fetchAcademicYears();
  }, []);

  const fetchAcademicYears = async () => {
    try {
      setLoading(true);
      const response = await academicYearsAPI.getAll();
      setAcademicYears(response.data.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching academic years:', err);
      setError('Failed to load academic years. Please try again.');
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      console.log('Submitting form data:', formData);
      if (showEditForm && currentYear) {
        await academicYearsAPI.update(currentYear._id!, formData);
      } else {
        await academicYearsAPI.create(formData);
      }
      
      // Close forms and refresh data
      setShowAddForm(false);
      setShowEditForm(false);
      setCurrentYear(null);
      resetForm();
      await fetchAcademicYears();
    } catch (err: any) {
      console.error('Error saving academic year:', err);
      console.error('Error response:', err.response?.data);
      let errorMessage = err.response?.data?.error || 'Failed to save academic year. Please try again.';
      if (err.response?.data?.details) {
        errorMessage += ': ' + err.response.data.details.join(', ');
      }
      setError(errorMessage);
    }
  };

  const handleEdit = (year: AcademicYear) => {
    setCurrentYear(year);
    // Format dates for HTML date input (YYYY-MM-DD format)
    const formatDateForInput = (dateStr: string) => {
      if (!dateStr) return '';
      const date = new Date(dateStr);
      return date.toISOString().split('T')[0];
    };
    
    setFormData({
      ...year,
      startDate: formatDateForInput(year.startDate),
      endDate: formatDateForInput(year.endDate),
      semester1Start: formatDateForInput(year.semester1Start),
      semester1End: formatDateForInput(year.semester1End),
      semester2Start: formatDateForInput(year.semester2Start),
      semester2End: formatDateForInput(year.semester2End),
    });
    setShowEditForm(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this academic year?')) {
      try {
        await academicYearsAPI.delete(id);
        await fetchAcademicYears();
      } catch (err: any) {
        console.error('Error deleting academic year:', err);
        const errorMessage = err.response?.data?.error || 'Failed to delete academic year. Please try again.';
        setError(errorMessage);
      }
    }
  };

  const handleSetActive = async (id: string) => {
    try {
      await academicYearsAPI.activate(id);
      await fetchAcademicYears();
    } catch (err: any) {
      console.error('Error setting active academic year:', err);
      const errorMessage = err.response?.data?.error || 'Failed to set active academic year. Please try again.';
      setError(errorMessage);
    }
  };

  const resetForm = () => {
    setFormData({
      year: '',
      startDate: '',
      endDate: '',
      isActive: false,
      semester1Start: '',
      semester1End: '',
      semester2Start: '',
      semester2End: '',
      description: ''
    });
  };

  const closeModal = () => {
    setShowAddForm(false);
    setShowEditForm(false);
    setCurrentYear(null);
    resetForm();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Academic Year Settings</h1>
          <p className="text-lg text-gray-600">Manage academic years and semester configurations</p>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-6 rounded-r-lg shadow-sm mb-6" role="alert">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-red-800 font-medium">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="mb-8">
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-medium rounded-lg shadow-sm transition-all duration-200 hover:shadow-md"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add New Academic Year
          </button>
        </div>

        {/* Academic Years List */}
        {loading ? (
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading academic years...</p>
            </div>
          </div>
        ) : (
          <div className="grid gap-6">
            {academicYears.map((year) => (
              <div key={year._id} className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4">
                      <h3 className="text-xl font-semibold text-gray-900">{year.year}</h3>
                      {year.isActive && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 mt-1">{year.description}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Academic Year</p>
                        <p className="text-sm text-gray-600">
                          {new Date(year.startDate).toLocaleDateString()} - {new Date(year.endDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Semester 1</p>
                        <p className="text-sm text-gray-600">
                          {new Date(year.semester1Start).toLocaleDateString()} - {new Date(year.semester1End).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Semester 2</p>
                        <p className="text-sm text-gray-600">
                          {new Date(year.semester2Start).toLocaleDateString()} - {new Date(year.semester2End).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    {!year.isActive && (
                      <button
                        onClick={() => handleSetActive(year._id!)}
                        className="inline-flex items-center px-3 py-2 text-sm font-medium text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-all duration-200"
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Set Active
                      </button>
                    )}
                    <button
                      onClick={() => handleEdit(year)}
                      className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all duration-200"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit
                    </button>
                    {!year.isActive && (
                      <button
                        onClick={() => handleDelete(year._id!)}
                        className="inline-flex items-center px-3 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200"
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add/Edit Form Modal */}
        {(showAddForm || showEditForm) && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
            <div className="relative bg-white rounded-2xl shadow-xl mx-4 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-gray-900">
                    {showEditForm ? 'Edit Academic Year' : 'Add New Academic Year'}
                  </h3>
                  <button
                    onClick={closeModal}
                    className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-2">
                        Academic Year *
                      </label>
                      <input
                        type="text"
                        id="year"
                        name="year"
                        value={formData.year}
                        onChange={handleInputChange}
                        placeholder="e.g., 2024-2025"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                        Description
                      </label>
                      <input
                        type="text"
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        placeholder="Description of the academic year"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
                        Start Date *
                      </label>
                      <input
                        type="date"
                        id="startDate"
                        name="startDate"
                        value={formData.startDate}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
                        End Date *
                      </label>
                      <input
                        type="date"
                        id="endDate"
                        name="endDate"
                        value={formData.endDate}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="semester1Start" className="block text-sm font-medium text-gray-700 mb-2">
                        Semester 1 Start *
                      </label>
                      <input
                        type="date"
                        id="semester1Start"
                        name="semester1Start"
                        value={formData.semester1Start}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="semester1End" className="block text-sm font-medium text-gray-700 mb-2">
                        Semester 1 End *
                      </label>
                      <input
                        type="date"
                        id="semester1End"
                        name="semester1End"
                        value={formData.semester1End}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="semester2Start" className="block text-sm font-medium text-gray-700 mb-2">
                        Semester 2 Start *
                      </label>
                      <input
                        type="date"
                        id="semester2Start"
                        name="semester2Start"
                        value={formData.semester2Start}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="semester2End" className="block text-sm font-medium text-gray-700 mb-2">
                        Semester 2 End *
                      </label>
                      <input
                        type="date"
                        id="semester2End"
                        name="semester2End"
                        value={formData.semester2End}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isActive"
                      name="isActive"
                      checked={formData.isActive}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
                      Set as active academic year
                    </label>
                  </div>

                  <div className="flex justify-end space-x-4 pt-6">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="px-6 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-lg transition-all duration-200"
                    >
                      {showEditForm ? 'Update' : 'Create'} Academic Year
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AcademicYearSettings;
