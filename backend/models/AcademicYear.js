const mongoose = require('mongoose');

const academicYearSchema = new mongoose.Schema({
  year: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    match: /^\d{4}-\d{4}$/,
    validate: {
      validator: function(v) {
        const [startYear, endYear] = v.split('-').map(Number);
        return endYear === startYear + 1;
      },
      message: 'Academic year format should be YYYY-YYYY (consecutive years)'
    }
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true,
    validate: {
      validator: function(v) {
        return v > this.startDate;
      },
      message: 'End date must be after start date'
    }
  },
  isActive: {
    type: Boolean,
    default: false
  },
  semester1Start: {
    type: Date,
    required: true
  },
  semester1End: {
    type: Date,
    required: true,
    validate: {
      validator: function(v) {
        return v > this.semester1Start;
      },
      message: 'Semester 1 end date must be after start date'
    }
  },
  semester2Start: {
    type: Date,
    required: true,
    validate: {
      validator: function(v) {
        return v > this.semester1End;
      },
      message: 'Semester 2 start date must be after Semester 1 end date'
    }
  },
  semester2End: {
    type: Date,
    required: true,
    validate: {
      validator: function(v) {
        return v > this.semester2Start && v <= this.endDate;
      },
      message: 'Semester 2 end date must be after start date and not exceed academic year end date'
    }
  },
  description: {
    type: String,
    trim: true,
    maxlength: 200
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Middleware to ensure only one active academic year
academicYearSchema.pre('save', async function(next) {
  if (this.isActive) {
    // Set all other academic years to inactive
    await this.constructor.updateMany(
      { _id: { $ne: this._id } },
      { isActive: false }
    );
  }
  
  this.updatedAt = new Date();
  next();
});

// Index for better performance
academicYearSchema.index({ isActive: 1 });
academicYearSchema.index({ startDate: 1, endDate: 1 });

// Static method to get active academic year
academicYearSchema.statics.getActiveYear = function() {
  return this.findOne({ isActive: true });
};

// Static method to get current academic year based on date
academicYearSchema.statics.getCurrentYear = function(date = new Date()) {
  return this.findOne({
    startDate: { $lte: date },
    endDate: { $gte: date }
  });
};

// Method to check if a date falls within this academic year
academicYearSchema.methods.containsDate = function(date) {
  return date >= this.startDate && date <= this.endDate;
};

// Method to get current semester for a given date
academicYearSchema.methods.getCurrentSemester = function(date = new Date()) {
  if (!this.containsDate(date)) {
    return null;
  }
  
  if (date >= this.semester1Start && date <= this.semester1End) {
    return 1;
  } else if (date >= this.semester2Start && date <= this.semester2End) {
    return 2;
  }
  
  return null;
};

// Virtual for academic year duration in days
academicYearSchema.virtual('durationDays').get(function() {
  return Math.ceil((this.endDate - this.startDate) / (1000 * 60 * 60 * 24));
});

module.exports = mongoose.model('AcademicYear', academicYearSchema);
