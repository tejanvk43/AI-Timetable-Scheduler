const express = require('express');
const router = express.Router();
const Schedule = require('../models/Schedule');
const { protect } = require('../middleware/auth');

// GET /api/schedules - Get all schedules for the authenticated user
router.get('/', protect, async (req, res) => {
  try {
    const { include_public = 'false', search, limit = 50 } = req.query;
    let schedules;

    if (search) {
      // Search schedules
      schedules = await Schedule.searchSchedules(search, req.user.id);
    } else if (include_public === 'true') {
      // Get user's schedules + public schedules
      const [userSchedules, publicSchedules] = await Promise.all([
        Schedule.getUserSchedules(req.user.id),
        Schedule.getPublicSchedules()
      ]);
      
      // Combine and remove duplicates
      const allSchedules = [...userSchedules];
      publicSchedules.forEach(pub => {
        if (!allSchedules.find(us => us._id.toString() === pub._id.toString())) {
          allSchedules.push(pub);
        }
      });
      
      schedules = allSchedules.slice(0, parseInt(limit));
    } else {
      // Get only user's schedules
      schedules = await Schedule.getUserSchedules(req.user.id);
    }

    // Populate created_by for display
    await Schedule.populate(schedules, { path: 'created_by', select: 'username' });

    res.json(schedules);
  } catch (error) {
    console.error('Error fetching schedules:', error);
    res.status(500).json({ message: 'Error fetching schedules', error: error.message });
  }
});

// GET /api/schedules/public - Get public schedules
router.get('/public', async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    const schedules = await Schedule.getPublicSchedules()
      .limit(parseInt(limit))
      .populate('created_by', 'username');
    
    res.json(schedules);
  } catch (error) {
    console.error('Error fetching public schedules:', error);
    res.status(500).json({ message: 'Error fetching public schedules', error: error.message });
  }
});

// GET /api/schedules/popular - Get popular schedules
router.get('/popular', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const schedules = await Schedule.getPopularSchedules(parseInt(limit));
    res.json(schedules);
  } catch (error) {
    console.error('Error fetching popular schedules:', error);
    res.status(500).json({ message: 'Error fetching popular schedules', error: error.message });
  }
});

// GET /api/schedules/:id - Get a specific schedule
router.get('/:id', protect, async (req, res) => {
  try {
    const schedule = await Schedule.findById(req.params.id)
      .populate('created_by', 'username');

    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }

    // Check if user has access to this schedule
    if (!schedule.is_public && schedule.created_by._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(schedule);
  } catch (error) {
    console.error('Error fetching schedule:', error);
    res.status(500).json({ message: 'Error fetching schedule', error: error.message });
  }
});

// POST /api/schedules - Create a new schedule
router.post('/', protect, async (req, res) => {
  try {
    const {
      name,
      description,
      periods_per_day,
      total_duration_hours,
      start_time,
      end_time,
      period_timings,
      auto_generate_breaks,
      break_duration,
      lunch_break_after_period,
      lunch_duration,
      is_public,
      tags
    } = req.body;

    console.log('Received schedule creation request:', { name, start_time, end_time, periods: period_timings?.length });
    console.log('User:', req.user.id);

    // Validate required fields
    if (!name || !start_time || !end_time || !period_timings) {
      console.error('Missing required fields:', { name: !!name, start_time: !!start_time, end_time: !!end_time, period_timings: !!period_timings });
      return res.status(400).json({
        message: 'Missing required fields: name, start_time, end_time, period_timings'
      });
    }

    // Validate period timings
    if (!Array.isArray(period_timings) || period_timings.length === 0) {
      console.error('Invalid period_timings:', period_timings);
      return res.status(400).json({
        message: 'period_timings must be a non-empty array'
      });
    }

    // Validate time format
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(start_time) || !timeRegex.test(end_time)) {
      return res.status(400).json({
        message: 'Invalid time format. Use HH:MM format'
      });
    }

    // Check for duplicate schedule names for this user
    const existingSchedule = await Schedule.findOne({
      name: name.trim(),
      created_by: req.user.id
    });

    if (existingSchedule) {
      return res.status(400).json({
        message: 'A schedule with this name already exists'
      });
    }

    // Create new schedule
    const newSchedule = new Schedule({
      name: name.trim(),
      description: description?.trim(),
      created_by: req.user.id,
      periods_per_day: periods_per_day || period_timings.filter(p => !p.is_break).length,
      total_duration_hours: total_duration_hours || 8,
      start_time,
      end_time,
      period_timings: period_timings.map((p, index) => ({
        ...p,
        order: p.order !== undefined ? p.order : index
      })),
      auto_generate_breaks: auto_generate_breaks !== undefined ? auto_generate_breaks : true,
      break_duration: break_duration || 15,
      lunch_break_after_period: lunch_break_after_period || 4,
      lunch_duration: lunch_duration || 60,
      is_public: is_public || false,
      tags: Array.isArray(tags) ? tags.filter(tag => tag.trim()) : []
    });

    const savedSchedule = await newSchedule.save();
    await savedSchedule.populate('created_by', 'username');

    res.status(201).json(savedSchedule);
  } catch (error) {
    console.error('Error creating schedule:', error);
    
    if (error.name === 'ValidationError') {
      const errorMessages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        message: 'Validation error',
        errors: errorMessages
      });
    }

    res.status(500).json({ message: 'Error creating schedule', error: error.message });
  }
});

