const mongoose = require('mongoose');

const noticeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  images: [{
    type: String, // Store file paths
    trim: true
  }],
  // Keep backward compatibility with single image
  image: {
    type: String, // Store file path or base64
    default: null
  },
  targetAudience: {
    type: String,
    required: true,
    enum: ['All', 'CSE', 'ECE', 'Mechanical', 'Civil', 'IT', 'Hostel', 'Library', 'Sports', 'Cultural'],
    default: 'All'
  },
  expiryDate: {
    type: Date,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Urgent'],
    default: 'Medium'
  },
  tags: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true
});

// Index for efficient queries
noticeSchema.index({ targetAudience: 1, isActive: 1, expiryDate: 1 });
noticeSchema.index({ title: 'text', description: 'text' });

// Virtual to check if notice is expired
noticeSchema.virtual('isExpired').get(function() {
  return new Date() > this.expiryDate;
});

// Pre-save middleware to auto-deactivate expired notices
noticeSchema.pre('save', function(next) {
  if (new Date() > this.expiryDate) {
    this.isActive = false;
  }
  next();
});

// Static method to get active notices
noticeSchema.statics.getActiveNotices = function(filters = {}) {
  const query = {
    isActive: true,
    expiryDate: { $gt: new Date() },
    ...filters
  };
  
  return this.find(query)
    .populate('createdBy', 'name email')
    .sort({ priority: -1, createdAt: -1 });
};

module.exports = mongoose.model('Notice', noticeSchema);
