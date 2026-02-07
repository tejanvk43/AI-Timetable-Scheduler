import React, { useState, useEffect, useRef } from 'react';
import { timetables, classes, templates, subjects, users, aiGeneration } from '../../utils/api';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const ManageTimetables: React.FC = () => {
  const [timetableList, setTimetableList] = useState<any[]>([]);
  const [classList, setClassList] = useState<any[]>([]);
  const [templateList, setTemplateList] = useState<any[]>([]);
  const [showCreateForm, setShowCreateForm] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [viewingTimetable, setViewingTimetable] = useState<any | null>(null);
  const [timetableDetails, setTimetableDetails] = useState<any | null>(null);
  const [loadingDetails, setLoadingDetails] = useState<boolean>(false);
  
  // Editing states
  const [editingCell, setEditingCell] = useState<{ day: string; period: number } | null>(null);
  const [editFormData, setEditFormData] = useState<{ subject_id: string; faculty_id: string; is_lab: boolean }>({ subject_id: '', faculty_id: '', is_lab: false });
  const [subjectList, setSubjectList] = useState<any[]>([]);
  const [facultyList, setFacultyList] = useState<any[]>([]);
  const [regenerating, setRegenerating] = useState<boolean>(false);
  const [regeneratingAll, setRegeneratingAll] = useState<boolean>(false);
  const timetableRef = useRef<HTMLDivElement>(null);
  
  // Form states
  const [formData, setFormData] = useState({
    class_id: '',
    academic_year: '',
    template_id: '',
    periods_per_day: 6,
    working_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
    period_timings: [
      { name: 'Period 1', start_time: '09:00', end_time: '09:50' },
      { name: 'Period 2', start_time: '09:50', end_time: '10:40' },
      { name: 'Break', start_time: '10:40', end_time: '11:00', is_break: true, break_duration: 20 },
      { name: 'Period 3', start_time: '11:00', end_time: '11:50' },
      { name: 'Period 4', start_time: '11:50', end_time: '12:40' },
      { name: 'Lunch Break', start_time: '12:40', end_time: '13:30', is_break: true, break_duration: 50 },
      { name: 'Period 5', start_time: '13:30', end_time: '14:20' },
      { name: 'Period 6', start_time: '14:20', end_time: '15:10' }
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
    fetchSubjectsAndFaculty();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [timetableResponse, classResponse, templateResponse] = await Promise.all([
        timetables.getAll(),
        classes.getAll(),
        templates.getAll()
      ]);
      
      setTimetableList(timetableResponse.data.data);
      setClassList(classResponse.data.data);
      setTemplateList(Array.isArray(templateResponse.data) ? templateResponse.data : []);
    } catch (err: any) {
      setError('Failed to load data. Please refresh and try again.');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubjectsAndFaculty = async () => {
    try {
      const [subjectsRes, facultyRes] = await Promise.all([
        subjects.getAll(),
        users.getAll()
      ]);
      setSubjectList(subjectsRes.data.data || []);
      setFacultyList((facultyRes.data.data || []).filter((u: any) => u.role === 'faculty'));
    } catch (err) {
      console.error('Error fetching subjects/faculty:', err);
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

  const handleViewTimetable = async (timetable: any) => {
    setViewingTimetable(timetable);
    setLoadingDetails(true);
    try {
      const response = await timetables.getById(timetable._id);
      setTimetableDetails(response.data.data);
    } catch (err: any) {
      console.error('Error fetching timetable details:', err);
      setTimetableDetails(timetable);
    } finally {
      setLoadingDetails(false);
    }
  };

  const closeTimetableView = () => {
    setViewingTimetable(null);
    setTimetableDetails(null);
    setEditingCell(null);
  };

  // Handle regenerate timetable
  const handleRegenerate = async () => {
    if (!timetableDetails || !viewingTimetable) return;
    
    if (!window.confirm('Are you sure you want to regenerate this timetable? This will replace the current schedule.')) {
      return;
    }
    
    setRegenerating(true);
    try {
      await aiGeneration.regenerateTimetable({
        timetable_id: viewingTimetable._id
      });
      
      // Refresh the timetable details
      const response = await timetables.getById(viewingTimetable._id);
      setTimetableDetails(response.data.data);
      setSuccess('Timetable regenerated successfully!');
      fetchData(); // Refresh the list
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to regenerate timetable.');
      console.error('Error regenerating timetable:', err);
    } finally {
      setRegenerating(false);
    }
  };

  // Handle regenerate ALL timetables sequentially (fixes faculty conflicts)
  const handleRegenerateAll = async () => {
    if (!window.confirm('This will REGENERATE ALL timetables to fix faculty scheduling conflicts. Each timetable will be regenerated in sequence, ensuring no faculty is double-booked. Continue?')) {
      return;
    }
    
    setRegeneratingAll(true);
    setError(null);
    try {
      const response = await aiGeneration.regenerateAllTimetables();
      const results = response.data.results || [];
      const successCount = results.filter((r: any) => r.status === 'success').length;
      const failedCount = results.filter((r: any) => r.status === 'failed' || r.status === 'error').length;
      
      setSuccess(`Regenerated ${successCount} timetables successfully. ${failedCount > 0 ? `${failedCount} failed.` : ''}`);
      fetchData(); // Refresh the list
      
      // If viewing a timetable, refresh its details too
      if (viewingTimetable) {
        const detailsResponse = await timetables.getById(viewingTimetable._id);
        setTimetableDetails(detailsResponse.data.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to regenerate all timetables.');
      console.error('Error regenerating all timetables:', err);
    } finally {
      setRegeneratingAll(false);
    }
  };

  // Handle cell click for editing
  const handleCellClick = (day: string, period: number, entry: any) => {
    setEditingCell({ day, period });
    setEditFormData({
      subject_id: entry?.subject_id?._id || entry?.subject_id || '',
      faculty_id: entry?.faculty_id?._id || entry?.faculty_id || '',
      is_lab: entry?.is_lab || entry?.subject_details?.is_lab || false
    });
  };

  // Save cell edit
  const handleSaveEdit = async () => {
    if (!editingCell || !timetableDetails) return;
    
    try {
      const { day, period } = editingCell;
      
      // Build the updated schedule
      const updatedSchedule = { ...timetableDetails.schedule };
      if (!updatedSchedule[day]) {
        updatedSchedule[day] = [];
      }
      
      // Find and update or add the entry
      const existingIndex = updatedSchedule[day].findIndex((e: any) => e.period === period);
      const newEntry = {
        period,
        subject_id: editFormData.subject_id,
        faculty_id: editFormData.faculty_id,
        is_lab: editFormData.is_lab
      };
      
      if (existingIndex >= 0) {
        updatedSchedule[day][existingIndex] = newEntry;
      } else {
        updatedSchedule[day].push(newEntry);
        updatedSchedule[day].sort((a: any, b: any) => a.period - b.period);
      }
      
      // Save to server
      await timetables.updateSchedule(viewingTimetable._id, { schedule: updatedSchedule });
      
      // Refresh
      const response = await timetables.getById(viewingTimetable._id);
      setTimetableDetails(response.data.data);
      setEditingCell(null);
      setSuccess('Cell updated successfully!');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update cell.');
      console.error('Error updating cell:', err);
    }
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingCell(null);
    setEditFormData({ subject_id: '', faculty_id: '', is_lab: false });
  };

  // Download timetable as Excel
  const downloadAsExcel = () => {
    if (!timetableDetails) return;
    
    const periodsPerDay = timetableDetails.periods_per_day || 6;
    const data: any[][] = [];
    
    // Header row
    const header = ['Day', ...Array.from({ length: periodsPerDay }, (_, i) => `Period ${i + 1}`)];
    data.push(header);
    
    // Data rows
    daysOfWeek.forEach(day => {
      const row = [dayLabels[day]];
      const daySchedule = timetableDetails.schedule[day] || [];
      
      for (let period = 1; period <= periodsPerDay; period++) {
        const entry = daySchedule.find((e: any) => e.period === period);
        if (entry) {
          const subjectName = entry.subject_details?.name || entry.subject_id?.name || 'Subject';
          const facultyName = entry.faculty_details?.name || entry.faculty_id?.name || 'Faculty';
          const className = viewingTimetable?.class_id?.name || 'Class';
          const labText = (entry.is_lab || entry.subject_details?.is_lab) ? ' (Lab)' : '';
          row.push(`${subjectName}\n${className}\n${facultyName}${labText}`);
        } else {
          row.push('');
        }
      }
      data.push(row);
    });
    
    // Create workbook and worksheet
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Timetable');
    
    // Set column widths
    ws['!cols'] = [
      { wch: 12 }, // Day column
      ...Array(periodsPerDay).fill({ wch: 25 }) // Period columns
    ];
    
    // Download
    const className = viewingTimetable?.class_id?.name || 'Class';
    const fileName = `Timetable_${className}_${timetableDetails.academic_year}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  // Download timetable as PDF
  const downloadAsPDF = async () => {
    if (!timetableRef.current || !timetableDetails) return;
    
    try {
      // Capture the timetable table as canvas
      const canvas = await html2canvas(timetableRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: timetableRef.current.scrollWidth,
        windowHeight: timetableRef.current.scrollHeight
      });
      
      const imgData = canvas.toDataURL('image/png');
      
      // Calculate PDF dimensions (A4 landscape: 297mm x 210mm)
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const pdfWidth = 297; // A4 landscape width in mm
      const pdfHeight = 210; // A4 landscape height in mm
      const margin = 10;
      const contentWidth = pdfWidth - (2 * margin);
      const contentHeight = pdfHeight - 50; // Leave space for header
      const imgAspectRatio = imgWidth / imgHeight;
      
      // Calculate dimensions to fit the image
      let finalWidth = contentWidth;
      let finalHeight = contentWidth / imgAspectRatio;
      
      // If height exceeds available space, scale down
      if (finalHeight > contentHeight) {
        finalHeight = contentHeight;
        finalWidth = contentHeight * imgAspectRatio;
      }
      
      // Center the image
      const xPos = (pdfWidth - finalWidth) / 2;
      const yPos = 40; // Start after header
      
      // Create PDF
      const pdf = new jsPDF('landscape', 'mm', 'a4');
      
      // Add title
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      const className = viewingTimetable?.class_id?.name || 'Class';
      pdf.text(`Timetable - ${className}`, pdfWidth / 2, 15, { align: 'center' });
      
      // Add academic year
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Academic Year: ${timetableDetails.academic_year}`, pdfWidth / 2, 25, { align: 'center' });
      
      // Add date
      pdf.setFontSize(10);
      pdf.text(`Generated: ${new Date().toLocaleDateString()}`, pdfWidth / 2, 32, { align: 'center' });
      
      // Add the timetable image
      pdf.addImage(imgData, 'PNG', xPos, yPos, finalWidth, finalHeight);
      
      // Save PDF
      const fileName = `Timetable_${className}_${timetableDetails.academic_year}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayLabels: { [key: string]: string } = {
    monday: 'Monday',
    tuesday: 'Tuesday',
    wednesday: 'Wednesday',
    thursday: 'Thursday',
    friday: 'Friday',
    saturday: 'Saturday'
  };

  const resetForm = () => {
    setFormData({
      class_id: '',
      academic_year: '',
      template_id: '',
      periods_per_day: 6,
      working_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
      period_timings: [
        { name: 'Period 1', start_time: '09:00', end_time: '09:50' },
        { name: 'Period 2', start_time: '09:50', end_time: '10:40' },
        { name: 'Break', start_time: '10:40', end_time: '11:00', is_break: true, break_duration: 20 },
        { name: 'Period 3', start_time: '11:00', end_time: '11:50' },
        { name: 'Period 4', start_time: '11:50', end_time: '12:40' },
        { name: 'Lunch Break', start_time: '12:40', end_time: '13:30', is_break: true, break_duration: 50 },
        { name: 'Period 5', start_time: '13:30', end_time: '14:20' },
        { name: 'Period 6', start_time: '14:20', end_time: '15:10' }
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
        <div className="flex gap-3">
          <button
            onClick={handleRegenerateAll}
            disabled={regeneratingAll}
            className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
          >
            {regeneratingAll ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Regenerating All...
              </>
            ) : (
              <>
                🔄 Regenerate All (Fix Conflicts)
              </>
            )}
          </button>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            {showCreateForm ? 'Cancel' : 'Create New Timetable Structure'}
          </button>
        </div>
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
                  Use Template (Optional)
                </label>
                <select
                  value={formData.template_id}
                  onChange={(e) => setFormData({ ...formData, template_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">-- No Template (Create from Scratch) --</option>
                  {templateList.map(template => (
                    <option key={template._id} value={template._id}>
                      {template.name} - {template.periods_per_day} periods/day
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Select a template to automatically configure period timings and guidelines
                </p>
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
                      onClick={() => handleViewTimetable(timetable)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors"
                    >
                      View
                    </button>
                    <a
                      href={`/admin/generate?class=${timetable.class_id._id}`}
                      className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm transition-colors inline-flex items-center"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Generate
                    </a>
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

      {/* Timetable View Modal */}
      {viewingTimetable && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-blue-600 text-white">
              <h2 className="text-xl font-semibold">
                {viewingTimetable.class_id?.name || 'Class'} - {viewingTimetable.academic_year}
              </h2>
              <div className="flex items-center space-x-3">
                {timetableDetails?.schedule && Object.keys(timetableDetails.schedule).length > 0 && (
                  <>
                    <button
                      onClick={downloadAsExcel}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Excel
                    </button>
                    <button
                      onClick={downloadAsPDF}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      PDF
                    </button>
                    <button
                      onClick={handleRegenerate}
                      disabled={regenerating}
                      className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center"
                    >
                      {regenerating ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Regenerating...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          Regenerate
                        </>
                      )}
                    </button>
                  </>
                )}
                <button
                  onClick={closeTimetableView}
                  className="text-white hover:text-gray-200 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
            </div>
            
            {/* Edit instructions */}
            {timetableDetails?.schedule && Object.keys(timetableDetails.schedule).length > 0 && (
              <div className="bg-blue-50 px-6 py-2 text-sm text-blue-700 border-b">
                💡 Click on any cell to edit. Labs are shown in purple.
              </div>
            )}
            
            <div ref={timetableRef} className="p-6 overflow-auto max-h-[calc(90vh-120px)]">
              {loadingDetails ? (
                <div className="flex justify-center py-8">
                  <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : timetableDetails?.schedule && Object.keys(timetableDetails.schedule).length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Day</th>
                        {Array.from({ length: timetableDetails.periods_per_day || 6 }, (_, i) => (
                          <th key={i} className="border border-gray-300 px-4 py-2 text-center font-semibold">
                            Period {i + 1}
                            {timetableDetails.period_timings?.[i] && (
                              <div className="text-xs text-gray-500 font-normal">
                                {timetableDetails.period_timings[i].start_time} - {timetableDetails.period_timings[i].end_time}
                              </div>
                            )}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {daysOfWeek
                        .filter(day => timetableDetails.working_days?.includes(day) || timetableDetails.schedule[day])
                        .map(day => (
                          <tr key={day} className="hover:bg-gray-50">
                            <td className="border border-gray-300 px-4 py-2 font-medium bg-gray-50">
                              {dayLabels[day]}
                            </td>
                            {Array.from({ length: timetableDetails.periods_per_day || 6 }, (_, periodIndex) => {
                              const daySchedule = timetableDetails.schedule[day] || [];
                              const periodEntry = daySchedule.find((entry: any) => entry.period === periodIndex + 1);
                              const isEditing = editingCell?.day === day && editingCell?.period === periodIndex + 1;
                              
                              return (
                                <td 
                                  key={periodIndex} 
                                  className={`border border-gray-300 px-3 py-2 text-center cursor-pointer transition-all ${
                                    isEditing 
                                      ? 'bg-blue-100 ring-2 ring-blue-500' 
                                      : periodEntry?.is_lab || periodEntry?.subject_details?.is_lab 
                                        ? 'bg-purple-50 hover:bg-purple-100' 
                                        : 'hover:bg-blue-50'
                                  }`}
                                  onClick={() => handleCellClick(day, periodIndex + 1, periodEntry)}
                                >
                                  {isEditing ? (
                                    <div className="space-y-2 min-w-[180px]">
                                      <select
                                        value={editFormData.subject_id}
                                        onChange={(e) => {
                                          const selectedSubject = subjectList.find(s => s._id === e.target.value);
                                          setEditFormData({ 
                                            ...editFormData, 
                                            subject_id: e.target.value,
                                            is_lab: selectedSubject?.is_lab || false
                                          });
                                        }}
                                        className="w-full px-2 py-1 text-sm border rounded"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <option value="">Select Subject</option>
                                        {subjectList.map(s => (
                                          <option key={s._id} value={s._id}>
                                            {s.name} {s.is_lab ? '(Lab)' : ''}
                                          </option>
                                        ))}
                                      </select>
                                      <select
                                        value={editFormData.faculty_id}
                                        onChange={(e) => setEditFormData({ ...editFormData, faculty_id: e.target.value })}
                                        className="w-full px-2 py-1 text-sm border rounded"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <option value="">Select Faculty</option>
                                        {facultyList.map(f => (
                                          <option key={f._id} value={f._id}>{f.name}</option>
                                        ))}
                                      </select>
                                      <div className="flex justify-center space-x-2">
                                        <button
                                          onClick={(e) => { e.stopPropagation(); handleSaveEdit(); }}
                                          className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded text-xs"
                                        >
                                          ✓ Save
                                        </button>
                                        <button
                                          onClick={(e) => { e.stopPropagation(); handleCancelEdit(); }}
                                          className="bg-gray-400 hover:bg-gray-500 text-white px-2 py-1 rounded text-xs"
                                        >
                                          ✕ Cancel
                                        </button>
                                      </div>
                                    </div>
                                  ) : periodEntry ? (
                                    <div className="group relative">
                                      <div className={`font-medium ${periodEntry.is_lab || periodEntry.subject_details?.is_lab ? 'text-purple-700' : 'text-gray-800'}`}>
                                        {periodEntry.subject_details?.name || periodEntry.subject_details?.code || periodEntry.subject_id?.name || 'Subject'}
                                        {(periodEntry.is_lab || periodEntry.subject_details?.is_lab) && <span className="ml-1 text-xs">(Lab)</span>}
                                      </div>
                                      <div className="text-xs text-gray-500">
                                        {periodEntry.faculty_details?.name || periodEntry.faculty_id?.name || 'Faculty'}
                                      </div>
                                      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all rounded">
                                        <span className="opacity-0 group-hover:opacity-100 text-xs text-blue-600 font-medium">Click to edit</span>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="group">
                                      <span className="text-gray-300 group-hover:text-blue-400">+ Add</span>
                                    </div>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                    </tbody>
                  </table>
                  
                  {/* Legend */}
                  <div className="mt-4 flex items-center space-x-4 text-sm text-gray-600">
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-purple-50 border border-purple-200 mr-2"></div>
                      <span>Lab Session (Consecutive)</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-blue-500 mr-2">●</span>
                      <span>Click any cell to edit</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <p className="text-gray-600 text-lg font-medium">No Timetable Generated Yet</p>
                  <p className="text-gray-400 text-sm mt-2">
                    This is a timetable structure. Go to "Generate Timetable" to create the actual schedule.
                  </p>
                  <a 
                    href="/admin/generate" 
                    className="inline-block mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Generate Timetable
                  </a>
                </div>
              )}
              
              {/* Timetable Info */}
              {timetableDetails && (
                <div className="mt-6 bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold mb-2">Timetable Information</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Periods per Day:</span>
                      <span className="ml-2 font-medium">{timetableDetails.periods_per_day}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Working Days:</span>
                      <span className="ml-2 font-medium">{timetableDetails.working_days?.length || 0}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Last Generated:</span>
                      <span className="ml-2 font-medium">
                        {timetableDetails.last_generated 
                          ? new Date(timetableDetails.last_generated).toLocaleDateString()
                          : 'Never'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Status:</span>
                      <span className={`ml-2 font-medium ${timetableDetails.schedule && Object.keys(timetableDetails.schedule).length > 0 ? 'text-green-600' : 'text-yellow-600'}`}>
                        {timetableDetails.schedule && Object.keys(timetableDetails.schedule).length > 0 ? 'Generated' : 'Pending'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageTimetables;
