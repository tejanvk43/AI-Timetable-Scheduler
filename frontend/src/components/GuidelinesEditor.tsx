import React, { useState } from 'react';

interface Guidelines {
  minimize_consecutive_faculty_periods: boolean;
  labs_once_a_week: boolean;
  sports_last_period_predefined_day: string;
  no_breaks_during_labs: boolean;
  max_periods_per_faculty_per_day: number;
  preferred_lab_days: string[];
  avoid_first_period_labs: boolean;
  lunch_break_period: number;
}

interface GuidelinesEditorProps {
  guidelines: Guidelines;
  onSave: (guidelines: Guidelines) => void;
  onCancel: () => void;
}

const GuidelinesEditor: React.FC<GuidelinesEditorProps> = ({
  guidelines,
  onSave,
  onCancel
}) => {
  const [localGuidelines, setLocalGuidelines] = useState<Guidelines>(guidelines);

  const handleToggle = (key: keyof Guidelines) => {
    if (typeof localGuidelines[key] === 'boolean') {
      setLocalGuidelines(prev => ({
        ...prev,
        [key]: !prev[key]
      }));
    }
  };

  const handleSelectChange = (key: keyof Guidelines, value: string) => {
    setLocalGuidelines(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleNumberChange = (key: keyof Guidelines, value: number) => {
    setLocalGuidelines(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleArrayChange = (key: keyof Guidelines, values: string[]) => {
    setLocalGuidelines(prev => ({
      ...prev,
      [key]: values
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(localGuidelines);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full m-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-gray-800">Edit Timetable Guidelines</h3>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Boolean Guidelines */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-gray-700 border-b pb-2">Scheduling Preferences</h4>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <label className="font-medium text-gray-700">Minimize Consecutive Faculty Periods</label>
                  <p className="text-sm text-gray-500">Avoid scheduling the same faculty in consecutive periods</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggle('minimize_consecutive_faculty_periods')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    localGuidelines.minimize_consecutive_faculty_periods ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                      localGuidelines.minimize_consecutive_faculty_periods ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <label className="font-medium text-gray-700">Labs Once a Week</label>
                  <p className="text-sm text-gray-500">Schedule each lab subject only once per week</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggle('labs_once_a_week')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    localGuidelines.labs_once_a_week ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                      localGuidelines.labs_once_a_week ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <label className="font-medium text-gray-700">No Breaks During Labs</label>
                  <p className="text-sm text-gray-500">Schedule lab periods consecutively without breaks</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggle('no_breaks_during_labs')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    localGuidelines.no_breaks_during_labs ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                      localGuidelines.no_breaks_during_labs ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <label className="font-medium text-gray-700">Avoid First Period Labs</label>
                  <p className="text-sm text-gray-500">Don't schedule labs in the first period of the day</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggle('avoid_first_period_labs')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    localGuidelines.avoid_first_period_labs ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                      localGuidelines.avoid_first_period_labs ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Selection Guidelines */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-gray-700 border-b pb-2">Day & Time Preferences</h4>
              
              <div className="p-3 bg-gray-50 rounded-lg">
                <label className="block font-medium text-gray-700 mb-2">Sports Day</label>
                <select
                  value={localGuidelines.sports_last_period_predefined_day}
                  onChange={(e) => handleSelectChange('sports_last_period_predefined_day', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">No specific day</option>
                  <option value="monday">Monday</option>
                  <option value="tuesday">Tuesday</option>
                  <option value="wednesday">Wednesday</option>
                  <option value="thursday">Thursday</option>
                  <option value="friday">Friday</option>
                  <option value="saturday">Saturday</option>
                </select>
                <p className="text-sm text-gray-500 mt-1">Schedule sports in the last period of this day</p>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg">
                <label className="block font-medium text-gray-700 mb-2">Lunch Break Period</label>
                <input
                  type="number"
                  min="1"
                  max="8"
                  value={localGuidelines.lunch_break_period}
                  onChange={(e) => handleNumberChange('lunch_break_period', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-sm text-gray-500 mt-1">Which period number should be the lunch break</p>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg">
                <label className="block font-medium text-gray-700 mb-2">Max Periods per Faculty per Day</label>
                <input
                  type="number"
                  min="1"
                  max="8"
                  value={localGuidelines.max_periods_per_faculty_per_day}
                  onChange={(e) => handleNumberChange('max_periods_per_faculty_per_day', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-sm text-gray-500 mt-1">Maximum periods a faculty can teach in one day</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onCancel}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Save Guidelines
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default GuidelinesEditor;
