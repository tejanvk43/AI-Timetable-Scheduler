const mongoose = require('mongoose');

// Schema for period timing
const PeriodTimingSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add period name'],
    trim: true
  },
  start_time: {
    type: String,
    required: [true, 'Please add period start time'],
    trim: true
  },
  end_time: {
    type: String,
    required: [true, 'Please add period end time'],
    trim: true
  },
  is_break: {
    type: Boolean,
    default: false
  },
  break_duration: {
    type: Number,
    default: 0,
    min: 0  // Allow 0 for non-break periods
  }
}, { _id: false });

// Schema for timetable entry
const TimetableEntrySchema = new mongoose.Schema({
  period: {
    type: Number,
    required: [true, 'Please add period number']
  },
  subject_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: [true, 'Please add subject ID']
  },
  faculty_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Please add faculty ID']
  },
  is_lab: {
    type: Boolean,
    default: false
  }
}, { _id: false });

// Schema for timetable guidelines
const GuidelinesSchema = new mongoose.Schema({
  labs_consecutive: {
    type: Boolean,
    default: true
  },
  labs_once_a_week: {
    type: Boolean,
    default: true
  },
  extra_periods_once_a_week: {
    type: Boolean,
    default: true
  },
  sports_last_period_predefined_day: {
    type: String,
    default: 'Friday'
  },
  no_parallel_classes_same_faculty: {
    type: Boolean,
    default: true
  },
  minimize_consecutive_faculty_periods: {
    type: Boolean,
    default: true
  },
  assign_faculty_to_extra_periods: {
    type: Boolean,
    default: true
  },
  no_same_class_subject_repeat_day: {
    type: Boolean,
    default: true
  },
  custom_constraints: {
    type: [String],
    default: []
  }
}, { _id: false });

// Main timetable schema
const TimetableSchema = new mongoose.Schema({
  class_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: [true, 'Please add class ID']
  },
  template_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Template',
    required: false // Optional - timetables can be created with or without templates
  },
  academic_year: {
    type: String,
    required: [true, 'Please add academic year'],
    trim: true
  },   
  periods_per_day: {
    type: Number,
    required: [true, 'Please add number of periods per day'],
    min: [1, 'Must have at least 1 period per day']
  },
  working_days: {
    type: [String],
    default: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
    validate: {
      validator: function(days) {
        const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        return days.every(day => validDays.includes(day));
      },
      message: 'Invalid day specified in working_days'
    }
  },
  period_names: {
    type: [String],
    required: [true, 'Please add period names']
  },
  period_timings: {
    type: [PeriodTimingSchema],
    required: [true, 'Please add period timings']
  },
  break_timings: {
    type: [PeriodTimingSchema],
    default: []
  },
  schedule: {
    monday: [TimetableEntrySchema],
    tuesday: [TimetableEntrySchema],
    wednesday: [TimetableEntrySchema],
    thursday: [TimetableEntrySchema],
    friday: [TimetableEntrySchema],
    saturday: [TimetableEntrySchema]
  },
  guidelines: {
    type: GuidelinesSchema,
    default: () => ({})
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  last_generated: {
    type: Date,
    default: null
  }
});

// Create compound index for class_id and academic_year
TimetableSchema.index({ class_id: 1, academic_year: 1 }, { unique: true });

module.exports = mongoose.model('Timetable', TimetableSchema);