// PUT /api/schedules/:id - Update a schedule
router.put('/:id', protect, async (req, res) => {
  try {
    const schedule = await Schedule.findById(req.params.id);

    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }

    // Check ownership
    if (schedule.created_by.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const {
      name,
      description,
      periods_per_day,
      total_duration_hours,
      start_time,
      end_time,
      period_timings,
      auto_generate_breaks,
      break_duration,
      lunch_break_after_period,
      lunch_duration,
      is_public,
      tags
    } = req.body;

    // Validate time format if provided
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (start_time && !timeRegex.test(start_time)) {
      return res.status(400).json({ message: 'Invalid start_time format. Use HH:MM format' });
    }
    if (end_time && !timeRegex.test(end_time)) {
      return res.status(400).json({ message: 'Invalid end_time format. Use HH:MM format' });
    }

    // Check for duplicate names (excluding current schedule)
    if (name && name.trim() !== schedule.name) {
      const existingSchedule = await Schedule.findOne({
        name: name.trim(),
        created_by: req.user.id,
        _id: { $ne: req.params.id }
      });

      if (existingSchedule) {
        return res.status(400).json({
          message: 'A schedule with this name already exists'
        });
      }
    }

    // Update fields
    if (name !== undefined) schedule.name = name.trim();
    if (description !== undefined) schedule.description = description?.trim();
    if (periods_per_day !== undefined) schedule.periods_per_day = periods_per_day;
    if (total_duration_hours !== undefined) schedule.total_duration_hours = total_duration_hours;
    if (start_time !== undefined) schedule.start_time = start_time;
    if (end_time !== undefined) schedule.end_time = end_time;
    if (period_timings !== undefined) {
      schedule.period_timings = period_timings.map((p, index) => ({
        ...p,
        order: p.order !== undefined ? p.order : index
      }));
    }
    if (auto_generate_breaks !== undefined) schedule.auto_generate_breaks = auto_generate_breaks;
    if (break_duration !== undefined) schedule.break_duration = break_duration;
    if (lunch_break_after_period !== undefined) schedule.lunch_break_after_period = lunch_break_after_period;
    if (lunch_duration !== undefined) schedule.lunch_duration = lunch_duration;
    if (is_public !== undefined) schedule.is_public = is_public;
    if (tags !== undefined) schedule.tags = Array.isArray(tags) ? tags.filter(tag => tag.trim()) : [];

    const updatedSchedule = await schedule.save();
    await updatedSchedule.populate('created_by', 'username');

    res.json(updatedSchedule);
  } catch (error) {
    console.error('Error updating schedule:', error);
    
    if (error.name === 'ValidationError') {
      const errorMessages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        message: 'Validation error',
        errors: errorMessages
      });
    }

    res.status(500).json({ message: 'Error updating schedule', error: error.message });
  }
});

// DELETE /api/schedules/:id - Delete a schedule
router.delete('/:id', protect, async (req, res) => {
  try {
    const schedule = await Schedule.findById(req.params.id);

    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }

    // Check ownership
    if (schedule.created_by.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await Schedule.findByIdAndDelete(req.params.id);

    res.json({ message: 'Schedule deleted successfully' });
  } catch (error) {
    console.error('Error deleting schedule:', error);
    res.status(500).json({ message: 'Error deleting schedule', error: error.message });
  }
});

// POST /api/schedules/:id/duplicate - Duplicate a schedule
router.post('/:id/duplicate', protect, async (req, res) => {
  try {
    const originalSchedule = await Schedule.findById(req.params.id);

    if (!originalSchedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }

    // Check access
    if (!originalSchedule.is_public && originalSchedule.created_by.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { name } = req.body;
    const newName = name || `Copy of ${originalSchedule.name}`;

    // Check for duplicate names
    const existingSchedule = await Schedule.findOne({
      name: newName,
      created_by: req.user.id
    });

    if (existingSchedule) {
      return res.status(400).json({
        message: 'A schedule with this name already exists'
      });
    }

    // Increment usage count for original if it's public and not owned by current user
    if (originalSchedule.is_public && originalSchedule.created_by.toString() !== req.user.id) {
      await originalSchedule.incrementUsage();
    }

    // Create duplicate
    const duplicateSchedule = new Schedule({
      name: newName,
      description: originalSchedule.description,
      created_by: req.user.id,
      periods_per_day: originalSchedule.periods_per_day,
      total_duration_hours: originalSchedule.total_duration_hours,
      start_time: originalSchedule.start_time,
      end_time: originalSchedule.end_time,
      period_timings: originalSchedule.period_timings,
      auto_generate_breaks: originalSchedule.auto_generate_breaks,
      break_duration: originalSchedule.break_duration,
      lunch_break_after_period: originalSchedule.lunch_break_after_period,
      lunch_duration: originalSchedule.lunch_duration,
      is_public: false, // Duplicates are private by default
      tags: [...originalSchedule.tags]
    });

    const savedSchedule = await duplicateSchedule.save();
    await savedSchedule.populate('created_by', 'username');

    res.status(201).json(savedSchedule);
  } catch (error) {
    console.error('Error duplicating schedule:', error);
    res.status(500).json({ message: 'Error duplicating schedule', error: error.message });
  }
});

// POST /api/schedules/:id/use - Mark schedule as used (increment usage count)
router.post('/:id/use', protect, async (req, res) => {
  try {
    const schedule = await Schedule.findById(req.params.id);

    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }

    // Check access
    if (!schedule.is_public && schedule.created_by.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Only increment usage for public schedules used by others
    if (schedule.is_public && schedule.created_by.toString() !== req.user.id) {
      await schedule.incrementUsage();
    }

    res.json({ message: 'Schedule usage recorded', usage_count: schedule.usage_count });
  } catch (error) {
    console.error('Error recording schedule usage:', error);
    res.status(500).json({ message: 'Error recording schedule usage', error: error.message });
  }
});

module.exports = router;
