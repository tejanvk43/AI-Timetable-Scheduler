const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const Template = require('../models/Template');

// @route   GET /api/templates
// @desc    Get all templates (public + user's own)
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const templates = await Template.getUserTemplates(req.user._id);
    res.json(templates);
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ message: 'Error fetching templates', error: error.message });
  }
});

// @route   GET /api/templates/public
// @desc    Get all public templates
// @access  Public
router.get('/public', async (req, res) => {
  try {
    const templates = await Template.getPublicTemplates();
    res.json(templates);
  } catch (error) {
    console.error('Error fetching public templates:', error);
    res.status(500).json({ message: 'Error fetching public templates', error: error.message });
  }
});

// @route   GET /api/templates/:id
// @desc    Get template by ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const template = await Template.findById(req.params.id).populate('created_by', 'name faculty_id');
    
    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }
    
    // Check if user can access this template
    if (!template.is_public && template.created_by._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied to this template' });
    }
    
    res.json(template);
  } catch (error) {
    console.error('Error fetching template:', error);
    res.status(500).json({ message: 'Error fetching template', error: error.message });
  }
});

// @route   POST /api/templates
// @desc    Create new template
// @access  Private/Admin
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const {
      name,
      description,
      periods_per_day,
      days,
      guidelines,
      schedule_template,
      is_public
    } = req.body;
    
    console.log('Received template creation request:', { name, periods_per_day, days, is_public });
    console.log('User:', req.user._id, 'Role:', req.user.role);
    
    // Validate required fields
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Template name is required' });
    }
    
    // Check if template name already exists for this user
    const existingTemplate = await Template.findOne({
      name: name.trim(),
      created_by: req.user._id
    });
    
    if (existingTemplate) {
      return res.status(400).json({ message: 'Template with this name already exists' });
    }
    
    const template = new Template({
      name: name.trim(),
      description,
      periods_per_day: periods_per_day || 8,
      days: days || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
      guidelines: guidelines || {},
      schedule_template: schedule_template || {},
      created_by: req.user._id,
      is_public: is_public || false
    });
    
    await template.save();
    await template.populate('created_by', 'name faculty_id');
    
    console.log('Template created successfully:', template._id);
    
    res.status(201).json({
      message: 'Template created successfully',
      template
    });
  } catch (error) {
    console.error('Error creating template:', error);
    console.error('Error stack:', error.stack);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Validation error', error: error.message });
    }
    res.status(500).json({ message: 'Error creating template', error: error.message });
  }
});

// @route   PUT /api/templates/:id
// @desc    Update template
// @access  Private/Admin (only creator or admin)
router.put('/:id', protect, async (req, res) => {
  try {
    const template = await Template.findById(req.params.id);
    
    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }
    
    // Check if user can edit this template
    if (template.created_by.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. You can only edit your own templates.' });
    }
    
    const {
      name,
      description,
      periods_per_day,
      days,
      guidelines,
      schedule_template,
      is_public
    } = req.body;
    
    // Check if new name conflicts with existing templates
    if (name && name !== template.name) {
      const existingTemplate = await Template.findOne({
        name: name,
        created_by: template.created_by,
        _id: { $ne: template._id }
      });
      
      if (existingTemplate) {
        return res.status(400).json({ message: 'Template with this name already exists' });
      }
    }
    
    // Update fields
    if (name) template.name = name;
    if (description !== undefined) template.description = description;
    if (periods_per_day) template.periods_per_day = periods_per_day;
    if (days) template.days = days;
    if (guidelines) template.guidelines = { ...template.guidelines, ...guidelines };
    if (schedule_template) template.schedule_template = schedule_template;
    if (is_public !== undefined) template.is_public = is_public;
    
    await template.save();
    await template.populate('created_by', 'name faculty_id');
    
    res.json({
      message: 'Template updated successfully',
      template
    });
  } catch (error) {
    console.error('Error updating template:', error);
    res.status(500).json({ message: 'Error updating template', error: error.message });
  }
});

// @route   DELETE /api/templates/:id
// @desc    Delete template
// @access  Private/Admin (only creator or admin)
router.delete('/:id', protect, async (req, res) => {
  try {
    const template = await Template.findById(req.params.id);
    
    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }
    
    // Check if user can delete this template
    if (template.created_by.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. You can only delete your own templates.' });
    }
    
    // Check if template is being used by any timetables
    const Timetable = require('../models/Timetable');
    const usingTimetables = await Timetable.find({ template_id: template._id });
    
    if (usingTimetables.length > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete template. It is being used by existing timetables.',
        using_timetables: usingTimetables.length
      });
    }
    
    await Template.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Error deleting template:', error);
    res.status(500).json({ message: 'Error deleting template', error: error.message });
  }
});

// @route   POST /api/templates/:id/duplicate
// @desc    Duplicate an existing template
// @access  Private/Admin
router.post('/:id/duplicate', protect, authorize('admin'), async (req, res) => {
  try {
    const originalTemplate = await Template.findById(req.params.id);
    
    if (!originalTemplate) {
      return res.status(404).json({ message: 'Template not found' });
    }
    
    // Check if user can access the original template
    if (!originalTemplate.is_public && originalTemplate.created_by.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied to this template' });
    }
    
    const { new_name } = req.body;
    
    if (!new_name) {
      return res.status(400).json({ message: 'Please provide a name for the duplicated template' });
    }
    
    // Check if new name already exists
    const existingTemplate = await Template.findOne({
      name: new_name,
      created_by: req.user._id
    });
    
    if (existingTemplate) {
      return res.status(400).json({ message: 'Template with this name already exists' });
    }
    
    // Create duplicate
    const duplicateTemplate = new Template({
      name: new_name,
      description: `Copy of ${originalTemplate.name}`,
      periods_per_day: originalTemplate.periods_per_day,
      days: [...originalTemplate.days],
      guidelines: { ...originalTemplate.guidelines },
      schedule_template: new Map(originalTemplate.schedule_template),
      created_by: req.user._id,
      is_public: false // Duplicates start as private
    });
    
    await duplicateTemplate.save();
    await duplicateTemplate.populate('created_by', 'name faculty_id');
    
    res.status(201).json({
      message: 'Template duplicated successfully',
      template: duplicateTemplate
    });
  } catch (error) {
    console.error('Error duplicating template:', error);
    res.status(500).json({ message: 'Error duplicating template', error: error.message });
  }
});

// @route   GET /api/templates/:id/usage
// @desc    Get template usage statistics
// @access  Private
router.get('/:id/usage', protect, async (req, res) => {
  try {
    const template = await Template.findById(req.params.id);
    
    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }
    
    // Check access
    if (!template.is_public && template.created_by.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied to this template' });
    }
    
    const Timetable = require('../models/Timetable');
    const usingTimetables = await Timetable.find({ template_id: template._id })
      .populate('class_id', 'name semester department')
      .select('academic_year class_id created_at');
    
    res.json({
      template_name: template.name,
      usage_count: template.usage_count,
      active_timetables: usingTimetables.length,
      timetables: usingTimetables
    });
  } catch (error) {
    console.error('Error fetching template usage:', error);
    res.status(500).json({ message: 'Error fetching template usage', error: error.message });
  }
});

module.exports = router;
