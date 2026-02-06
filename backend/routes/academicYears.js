const express = require('express');
const router = express.Router();
const AcademicYear = require('../models/AcademicYear');
const { protect, authorize } = require('../middleware/auth');

// Helper function to validate date ranges
const validateDateRanges = (data) => {
  const errors = [];
  const { startDate, endDate, semester1Start, semester1End, semester2Start, semester2End } = data;
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  const sem1Start = new Date(semester1Start);
  const sem1End = new Date(semester1End);
  const sem2Start = new Date(semester2Start);
  const sem2End = new Date(semester2End);
  
  // Validate academic year dates
  if (end <= start) {
    errors.push('Academic year end date must be after start date');
  }
  
  // Validate semester 1 dates
  if (sem1End <= sem1Start) {
    errors.push('Semester 1 end date must be after start date');
  }
  
  // Validate semester 2 dates
  if (sem2End <= sem2Start) {
    errors.push('Semester 2 end date must be after start date');
  }
  
  // Validate semester sequence
  if (sem2Start <= sem1End) {
    errors.push('Semester 2 must start after Semester 1 ends');
  }
  
  // Validate semesters are within academic year
  if (sem1Start < start || sem1End > end) {
    errors.push('Semester 1 must be within the academic year period');
  }
  
  if (sem2Start < start || sem2End > end) {
    errors.push('Semester 2 must be within the academic year period');
  }
  
  return errors;
};

// @route   GET /api/academic-years
// @desc    Get all academic years
// @access  Private (Admin only)
router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    console.log('=== FETCHING ACADEMIC YEARS ===');
    console.log('User:', req.user);
    
    const academicYears = await AcademicYear.find()
      .populate('createdBy', 'username name')
      .sort({ year: -1 });

    console.log('Found academic years:', academicYears.length);
    
    res.json({
      success: true,
      data: academicYears
    });
  } catch (error) {
    console.error('=== ERROR FETCHING ACADEMIC YEARS ===');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch academic years',
      details: error.message
    });
  }
});

// @route   GET /api/academic-years/active
// @desc    Get active academic year
// @access  Public
router.get('/active', async (req, res) => {
  try {
    const activeYear = await AcademicYear.getActiveYear();
    
    if (!activeYear) {
      return res.status(404).json({
        success: false,
        error: 'No active academic year found'
      });
    }

    res.json({
      success: true,
      data: activeYear
    });
  } catch (error) {
    console.error('Error fetching active academic year:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch active academic year'
    });
  }
});

// @route   GET /api/academic-years/current
// @desc    Get current academic year based on date
// @access  Public
router.get('/current', async (req, res) => {
  try {
    const currentYear = await AcademicYear.getCurrentYear();
    
    if (!currentYear) {
      return res.status(404).json({
        success: false,
        error: 'No academic year found for current date'
      });
    }

    res.json({
      success: true,
      data: currentYear
    });
  } catch (error) {
    console.error('Error fetching current academic year:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch current academic year'
    });
  }
});

// @route   GET /api/academic-years/:id
// @desc    Get academic year by ID
// @access  Private (Admin only)
router.get('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const academicYear = await AcademicYear.findById(req.params.id)
      .populate('createdBy', 'username name');

    if (!academicYear) {
      return res.status(404).json({
        success: false,
        error: 'Academic year not found'
      });
    }

    res.json({
      success: true,
      data: academicYear
    });
  } catch (error) {
    console.error('Error fetching academic year:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch academic year'
    });
  }
});

// @route   POST /api/academic-years
// @desc    Create new academic year
// @access  Private (Admin only)
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    console.log('=== CREATE ACADEMIC YEAR REQUEST ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    const {
      year,
      startDate,
      endDate,
      semester1Start,
      semester1End,
      semester2Start,
      semester2End,
      description,
      isActive
    } = req.body;

    // Validate required fields
    const missingFields = [];
    if (!year) missingFields.push('year');
    if (!startDate) missingFields.push('startDate');
    if (!endDate) missingFields.push('endDate');
    if (!semester1Start) missingFields.push('semester1Start');
    if (!semester1End) missingFields.push('semester1End');
    if (!semester2Start) missingFields.push('semester2Start');
    if (!semester2End) missingFields.push('semester2End');
    
    if (missingFields.length > 0) {
      console.log('Missing fields:', missingFields);
      return res.status(400).json({
        success: false,
        error: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    // Validate date ranges
    const dateErrors = validateDateRanges(req.body);
    if (dateErrors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Date validation failed',
        details: dateErrors
      });
    }

    // Check if academic year already exists
    const existingYear = await AcademicYear.findOne({ year });
    if (existingYear) {
      return res.status(400).json({
        success: false,
        error: 'Academic year already exists'
      });
    }

    // Create new academic year
    const academicYear = new AcademicYear({
      year,
      startDate,
      endDate,
      semester1Start,
      semester1End,
      semester2Start,
      semester2End,
      description,
      isActive: isActive || false,
      createdBy: req.user.id
    });

    await academicYear.save();

    // Populate the created academic year
    await academicYear.populate('createdBy', 'username name');

    res.status(201).json({
      success: true,
      data: academicYear,
      message: 'Academic year created successfully'
    });
  } catch (error) {
    console.error('Error creating academic year:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Academic year already exists'
      });
    }
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to create academic year'
    });
  }
});

