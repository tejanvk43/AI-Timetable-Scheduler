const mongoose = require('mongoose');

const ClassSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a class name'],
    trim: true,
    maxlength: [100, 'Class name cannot be more than 100 characters'],
    unique: true
  },
  branch: {
    type: String,
    required: [true, 'Please specify a branch'],
    trim: true,
    maxlength: [50, 'Branch cannot be more than 50 characters']
  },
  year: {
    type: Number,
    required: [true, 'Please specify a year'],
    min: [1, 'Year must be at least 1']
  },
  class_teacher_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

// Create index on name and branch for faster lookups
ClassSchema.index({ name: 1, branch: 1 });

module.exports = mongoose.model('Class', ClassSchema);
