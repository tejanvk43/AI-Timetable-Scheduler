import React, { useState, useEffect } from 'react';
import { classes, users } from '../../utils/api';
import BulkUpload from '../../components/BulkUpload';

const ManageClasses: React.FC = () => {
  const [classList, setClassList] = useState<any[]>([]);
  const [facultyList, setFacultyList] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Form states
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [showEditForm, setShowEditForm] = useState<boolean>(false);
  const [currentClass, setCurrentClass] = useState<any>(null);
  
  // New class form data
  const [formData, setFormData] = useState({
    name: '',
    branch: '',
    year: '',
    section: '',
    class_teacher_id: ''
  });

  // Bulk upload state
  const [showBulkUpload, setShowBulkUpload] = useState<boolean>(false);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const response = await classes.getAll();
      setClassList(response.data.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching classes:', err);
      setError('Failed to load classes. Please try again.');
      setLoading(false);
    }
  };

  const fetchFaculty = async () => {
    try {
      const response = await users.getFaculty();
      setFacultyList(response.data.data);
    } catch (err) {
      console.error('Error fetching faculty:', err);
    }
  };

  useEffect(() => {
    fetchClasses();
    fetchFaculty();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleAddClass = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      await classes.create(formData);
      
      // Reset form
      setFormData({
        name: '',
        branch: '',
        year: '',
        section: '',
        class_teacher_id: ''
      });
      
      setShowAddForm(false);
      fetchClasses(); // Refresh list
    } catch (err: any) {
      console.error('Error adding class:', err);
      setError(err.response?.data?.message || 'Failed to add class.');
      setLoading(false);
    }
  };

  const handleEditClass = (classItem: any) => {
    setCurrentClass(classItem);
    setShowEditForm(true);
  };

  const handleUpdateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      await classes.update(currentClass._id, {
        name: currentClass.name,
        branch: currentClass.branch,
        year: currentClass.year,
        section: currentClass.section,
        class_teacher_id: currentClass.class_teacher_id
      });
      
      setShowEditForm(false);
      fetchClasses(); // Refresh list
    } catch (err: any) {
      console.error('Error updating class:', err);
      setError(err.response?.data?.message || 'Failed to update class.');
      setLoading(false);
    }
  };

  const handleDeleteClass = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this class?')) {
      return;
    }
    
    try {
      setLoading(true);
      await classes.delete(id);
      fetchClasses(); // Refresh list
    } catch (err: any) {
      console.error('Error deleting class:', err);
      setError(err.response?.data?.message || 'Failed to delete class.');
      setLoading(false);
    }
  };

  const handleCurrentClassChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCurrentClass({
      ...currentClass,
      [name]: value
    });
  };

  const handleBulkUpload = async (data: any[]) => {
    try {
      setLoading(true);
      
      // Use the bulk API endpoint
      const response = await classes.bulkCreate(data);
      
      setShowBulkUpload(false);
      fetchClasses(); // Refresh list
      setLoading(false);
      
      // Show success message with details
      const { created, errors } = response.data.data;
      let message = `Successfully created ${created.length} classes.`;
      if (errors.length > 0) {
        message += ` ${errors.length} errors occurred: ${errors.join(', ')}`;
      }
      
      // You could show this in a toast or alert
      alert(message);
      
    } catch (err: any) {
      console.error('Error bulk uploading classes:', err);
      setError(err.response?.data?.message || 'Failed to upload class data.');
      setLoading(false);
    }
  };

  const getClassTemplate = () => {
    return [
      {
        name: 'Computer Science A',
        branch: 'Computer Science',
        year: 1,
        section: 'A',
        class_teacher_id: 'F001' // Use faculty_id, not ObjectId
      },
      {
        name: 'Computer Science B',
        branch: 'Computer Science', 
        year: 1,
        section: 'B',
        class_teacher_id: 'F002' // Use faculty_id, not ObjectId
      },
      {
        name: 'Information Technology A',
        branch: 'Information Technology',
        year: 2,
        section: 'A',
        class_teacher_id: '' // Optional - can be empty
      }
    ];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Manage Classes</h1>
          <p className="text-lg text-gray-600">Add, edit, and manage class information</p>
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
            Add New Class
          </button>
          <button
            onClick={() => setShowBulkUpload(true)}
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium rounded-lg shadow-sm transition-all duration-200 hover:shadow-md"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            Bulk Upload Classes
          </button>
        </div>
      
      {/* Add Class Form */}
      {showAddForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
          <div className="relative bg-white rounded-lg shadow-xl mx-4 max-w-md md:max-w-lg w-full">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">Add New Class</h2>
              
              <form onSubmit={handleAddClass}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Class Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g., CSE A"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Branch *
                  </label>
                  <input
                    type="text"
                    name="branch"
                    required
                    value={formData.branch}
                    onChange={handleInputChange}
                    placeholder="e.g., Computer Science"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Year *
                  </label>
                  <select
                    name="year"
                    required
                    value={formData.year}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Select Year</option>
                    <option value="1">1st Year</option>
                    <option value="2">2nd Year</option>
                    <option value="3">3rd Year</option>
                    <option value="4">4th Year</option>
                  </select>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Section
                  </label>
                  <input
                    type="text"
                    name="section"
                    value={formData.section}
                    onChange={handleInputChange}
                    placeholder="e.g., A, B, C"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Class Teacher
                  </label>
                  <select
                    name="class_teacher_id"
                    value={formData.class_teacher_id}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Select Class Teacher</option>
                    {facultyList.map(faculty => (
                      <option key={faculty._id} value={faculty._id}>
                        {faculty.name} ({faculty.faculty_id})
                      </option>
                    ))}
                  </select>
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
                    {loading ? 'Adding...' : 'Add Class'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      
      {/* Edit Class Form */}
      {showEditForm && currentClass && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
          <div className="relative bg-white rounded-lg shadow-xl mx-4 max-w-md md:max-w-lg w-full">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">Edit Class</h2>
              
              <form onSubmit={handleUpdateClass}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Class Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={currentClass.name}
                    onChange={handleCurrentClassChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Branch *
                  </label>
                  <input
                    type="text"
                    name="branch"
                    required
                    value={currentClass.branch}
                    onChange={handleCurrentClassChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Year *
                  </label>
                  <select
                    name="year"
                    required
                    value={currentClass.year}
                    onChange={handleCurrentClassChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Select Year</option>
                    <option value="1">1st Year</option>
                    <option value="2">2nd Year</option>
                    <option value="3">3rd Year</option>
                    <option value="4">4th Year</option>
                  </select>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Section
                  </label>
                  <input
                    type="text"
                    name="section"
                    value={currentClass.section || ''}
                    onChange={handleCurrentClassChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Class Teacher
                  </label>
                  <select
                    name="class_teacher_id"
                    value={currentClass.class_teacher_id || ''}
                    onChange={handleCurrentClassChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Select Class Teacher</option>
                    {facultyList.map(faculty => (
                      <option key={faculty._id} value={faculty._id}>
                        {faculty.name} ({faculty.faculty_id})
                      </option>
                    ))}
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
                    {loading ? 'Updating...' : 'Update Class'}
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
                <h2 className="text-xl font-bold">Bulk Upload Classes</h2>
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
                templateData={getClassTemplate()}
                templateFilename="classes-template.xlsx"
                title="Classes"
                description="Upload classes in bulk using an Excel file"
                expectedColumns={['name', 'branch', 'year', 'section', 'class_teacher_id']}
              />
            </div>
          </div>
        </div>
      )}
      
      {/* Classes List */}
      {loading && !showAddForm && !showEditForm ? (
        <div className="flex justify-center my-12">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {classList.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Class Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Branch
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Year
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Section
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Class Teacher
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {classList.map((classItem) => (
                  <tr key={classItem._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {classItem.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {classItem.branch}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {classItem.year}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {classItem.section || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {classItem.class_teacher_id?.name || 'Not Assigned'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEditClass(classItem)}
                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteClass(classItem._id)}
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
              <p className="text-gray-500">No classes found.</p>
            </div>
          )}
        </div>
      )}
      </div>
    </div>
  );
};

export default ManageClasses;
