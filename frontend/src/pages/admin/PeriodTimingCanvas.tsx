import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api.js';

interface PeriodTiming {
  id: string;
  name: string;
  start_time: string;
  end_time: string;
  is_break: boolean;
  break_duration?: number;
  order: number;
}

interface TimeSchedule {
  name: string;
  description: string;
  periods_per_day: number;
  total_duration_hours: number;
  start_time: string;
  end_time: string;
  period_timings: PeriodTiming[];
  auto_generate_breaks: boolean;
  break_duration: number;
  lunch_break_after_period: number;
  lunch_duration: number;
  standard_period_duration: number;
  break_frequency: number;
}

const PeriodTimingCanvas: React.FC = () => {
  const navigate = useNavigate();
  const [schedule, setSchedule] = useState<TimeSchedule>({
    name: 'New Schedule Template',
    description: 'Standard college schedule with periods and breaks',
    periods_per_day: 8,
    total_duration_hours: 8,
    start_time: '09:00',
    end_time: '17:00',
    period_timings: [],
    auto_generate_breaks: true,
    break_duration: 15,
    lunch_break_after_period: 4,
    lunch_duration: 60,
    standard_period_duration: 50,
    break_frequency: 2
  });

  const [selectedPeriod, setSelectedPeriod] = useState<PeriodTiming | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Template management states
  const [savedTemplates, setSavedTemplates] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const [showTemplateList, setShowTemplateList] = useState(true);

  const generateDefaultSchedule = React.useCallback(() => {
    if (!schedule.start_time) return;

    const periods: PeriodTiming[] = [];
    let currentTime = new Date(`1970-01-01T${schedule.start_time}`);
    let periodCounter = 1;

    for (let i = 0; i < schedule.periods_per_day; i++) {
      // Add lunch break after specified period
      if (schedule.auto_generate_breaks && i === schedule.lunch_break_after_period) {
        periods.push({
          id: `break-lunch-${Date.now()}`,
          name: 'Lunch Break',
          start_time: currentTime.toTimeString().slice(0, 5),
          end_time: '',
          is_break: true,
          break_duration: schedule.lunch_duration,
          order: periods.length
        });

        currentTime.setMinutes(currentTime.getMinutes() + schedule.lunch_duration);

        periods[periods.length - 1].end_time = currentTime.toTimeString().slice(0, 5);
      }

      // Add short break based on break frequency
      if (schedule.auto_generate_breaks &&
          schedule.break_frequency > 0 &&
          i > 0 &&
          i !== schedule.lunch_break_after_period &&
          (i - (i > schedule.lunch_break_after_period ? 1 : 0)) % schedule.break_frequency === 0) {
        periods.push({
          id: `break-${i}-${Date.now()}`,
          name: `Break ${Math.ceil(i / schedule.break_frequency)}`,
          start_time: currentTime.toTimeString().slice(0, 5),
          end_time: '',
          is_break: true,
          break_duration: schedule.break_duration,
          order: periods.length
        });

        currentTime.setMinutes(currentTime.getMinutes() + schedule.break_duration);
        periods[periods.length - 1].end_time = currentTime.toTimeString().slice(0, 5);
      }

      // Add the actual period with configurable duration
      const startTime = currentTime.toTimeString().slice(0, 5);
      currentTime.setMinutes(currentTime.getMinutes() + schedule.standard_period_duration);
      const endTime = currentTime.toTimeString().slice(0, 5);

      periods.push({
        id: `period-${periodCounter}-${Date.now()}`,
        name: `Period ${periodCounter}`,
        start_time: startTime,
        end_time: endTime,
        is_break: false,
        order: periods.length
      });

      periodCounter++;

      // Add gap between periods (reduced from 10 to 5 minutes for tighter schedule)
      if (i < schedule.periods_per_day - 1) {
        currentTime.setMinutes(currentTime.getMinutes() + 5);
      }
    }

    setSchedule(prev => ({
      ...prev,
      period_timings: periods,
      end_time: currentTime.toTimeString().slice(0, 5)
    }));
  }, [schedule.periods_per_day, schedule.start_time, schedule.auto_generate_breaks,
      schedule.lunch_break_after_period, schedule.break_duration, schedule.lunch_duration,
      schedule.standard_period_duration, schedule.break_frequency]);

  useEffect(() => {
    generateDefaultSchedule();
    loadSavedTemplates();
  }, [generateDefaultSchedule]);

  // Load saved templates from backend
  const loadSavedTemplates = async () => {
    setIsLoadingTemplates(true);
    try {
      const response = await api.get('/templates');
      // API returns array directly, not wrapped in templates property
      setSavedTemplates(Array.isArray(response.data) ? response.data : response.data.templates || []);
      console.log('Loaded templates:', response.data);
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setIsLoadingTemplates(false);
    }
  };

  // Load a specific template
  const loadTemplate = async (templateId: string) => {
    try {
      const response = await api.get(`/templates/${templateId}`);
      const template = response.data;

      // Check if template has period timings
      if (template.guidelines && template.guidelines.period_timings && template.guidelines.period_timings.length > 0) {
        const periodTimings = template.guidelines.period_timings.map((timing: any, index: number) => ({
          id: `period-${index}-${Date.now()}`,
          name: timing.period_name,
          start_time: timing.start_time,
          end_time: timing.end_time,
          is_break: timing.is_break,
          break_duration: timing.break_duration,
          order: index
        }));

        setSchedule(prev => ({
          ...prev,
          name: template.name,
          description: template.description || '',
          periods_per_day: template.periods_per_day || periodTimings.filter((p: any) => !p.is_break).length,
          period_timings: periodTimings,
          start_time: periodTimings[0]?.start_time || '09:00',
          end_time: periodTimings[periodTimings.length - 1]?.end_time || '17:00'
        }));

        setSelectedTemplate(templateId);
        setShowTemplateList(false);
      } else {
        // Template exists but has no period timings - load basic info and switch to edit mode
        setSchedule(prev => ({
          ...prev,
          name: template.name || 'Untitled Template',
          description: template.description || '',
          periods_per_day: template.periods_per_day || 6,
          period_timings: []
        }));
        setSelectedTemplate(templateId);
        setShowTemplateList(false);
        alert('This template has no period timings configured. Please add periods.');
      }
    } catch (error) {
      console.error('Error loading template:', error);
      alert('Error loading template. Please try again.');
    }
  };

  // Delete a template
  const deleteTemplate = async (templateId: string) => {
    if (window.confirm('Are you sure you want to delete this template? This action cannot be undone.')) {
      try {
        await api.delete(`/templates/${templateId}`);
        setSavedTemplates(prev => prev.filter(t => t._id !== templateId));
        if (selectedTemplate === templateId) {
          setSelectedTemplate(null);
          setShowTemplateList(true);
        }
        alert('Template deleted successfully');
      } catch (error) {
        console.error('Error deleting template:', error);
        alert('Error deleting template');
      }
    }
  };

  // Create new template
  const createNewTemplate = () => {
    setSchedule({
      name: 'New Schedule Template',
      description: 'Standard college schedule with periods and breaks',
      periods_per_day: 8,
      total_duration_hours: 8,
      start_time: '09:00',
      end_time: '17:00',
      period_timings: [],
      auto_generate_breaks: true,
      break_duration: 15,
      lunch_break_after_period: 4,
      lunch_duration: 60,
      standard_period_duration: 50,
      break_frequency: 2
    });
    setSelectedTemplate(null);
    setShowTemplateList(false);
    generateDefaultSchedule();
  };

  const addCustomPeriod = () => {
    const lastPeriod = schedule.period_timings[schedule.period_timings.length - 1];
    const startTime = lastPeriod ? lastPeriod.end_time : schedule.start_time;

    const newPeriod: PeriodTiming = {
      id: `custom-${Date.now()}`,
      name: 'Custom Period',
      start_time: startTime,
      end_time: startTime,
      is_break: false,
      order: schedule.period_timings.length
    };

    setSchedule(prev => ({
      ...prev,
      period_timings: [...prev.period_timings, newPeriod]
    }));

    setSelectedPeriod(newPeriod);
    setIsEditing(true);
  };

  const addCustomBreak = () => {
    const lastPeriod = schedule.period_timings[schedule.period_timings.length - 1];
    const startTime = lastPeriod ? lastPeriod.end_time : schedule.start_time;

    const newBreak: PeriodTiming = {
      id: `custom-break-${Date.now()}`,
      name: 'Custom Break',
      start_time: startTime,
      end_time: startTime,
      is_break: true,
      break_duration: 15,
      order: schedule.period_timings.length
    };

    setSchedule(prev => ({
      ...prev,
      period_timings: [...prev.period_timings, newBreak]
    }));

    setSelectedPeriod(newBreak);
    setIsEditing(true);
  };

  const updatePeriod = (updatedPeriod: PeriodTiming) => {
    setSchedule(prev => {
      const newPeriods = prev.period_timings.map(p =>
        p.id === updatedPeriod.id ? updatedPeriod : p
      );

      // Recalculate subsequent periods to maintain timeline consistency
      const updatedIndex = newPeriods.findIndex(p => p.id === updatedPeriod.id);
      if (updatedIndex !== -1 && updatedIndex < newPeriods.length - 1) {
        let currentEndTime = new Date(`1970-01-01T${updatedPeriod.end_time}`);

        for (let i = updatedIndex + 1; i < newPeriods.length; i++) {
          // Add 5-minute gap between periods
          currentEndTime.setMinutes(currentEndTime.getMinutes() + 5);

          const period = newPeriods[i];
          const newStartTime = currentEndTime.toTimeString().slice(0, 5);

          // Calculate duration for this period
          let duration = 50; // default
          if (period.is_break && period.break_duration) {
            duration = period.break_duration;
          } else if (!period.is_break && period.start_time && period.end_time) {
            const start = new Date(`1970-01-01T${period.start_time}`);
            const end = new Date(`1970-01-01T${period.end_time}`);
            duration = Math.round((end.getTime() - start.getTime()) / (1000 * 60));
          }

          currentEndTime.setMinutes(currentEndTime.getMinutes() + duration);
          const newEndTime = currentEndTime.toTimeString().slice(0, 5);

          newPeriods[i] = {
            ...period,
            start_time: newStartTime,
            end_time: newEndTime
          };
        }
      }

      return {
        ...prev,
        period_timings: newPeriods,
        end_time: newPeriods.length > 0 ? newPeriods[newPeriods.length - 1].end_time : prev.end_time
      };
    });
  };

  const deletePeriod = (periodId: string) => {
    setSchedule(prev => ({
      ...prev,
      period_timings: prev.period_timings.filter(p => p.id !== periodId)
    }));
  };

  // Dynamic period management functions
  const addNewPeriod = () => {
    const lastPeriod = schedule.period_timings[schedule.period_timings.length - 1];
    let startTime = '09:00';

    if (lastPeriod?.end_time) {
      const lastEndTime = new Date(`1970-01-01T${lastPeriod.end_time}`);
      lastEndTime.setMinutes(lastEndTime.getMinutes() + 5); // 5-minute gap
      startTime = lastEndTime.toTimeString().slice(0, 5);
    }

    const endTime = new Date(`1970-01-01T${startTime}`);
    endTime.setMinutes(endTime.getMinutes() + schedule.standard_period_duration);

    const newPeriod: PeriodTiming = {
      id: `period-new-${Date.now()}`,
      name: `Period ${schedule.period_timings.filter(p => !p.is_break).length + 1}`,
      start_time: startTime,
      end_time: endTime.toTimeString().slice(0, 5),
      is_break: false,
      order: schedule.period_timings.length
    };

    setSchedule(prev => ({
      ...prev,
      period_timings: [...prev.period_timings, newPeriod],
      end_time: newPeriod.end_time
    }));
  };

  const addNewBreak = () => {
    const lastPeriod = schedule.period_timings[schedule.period_timings.length - 1];
    let startTime = '09:00';

    if (lastPeriod?.end_time) {
      const lastEndTime = new Date(`1970-01-01T${lastPeriod.end_time}`);
      lastEndTime.setMinutes(lastEndTime.getMinutes() + 5); // 5-minute gap
      startTime = lastEndTime.toTimeString().slice(0, 5);
    }

    const endTime = new Date(`1970-01-01T${startTime}`);
    endTime.setMinutes(endTime.getMinutes() + schedule.break_duration);

    const newBreak: PeriodTiming = {
      id: `break-new-${Date.now()}`,
      name: `Break ${schedule.period_timings.filter(p => p.is_break && !p.name.includes('Lunch')).length + 1}`,
      start_time: startTime,
      end_time: endTime.toTimeString().slice(0, 5),
      is_break: true,
      break_duration: schedule.break_duration,
      order: schedule.period_timings.length
    };

    setSchedule(prev => ({
      ...prev,
      period_timings: [...prev.period_timings, newBreak],
      end_time: newBreak.end_time
    }));
  };

  const addExtraPeriod = () => {
    const lastPeriod = schedule.period_timings[schedule.period_timings.length - 1];
    let startTime = '16:00'; // Default extra period time

    if (lastPeriod?.end_time) {
      const lastEndTime = new Date(`1970-01-01T${lastPeriod.end_time}`);
      lastEndTime.setMinutes(lastEndTime.getMinutes() + 10); // 10-minute gap for extra
      startTime = lastEndTime.toTimeString().slice(0, 5);
    }

    const endTime = new Date(`1970-01-01T${startTime}`);
    endTime.setMinutes(endTime.getMinutes() + schedule.standard_period_duration);

    const extraPeriod: PeriodTiming = {
      id: `extra-${Date.now()}`,
      name: `Extra Period`,
      start_time: startTime,
      end_time: endTime.toTimeString().slice(0, 5),
      is_break: false,
      order: schedule.period_timings.length
    };

    setSchedule(prev => ({
      ...prev,
      period_timings: [...prev.period_timings, extraPeriod],
      end_time: extraPeriod.end_time
    }));
  };

  const adjustPeriodsToCount = (targetCount: number) => {
    const currentPeriods = schedule.period_timings.filter(p => !p.is_break);
    const currentCount = currentPeriods.length;

    if (targetCount > currentCount) {
      // Add more periods
      for (let i = currentCount; i < targetCount; i++) {
        addNewPeriod();
      }
    } else if (targetCount < currentCount) {
      // Remove excess periods (keep breaks)
      const periodsToKeep = currentPeriods.slice(0, targetCount);
      const breaks = schedule.period_timings.filter(p => p.is_break);

      setSchedule(prev => ({
        ...prev,
        period_timings: [...periodsToKeep, ...breaks].sort((a, b) => a.order - b.order)
      }));
    }
  };

  const clearAllPeriods = () => {
    if (window.confirm('Are you sure you want to clear all periods and breaks? This action cannot be undone.')) {
      setSchedule(prev => ({
        ...prev,
        period_timings: [],
        end_time: prev.start_time
      }));
    }
  };

  const resetToDefault = () => {
    if (window.confirm('Reset to default schedule? This will replace all current periods and breaks.')) {
      generateDefaultSchedule();
    }
  };

  const insertPeriodAt = (index: number, type: 'period' | 'break' | 'lunch') => {
    const currentPeriod = schedule.period_timings[index];
    const nextPeriod = schedule.period_timings[index + 1];

    let startTime = currentPeriod.end_time;
    let duration = type === 'period' ? schedule.standard_period_duration :
                   type === 'lunch' ? schedule.lunch_duration : schedule.break_duration;

    const start = new Date(`1970-01-01T${startTime}`);
    start.setMinutes(start.getMinutes() + 5); // 5-minute gap
    const end = new Date(start);
    end.setMinutes(end.getMinutes() + duration);

    const newItem: PeriodTiming = {
      id: `${type}-insert-${Date.now()}`,
      name: type === 'period' ? `Period ${schedule.period_timings.filter(p => !p.is_break).length + 1}` :
            type === 'lunch' ? 'Lunch Break' :
            `Break ${schedule.period_timings.filter(p => p.is_break && !p.name.includes('Lunch')).length + 1}`,
      start_time: start.toTimeString().slice(0, 5),
      end_time: end.toTimeString().slice(0, 5),
      is_break: type !== 'period',
      break_duration: type !== 'period' ? duration : undefined,
      order: index + 0.5 // Insert between current and next
    };

    const newPeriods = [...schedule.period_timings];
    newPeriods.splice(index + 1, 0, newItem);

    // Reorder and recalculate subsequent timings
    newPeriods.forEach((period, i) => {
      period.order = i;
    });

    // Adjust subsequent periods
    let currentTime = new Date(`1970-01-01T${newItem.end_time}`);
    for (let i = index + 2; i < newPeriods.length; i++) {
      currentTime.setMinutes(currentTime.getMinutes() + 5); // gap
      const period = newPeriods[i];

      let periodDuration = 50;
      if (period.is_break && period.break_duration) {
        periodDuration = period.break_duration;
      } else if (!period.is_break && period.start_time && period.end_time) {
        const start = new Date(`1970-01-01T${period.start_time}`);
        const end = new Date(`1970-01-01T${period.end_time}`);
        periodDuration = Math.round((end.getTime() - start.getTime()) / (1000 * 60));
      }

      newPeriods[i] = {
        ...period,
        start_time: currentTime.toTimeString().slice(0, 5),
        end_time: (() => {
          currentTime.setMinutes(currentTime.getMinutes() + periodDuration);
          return currentTime.toTimeString().slice(0, 5);
        })()
      };
    }

    setSchedule(prev => ({
      ...prev,
      period_timings: newPeriods,
      end_time: newPeriods.length > 0 ? newPeriods[newPeriods.length - 1].end_time : prev.end_time
    }));
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const movePeriodUp = (index: number) => {
    if (index === 0) return;

    const newPeriods = [...schedule.period_timings];
    [newPeriods[index], newPeriods[index - 1]] = [newPeriods[index - 1], newPeriods[index]];

    // Update order
    newPeriods.forEach((period, idx) => {
      period.order = idx;
    });

    setSchedule(prev => ({
      ...prev,
      period_timings: newPeriods
    }));
  };

  const movePeriodDown = (index: number) => {
    if (index === schedule.period_timings.length - 1) return;

    const newPeriods = [...schedule.period_timings];
    [newPeriods[index], newPeriods[index + 1]] = [newPeriods[index + 1], newPeriods[index]];

    // Update order
    newPeriods.forEach((period, idx) => {
      period.order = idx;
    });

    setSchedule(prev => ({
      ...prev,
      period_timings: newPeriods
    }));
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();

    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      return;
    }

    const newPeriods = [...schedule.period_timings];
    const draggedPeriod = newPeriods[draggedIndex];

    // Remove the dragged item
    newPeriods.splice(draggedIndex, 1);

    // Insert at new position
    const insertIndex = draggedIndex < dropIndex ? dropIndex - 1 : dropIndex;
    newPeriods.splice(insertIndex, 0, draggedPeriod);

    // Update order for all periods
    newPeriods.forEach((period, index) => {
      period.order = index;
    });

    setSchedule(prev => ({
      ...prev,
      period_timings: newPeriods
    }));

    setDraggedIndex(null);
  };

  const calculateTotalDuration = () => {
    if (schedule.period_timings.length === 0) return '0h 0m';

    const firstPeriod = schedule.period_timings[0];
    const lastPeriod = schedule.period_timings[schedule.period_timings.length - 1];

    if (!firstPeriod || !lastPeriod) return '0h 0m';

    const start = new Date(`1970-01-01T${firstPeriod.start_time}`);
    const end = new Date(`1970-01-01T${lastPeriod.end_time}`);

    const diffMs = end.getTime() - start.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    return `${hours}h ${minutes}m`;
  };

  const saveAsTemplate = async () => {
    console.log('saveAsTemplate called with schedule:', schedule);

    if (!schedule.name.trim()) {
      alert('Please enter a schedule name');
      return;
    }

    try {
      // Create a template with the timing structure
      const templateData = {
        name: schedule.name,
        description: schedule.description || `Template with ${schedule.periods_per_day} periods`,
        periods_per_day: schedule.periods_per_day,
        days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        guidelines: {
          timing_notes: `This template defines the timing structure with ${schedule.periods_per_day} periods and breaks. Start time: ${schedule.start_time}, End time: ${schedule.end_time}`,
          period_timings: schedule.period_timings.map(period => ({
            period_name: period.name,
            start_time: period.start_time,
            end_time: period.end_time,
            is_break: period.is_break,
            break_duration: period.break_duration,
            duration_minutes: period.is_break ? period.break_duration : calculatePeriodDuration(period.start_time, period.end_time)
          }))
        },
        schedule_template: {},  // Empty object instead of Map for JSON serialization
        is_public: false
      };

      console.log('Sending template data:', templateData);

      let response;
      if (selectedTemplate) {
        // Update existing template
        response = await api.put(`/templates/${selectedTemplate}`, templateData);
        alert('Template updated successfully!');
      } else {
        // Create new template
        response = await api.post('/templates', templateData);
        alert('Template created successfully!');
      }

      console.log('Template API response status:', response.status);
      console.log('Template operation successful:', response.data);

      // Refresh template list and show it
      await loadSavedTemplates();
      setShowTemplateList(true);

    } catch (error: any) {
      console.error('Error saving template:', error);
      if (error.response) {
        console.error('Template save error response:', error.response.data);
        alert(`Error saving template: ${error.response.data.message || error.response.data.error || 'Unknown error'}`);
      } else if (error.request) {
        console.error('No response received:', error.request);
        alert('Error saving template: No response from server');
      } else {
        console.error('Error details:', error.message);
        alert(`Error saving template: ${error.message}`);
      }
    }
  };

  const calculatePeriodDuration = (startTime: string, endTime: string) => {
    const start = new Date(`1970-01-01T${startTime}`);
    const end = new Date(`1970-01-01T${endTime}`);
    return Math.floor((end.getTime() - start.getTime()) / (1000 * 60));
  };

  const generateEmptyScheduleTemplate = () => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const template: any = {};

    days.forEach(day => {
      template[day] = {};
      schedule.period_timings.forEach((period, index) => {
        if (!period.is_break) {
          const periodNumber = period.name.replace('Period ', '');
          template[day][periodNumber] = {
            subject_id: null,
            faculty_id: null,
            room: '',
            notes: ''
          };
        }
      });
    });

    return template;
  };

  const saveSchedule = async () => {
    console.log('saveSchedule called with schedule:', schedule);

    if (!schedule.name.trim()) {
      alert('Please enter a schedule name');
      return;
    }

    try {
      console.log('Sending schedule data to /api/schedules');

      const response = await api.post('/schedules', schedule);

      console.log('Schedule API response status:', response.status);
      console.log('Schedule saved successfully:', response.data);
      alert('Schedule saved successfully!');
    } catch (error: any) {
      console.error('Error saving schedule:', error);
      if (error.response) {
        console.error('Schedule save error:', error.response.data);
        const errorMsg = error.response.data.message || error.response.data.error || JSON.stringify(error.response.data);
        alert(`Error saving schedule: ${errorMsg}`);
      } else if (error.request) {
        console.error('No response received:', error.request);
        alert('Error saving schedule: No response from server');
      } else {
        alert(`Error saving schedule: ${error.message}`);
      }
    }
  };

  const renderTemplateList = () => {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">📋 Saved Period Timing Templates</h2>
          <button
            onClick={createNewTemplate}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
          >
            ➕ Create New Template
          </button>
        </div>

        {isLoadingTemplates ? (
          <div className="text-center py-8">
            <div className="text-gray-500">Loading templates...</div>
          </div>
        ) : savedTemplates.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg mb-4">📝 No templates created yet</div>
            <p className="text-gray-500 mb-6">Create your first period timing template to get started!</p>
            <button
              onClick={createNewTemplate}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
            >
              Create First Template
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedTemplates.map((template) => (
              <div key={template._id} className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">{template.name}</h3>
                    <p className="text-sm text-gray-600 mb-2">{template.description}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>📚 {template.periods_per_day} periods</span>
                      <span>📅 {template.days?.length || 5} days</span>
                    </div>
                  </div>
                </div>

                {/* Template Details */}
                {template.guidelines?.period_timings && (
                  <div className="mb-4">
                    <div className="text-xs font-medium text-gray-700 mb-2">Period Structure:</div>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {template.guidelines.period_timings.slice(0, 3).map((timing: any, index: number) => (
                        <div key={index} className="flex justify-between text-xs bg-white p-2 rounded">
                          <span className={timing.is_break ? 'text-orange-600' : 'text-blue-600'}>
                            {timing.period_name}
                          </span>
                          <span className="text-gray-500">
                            {timing.start_time} - {timing.end_time}
                          </span>
                        </div>
                      ))}
                      {template.guidelines.period_timings.length > 3 && (
                        <div className="text-xs text-gray-400 text-center">
                          +{template.guidelines.period_timings.length - 3} more periods...
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => loadTemplate(template._id)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm font-medium transition-colors duration-200"
                  >
                    ✎ Edit
                  </button>
                  <button
                    onClick={() => {
                      loadTemplate(template._id);
                      // Create a copy with new name
                      setTimeout(() => {
                        setSchedule(prev => ({
                          ...prev,
                          name: `${prev.name} (Copy)`
                        }));
                        setSelectedTemplate(null);
                      }, 500);
                    }}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded text-sm font-medium transition-colors duration-200"
                  >
                    📋 Copy
                  </button>
                  <button
                    onClick={() => deleteTemplate(template._id)}
                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded text-sm font-medium transition-colors duration-200"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderTimelineView = () => {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Timeline View</h3>

        {/* Quick Edit Instructions */}
        <div className="bg-green-50 border-l-4 border-green-500 p-3 rounded mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-4 w-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-2">
              <p className="text-xs text-green-700">
                <strong>✨ Inline Duration Editing:</strong> Click on any duration input field below to instantly change period/break lengths.
                Timeline automatically adjusts subsequent periods!
              </p>
            </div>
          </div>
        </div>

        <div className="text-sm text-gray-600 mb-4 flex items-center">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
          </svg>
          Drag the handle (⋮⋮) or use ↑↓ buttons to reorder periods and breaks
        </div>
        <div className="space-y-2">
          {schedule.period_timings.map((period, index) => (
            <div
              key={period.id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
              onDrop={(e) => handleDrop(e, index)}
              className={`flex items-center justify-between p-4 rounded-lg transition-all ${
                period.is_break
                  ? 'bg-orange-100 hover:bg-orange-200 border-l-4 border-orange-500'
                  : 'bg-blue-100 hover:bg-blue-200 border-l-4 border-blue-500'
              } ${selectedPeriod?.id === period.id ? 'ring-2 ring-blue-300' : ''} ${
                draggedIndex === index ? 'opacity-50 transform scale-105 shadow-lg' : ''
              }`}
            >
              <div className="flex items-center space-x-4">
                <div className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 text-lg font-bold select-none">
                  ⋮⋮
                </div>
                <div className="text-sm font-mono">
                  {period.start_time} - {period.end_time}
                </div>
                <div className="flex-1">
                  <div className="font-medium">
                    {period.name}
                  </div>
                  <div className="text-sm text-gray-600 flex items-center gap-2">
                    {period.is_break ? (
                      <div className="flex items-center gap-2">
                        <span>Break Duration:</span>
                        <input
                          type="number"
                          min="5"
                          max="120"
                          value={period.break_duration || 15}
                          onChange={(e) => {
                            const newDuration = parseInt(e.target.value);
                            const updatedPeriod = { ...period, break_duration: newDuration };
                            // Recalculate end time based on new duration
                            if (period.start_time) {
                              const start = new Date(`1970-01-01T${period.start_time}`);
                              start.setMinutes(start.getMinutes() + newDuration);
                              updatedPeriod.end_time = start.toTimeString().slice(0, 5);
                            }
                            updatePeriod(updatedPeriod);
                          }}
                          className="w-16 px-1 py-0.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <span>min</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span>Period Duration:</span>
                        <input
                          type="number"
                          min="30"
                          max="90"
                          value={(() => {
                            if (!period.start_time || !period.end_time) return 50;
                            const start = new Date(`1970-01-01T${period.start_time}`);
                            const end = new Date(`1970-01-01T${period.end_time}`);
                            return Math.round((end.getTime() - start.getTime()) / (1000 * 60));
                          })()}
                          onChange={(e) => {
                            const newDuration = parseInt(e.target.value);
                            if (period.start_time) {
                              const start = new Date(`1970-01-01T${period.start_time}`);
                              start.setMinutes(start.getMinutes() + newDuration);
                              const updatedPeriod = {
                                ...period,
                                end_time: start.toTimeString().slice(0, 5)
                              };
                              updatePeriod(updatedPeriod);
                            }
                          }}
                          className="w-16 px-1 py-0.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <span>min</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    movePeriodUp(index);
                  }}
                  disabled={index === 0}
                  className="text-gray-600 hover:text-gray-800 text-sm px-2 py-1 rounded hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Move up"
                >
                  ↑
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    movePeriodDown(index);
                  }}
                  disabled={index === schedule.period_timings.length - 1}
                  className="text-gray-600 hover:text-gray-800 text-sm px-2 py-1 rounded hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Move down"
                >
                  ↓
                </button>

                {/* Insert options */}
                <div className="relative group">
                  <button
                    className="text-green-600 hover:text-green-800 text-sm px-2 py-1 rounded hover:bg-green-50"
                    title="Insert new period/break"
                  >
                    ➕
                  </button>
                  <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg z-10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                    <div className="p-2 space-y-1 min-w-40">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          insertPeriodAt(index, 'period');
                        }}
                        className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 rounded flex items-center gap-2"
                      >
                        📚 Insert Period
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          insertPeriodAt(index, 'break');
                        }}
                        className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-orange-50 rounded flex items-center gap-2"
                      >
                        ☕ Insert Break
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          insertPeriodAt(index, 'lunch');
                        }}
                        className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-yellow-50 rounded flex items-center gap-2"
                      >
                        🍽️ Insert Lunch
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPeriod(period);
                    setIsEditing(true);
                  }}
                  className="text-blue-600 hover:text-blue-800 text-sm px-2 py-1 rounded hover:bg-blue-50"
                >
                  ✎ Edit
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deletePeriod(period.id);
                  }}
                  className="text-red-600 hover:text-red-800 text-sm px-2 py-1 rounded hover:bg-red-50"
                >
                  ✕ Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderEditModal = () => {
    if (!selectedPeriod || !isEditing) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <h3 className="text-lg font-semibold mb-4">
            Edit {selectedPeriod.is_break ? 'Break' : 'Period'}
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Name
              </label>
              <input
                type="text"
                value={selectedPeriod.name}
                onChange={(e) => setSelectedPeriod({
                  ...selectedPeriod,
                  name: e.target.value
                })}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Period 1, Morning Break, Lunch"
              />
            </div>

            {/* Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type
              </label>
              <div className="flex gap-3">
                <label className="flex items-center">
                  <input
                    type="radio"
                    checked={!selectedPeriod.is_break}
                    onChange={() => setSelectedPeriod({
                      ...selectedPeriod,
                      is_break: false,
                      break_duration: undefined
                    })}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">📚 Teaching Period</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    checked={selectedPeriod.is_break}
                    onChange={() => setSelectedPeriod({
                      ...selectedPeriod,
                      is_break: true,
                      break_duration: selectedPeriod.break_duration || 15
                    })}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">☕ Break/Lunch</span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Time
                </label>
                <input
                  type="time"
                  value={selectedPeriod.start_time}
                  onChange={(e) => setSelectedPeriod({
                    ...selectedPeriod,
                    start_time: e.target.value
                  })}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Time
                </label>
                <input
                  type="time"
                  value={selectedPeriod.end_time}
                  onChange={(e) => setSelectedPeriod({
                    ...selectedPeriod,
                    end_time: e.target.value
                  })}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {!selectedPeriod.is_break && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Period Duration (minutes)
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="number"
                    min="30"
                    max="90"
                    value={(() => {
                      if (!selectedPeriod.start_time || !selectedPeriod.end_time) return 50;
                      const start = new Date(`1970-01-01T${selectedPeriod.start_time}`);
                      const end = new Date(`1970-01-01T${selectedPeriod.end_time}`);
                      return Math.round((end.getTime() - start.getTime()) / (1000 * 60));
                    })()}
                    onChange={(e) => {
                      const duration = parseInt(e.target.value);
                      if (selectedPeriod.start_time) {
                        const start = new Date(`1970-01-01T${selectedPeriod.start_time}`);
                        start.setMinutes(start.getMinutes() + duration);
                        setSelectedPeriod({
                          ...selectedPeriod,
                          end_time: start.toTimeString().slice(0, 5)
                        });
                      }
                    }}
                    className="flex-1 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex gap-2 text-xs">
                  <button
                    onClick={() => {
                      if (selectedPeriod.start_time) {
                        const start = new Date(`1970-01-01T${selectedPeriod.start_time}`);
                        start.setMinutes(start.getMinutes() + 40);
                        setSelectedPeriod({...selectedPeriod, end_time: start.toTimeString().slice(0, 5)});
                      }
                    }}
                    className="bg-blue-100 hover:bg-blue-200 px-2 py-1 rounded"
                  >
                    40min
                  </button>
                  <button
                    onClick={() => {
                      if (selectedPeriod.start_time) {
                        const start = new Date(`1970-01-01T${selectedPeriod.start_time}`);
                        start.setMinutes(start.getMinutes() + 50);
                        setSelectedPeriod({...selectedPeriod, end_time: start.toTimeString().slice(0, 5)});
                      }
                    }}
                    className="bg-blue-100 hover:bg-blue-200 px-2 py-1 rounded"
                  >
                    50min
                  </button>
                  <button
                    onClick={() => {
                      if (selectedPeriod.start_time) {
                        const start = new Date(`1970-01-01T${selectedPeriod.start_time}`);
                        start.setMinutes(start.getMinutes() + 60);
                        setSelectedPeriod({...selectedPeriod, end_time: start.toTimeString().slice(0, 5)});
                      }
                    }}
                    className="bg-blue-100 hover:bg-blue-200 px-2 py-1 rounded"
                  >
                    60min
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">Automatically updates end time</p>
              </div>
            )}

            {selectedPeriod.is_break && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Break Duration (minutes)
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="number"
                    min="5"
                    max="120"
                    value={selectedPeriod.break_duration || 15}
                    onChange={(e) => setSelectedPeriod({
                      ...selectedPeriod,
                      break_duration: parseInt(e.target.value)
                    })}
                    className="flex-1 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex gap-2 text-xs">
                  <button
                    onClick={() => setSelectedPeriod({...selectedPeriod, break_duration: 10})}
                    className="bg-orange-100 hover:bg-orange-200 px-2 py-1 rounded"
                  >
                    10min
                  </button>
                  <button
                    onClick={() => setSelectedPeriod({...selectedPeriod, break_duration: 15})}
                    className="bg-orange-100 hover:bg-orange-200 px-2 py-1 rounded"
                  >
                    15min
                  </button>
                  <button
                    onClick={() => setSelectedPeriod({...selectedPeriod, break_duration: 30})}
                    className="bg-orange-100 hover:bg-orange-200 px-2 py-1 rounded"
                  >
                    30min
                  </button>
                  <button
                    onClick={() => setSelectedPeriod({...selectedPeriod, break_duration: 60})}
                    className="bg-yellow-100 hover:bg-yellow-200 px-2 py-1 rounded"
                  >
                    60min (Lunch)
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <button
              onClick={() => { setSelectedPeriod(null); setIsEditing(false); }}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                updatePeriod(selectedPeriod);
                setSelectedPeriod(null);
                setIsEditing(false);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Period & Timing Canvas</h1>
        <p className="text-gray-600 mb-2">Design timing structures with periods and breaks - perfect for creating reusable templates</p>
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                <strong>Templates vs Schedules:</strong> Templates define timing structure without subjects - perfect for reuse across different classes.
                Schedules are specific configurations for immediate use.
              </p>
            </div>
          </div>
        </div>
      </div>

      {showTemplateList ? (
        renderTemplateList()
      ) : (
        <>
          {/* Schedule Configuration */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">Schedule Configuration</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Template/Schedule Name *
                    </label>
                    <input
                      type="text"
                      value={schedule.name}
                      onChange={(e) => setSchedule({...schedule, name: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Regular College Timing, Engineering Schedule"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <input
                      type="text"
                      value={schedule.description}
                      onChange={(e) => setSchedule({...schedule, description: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Standard 8-period schedule with lunch break"
                    />
                  </div>
                </div>

                {/* Timing Configuration Section */}
                <div className="bg-blue-50 rounded-lg p-4 mb-6">
                  <h3 className="text-lg font-semibold text-blue-900 mb-4">📅 Overall Schedule Timing</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Schedule Start Time *
                      </label>
                      <input
                        type="time"
                        value={schedule.start_time}
                        onChange={(e) => setSchedule({...schedule, start_time: e.target.value})}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Schedule End Time *
                      </label>
                      <input
                        type="time"
                        value={schedule.end_time}
                        onChange={(e) => setSchedule({...schedule, end_time: e.target.value})}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Number of Periods
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="12"
                        value={schedule.periods_per_day}
                        onChange={(e) => setSchedule({...schedule, periods_per_day: parseInt(e.target.value)})}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Period Duration Settings */}
                <div className="bg-green-50 rounded-lg p-4 mb-6">
                  <h3 className="text-lg font-semibold text-green-900 mb-4">⏰ Period Duration Settings</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Standard Period Duration (minutes)
                      </label>
                      <input
                        type="number"
                        min="30"
                        max="90"
                        value={schedule.standard_period_duration}
                        onChange={(e) => setSchedule({...schedule, standard_period_duration: parseInt(e.target.value)})}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">Default duration for each period</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Period Type
                      </label>
                      <select className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500">
                        <option value="uniform">All periods same duration</option>
                        <option value="custom">Custom duration per period</option>
                      </select>
                    </div>

                    <div className="flex flex-col justify-end">
                      <button
                        onClick={() => {
                          // Apply standard duration to all periods
                          setSchedule(prev => ({
                            ...prev,
                            period_timings: prev.period_timings.map(period => {
                              if (!period.is_break && period.start_time) {
                                const start = new Date(`1970-01-01T${period.start_time}`);
                                start.setMinutes(start.getMinutes() + prev.standard_period_duration);
                                return {
                                  ...period,
                                  end_time: start.toTimeString().slice(0, 5)
                                };
                              }
                              return period;
                            })
                          }));
                          // Regenerate timeline to fix gaps
                          setTimeout(() => generateDefaultSchedule(), 100);
                        }}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
                      >
                        📐 Apply to All Periods
                      </button>
                      <p className="text-xs text-gray-500 mt-1">Sets all periods to standard duration</p>
                    </div>
                  </div>
                </div>

                {/* Break Timing Settings */}
                <div className="bg-orange-50 rounded-lg p-4 mb-6">
                  <h3 className="text-lg font-semibold text-orange-900 mb-4">☕ Break Timing Settings</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Short Break Duration (minutes)
                      </label>
                      <input
                        type="number"
                        min="5"
                        max="30"
                        value={schedule.break_duration}
                        onChange={(e) => setSchedule({...schedule, break_duration: parseInt(e.target.value)})}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Break After Every X Periods
                      </label>
                      <select
                        value={schedule.break_frequency} // Use schedule.break_frequency here
                        onChange={(e) => setSchedule({...schedule, break_frequency: parseInt(e.target.value)})}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      >
                        <option value={1}>After every period</option>
                        <option value={2}>After every 2 periods</option>
                        <option value={3}>After every 3 periods</option>
                        <option value={0}>No automatic breaks</option>
                      </select>
                    </div>

                    <div>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={schedule.auto_generate_breaks}
                          onChange={(e) => setSchedule({...schedule, auto_generate_breaks: e.target.checked})}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700">Auto-generate breaks</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Lunch Break Settings */}
                <div className="bg-yellow-50 rounded-lg p-4 mb-6">
                  <h3 className="text-lg font-semibold text-yellow-900 mb-4">🍽️ Lunch Break Settings</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Lunch Break Duration (minutes)
                      </label>
                      <input
                        type="number"
                        min="30"
                        max="120"
                        value={schedule.lunch_duration}
                        onChange={(e) => setSchedule({...schedule, lunch_duration: parseInt(e.target.value)})}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Lunch Break After Period
                      </label>
                      <select
                        value={schedule.lunch_break_after_period}
                        onChange={(e) => setSchedule({...schedule, lunch_break_after_period: parseInt(e.target.value)})}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                      >
                        {Array.from({length: schedule.periods_per_day}, (_, i) => (
                          <option key={i+1} value={i+1}>After Period {i+1}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Lunch Break Start Time (Optional)
                      </label>
                      <input
                        type="time"
                        placeholder="Auto-calculated"
                        className="w-full p-3 border border-gray-300 rounded-lg bg-gray-100"
                        readOnly // This input is for display if auto-calculated
                      />
                      <p className="text-xs text-gray-500 mt-1">Leave empty for auto-calculation</p>
                    </div>
                  </div>
                </div>

                {/* Dynamic Period Management */}
                <div className="bg-purple-50 rounded-lg p-4 mb-6">
                  <h3 className="text-lg font-semibold text-purple-900 mb-4">🎯 Dynamic Period & Break Management</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Add New Period
                      </label>
                      <button
                        onClick={addNewPeriod}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2"
                      >
                        ➕ Add Period
                      </button>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Add Break
                      </label>
                      <button
                        onClick={addNewBreak}
                        className="w-full bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2"
                      >
                        ☕ Add Break
                      </button>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Add Extra Period
                      </label>
                      <button
                        onClick={addExtraPeriod}
                        className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2"
                      >
                        ⭐ Add Extra
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Total Periods Count
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="1"
                          max="15"
                          value={schedule.periods_per_day}
                          onChange={(e) => {
                            const newCount = parseInt(e.target.value);
                            setSchedule({...schedule, periods_per_day: newCount});
                            adjustPeriodsToCount(newCount);
                          }}
                          className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        />
                        <button
                          onClick={() => adjustPeriodsToCount(schedule.periods_per_day)}
                          className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg text-sm"
                          title="Apply count change"
                        >
                          ✓ Apply
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Quick Actions
                      </label>
                      <div className="flex gap-2">
                        <button
                          onClick={clearAllPeriods}
                          className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm flex-1"
                        >
                          🗑️ Clear All
                        </button>
                        <button
                          onClick={resetToDefault}
                          className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded-lg text-sm flex-1"
                        >
                          🔄 Reset
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-purple-50 rounded-lg p-4 mb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-purple-900 mb-2">🔄 Auto-Generate Schedule</h3>
                      <p className="text-sm text-purple-700">
                        Click to generate a complete schedule based on your timing settings above.
                      </p>
                    </div>
                    <button
                      onClick={generateDefaultSchedule}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
                    >
                      ⚡ Generate Schedule
                    </button>
                  </div>
                </div>

                {/* Schedule Preview */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">📊 Schedule Overview</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                    <div className="bg-white p-3 rounded border">
                      <span className="font-medium text-gray-600">Total Periods:</span>
                      <div className="text-xl font-bold text-blue-600">{schedule.period_timings.filter(p => !p.is_break).length}</div>
                    </div>
                    <div className="bg-white p-3 rounded border">
                      <span className="font-medium text-gray-600">Total Breaks:</span>
                      <div className="text-xl font-bold text-orange-600">{schedule.period_timings.filter(p => p.is_break).length}</div>
                    </div>
                    <div className="bg-white p-3 rounded border">
                      <span className="font-medium text-gray-600">Total Duration:</span>
                      <div className="text-xl font-bold text-green-600">{calculateTotalDuration()}</div>
                    </div>
                    <div className="bg-white p-3 rounded border">
                      <span className="font-medium text-gray-600">Start - End:</span>
                      <div className="text-xl font-bold text-purple-600">{schedule.start_time} - {schedule.end_time}</div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Calculated End Time
                    </label>
                    <input
                      type="time"
                      value={schedule.end_time}
                      readOnly
                      className="w-full p-3 border border-gray-300 rounded-lg bg-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Total Duration
                    </label>
                    <input
                      type="text"
                      value={calculateTotalDuration()}
                      readOnly
                      className="w-full p-3 border border-gray-300 rounded-lg bg-gray-100"
                    />
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="text-lg font-medium mb-3">Auto-Generate Settings</h3>

                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={schedule.auto_generate_breaks}
                        onChange={(e) => setSchedule({...schedule, auto_generate_breaks: e.target.checked})}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">Auto-generate breaks</span>
                    </label>

                    {schedule.auto_generate_breaks && (
                      <div className="grid grid-cols-2 gap-4 ml-6">
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">Break Duration (min)</label>
                          <input
                            type="number"
                            min="5"
                            max="30"
                            value={schedule.break_duration}
                            onChange={(e) => setSchedule({...schedule, break_duration: parseInt(e.target.value)})}
                            className="w-full p-2 border border-gray-300 rounded"
                          />
                        </div>

                        <div>
                          <label className="block text-sm text-gray-600 mb-1">Lunch after Period</label>
                          <input
                            type="number"
                            min="1"
                            max="10"
                            value={schedule.lunch_break_after_period}
                            onChange={(e) => setSchedule({...schedule, lunch_break_after_period: parseInt(e.target.value)})}
                            className="w-full p-2 border border-gray-300 rounded"
                          />
                        </div>

                        <div className="col-span-2">
                          <label className="block text-sm text-gray-600 mb-1">Lunch Duration (min)</label>
                          <input
                            type="number"
                            min="30"
                            max="120"
                            value={schedule.lunch_duration}
                            onChange={(e) => setSchedule({...schedule, lunch_duration: parseInt(e.target.value)})}
                            className="w-full p-2 border border-gray-300 rounded"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="space-y-4">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-3">Schedule Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Total Periods:</span>
                    <span className="font-medium">{schedule.period_timings.filter(p => !p.is_break).length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Breaks:</span>
                    <span className="font-medium">{schedule.period_timings.filter(p => p.is_break).length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Duration:</span>
                    <span className="font-medium">{calculateTotalDuration()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Start - End:</span>
                    <span className="font-medium">{schedule.start_time} - {schedule.end_time}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-3">Quick Actions</h3>
                <div className="space-y-2">
                  <button
                    onClick={addCustomPeriod}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                  >
                    + Add Period
                  </button>
                  <button
                    onClick={addCustomBreak}
                    className="w-full px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 text-sm"
                  >
                    + Add Break
                  </button>
                  <button
                    onClick={generateDefaultSchedule}
                    className="w-full px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm"
                  >
                    🔄 Reset Schedule
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-3">Template Actions</h3>
                <div className="space-y-3 text-sm">
                  <div className="p-3 bg-purple-50 rounded border-l-4 border-purple-500">
                    <div className="font-medium text-purple-800">📝 Create Timing Template</div>
                    <div className="text-purple-600 mt-1">
                      Save this timing structure as a reusable template. Templates define periods and breaks without subject assignments.
                    </div>
                  </div>
                  <div className="p-3 bg-green-50 rounded border-l-4 border-green-500">
                    <div className="font-medium text-green-800">💾 Save Schedule</div>
                    <div className="text-green-600 mt-1">
                      Save as a schedule for future reference and modifications.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Timeline View */}
          {renderTimelineView()}

          {/* Action Buttons */}
          <div className="flex justify-between mt-6">
            <button
              onClick={() => navigate('/admin')}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Back to Dashboard
            </button>

            <div className="space-x-3">
              <button
                onClick={saveAsTemplate}
                disabled={!schedule.name.trim()}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
              >
                📝 Create Timing Template
              </button>
              <button
                onClick={saveSchedule}
                disabled={!schedule.name.trim()}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                💾 Save Schedule
              </button>
            </div>
          </div>
        </>
      )}

      {/* Edit Modal */}
      {renderEditModal()}
    </div>
  );
};

export default PeriodTimingCanvas;