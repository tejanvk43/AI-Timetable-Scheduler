import React, { useState, useEffect } from 'react';
import { subjects } from '../../utils/api';
import BulkUpload from '../../components/BulkUpload';

const ManageSubjects: React.FC = () => {
  const [subjectList, setSubjectList] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Form states
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [showEditForm, setShowEditForm] = useState<boolean>(false);
  const [currentSubject, setCurrentSubject] = useState<any>(null);
  
  // New subject form data
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    is_lab: false,
    default_duration_periods: 1
  });
  
  // Bulk upload state
  const [showBulkUpload, setShowBulkUpload] = useState<boolean>(false);
  
  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const response = await subjects.getAll();
      setSubjectList(response.data.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching subjects:', err);
      setError('Failed to load subjects. Please try again.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    // Handle checkbox separately
    if (type === 'checkbox') {
      const { checked } = e.target as HTMLInputElement;
      
      setFormData({
        ...formData,
        [name]: checked,
        // If lab is checked, set default duration to 2, otherwise 1
        ...(name === 'is_lab' && { default_duration_periods: checked ? 2 : 1 })
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      await subjects.create(formData);
      
      // Reset form
      setFormData({
        name: '',
        code: '',
        is_lab: false,
        default_duration_periods: 1
      });
      
      setShowAddForm(false);
      fetchSubjects(); // Refresh list
    } catch (err: any) {
      console.error('Error adding subject:', err);
      setError(err.response?.data?.message || 'Failed to add subject.');
      setLoading(false);
    }
  };

  const handleEditSubject = (subject: any) => {
    setCurrentSubject(subject);
    setShowEditForm(true);
  };

  const handleUpdateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      // Update subject details
      await subjects.update(currentSubject._id, currentSubject);
      
      setShowEditForm(false);
      fetchSubjects(); // Refresh list
    } catch (err: any) {
      console.error('Error updating subject:', err);
      setError(err.response?.data?.message || 'Failed to update subject.');
      setLoading(false);
    }
  };

  const handleDeleteSubject = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this subject?')) {
      return;
    }
    
    try {
      setLoading(true);
      await subjects.delete(id);
      fetchSubjects(); // Refresh list
    } catch (err: any) {
      console.error('Error deleting subject:', err);
      setError(err.response?.data?.message || 'Failed to delete subject.');
      setLoading(false);
    }
  };

  const handleCurrentSubjectChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    // Handle checkbox separately
    if (type === 'checkbox') {
      const { checked } = e.target as HTMLInputElement;
      
      setCurrentSubject({
        ...currentSubject,
        [name]: checked,
        // If lab is checked, set default duration to 2, otherwise 1
        ...(name === 'is_lab' && !checked && { default_duration_periods: 1 })
      });
    } else {
      setCurrentSubject({
        ...currentSubject,
        [name]: value
      });
    }
  };

  const handleBulkUpload = async (data: any[]) => {
    try {
      setLoading(true);
      
      // Use the bulk API endpoint
      const response = await subjects.bulkCreate(data);
      
      setShowBulkUpload(false);
      fetchSubjects(); // Refresh list
      setLoading(false);
      
      // Show success message with details
      const { created, errors } = response.data.data;
      let message = `Successfully created ${created.length} subjects.`;
      if (errors.length > 0) {
        message += ` ${errors.length} errors occurred: ${errors.join(', ')}`;
      }
      
      // You could show this in a toast or alert
      alert(message);
      
    } catch (err: any) {
      console.error('Error bulk uploading subjects:', err);
      setError(err.response?.data?.message || 'Failed to upload subject data.');
      setLoading(false);
    }
  };

  const getSubjectTemplate = () => {
    return [
      {
        name: 'Data Structures',
        code: 'CS201',
        is_lab: false,
        default_duration_periods: 1
      },
      {
        name: 'Data Structures Lab',
        code: 'CS201L',
        is_lab: true,
        default_duration_periods: 2
      }
    ];
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Manage Subjects</h1>
          <p className="text-sm sm:text-base text-gray-600">Add, edit, and manage course subjects and lab courses</p>
        </div>
        
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-3 sm:p-4 mb-4 sm:mb-6 rounded-r-md" role="alert">
            <p className="text-sm sm:text-base">{error}</p>
          </div>
        )}
        
        {/* Action Buttons */}
        <div className="mb-6 flex flex-col sm:flex-row gap-3 sm:gap-4">
          <button
            onClick={() => setShowAddForm(true)}
            className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white font-medium py-2.5 px-4 sm:px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add New Subject
          </button>
          <button
            onClick={() => setShowBulkUpload(true)}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 sm:px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            Bulk Upload Subjects
          </button>
        </div>
        
        {/* Add Subject Form */}
        {showAddForm && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50 p-4">
            <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md sm:max-w-lg">
              <div className="p-4 sm:p-6">
                <div className="flex justify-between items-center mb-4 sm:mb-6">
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900">Add New Subject</h2>
                  <button
                    onClick={() => setShowAddForm(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <form onSubmit={handleAddSubject} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Subject Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                      placeholder="e.g., Data Structures"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Subject Code
                    </label>
                    <input
                      type="text"
                      name="code"
                      value={formData.code}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                      placeholder="e.g., CS201"
                    />
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="is_lab"
                      name="is_lab"
                      checked={formData.is_lab}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <label htmlFor="is_lab" className="text-sm font-medium text-gray-700">
                      Is Lab Subject?
                    </label>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Default Duration (periods)
                    </label>
                    <select
                      name="default_duration_periods"
                      value={formData.default_duration_periods}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                    >
                      <option value={1}>1 Period</option>
                      <option value={2}>2 Periods</option>
                      <option value={3}>3 Periods</option>
                    </select>
                    <p className="text-xs sm:text-sm text-gray-500 mt-1">
                      Lab subjects typically require 2-3 consecutive periods
                    </p>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t">
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="w-full sm:w-auto px-4 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="w-full sm:w-auto px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                      disabled={loading}
                    >
                      {loading ? 'Adding...' : 'Add Subject'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
        
        {/* Edit Subject Form */}
        {showEditForm && currentSubject && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50 p-4">
            <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md sm:max-w-lg">
              <div className="p-4 sm:p-6">
                <div className="flex justify-between items-center mb-4 sm:mb-6">
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900">Edit Subject</h2>
                  <button
                    onClick={() => setShowEditForm(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <form onSubmit={handleUpdateSubject} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Subject Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      required
                      value={currentSubject.name}
                      onChange={handleCurrentSubjectChange}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Subject Code
                    </label>
                    <input
                      type="text"
                      name="code"
                      value={currentSubject.code || ''}
                      onChange={handleCurrentSubjectChange}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="edit_is_lab"
                      name="is_lab"
                      checked={currentSubject.is_lab}
                      onChange={handleCurrentSubjectChange}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="edit_is_lab" className="text-sm font-medium text-gray-700">
                      Is Lab Subject?
                    </label>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Default Duration (periods)
                    </label>
                    <select
                      name="default_duration_periods"
                      value={currentSubject.default_duration_periods}
                      onChange={handleCurrentSubjectChange}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    >
                      <option value={1}>1 Period</option>
                      <option value={2}>2 Periods</option>
                      <option value={3}>3 Periods</option>
                    </select>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t">
                    <button
                      type="button"
                      onClick={() => setShowEditForm(false)}
                      className="w-full sm:w-auto px-4 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="w-full sm:w-auto px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                      disabled={loading}
                    >
                      {loading ? 'Updating...' : 'Update Subject'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
        
        {/* Bulk Upload Modal */}
        {showBulkUpload && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50 p-4">
            <div className="relative bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="p-4 sm:p-6">
                <div className="flex justify-between items-center mb-4 sm:mb-6">
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900">Bulk Upload Subjects</h2>
                  <button
                    onClick={() => setShowBulkUpload(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <BulkUpload
                  onUpload={handleBulkUpload}
                  templateData={getSubjectTemplate()}
                  templateFilename="subjects-template.xlsx"
                  title="Subjects"
                  description="Upload subjects in bulk using an Excel file"
                  expectedColumns={['name', 'code', 'is_lab', 'default_duration_periods']}
                />
              </div>
            </div>
          </div>
        )}
        
        {/* Subject List */}
        {loading && !showAddForm && !showEditForm ? (
          <div className="flex justify-center my-12">
            <div className="w-8 h-8 sm:w-12 sm:h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
            {subjectList.length > 0 ? (
              <>
                {/* Desktop Table View */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Code
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Duration
                        </th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {subjectList.map((subject) => (
                        <tr key={subject._id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {subject.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {subject.code || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {subject.is_lab ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                Lab
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Theory
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {subject.default_duration_periods} Period(s)
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end space-x-2">
                              <button
                                onClick={() => handleEditSubject(subject)}
                                className="text-indigo-600 hover:text-indigo-900 px-2 py-1 rounded transition-colors"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteSubject(subject._id)}
                                className="text-red-600 hover:text-red-900 px-2 py-1 rounded transition-colors"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile/Tablet Card View */}
                <div className="lg:hidden">
                  <div className="space-y-4 p-4">
                    {subjectList.map((subject) => (
                      <div key={subject._id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <h3 className="text-base font-semibold text-gray-900 mb-1">{subject.name}</h3>
                            <div className="flex flex-wrap gap-2 mb-2">
                              {subject.code && (
                                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-200 text-gray-800">
                                  {subject.code}
                                </span>
                              )}
                              {subject.is_lab ? (
                                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                                  Lab Subject
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-100 text-green-800">
                                  Theory Subject
                                </span>
                              )}
                              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-purple-100 text-purple-800">
                                {subject.default_duration_periods} Period(s)
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => handleEditSubject(subject)}
                            className="px-3 py-2 text-sm text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 rounded-md transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteSubject(subject._id)}
                            className="px-3 py-2 text-sm text-red-600 hover:text-red-900 hover:bg-red-50 rounded-md transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No subjects found</h3>
                <p className="text-gray-500 mb-6">Get started by adding your first subject.</p>
                <button
                  onClick={() => setShowAddForm(true)}
                  className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
                >
                  Add Subject
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageSubjects;
