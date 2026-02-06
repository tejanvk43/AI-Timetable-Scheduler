import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface Template {
  _id?: string;
  name: string;
  description: string;
  periods_per_day: number;
  days: string[];
  guidelines: {
    labs_consecutive: boolean;
    labs_once_a_week: boolean;
    extra_periods_once_a_week: boolean;
    sports_last_period_predefined_day: string;
    no_parallel_classes_same_faculty: boolean;
    minimize_consecutive_faculty_periods: boolean;
    assign_faculty_to_extra_periods: boolean;
    no_same_class_subject_repeat_day: boolean;
    custom_constraints: string[];
  };
  schedule_template: Map<string, TemplateEntry[]>;
  is_public: boolean;
  usage_count?: number;
  created_by?: {
    name: string;
    faculty_id: string;
  };
}

interface TemplateEntry {
  period: number;
  subject_placeholder: string;
  faculty_placeholder: string;
  is_lab: boolean;
  is_fixed: boolean;
  notes: string;
}

const TimetableCanvas: React.FC = () => {
  const navigate = useNavigate();
  const [template, setTemplate] = useState<Template>({
    name: '',
    description: '',
    periods_per_day: 8,
    days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
    guidelines: {
      labs_consecutive: true,
      labs_once_a_week: true,
      extra_periods_once_a_week: true,
      sports_last_period_predefined_day: 'Friday',
      no_parallel_classes_same_faculty: true,
      minimize_consecutive_faculty_periods: true,
      assign_faculty_to_extra_periods: true,
      no_same_class_subject_repeat_day: true,
      custom_constraints: []
    },
    schedule_template: new Map(),
    is_public: false
  });

  const [showTemplateModal, setShowTemplateModal] = useState(true);
  const [existingTemplates, setExistingTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingCell, setEditingCell] = useState<{day: string, period: number} | null>(null);

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const periodOptions = [4, 5, 6, 7, 8, 9, 10];

  useEffect(() => {
    fetchExistingTemplates();
  }, []);

  const fetchExistingTemplates = async () => {
    try {
      const response = await fetch('/api/templates', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setExistingTemplates(data);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const loadExistingTemplate = async (templateId: string) => {
    try {
      const response = await fetch(`/api/templates/${templateId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setTemplate({
          ...data,
          schedule_template: new Map(Object.entries(data.schedule_template || {}))
        });
        setShowTemplateModal(false);
      }
    } catch (error) {
      console.error('Error loading template:', error);
    }
  };

  const createNewTemplate = () => {
    setTemplate({
      name: '',
      description: '',
      periods_per_day: 8,
      days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
      guidelines: {
        labs_consecutive: true,
        labs_once_a_week: true,
        extra_periods_once_a_week: true,
        sports_last_period_predefined_day: 'Friday',
        no_parallel_classes_same_faculty: true,
        minimize_consecutive_faculty_periods: true,
        assign_faculty_to_extra_periods: true,
        no_same_class_subject_repeat_day: true,
        custom_constraints: []
      },
      schedule_template: new Map(),
      is_public: false
    });
    setShowTemplateModal(false);
  };

  const handleSaveTemplate = async () => {
    if (!template.name.trim()) {
      alert('Please enter a template name');
      return;
    }

    setIsLoading(true);
    try {
      const templateData = {
        ...template,
        schedule_template: Object.fromEntries(template.schedule_template)
      };

      const url = template._id ? `/api/templates/${template._id}` : '/api/templates';
      const method = template._id ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(templateData)
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Template ${template._id ? 'updated' : 'created'} successfully!`);
        setTemplate(result.template);
        fetchExistingTemplates();
      } else {
        const error = await response.json();
        alert(`Error: ${error.message}`);
      }
    } catch (error) {
      console.error('Error saving template:', error);
      alert('Error saving template');
    }
    setIsLoading(false);
  };

  const addPeriodToCell = (day: string, period: number) => {
    const dayKey = day.toLowerCase();
    const currentEntries = template.schedule_template.get(dayKey) || [];
    
    const newEntry: TemplateEntry = {
      period,
      subject_placeholder: 'Subject Name',
      faculty_placeholder: 'Faculty Name',
      is_lab: false,
      is_fixed: false,
      notes: ''
    };

    const updatedEntries = [...currentEntries, newEntry].sort((a, b) => a.period - b.period);
    const newScheduleTemplate = new Map(template.schedule_template);
    newScheduleTemplate.set(dayKey, updatedEntries);

    setTemplate({
      ...template,
      schedule_template: newScheduleTemplate
    });
  };

  const updatePeriodEntry = (day: string, periodIndex: number, field: string, value: any) => {
    const dayKey = day.toLowerCase();
    const currentEntries = template.schedule_template.get(dayKey) || [];
    const updatedEntries = [...currentEntries];
    
    if (updatedEntries[periodIndex]) {
      updatedEntries[periodIndex] = {
        ...updatedEntries[periodIndex],
        [field]: value
      };
    }

    const newScheduleTemplate = new Map(template.schedule_template);
    newScheduleTemplate.set(dayKey, updatedEntries);

    setTemplate({
      ...template,
      schedule_template: newScheduleTemplate
    });
  };

  const removePeriodEntry = (day: string, periodIndex: number) => {
    const dayKey = day.toLowerCase();
    const currentEntries = template.schedule_template.get(dayKey) || [];
    const updatedEntries = currentEntries.filter((_, index) => index !== periodIndex);

    const newScheduleTemplate = new Map(template.schedule_template);
    newScheduleTemplate.set(dayKey, updatedEntries);

    setTemplate({
      ...template,
      schedule_template: newScheduleTemplate
    });
  };

  const getCellEntries = (day: string) => {
    return template.schedule_template.get(day.toLowerCase()) || [];
  };

  const renderTimetableGrid = () => {
    return (
      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full table-auto">
          <thead>
            <tr className="bg-blue-600 text-white">
              <th className="px-4 py-3 text-left font-semibold">Day</th>
              {Array.from({ length: template.periods_per_day }, (_, i) => (
                <th key={i} className="px-4 py-3 text-center font-semibold">
                  Period {i + 1}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {daysOfWeek.slice(0, template.days.length).map((day, dayIndex) => (
              <tr key={day} className={dayIndex % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                <td className="px-4 py-3 font-medium text-gray-900 border-r">
                  {day}
                </td>
                {Array.from({ length: template.periods_per_day }, (_, periodIndex) => {
                  const periodNumber = periodIndex + 1;
                  const dayEntries = getCellEntries(day);
                  const periodEntry = dayEntries.find(entry => entry.period === periodNumber);
                  
                  return (
                    <td key={periodIndex} className="px-2 py-2 border-r border-b min-w-[150px]">
                      {periodEntry ? (
                        <div className={`p-2 rounded text-sm ${periodEntry.is_lab ? 'bg-purple-100 border-purple-300' : 'bg-blue-100 border-blue-300'} border`}>
                          <div className="font-semibold text-gray-800">
                            {periodEntry.subject_placeholder}
                          </div>
                          <div className="text-gray-600 text-xs">
                            {periodEntry.faculty_placeholder}
                          </div>
                          {periodEntry.is_lab && (
                            <div className="text-purple-600 text-xs font-medium">LAB</div>
                          )}
                          {periodEntry.is_fixed && (
                            <div className="text-red-600 text-xs font-medium">FIXED</div>
                          )}
                          <div className="flex justify-between mt-1">
                            <button
                              onClick={() => setEditingCell({day, period: periodNumber})}
                              className="text-blue-600 hover:text-blue-800 text-xs"
                            >
                              ✎ Edit
                            </button>
                            <button
                              onClick={() => {
                                const entryIndex = dayEntries.findIndex(e => e.period === periodNumber);
                                removePeriodEntry(day, entryIndex);
                              }}
                              className="text-red-600 hover:text-red-800 text-xs"
                            >
                              ✕ Remove
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => addPeriodToCell(day, periodNumber)}
                          className="w-full h-16 border-2 border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50 rounded text-gray-500 hover:text-blue-600 transition-colors"
                        >
                          + Add Entry
                        </button>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  if (showTemplateModal) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
          <h2 className="text-2xl font-bold mb-4">Choose Template Option</h2>
          
          <div className="space-y-4">
            <div>
              <button
                onClick={createNewTemplate}
                className="w-full p-4 border-2 border-blue-300 hover:border-blue-500 rounded-lg text-left transition-colors"
              >
                <div className="font-semibold text-blue-600">Create New Template</div>
                <div className="text-gray-600 text-sm">Start with a blank template</div>
              </button>
            </div>

            {existingTemplates.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Or load existing template:</h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {existingTemplates.map((temp) => (
                    <div
                      key={temp._id}
                      className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                      onClick={() => temp._id && loadExistingTemplate(temp._id)}
                    >
                      <div className="font-semibold">{temp.name}</div>
                      <div className="text-sm text-gray-600">{temp.description}</div>
                      <div className="text-xs text-gray-500">
                        {temp.periods_per_day} periods/day • {temp.usage_count || 0} times used
                        {temp.is_public && ' • Public'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <button
              onClick={() => navigate('/admin')}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Timetable Template Designer</h1>
        <p className="text-gray-600">Create and customize reusable timetable templates</p>
      </div>

      {/* Template Info Section */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Template Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Template Name *
            </label>
            <input
              type="text"
              value={template.name}
              onChange={(e) => setTemplate({...template, name: e.target.value})}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter template name"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Periods per Day
            </label>
            <select
              value={template.periods_per_day}
              onChange={(e) => setTemplate({...template, periods_per_day: parseInt(e.target.value)})}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {periodOptions.map(num => (
                <option key={num} value={num}>{num} periods</option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={template.description}
              onChange={(e) => setTemplate({...template, description: e.target.value})}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              placeholder="Describe this template..."
            />
          </div>
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={template.is_public}
                onChange={(e) => setTemplate({...template, is_public: e.target.checked})}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">Make this template public</span>
            </label>
          </div>
        </div>
      </div>

      {/* Guidelines Section */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Timetable Guidelines</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={template.guidelines.labs_consecutive}
              onChange={(e) => setTemplate({
                ...template,
                guidelines: {...template.guidelines, labs_consecutive: e.target.checked}
              })}
              className="w-4 h-4 text-blue-600"
            />
            <span className="text-sm">Labs should be consecutive periods</span>
          </label>

          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={template.guidelines.labs_once_a_week}
              onChange={(e) => setTemplate({
                ...template,
                guidelines: {...template.guidelines, labs_once_a_week: e.target.checked}
              })}
              className="w-4 h-4 text-blue-600"
            />
            <span className="text-sm">Schedule labs once a week</span>
          </label>

          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={template.guidelines.no_parallel_classes_same_faculty}
              onChange={(e) => setTemplate({
                ...template,
                guidelines: {...template.guidelines, no_parallel_classes_same_faculty: e.target.checked}
              })}
              className="w-4 h-4 text-blue-600"
            />
            <span className="text-sm">No parallel classes for same faculty</span>
          </label>

          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={template.guidelines.minimize_consecutive_faculty_periods}
              onChange={(e) => setTemplate({
                ...template,
                guidelines: {...template.guidelines, minimize_consecutive_faculty_periods: e.target.checked}
              })}
              className="w-4 h-4 text-blue-600"
            />
            <span className="text-sm">Minimize consecutive faculty periods</span>
          </label>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sports Day
            </label>
            <select
              value={template.guidelines.sports_last_period_predefined_day}
              onChange={(e) => setTemplate({
                ...template,
                guidelines: {...template.guidelines, sports_last_period_predefined_day: e.target.value}
              })}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            >
              <option value="">No specific day</option>
              <option value="Monday">Monday</option>
              <option value="Tuesday">Tuesday</option>
              <option value="Wednesday">Wednesday</option>
              <option value="Thursday">Thursday</option>
              <option value="Friday">Friday</option>
              <option value="Saturday">Saturday</option>
            </select>
          </div>
        </div>
      </div>

      {/* Timetable Grid */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Template Layout</h2>
        {renderTimetableGrid()}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between">
        <div className="space-x-2">
          <button
            onClick={() => setShowTemplateModal(true)}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Load Different Template
          </button>
        </div>
        <div className="space-x-2">
          <button
            onClick={() => navigate('/admin')}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveTemplate}
            disabled={isLoading || !template.name.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Saving...' : template._id ? 'Update Template' : 'Save Template'}
          </button>
        </div>
      </div>

      {/* Edit Cell Modal */}
      {editingCell && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">
              Edit {editingCell.day} - Period {editingCell.period}
            </h3>
            
            {(() => {
              const dayEntries = getCellEntries(editingCell.day);
              const entryIndex = dayEntries.findIndex(e => e.period === editingCell.period);
              const entry = dayEntries[entryIndex];
              
              if (!entry) return null;
              
              return (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Subject Placeholder
                    </label>
                    <input
                      type="text"
                      value={entry.subject_placeholder}
                      onChange={(e) => updatePeriodEntry(editingCell.day, entryIndex, 'subject_placeholder', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Faculty Placeholder
                    </label>
                    <input
                      type="text"
                      value={entry.faculty_placeholder}
                      onChange={(e) => updatePeriodEntry(editingCell.day, entryIndex, 'faculty_placeholder', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={entry.is_lab}
                        onChange={(e) => updatePeriodEntry(editingCell.day, entryIndex, 'is_lab', e.target.checked)}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">This is a lab period</span>
                    </label>
                  </div>
                  
                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={entry.is_fixed}
                        onChange={(e) => updatePeriodEntry(editingCell.day, entryIndex, 'is_fixed', e.target.checked)}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">Fixed position (cannot be moved)</span>
                    </label>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notes
                    </label>
                    <textarea
                      value={entry.notes}
                      onChange={(e) => updatePeriodEntry(editingCell.day, entryIndex, 'notes', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={2}
                    />
                  </div>
                </div>
              );
            })()}
            
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setEditingCell(null)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={() => setEditingCell(null)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimetableCanvas;
