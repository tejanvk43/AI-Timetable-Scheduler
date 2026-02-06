const mongoose = require('mongoose');

const periodTimingSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  start_time: {
    type: String,
    required: true
  },
  end_time: {
    type: String,
    required: true
  },
  is_break: {
    type: Boolean,
    default: false
  },
  break_duration: {
    type: Number,
    min: 0,  // Allow 0 for regular periods (non-breaks)
    max: 120
  },
  order: {
    type: Number,
    required: true
  }
});

const scheduleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  periods_per_day: {
    type: Number,
    required: true,
    min: 1,
    max: 12,
    default: 8
  },
  total_duration_hours: {
    type: Number,
    required: true,
    min: 1,
    max: 24,
    default: 8
  },
  start_time: {
    type: String,
    required: true,
    match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
  },
  end_time: {
    type: String,
    required: true,
    match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
  },
  period_timings: [periodTimingSchema],
  auto_generate_breaks: {
    type: Boolean,
    default: true
  },
  break_duration: {
    type: Number,
    default: 15,
    min: 5,
    max: 30
  },
  lunch_break_after_period: {
    type: Number,
    default: 4,
    min: 1,
    max: 10
  },
  lunch_duration: {
    type: Number,
    default: 60,
    min: 30,
    max: 120
  },
  is_public: {
    type: Boolean,
    default: false
  },
  usage_count: {
    type: Number,
    default: 0
  },
  tags: [{
    type: String,
    trim: true
  }],
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Pre-save middleware to update timestamps
scheduleSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

// Instance methods
scheduleSchema.methods.incrementUsage = function() {
  this.usage_count += 1;
  return this.save();
};

scheduleSchema.methods.getTotalDuration = function() {
  if (this.period_timings.length === 0) return 0;
  
  const firstPeriod = this.period_timings[0];
  const lastPeriod = this.period_timings[this.period_timings.length - 1];
  
  if (!firstPeriod || !lastPeriod) return 0;
  
  const start = new Date(`1970-01-01T${firstPeriod.start_time}`);
  const end = new Date(`1970-01-01T${lastPeriod.end_time}`);
  
  return Math.floor((end.getTime() - start.getTime()) / (1000 * 60)); // Return minutes
};

scheduleSchema.methods.getPeriodsCount = function() {
  return this.period_timings.filter(p => !p.is_break).length;
};

scheduleSchema.methods.getBreaksCount = function() {
  return this.period_timings.filter(p => p.is_break).length;
};

// Static methods
scheduleSchema.statics.getUserSchedules = function(userId) {
  return this.find({ created_by: userId }).sort({ created_at: -1 });
};

scheduleSchema.statics.getPublicSchedules = function() {
  return this.find({ is_public: true }).sort({ usage_count: -1, created_at: -1 });
};

scheduleSchema.statics.getPopularSchedules = function(limit = 10) {
  return this.find({ is_public: true })
    .sort({ usage_count: -1 })
    .limit(limit)
    .populate('created_by', 'username');
};

scheduleSchema.statics.searchSchedules = function(query, userId) {
  const searchRegex = new RegExp(query, 'i');
  
  return this.find({
    $and: [
      {
        $or: [
          { is_public: true },
          { created_by: userId }
        ]
      },
      {
        $or: [
          { name: searchRegex },
          { description: searchRegex },
          { tags: { $in: [searchRegex] } }
        ]
      }
    ]
  }).populate('created_by', 'username');
};

// Virtual for formatted duration
scheduleSchema.virtual('formatted_duration').get(function() {
  const minutes = this.getTotalDuration();
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
});

// Ensure virtual fields are serialized
scheduleSchema.set('toJSON', { virtuals: true });

// Indexes for performance
scheduleSchema.index({ created_by: 1, created_at: -1 });
scheduleSchema.index({ is_public: 1, usage_count: -1 });
scheduleSchema.index({ name: 'text', description: 'text', tags: 'text' });

module.exports = mongoose.model('Schedule', scheduleSchema);