// @route   PUT /api/academic-years/:id
// @desc    Update academic year
// @access  Private (Admin only)
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const {
      year,
      startDate,
      endDate,
      semester1Start,
      semester1End,
      semester2Start,
      semester2End,
      description,
      isActive
    } = req.body;

    // Find the academic year
    const academicYear = await AcademicYear.findById(req.params.id);
    if (!academicYear) {
      return res.status(404).json({
        success: false,
        error: 'Academic year not found'
      });
    }

    // Validate date ranges if dates are being updated
    if (startDate || endDate || semester1Start || semester1End || semester2Start || semester2End) {
      const dataToValidate = {
        startDate: startDate || academicYear.startDate,
        endDate: endDate || academicYear.endDate,
        semester1Start: semester1Start || academicYear.semester1Start,
        semester1End: semester1End || academicYear.semester1End,
        semester2Start: semester2Start || academicYear.semester2Start,
        semester2End: semester2End || academicYear.semester2End
      };

      const dateErrors = validateDateRanges(dataToValidate);
      if (dateErrors.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Date validation failed',
          details: dateErrors
        });
      }
    }

    // Check if year is being changed and if it conflicts
    if (year && year !== academicYear.year) {
      const existingYear = await AcademicYear.findOne({ year });
      if (existingYear) {
        return res.status(400).json({
          success: false,
          error: 'Academic year already exists'
        });
      }
    }

    // Update fields
    if (year) academicYear.year = year;
    if (startDate) academicYear.startDate = startDate;
    if (endDate) academicYear.endDate = endDate;
    if (semester1Start) academicYear.semester1Start = semester1Start;
    if (semester1End) academicYear.semester1End = semester1End;
    if (semester2Start) academicYear.semester2Start = semester2Start;
    if (semester2End) academicYear.semester2End = semester2End;
    if (description !== undefined) academicYear.description = description;
    if (isActive !== undefined) academicYear.isActive = isActive;

    await academicYear.save();

    // Populate the updated academic year
    await academicYear.populate('createdBy', 'username name');

    res.json({
      success: true,
      data: academicYear,
      message: 'Academic year updated successfully'
    });
  } catch (error) {
    console.error('Error updating academic year:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Academic year already exists'
      });
    }
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to update academic year'
    });
  }
});

// @route   PUT /api/academic-years/:id/activate
// @desc    Set academic year as active
// @access  Private (Admin only)
router.put('/:id/activate', protect, authorize('admin'), async (req, res) => {
  try {
    const academicYear = await AcademicYear.findById(req.params.id);
    if (!academicYear) {
      return res.status(404).json({
        success: false,
        error: 'Academic year not found'
      });
    }

    // Set this year as active (middleware will deactivate others)
    academicYear.isActive = true;
    await academicYear.save();

    await academicYear.populate('createdBy', 'username name');

    res.json({
      success: true,
      data: academicYear,
      message: 'Academic year set as active successfully'
    });
  } catch (error) {
    console.error('Error activating academic year:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to activate academic year'
    });
  }
});

// @route   DELETE /api/academic-years/:id
// @desc    Delete academic year
// @access  Private (Admin only)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const academicYear = await AcademicYear.findById(req.params.id);
    if (!academicYear) {
      return res.status(404).json({
        success: false,
        error: 'Academic year not found'
      });
    }

    // Check if this is the active academic year
    if (academicYear.isActive) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete active academic year. Please set another year as active first.'
      });
    }

    // TODO: Check if academic year is referenced by timetables, schedules, etc.
    // For now, we'll allow deletion

    await AcademicYear.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Academic year deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting academic year:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete academic year'
    });
  }
});

module.exports = router;
