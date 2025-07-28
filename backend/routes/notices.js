const express = require('express');
const { body, validationResult } = require('express-validator');
const Notice = require('../models/Notice');
const auth = require('../middleware/auth');
const { uploadMiddleware, singleUploadMiddleware, deleteFromS3 } = require('../config/cloudStorage');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// @route   GET /api/notices
// @desc    Get all active notices (public access)
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { audience, search, page = 1, limit = 10 } = req.query;
    
    let filters = {};
    
    // Filter by audience
    if (audience && audience !== 'All') {
      filters.targetAudience = audience;
    }
    
    // Search functionality
    if (search) {
      filters.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }
    
    const notices = await Notice.getActiveNotices(filters)
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Notice.countDocuments({
      isActive: true,
      expiryDate: { $gt: new Date() },
      ...filters
    });
    
    res.json({
      success: true,
      notices,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
    
  } catch (error) {
    console.error('Get notices error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/notices/admin
// @desc    Get all notices for admin (including expired)
// @access  Private
router.get('/admin', auth, async (req, res) => {
  try {
    const { audience, search, page = 1, limit = 10, includeExpired = 'false' } = req.query;
    
    let filters = {};
    
    // Filter by audience
    if (audience && audience !== 'All') {
      filters.targetAudience = audience;
    }
    
    // Include expired notices option
    if (includeExpired === 'false') {
      filters.expiryDate = { $gt: new Date() };
    }
    
    // Search functionality
    if (search) {
      filters.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }
    
    const notices = await Notice.find(filters)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Notice.countDocuments(filters);
    
    res.json({
      success: true,
      notices,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
    
  } catch (error) {
    console.error('Get admin notices error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/notices/:id
// @desc    Get single notice
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const notice = await Notice.findById(req.params.id)
      .populate('createdBy', 'name email');
    
    if (!notice) {
      return res.status(404).json({ message: 'Notice not found' });
    }
    
    res.json({
      success: true,
      notice
    });
    
  } catch (error) {
    console.error('Get notice error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/notices
// @desc    Create new notice
// @access  Private
router.post('/', auth, uploadMiddleware, [
  body('title').trim().isLength({ min: 1, max: 200 }),
  body('description').trim().isLength({ min: 1 }),
  body('targetAudience').isIn(['All', 'CSE', 'ECE', 'Mechanical', 'Civil', 'IT', 'Hostel', 'Library', 'Sports', 'Cultural']),
  body('expiryDate').isISO8601().toDate(),
  body('priority').optional().isIn(['Low', 'Medium', 'High', 'Urgent'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { title, description, targetAudience, expiryDate, priority, tags } = req.body;
    
    // Parse tags if provided
    let parsedTags = [];
    if (tags) {
      parsedTags = typeof tags === 'string' ? tags.split(',').map(tag => tag.trim()) : tags;
    }
    
    const noticeData = {
      title,
      description,
      targetAudience,
      expiryDate: new Date(expiryDate),
      priority: priority || 'Medium',
      tags: parsedTags,
      createdBy: req.admin._id
    };
    
    // Add images if uploaded
    if (req.files && req.files.length > 0) {
      noticeData.images = req.files.map(file => 
        file.location || `/uploads/${file.filename}`
      );
      // For backward compatibility, set the first image as the main image
      noticeData.image = noticeData.images[0];
    } else if (req.file) {
      // Single file upload (backward compatibility)
      noticeData.image = req.file.location || `/uploads/${req.file.filename}`;
      noticeData.images = [noticeData.image];
    }
    
    const notice = new Notice(noticeData);
    await notice.save();
    await notice.populate('createdBy', 'name email');
    
    res.status(201).json({
      success: true,
      notice
    });
    
  } catch (error) {
    console.error('Create notice error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/notices/:id
// @desc    Update notice
// @access  Private
router.put('/:id', auth, uploadMiddleware, [
  body('title').optional().trim().isLength({ min: 1, max: 200 }),
  body('description').optional().trim().isLength({ min: 1 }),
  body('targetAudience').optional().isIn(['All', 'CSE', 'ECE', 'Mechanical', 'Civil', 'IT', 'Hostel', 'Library', 'Sports', 'Cultural']),
  body('expiryDate').optional().isISO8601().toDate(),
  body('priority').optional().isIn(['Low', 'Medium', 'High', 'Urgent'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const notice = await Notice.findById(req.params.id);
    if (!notice) {
      return res.status(404).json({ message: 'Notice not found' });
    }
    
    const { title, description, targetAudience, expiryDate, priority, tags, removeImage } = req.body;
    
    // Update fields
    if (title) notice.title = title;
    if (description) notice.description = description;
    if (targetAudience) notice.targetAudience = targetAudience;
    if (expiryDate) notice.expiryDate = new Date(expiryDate);
    if (priority) notice.priority = priority;
    
    // Handle tags
    if (tags) {
      notice.tags = typeof tags === 'string' ? tags.split(',').map(tag => tag.trim()) : tags;
    }
    
    // Handle image update
    if (req.files && req.files.length > 0) {
      // Delete old images if exist
      if (notice.images && notice.images.length > 0) {
        for (const oldImage of notice.images) {
          await deleteFromS3(oldImage);
          // Also try to delete local file for backward compatibility
          const oldImagePath = path.join(__dirname, '..', oldImage);
          if (fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath);
          }
        }
      } else if (notice.image) {
        // Handle single image for backward compatibility
        await deleteFromS3(notice.image);
        const oldImagePath = path.join(__dirname, '..', notice.image);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      
      // Add new images
      notice.images = req.files.map(file => 
        file.location || `/uploads/${file.filename}`
      );
      notice.image = notice.images[0]; // For backward compatibility
    } else if (req.file) {
      // Single file upload (backward compatibility)
      if (notice.image) {
        await deleteFromS3(notice.image);
        const oldImagePath = path.join(__dirname, '..', notice.image);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      notice.image = req.file.location || `/uploads/${req.file.filename}`;
      notice.images = [notice.image];
    } else if (removeImage === 'true') {
      // Remove all images if requested
      if (notice.images && notice.images.length > 0) {
        for (const oldImage of notice.images) {
          await deleteFromS3(oldImage);
          const oldImagePath = path.join(__dirname, '..', oldImage);
          if (fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath);
          }
        }
        notice.images = [];
      }
      if (notice.image) {
        await deleteFromS3(notice.image);
        const oldImagePath = path.join(__dirname, '..', notice.image);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
        notice.image = null;
      }
    }
    
    await notice.save();
    await notice.populate('createdBy', 'name email');
    
    res.json({
      success: true,
      notice
    });
    
  } catch (error) {
    console.error('Update notice error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/notices/:id
// @desc    Delete notice
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const notice = await Notice.findById(req.params.id);
    if (!notice) {
      return res.status(404).json({ message: 'Notice not found' });
    }
    
    // Delete associated image files
    if (notice.images && notice.images.length > 0) {
      for (const image of notice.images) {
        await deleteFromS3(image);
        // Also try to delete local file for backward compatibility
        const imagePath = path.join(__dirname, '..', image);
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      }
    } else if (notice.image) {
      // Handle single image for backward compatibility
      await deleteFromS3(notice.image);
      const imagePath = path.join(__dirname, '..', notice.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }
    
    await Notice.findByIdAndDelete(req.params.id);
    
    res.json({
      success: true,
      message: 'Notice deleted successfully'
    });
    
  } catch (error) {
    console.error('Delete notice error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/notices/stats/overview
// @desc    Get notice statistics for admin dashboard
// @access  Private
router.get('/stats/overview', auth, async (req, res) => {
  try {
    const totalNotices = await Notice.countDocuments({});
    const activeNotices = await Notice.countDocuments({ 
      isActive: true, 
      expiryDate: { $gt: new Date() } 
    });
    const expiredNotices = await Notice.countDocuments({ 
      expiryDate: { $lt: new Date() } 
    });
    
    // Get notices by audience
    const audienceStats = await Notice.aggregate([
      { $match: { isActive: true, expiryDate: { $gt: new Date() } } },
      { $group: { _id: '$targetAudience', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    // Get notices by priority
    const priorityStats = await Notice.aggregate([
      { $match: { isActive: true, expiryDate: { $gt: new Date() } } },
      { $group: { _id: '$priority', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    res.json({
      success: true,
      stats: {
        total: totalNotices,
        active: activeNotices,
        expired: expiredNotices,
        byAudience: audienceStats,
        byPriority: priorityStats
      }
    });
    
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
