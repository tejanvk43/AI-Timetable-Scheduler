const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const Class = require('../models/Class');
const User = require('../models/User');

// @route   GET /api/classes
// @desc    Get all classes
// @access  Public
router.get('/', async (req, res) => {
  try {
    const classes = await Class.find().populate('class_teacher_id', 'name faculty_id phone_number');
    
    res.status(200).json({
      message: 'Classes retrieved successfully',
      count: classes.length,
      data: classes
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error retrieving classes', error: error.message });
  }
});

// @route   GET /api/classes/:id
// @desc    Get class by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const classData = await Class.findById(req.params.id)
      .populate('class_teacher_id', 'name faculty_id phone_number');
    
    if (!classData) {
      return res.status(404).json({ message: 'Class not found' });
    }
    
    res.status(200).json({
      message: 'Class retrieved successfully',
      data: classData
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error retrieving class', error: error.message });
  }
});

// @route   POST /api/classes
// @desc    Create new class
// @access  Private/Admin
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { name, branch, year, class_teacher_id } = req.body;
    
    // Check if class already exists
    const classExists = await Class.findOne({ name });
    
    if (classExists) {
      return res.status(400).json({ message: 'Class with this name already exists' });
    }
    
    // Create new class
    const classData = await Class.create({
      name,
      branch,
      year,
      class_teacher_id
    });
    
    // If class teacher is provided, update the faculty's classes_assigned
    if (class_teacher_id) {
      await User.findByIdAndUpdate(class_teacher_id, {
        $addToSet: { classes_assigned: classData._id }
      });
    }
    
    res.status(201).json({
      message: 'Class created successfully',
      data: classData
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creating class', error: error.message });
  }
});

// @route   PUT /api/classes/:id
// @desc    Update class
// @access  Private/Admin
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const { name, branch, year, class_teacher_id } = req.body;
    
    let classData = await Class.findById(req.params.id);
    
    if (!classData) {
      return res.status(404).json({ message: 'Class not found' });
    }
    
    // If changing class teacher, update old and new faculty's classes_assigned
    if (class_teacher_id && classData.class_teacher_id !== class_teacher_id) {
      // Remove class from old teacher's assignments if there was one
      if (classData.class_teacher_id) {
        await User.findByIdAndUpdate(classData.class_teacher_id, {
          $pull: { classes_assigned: classData._id }
        });
      }
      
      // Add class to new teacher's assignments
      await User.findByIdAndUpdate(class_teacher_id, {
        $addToSet: { classes_assigned: classData._id }
      });
    }
    
    // Update class fields
    if (name) classData.name = name;
    if (branch) classData.branch = branch;
    if (year) classData.year = year;
    if (class_teacher_id) classData.class_teacher_id = class_teacher_id;
    
    await classData.save();
    
    res.status(200).json({
      message: 'Class updated successfully',
      data: classData
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating class', error: error.message });
  }
});

// @route   DELETE /api/classes/:id
// @desc    Delete class
// @access  Private/Admin
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const classData = await Class.findById(req.params.id);
    
    if (!classData) {
      return res.status(404).json({ message: 'Class not found' });
    }
    
    // Remove class from class teacher's assignments if there is one
    if (classData.class_teacher_id) {
      await User.findByIdAndUpdate(classData.class_teacher_id, {
        $pull: { classes_assigned: classData._id }
      });
    }
    
    // Remove class from all faculty members who teach it
    await User.updateMany(
      { classes_assigned: classData._id },
      { $pull: { classes_assigned: classData._id } }
    );
    
    await Class.findByIdAndDelete(req.params.id);
    
    res.status(200).json({
      message: 'Class deleted successfully',
      data: {}
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error deleting class', error: error.message });
  }
});

// @route   POST /api/classes/bulk
// @desc    Create multiple classes (bulk)
// @access  Private/Admin
router.post('/bulk', protect, authorize('admin'), async (req, res) => {
  try {
    const { classes } = req.body;
    
    if (!classes || !Array.isArray(classes) || classes.length === 0) {
      return res.status(400).json({ message: 'Classes array is required and cannot be empty' });
    }
    
    const createdClasses = [];
    const errors = [];
    
    for (let i = 0; i < classes.length; i++) {
      const classData = classes[i];
      
      try {
        // Validate required fields
        if (!classData.name || !classData.branch || !classData.year || !classData.section) {
          throw new Error(`Row ${i + 1}: Name, branch, year, and section are required`);
        }
        
        // Check if class already exists
        const existingClass = await Class.findOne({ 
          name: classData.name,
          branch: classData.branch,
          year: classData.year,
          section: classData.section
        });
        
        if (existingClass) {
          throw new Error(`Row ${i + 1}: Class '${classData.name}' already exists`);
        }
        
        // Validate class teacher if provided
        let classTeacherId = null;
        if (classData.class_teacher_id) {
          // Try to find teacher by faculty_id first, then by username
          let teacher = await User.findOne({ faculty_id: classData.class_teacher_id });
          if (!teacher) {
            teacher = await User.findOne({ username: classData.class_teacher_id });
          }
          // Only try findById if the value looks like a valid ObjectId
          if (!teacher && classData.class_teacher_id.match(/^[0-9a-fA-F]{24}$/)) {
            teacher = await User.findById(classData.class_teacher_id);
          }
          if (!teacher || teacher.role !== 'faculty') {
            throw new Error(`Row ${i + 1}: Faculty with ID '${classData.class_teacher_id}' not found or not a faculty member`);
          }
          classTeacherId = teacher._id;
        }
        
        // Create new class
        const newClass = new Class({
          name: classData.name,
          branch: classData.branch,
          year: parseInt(classData.year),
          section: classData.section,
          class_teacher_id: classTeacherId
        });
        
        await newClass.save();
        
        // Populate the class teacher for response
        await newClass.populate('class_teacher_id', 'name faculty_id');
        
        createdClasses.push(newClass);
        
      } catch (error) {
        errors.push(error.message);
      }
    }
    
    res.status(201).json({
      message: `Bulk class creation completed. ${createdClasses.length} classes created, ${errors.length} errors.`,
      data: {
        created: createdClasses,
        errors: errors
      }
    });
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creating classes in bulk', error: error.message });
  }
});

module.exports = router;
