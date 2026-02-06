import React, { useState, useEffect } from 'react';
import { users, subjects } from '../../utils/api';
import BulkUpload from '../../components/BulkUpload';

const ManageFaculty: React.FC = () => {
  const [facultyList, setFacultyList] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Form states
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [showEditForm, setShowEditForm] = useState<boolean>(false);
  const [currentFaculty, setCurrentFaculty] = useState<any>(null);
  
  // New faculty form data
  const [formData, setFormData] = useState({
    username: '',
    name: '',
    faculty_id: '',
    phone_number: '',
    role: 'faculty'
  });
  
  // Available subjects for assignment
  const [availableSubjects, setAvailableSubjects] = useState<any[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  
  // Bulk upload state
  const [showBulkUpload, setShowBulkUpload] = useState<boolean>(false);
  
  const fetchFaculty = async () => {
    try {
      setLoading(true);
      const response = await users.getFaculty();
      setFacultyList(response.data.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching faculty:', err);
      setError('Failed to load faculty members. Please try again.');
      setLoading(false);
    }
  };

  const fetchSubjects = async () => {
    try {
      const response = await subjects.getAll();
      setAvailableSubjects(response.data.data);
    } catch (err) {
      console.error('Error fetching subjects:', err);
    }
  };

  useEffect(() => {
    fetchFaculty();
    fetchSubjects();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleAddFaculty = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      await users.register(formData);
      
      // Reset form
      setFormData({
        username: '',
        name: '',
        faculty_id: '',
        phone_number: '',
        role: 'faculty'
      });
      
      setShowAddForm(false);
      fetchFaculty(); // Refresh list
    } catch (err: any) {
      console.error('Error adding faculty:', err);
      setError(err.response?.data?.message || 'Failed to add faculty member.');
      setLoading(false);
    }
  };

  const handleEditFaculty = (faculty: any) => {
    setCurrentFaculty(faculty);
    setSelectedSubjects(faculty.subjects_taught?.map((s: any) => s._id || s) || []);
    setShowEditForm(true);
  };

  const handleUpdateFaculty = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      // Update faculty details
      await users.update(currentFaculty._id, {
        name: currentFaculty.name,
        faculty_id: currentFaculty.faculty_id,
        phone_number: currentFaculty.phone_number
      });
      
      // Assign subjects
      await subjects.assignToFaculty({
        faculty_id: currentFaculty._id,
        subject_ids: selectedSubjects
      });
      
      setShowEditForm(false);
      fetchFaculty(); // Refresh list
    } catch (err: any) {
      console.error('Error updating faculty:', err);
      setError(err.response?.data?.message || 'Failed to update faculty member.');
      setLoading(false);
    }
  };

  const handleDeleteFaculty = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this faculty member?')) {
      return;
    }
    
    try {
      setLoading(true);
      await users.delete(id);
      fetchFaculty(); // Refresh list
    } catch (err: any) {
      console.error('Error deleting faculty:', err);
      setError(err.response?.data?.message || 'Failed to delete faculty member.');
      setLoading(false);
    }
  };

  const handleSubjectSelection = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const options = Array.from(e.target.selectedOptions, option => option.value);
    setSelectedSubjects(options);
  };

  const handleCurrentFacultyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCurrentFaculty({
      ...currentFaculty,
      [name]: value
    });
  };

  const handleBulkUpload = async (data: any[]) => {
    try {
      setLoading(true);
      
      // Use the bulk API endpoint
      const response = await users.bulkCreate(data);
      
      setShowBulkUpload(false);
      fetchFaculty(); // Refresh list
      setLoading(false);
      
      // Show success message with details
      const { created, errors } = response.data.data;
      let message = `Successfully created ${created.length} faculty members.`;
      if (errors.length > 0) {
        message += ` ${errors.length} errors occurred: ${errors.join(', ')}`;
      }
      
      // You could show this in a toast or alert
      alert(message);
      
    } catch (err: any) {
      console.error('Error bulk uploading faculty:', err);
      setError(err.response?.data?.message || 'Failed to upload faculty data.');
      setLoading(false);
    }
  };

  const getFacultyTemplate = () => {
    return [
      {
        username: 'john.doe',
        name: 'John Doe',
        faculty_id: 'F001',
        phone_number: '+1234567890',
        password: 'password123'
      },
      {
        username: 'jane.smith',
        name: 'Jane Smith',
        faculty_id: 'F002',
        phone_number: '+1234567891',
        password: 'password123'
      }
    ];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Manage Faculty</h1>
          <p className="text-lg text-gray-600">Add, edit, and manage faculty members</p>
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
        
        {/* Action Buttons */}
        <div className="mb-8 flex flex-wrap gap-4">
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-medium rounded-lg shadow-sm transition-all duration-200 hover:shadow-md"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add New Faculty
          </button>
          <button
            onClick={() => setShowBulkUpload(true)}
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium rounded-lg shadow-sm transition-all duration-200 hover:shadow-md"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            Bulk Upload Faculty
          </button>
        </div>
      
      {/* Add Faculty Form */}
      {showAddForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
          <div className="relative bg-white rounded-lg shadow-xl mx-4 max-w-md md:max-w-lg w-full">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">Add New Faculty</h2>
              
              <form onSubmit={handleAddFaculty}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    name="username"
                    required
                    value={formData.username}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name
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
                    Faculty ID
                  </label>
                  <input
                    type="text"
                    name="faculty_id"
                    required
                    value={formData.faculty_id}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Format: F001, F002, etc.
                  </p>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    name="phone_number"
                    value={formData.phone_number}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
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
                    {loading ? 'Adding...' : 'Add Faculty'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      
      {/* Edit Faculty Form */}
      {showEditForm && currentFaculty && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
          <div className="relative bg-white rounded-lg shadow-xl mx-4 max-w-md md:max-w-lg w-full">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">Edit Faculty</h2>
              
              <form onSubmit={handleUpdateFaculty}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={currentFaculty.name}
                    onChange={handleCurrentFacultyChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Faculty ID
                  </label>
                  <input
                    type="text"
                    name="faculty_id"
                    required
                    value={currentFaculty.faculty_id}
                    onChange={handleCurrentFacultyChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    name="phone_number"
                    value={currentFaculty.phone_number || ''}
                    onChange={handleCurrentFacultyChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subjects Taught
                  </label>
                  <select
                    multiple
                    value={selectedSubjects}
                    onChange={handleSubjectSelection}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    size={5}
                  >
                    {availableSubjects.map(subject => (
                      <option key={subject._id} value={subject._id}>
                        {subject.name} {subject.code ? `(${subject.code})` : ''} {subject.is_lab ? '- Lab' : ''}
                      </option>
                    ))}
                  </select>
                  <p className="text-sm text-gray-500 mt-1">
                    Hold Ctrl/Cmd to select multiple subjects
                  </p>
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
                    {loading ? 'Updating...' : 'Update Faculty'}
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
                <h2 className="text-xl font-bold">Bulk Upload Faculty</h2>
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
                templateData={getFacultyTemplate()}
                templateFilename="faculty-template.xlsx"
                title="Faculty"
                description="Upload faculty members in bulk using an Excel file"
                expectedColumns={['username', 'name', 'faculty_id', 'phone_number', 'password']}
              />
            </div>
          </div>
        </div>
      )}
      
      {/* Faculty List */}
      {loading && !showAddForm && !showEditForm ? (
        <div className="flex justify-center my-12">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {facultyList.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Faculty ID
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Username
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phone
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subjects
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {facultyList.map((faculty) => (
                  <tr key={faculty._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {faculty.faculty_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {faculty.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {faculty.username}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {faculty.phone_number || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {faculty.subjects_taught?.length ? (
                        <span className="text-xs font-semibold inline-block py-1 px-2 rounded bg-blue-100 text-blue-700">
                          {faculty.subjects_taught.length} subject(s)
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEditFaculty(faculty)}
                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteFaculty(faculty._id)}
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
              <p className="text-gray-500">No faculty members found.</p>
            </div>
          )}
        </div>
      )}
      </div>
    </div>
  );
};

export default ManageFaculty;
