import React, { useState, useEffect } from 'react';
import { classes, timetables } from '../../utils/api';

interface PeriodTiming {
  name: string;
  start_time: string;
  end_time: string;
  is_break: boolean;
  break_duration?: number;
}

interface TimetableTemplate {
  class_id: string;
  academic_year: string;
  periods_per_day: number;
  working_days: string[];
  period_timings: PeriodTiming[];
  guidelines: {
    minimize_consecutive_faculty_periods: boolean;
    labs_once_a_week: boolean;
    sports_last_period_predefined_day: string;
    no_breaks_during_labs: boolean;
    max_periods_per_faculty_per_day: number;
    preferred_lab_days: string[];
    avoid_first_period_labs: boolean;
    lunch_break_period: number;
  };
}

const TimetableCanvas: React.FC = () => {
  const [classList, setClassList] = useState<any[]>([]);
  const [existingTemplates, setExistingTemplates] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [academicYear, setAcademicYear] = useState<string>('2024-25');
  const [periodsPerDay, setPeriodsPerDay] = useState<number>(8);
  const [workingDays, setWorkingDays] = useState<string[]>(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']);
  const [periodTimings, setPeriodTimings] = useState<PeriodTiming[]>([]);
  const [guidelines, setGuidelines] = useState({
    minimize_consecutive_faculty_periods: true,
    labs_once_a_week: true,
    sports_last_period_predefined_day: 'friday',
    no_breaks_during_labs: true,
    max_periods_per_faculty_per_day: 6,
    preferred_lab_days: ['tuesday', 'wednesday', 'thursday'],
    avoid_first_period_labs: false,
    lunch_break_period: 4
  });

  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('create');

  // Available days for selection
  const allDays = [
    { key: 'monday', label: 'Monday' },
    { key: 'tuesday', label: 'Tuesday' },
    { key: 'wednesday', label: 'Wednesday' },
    { key: 'thursday', label: 'Thursday' },
    { key: 'friday', label: 'Friday' },
    { key: 'saturday', label: 'Saturday' }
  ];

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    // Generate default period timings when periods per day changes
    generateDefaultPeriods();
  }, [periodsPerDay]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [classResponse, templateResponse] = await Promise.all([
        classes.getAll(),
        timetables.getAll()
      ]);
      
      setClassList(classResponse.data.data);
      setExistingTemplates(templateResponse.data.data);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data. Please refresh and try again.');
    } finally {
      setLoading(false);
    }
  };

  const generateDefaultPeriods = () => {
    const defaultPeriods: PeriodTiming[] = [];
    let currentTime = 9; // Start at 9:00 AM
    let currentMinutes = 0;

    for (let i = 1; i <= periodsPerDay; i++) {
      // Add lunch break after period 4 (typically)
      if (i === 5) {
        defaultPeriods.push({
          name: 'Lunch Break',
          start_time: `${String(currentTime).padStart(2, '0')}:${String(currentMinutes).padStart(2, '0')}`,
          end_time: `${String(currentTime + 1).padStart(2, '0')}:${String(currentMinutes).padStart(2, '0')}`,
          is_break: true,
          break_duration: 60
        });
        currentTime += 1;
      }

      // Add short break after every 2 periods (except before lunch)
      if (i > 1 && i !== 5 && (i - 1) % 2 === 0) {
        defaultPeriods.push({
          name: `Break ${Math.floor((i - 1) / 2)}`,
          start_time: `${String(currentTime).padStart(2, '0')}:${String(currentMinutes).padStart(2, '0')}`,
          end_time: `${String(currentTime).padStart(2, '0')}:${String(currentMinutes + 15).padStart(2, '0')}`,
          is_break: true,
          break_duration: 15
        });
        currentMinutes += 15;
        if (currentMinutes >= 60) {
          currentTime += Math.floor(currentMinutes / 60);
          currentMinutes = currentMinutes % 60;
        }
      }

      const startTime = `${String(currentTime).padStart(2, '0')}:${String(currentMinutes).padStart(2, '0')}`;
      currentMinutes += 50; // 50-minute periods
      if (currentMinutes >= 60) {
        currentTime += Math.floor(currentMinutes / 60);
        currentMinutes = currentMinutes % 60;
      }
      const endTime = `${String(currentTime).padStart(2, '0')}:${String(currentMinutes).padStart(2, '0')}`;

      defaultPeriods.push({
        name: `Period ${i}`,
        start_time: startTime,
        end_time: endTime,
        is_break: false
      });

      // Add 10 minutes gap between periods
      currentMinutes += 10;
      if (currentMinutes >= 60) {
        currentTime += Math.floor(currentMinutes / 60);
        currentMinutes = currentMinutes % 60;
      }
    }

    setPeriodTimings(defaultPeriods);
  };

  const handleWorkingDayToggle = (day: string) => {
    setWorkingDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
  };

  const handlePeriodChange = (index: number, field: keyof PeriodTiming, value: any) => {
    setPeriodTimings(prev => 
      prev.map((period, i) => 
        i === index ? { ...period, [field]: value } : period
      )
    );
  };

  const addCustomBreak = (afterPeriodIndex: number) => {
    const newBreak: PeriodTiming = {
      name: 'Custom Break',
      start_time: '12:00',
      end_time: '12:15',
      is_break: true,
      break_duration: 15
    };

    setPeriodTimings(prev => [
      ...prev.slice(0, afterPeriodIndex + 1),
      newBreak,
      ...prev.slice(afterPeriodIndex + 1)
    ]);
  };

  const removePeriod = (index: number) => {
    setPeriodTimings(prev => prev.filter((_, i) => i !== index));
  };

  const handleGuidelineChange = (key: string, value: any) => {
    setGuidelines(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedClass) {
      setError('Please select a class.');
      return;
    }

    if (workingDays.length === 0) {
      setError('Please select at least one working day.');
      return;
    }

    if (periodTimings.length === 0) {
      setError('Please add at least one period.');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const templateData: TimetableTemplate = {
        class_id: selectedClass,
        academic_year: academicYear,
        periods_per_day: periodsPerDay,
        working_days: workingDays,
        period_timings: periodTimings,
        guidelines
      };

      await timetables.create(templateData);
      setSuccess('Timetable template created successfully!');
      
      // Reset form
      setSelectedClass('');
      setAcademicYear('2024-25');
      setPeriodsPerDay(8);
      setWorkingDays(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']);
      generateDefaultPeriods();
      
      // Refresh templates list
      await fetchData();
      setActiveTab('view');
      
    } catch (err: any) {
      console.error('Error creating template:', err);
      setError(err.response?.data?.message || 'Failed to create timetable template.');
    } finally {
      setSaving(false);
    }
  };

  const deleteTemplate = async (templateId: string) => {
    if (!window.confirm('Are you sure you want to delete this timetable template?')) {
      return;
    }

    try {
      await timetables.delete(templateId);
      setSuccess('Template deleted successfully!');
      await fetchData();
    } catch (err: any) {
      setError('Failed to delete template.');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Timetable Canvas</h1>
          <p className="text-gray-600 mt-2">Create and manage timetable templates with custom periods and breaks</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-6">
        <button
          onClick={() => setActiveTab('create')}
          className={`px-4 py-2 rounded-md font-medium ${
            activeTab === 'create'
              ? 'bg-blue-100 text-blue-700'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Create Template
        </button>
        <button
          onClick={() => setActiveTab('view')}
          className={`px-4 py-2 rounded-md font-medium ${
            activeTab === 'view'
              ? 'bg-blue-100 text-blue-700'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          View Templates ({existingTemplates.length})
        </button>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <p>{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <p>{success}</p>
          </div>
        </div>
      )}

      {/* Create Template Tab */}
      {activeTab === 'create' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Class *
                </label>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">-- Select Class --</option>
                  {classList.map(classItem => (
                    <option key={classItem._id} value={classItem._id}>
                      {classItem.name} - {classItem.branch} (Year {classItem.year}, Section {classItem.section})
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
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., 2024-25"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Periods Per Day *
                </label>
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={periodsPerDay}
                  onChange={(e) => setPeriodsPerDay(parseInt(e.target.value))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>

            {/* Working Days Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Working Days *
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {allDays.map(day => (
                  <label key={day.key} className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={workingDays.includes(day.key)}
                      onChange={() => handleWorkingDayToggle(day.key)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">{day.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Period Timings */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="text-sm font-medium text-gray-700">
                  Period Timings & Breaks
                </label>
                <button
                  type="button"
                  onClick={generateDefaultPeriods}
                  className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-sm"
                >
                  Reset to Default
                </button>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto border rounded-lg p-4">
                {periodTimings.map((period, index) => (
                  <div key={index} className={`grid grid-cols-1 md:grid-cols-6 gap-3 p-4 border rounded-lg ${
                    period.is_break ? 'bg-orange-50 border-orange-200' : 'bg-blue-50 border-blue-200'
                  }`}>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Name</label>
                      <input
                        type="text"
                        value={period.name}
                        onChange={(e) => handlePeriodChange(index, 'name', e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Start Time</label>
                      <input
                        type="time"
                        value={period.start_time}
                        onChange={(e) => handlePeriodChange(index, 'start_time', e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">End Time</label>
                      <input
                        type="time"
                        value={period.end_time}
                        onChange={(e) => handlePeriodChange(index, 'end_time', e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
                      <select
                        value={period.is_break ? 'break' : 'period'}
                        onChange={(e) => handlePeriodChange(index, 'is_break', e.target.value === 'break')}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="period">Period</option>
                        <option value="break">Break</option>
                      </select>
                    </div>

                    {period.is_break && (
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Duration (min)</label>
                        <input
                          type="number"
                          min="5"
                          max="120"
                          value={period.break_duration || 15}
                          onChange={(e) => handlePeriodChange(index, 'break_duration', parseInt(e.target.value))}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    )}

                    <div className="flex items-end space-x-2">
                      {!period.is_break && (
                        <button
                          type="button"
                          onClick={() => addCustomBreak(index)}
                          className="px-2 py-1 bg-orange-100 hover:bg-orange-200 text-orange-700 rounded text-xs"
                          title="Add break after this period"
                        >
                          +Break
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => removePeriod(index)}
                        className="px-2 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded text-xs"
                        title="Remove this period/break"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Guidelines */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">
                Timetable Guidelines
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={guidelines.minimize_consecutive_faculty_periods}
                    onChange={(e) => handleGuidelineChange('minimize_consecutive_faculty_periods', e.target.checked)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-sm">Minimize consecutive faculty periods</span>
                </label>

                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={guidelines.labs_once_a_week}
                    onChange={(e) => handleGuidelineChange('labs_once_a_week', e.target.checked)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-sm">Schedule labs once a week</span>
                </label>

                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={guidelines.avoid_first_period_labs}
                    onChange={(e) => handleGuidelineChange('avoid_first_period_labs', e.target.checked)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-sm">Avoid first period labs</span>
                </label>

                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={guidelines.no_breaks_during_labs}
                    onChange={(e) => handleGuidelineChange('no_breaks_during_labs', e.target.checked)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-sm">No breaks during labs</span>
                </label>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Sports Day</label>
                  <select
                    value={guidelines.sports_last_period_predefined_day}
                    onChange={(e) => handleGuidelineChange('sports_last_period_predefined_day', e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                  >
                    <option value="">No specific day</option>
                    <option value="monday">Monday</option>
                    <option value="tuesday">Tuesday</option>
                    <option value="wednesday">Wednesday</option>
                    <option value="thursday">Thursday</option>
                    <option value="friday">Friday</option>
                    <option value="saturday">Saturday</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Max periods per faculty per day</label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={guidelines.max_periods_per_faculty_per_day}
                    onChange={(e) => handleGuidelineChange('max_periods_per_faculty_per_day', parseInt(e.target.value))}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-center pt-6 border-t">
              <button
                type="submit"
                disabled={saving || loading}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-8 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center space-x-2"
              >
                {saving ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Creating Template...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span>Create Timetable Template</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* View Templates Tab */}
      {activeTab === 'view' && (
        <div className="space-y-6">
          {existingTemplates.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow-md">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="text-gray-500 text-lg">No timetable templates found</p>
              <p className="text-gray-400 text-sm mt-2">Create your first template to get started</p>
              <button
                onClick={() => setActiveTab('create')}
                className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm"
              >
                Create Template
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {existingTemplates.map(template => (
                <div key={template._id} className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">
                        {template.class_id?.name || 'Unknown Class'}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {template.academic_year} • {template.periods_per_day} periods/day
                      </p>
                    </div>
                    <button
                      onClick={() => deleteTemplate(template._id)}
                      className="text-red-600 hover:text-red-800"
                      title="Delete template"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>

                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Working Days: </span>
                      <span className="text-gray-600">
                        {template.working_days?.map((day: string) => day.charAt(0).toUpperCase() + day.slice(1)).join(', ')}
                      </span>
                    </div>

                    <div>
                      <span className="font-medium text-gray-700">Periods: </span>
                      <span className="text-gray-600">
                        {template.period_timings?.filter((p: any) => !p.is_break).length} teaching periods, {template.period_timings?.filter((p: any) => p.is_break).length} breaks
                      </span>
                    </div>

                    <div className="flex items-center space-x-4 text-xs">
                      {template.guidelines?.labs_once_a_week && (
                        <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">Labs once/week</span>
                      )}
                      {template.guidelines?.sports_last_period_predefined_day && (
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                          Sports on {template.guidelines.sports_last_period_predefined_day}
                        </span>
                      )}
                      {template.guidelines?.avoid_first_period_labs && (
                        <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded">No 1st period labs</span>
                      )}
                    </div>
                  </div>

                  {/* Period Timeline Preview */}
                  <div className="mt-4 pt-4 border-t">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Timeline Preview:</h4>
                    <div className="flex flex-wrap gap-1">
                      {template.period_timings?.slice(0, 8).map((period: any, index: number) => (
                        <div
                          key={index}
                          className={`px-2 py-1 text-xs rounded ${
                            period.is_break 
                              ? 'bg-orange-200 text-orange-800' 
                              : 'bg-blue-200 text-blue-800'
                          }`}
                          title={`${period.start_time} - ${period.end_time}`}
                        >
                          {period.is_break ? 'B' : `P${period.name.replace('Period ', '')}`}
                        </div>
                      ))}
                      {template.period_timings?.length > 8 && (
                        <div className="px-2 py-1 text-xs bg-gray-200 text-gray-600 rounded">
                          +{template.period_timings.length - 8}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TimetableCanvas;
