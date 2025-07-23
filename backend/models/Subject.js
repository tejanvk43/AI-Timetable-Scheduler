const mongoose = require('mongoose');

const SubjectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a subject name'],
    trim: true,
    maxlength: [100, 'Subject name cannot be more than 100 characters'],
    unique: true
  },
  code: {
    type: String,
    trim: true,
    maxlength: [20, 'Subject code cannot be more than 20 characters']
  },
  is_lab: {
    type: Boolean,
    default: false
  },
  default_duration_periods: {
    type: Number,
    required: [true, 'Please add default duration in periods'],
    min: [1, 'Duration must be at least 1 period'],
    default: 1
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Subject', SubjectSchema);
