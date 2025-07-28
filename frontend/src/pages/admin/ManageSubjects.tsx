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
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Manage Subjects</h1>
      
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
          <p>{error}</p>
        </div>
      )}
      
      {/* Action Buttons */}
      <div className="mb-6 flex flex-wrap gap-4">
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md"
        >
          Add New Subject
        </button>
        <button
          onClick={() => setShowBulkUpload(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md"
        >
          Bulk Upload Subjects
        </button>
      </div>
      
      {/* Add Subject Form */}
      {showAddForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
          <div className="relative bg-white rounded-lg shadow-xl mx-4 max-w-md md:max-w-lg w-full">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">Add New Subject</h2>
              
              <form onSubmit={handleAddSubject}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subject Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subject Code
                  </label>
                  <input
                    type="text"
                    name="code"
                    value={formData.code}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                
                <div className="mb-4 flex items-center">
                  <input
                    type="checkbox"
                    id="is_lab"
                    name="is_lab"
                    checked={formData.is_lab}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                  />
                  <label htmlFor="is_lab" className="ml-2 block text-sm text-gray-700">
                    Is Lab Subject?
                  </label>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Default Duration (periods)
                  </label>
                  <select
                    name="default_duration_periods"
                    value={formData.default_duration_periods}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value={1}>1 Period</option>
                    <option value={2}>2 Periods</option>
                    <option value={3}>3 Periods</option>
                  </select>
                  <p className="text-sm text-gray-500 mt-1">
                    Lab subjects typically require 2-3 consecutive periods
                  </p>
                </div>
                
                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="mr-2 bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium py-2 px-4 rounded-md"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md"
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
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
          <div className="relative bg-white rounded-lg shadow-xl mx-4 max-w-md md:max-w-lg w-full">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">Edit Subject</h2>
              
              <form onSubmit={handleUpdateSubject}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subject Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={currentSubject.name}
                    onChange={handleCurrentSubjectChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subject Code
                  </label>
                  <input
                    type="text"
                    name="code"
                    value={currentSubject.code || ''}
                    onChange={handleCurrentSubjectChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                
                <div className="mb-4 flex items-center">
                  <input
                    type="checkbox"
                    id="edit_is_lab"
                    name="is_lab"
                    checked={currentSubject.is_lab}
                    onChange={handleCurrentSubjectChange}
                    className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                  />
                  <label htmlFor="edit_is_lab" className="ml-2 block text-sm text-gray-700">
                    Is Lab Subject?
                  </label>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Default Duration (periods)
                  </label>
                  <select
                    name="default_duration_periods"
                    value={currentSubject.default_duration_periods}
                    onChange={handleCurrentSubjectChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value={1}>1 Period</option>
                    <option value={2}>2 Periods</option>
                    <option value={3}>3 Periods</option>
                  </select>
                </div>
                
                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowEditForm(false)}
                    className="mr-2 bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium py-2 px-4 rounded-md"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md"
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
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
          <div className="relative bg-white rounded-lg shadow-xl mx-4 max-w-4xl w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Bulk Upload Subjects</h2>
                <button
                  onClick={() => setShowBulkUpload(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {subjectList.length > 0 ? (
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
                  <tr key={subject._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {subject.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {subject.code || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {subject.is_lab ? (
                        <span className="text-xs font-semibold inline-block py-1 px-2 rounded-full bg-blue-100 text-blue-700">
                          Lab
                        </span>
                      ) : (
                        <span className="text-xs font-semibold inline-block py-1 px-2 rounded-full bg-green-100 text-green-700">
                          Theory
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {subject.default_duration_periods} Period(s)
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEditSubject(subject)}
                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteSubject(subject._id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-6">
              <p className="text-gray-500">No subjects found.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ManageSubjects;
