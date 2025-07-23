const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const Subject = require('../models/Subject');
const User = require('../models/User');

// @route   GET /api/subjects
// @desc    Get all subjects
// @access  Public
router.get('/', async (req, res) => {
  try {
    const subjects = await Subject.find();
    
    res.status(200).json({
      message: 'Subjects retrieved successfully',
      count: subjects.length,
      data: subjects
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error retrieving subjects', error: error.message });
  }
});

// @route   GET /api/subjects/:id
// @desc    Get subject by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);
    
    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }
    
    res.status(200).json({
      message: 'Subject retrieved successfully',
      data: subject
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error retrieving subject', error: error.message });
  }
});

// @route   POST /api/subjects
// @desc    Create new subject
// @access  Private/Admin
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { name, code, is_lab, default_duration_periods } = req.body;
    
    // Check if subject already exists
    const subjectExists = await Subject.findOne({ name });
    
    if (subjectExists) {
      return res.status(400).json({ message: 'Subject with this name already exists' });
    }
    
    // Create new subject
    const subject = await Subject.create({
      name,
      code,
      is_lab: is_lab || false,
      default_duration_periods: default_duration_periods || (is_lab ? 2 : 1)
    });
    
    res.status(201).json({
      message: 'Subject created successfully',
      data: subject
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creating subject', error: error.message });
  }
});

// @route   PUT /api/subjects/:id
// @desc    Update subject
// @access  Private/Admin
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const { name, code, is_lab, default_duration_periods } = req.body;
    
    let subject = await Subject.findById(req.params.id);
    
    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }
    
    // Update subject fields
    if (name) subject.name = name;
    if (code !== undefined) subject.code = code;
    if (is_lab !== undefined) subject.is_lab = is_lab;
    if (default_duration_periods !== undefined) {
      subject.default_duration_periods = default_duration_periods;
    }
    
    await subject.save();
    
    res.status(200).json({
      message: 'Subject updated successfully',
      data: subject
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating subject', error: error.message });
  }
});

// @route   DELETE /api/subjects/:id
// @desc    Delete subject
// @access  Private/Admin
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);
    
    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }
    
    // Remove subject from all faculty who teach it
    await User.updateMany(
      { subjects_taught: subject._id },
      { $pull: { subjects_taught: subject._id } }
    );
    
    await Subject.findByIdAndDelete(req.params.id);
    
    res.status(200).json({
      message: 'Subject deleted successfully',
      data: {}
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error deleting subject', error: error.message });
  }
});

// @route   POST /api/subjects/assign
// @desc    Assign subjects to faculty
// @access  Private/Admin
router.post('/assign', protect, authorize('admin'), async (req, res) => {
  try {
    const { faculty_id, subject_ids } = req.body;
    
    if (!faculty_id || !subject_ids || !Array.isArray(subject_ids)) {
      return res.status(400).json({ message: 'Please provide faculty_id and subject_ids array' });
    }
    
    const faculty = await User.findById(faculty_id);
    
    if (!faculty) {
      return res.status(404).json({ message: 'Faculty not found' });
    }
    
    // Verify all subjects exist
    const subjects = await Subject.find({ _id: { $in: subject_ids } });
    
    if (subjects.length !== subject_ids.length) {
      return res.status(400).json({ message: 'Some subject IDs are invalid' });
    }
    
    // Update faculty's subjects taught
    faculty.subjects_taught = subject_ids;
    await faculty.save();
    
    res.status(200).json({
      message: 'Subjects assigned to faculty successfully',
      data: faculty
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error assigning subjects', error: error.message });
  }
});

// @route   POST /api/subjects/bulk
// @desc    Create multiple subjects (bulk)
// @access  Private/Admin
router.post('/bulk', protect, authorize('admin'), async (req, res) => {
  try {
    const { subjects } = req.body;
    
    if (!subjects || !Array.isArray(subjects) || subjects.length === 0) {
      return res.status(400).json({ message: 'Subjects array is required and cannot be empty' });
    }
    
    const createdSubjects = [];
    const errors = [];
    
    for (let i = 0; i < subjects.length; i++) {
      const subjectData = subjects[i];
      
      try {
        // Validate required fields
        if (!subjectData.name || !subjectData.code) {
          throw new Error(`Row ${i + 1}: Name and code are required`);
        }
        
        // Check if subject already exists
        const existingSubject = await Subject.findOne({ 
          $or: [
            { name: subjectData.name },
            { code: subjectData.code }
          ]
        });
        
        if (existingSubject) {
          throw new Error(`Row ${i + 1}: Subject with name '${subjectData.name}' or code '${subjectData.code}' already exists`);
        }
        
        // Create new subject
        const newSubject = new Subject({
          name: subjectData.name,
          code: subjectData.code,
          is_lab: subjectData.is_lab === 'true' || subjectData.is_lab === true || false,
          default_duration_periods: parseInt(subjectData.default_duration_periods) || 1
        });
        
        await newSubject.save();
        
        createdSubjects.push(newSubject);
        
      } catch (error) {
        errors.push(error.message);
      }
    }
    
    res.status(201).json({
      message: `Bulk subject creation completed. ${createdSubjects.length} subjects created, ${errors.length} errors.`,
      data: {
        created: createdSubjects,
        errors: errors
      }
    });
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creating subjects in bulk', error: error.message });
  }
});

module.exports = router;
