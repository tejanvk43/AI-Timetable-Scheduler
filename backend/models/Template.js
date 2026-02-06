const mongoose = require('mongoose');

const templateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  periods_per_day: {
    type: Number,
    required: true,
    min: 1,
    max: 12,
    default: 8
  },
  days: {
    type: [String],
    default: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
    validate: {
      validator: function(days) {
        const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        return days.every(day => validDays.includes(day.toLowerCase()));
      },
      message: 'Invalid day specified'
    }
  },
  guidelines: {
    labs_consecutive: { type: Boolean, default: true },
    labs_once_a_week: { type: Boolean, default: true },
    extra_periods_once_a_week: { type: Boolean, default: true },
    sports_last_period_predefined_day: { type: String, default: 'Friday' },
    no_parallel_classes_same_faculty: { type: Boolean, default: true },
    minimize_consecutive_faculty_periods: { type: Boolean, default: true },
    assign_faculty_to_extra_periods: { type: Boolean, default: true },
    no_same_class_subject_repeat_day: { type: Boolean, default: true },
    custom_constraints: [String],
    timing_notes: { type: String },
    period_timings: [{
      period_name: { type: String },
      start_time: { type: String },
      end_time: { type: String },
      is_break: { type: Boolean, default: false },
      break_duration: { type: Number, default: 0 },
      duration_minutes: { type: Number }
    }]
  },
  schedule_template: {
    type: Map,
    of: [{
      period: { type: Number, required: true },
      subject_placeholder: { type: String }, // Placeholder name like "Subject A", "Lab 1"
      faculty_placeholder: { type: String }, // Placeholder name like "Faculty A"
      is_lab: { type: Boolean, default: false },
      is_fixed: { type: Boolean, default: false }, // If true, this slot is fixed in the template
      notes: { type: String }
    }],
    default: () => new Map()
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  is_public: {
    type: Boolean,
    default: false // If true, template can be used by anyone
  },
  usage_count: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for faster searches
templateSchema.index({ name: 1, created_by: 1 });
templateSchema.index({ is_public: 1 });

// Virtual for getting template usage
templateSchema.virtual('timetables', {
  ref: 'Timetable',
  localField: '_id',
  foreignField: 'template_id'
});

// Method to increment usage count
templateSchema.methods.incrementUsage = function() {
  this.usage_count += 1;
  return this.save();
};

// Static method to get public templates
templateSchema.statics.getPublicTemplates = function() {
  return this.find({ is_public: true }).populate('created_by', 'name faculty_id');
};

// Static method to get user templates
templateSchema.statics.getUserTemplates = function(userId) {
  return this.find({ 
    $or: [
      { created_by: userId },
      { is_public: true }
    ]
  }).populate('created_by', 'name faculty_id');
};

module.exports = mongoose.model('Template', templateSchema);
