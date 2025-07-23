const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const User = require('../models/User');

// @route   GET /api/users
// @desc    Get all users (admin only)
// @access  Private/Admin
router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const users = await User.find()
      .select('-password')
      .populate('subjects_taught', 'name code is_lab')
      .populate('classes_assigned', 'name branch year');
    
    res.status(200).json({
      message: 'Users retrieved successfully',
      count: users.length,
      data: users
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error retrieving users', error: error.message });
  }
});

// @route   GET /api/users/faculty
// @desc    Get all faculty members
// @access  Private/Admin
router.get('/faculty', protect, authorize('admin'), async (req, res) => {
  try {
    const faculty = await User.find({ role: 'faculty' })
      .select('-password')
      .populate('subjects_taught', 'name code is_lab')
      .populate('classes_assigned', 'name branch year');
    
    res.status(200).json({
      message: 'Faculty members retrieved successfully',
      count: faculty.length,
      data: faculty
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error retrieving faculty', error: error.message });
  }
});

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Private/Admin
router.get('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('subjects_taught', 'name code is_lab')
      .populate('classes_assigned', 'name branch year');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(200).json({
      message: 'User retrieved successfully',
      data: user
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error retrieving user', error: error.message });
  }
});

// @route   PUT /api/users/:id
// @desc    Update user
// @access  Private/Admin
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const { name, phone_number, faculty_id, subjects_taught, classes_assigned } = req.body;
    
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Update user fields
    if (name) user.name = name;
    if (phone_number !== undefined) user.phone_number = phone_number;
    if (faculty_id) user.faculty_id = faculty_id;
    if (subjects_taught) user.subjects_taught = subjects_taught;
    if (classes_assigned) user.classes_assigned = classes_assigned;
    
    await user.save();
    
    res.status(200).json({
      message: 'User updated successfully',
      data: user
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating user', error: error.message });
  }
});

// @route   DELETE /api/users/:id
// @desc    Delete user
// @access  Private/Admin
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    console.log('Delete request for user ID:', req.params.id);
    console.log('Requesting user:', req.user.username, 'Role:', req.user.role);
    
    const user = await User.findById(req.params.id);
    
    if (!user) {
      console.log('User not found:', req.params.id);
      return res.status(404).json({ message: 'User not found' });
    }
    
    console.log('User to delete:', user.username, 'Role:', user.role);
    
    // Prevent deletion of last admin user
    if (user.role === 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin' });
      console.log('Admin count:', adminCount);
      
      if (adminCount <= 1) {
        console.log('Cannot delete last admin user');
        return res.status(400).json({ message: 'Cannot delete the last admin user' });
      }
    }
    
    console.log('Attempting to delete user...');
    await User.findByIdAndDelete(req.params.id);
    console.log('User deleted successfully');
    
    res.status(200).json({
      message: 'User deleted successfully',
      data: {}
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Error deleting user', error: error.message });
  }
});

// @route   POST /api/users/bulk
// @desc    Create multiple users (bulk)
// @access  Private/Admin
router.post('/bulk', protect, authorize('admin'), async (req, res) => {
  try {
    const { users } = req.body;
    
    if (!users || !Array.isArray(users) || users.length === 0) {
      return res.status(400).json({ message: 'Users array is required and cannot be empty' });
    }
    
    const createdUsers = [];
    const errors = [];
    
    for (let i = 0; i < users.length; i++) {
      const userData = users[i];
      
      try {
        // Validate required fields
        if (!userData.username || !userData.name) {
          throw new Error(`Row ${i + 1}: Username and name are required`);
        }
        
        // Check if user already exists
        const existingUser = await User.findOne({ 
          $or: [
            { username: userData.username },
            { faculty_id: userData.faculty_id }
          ]
        });
        
        if (existingUser) {
          throw new Error(`Row ${i + 1}: User with username '${userData.username}' or faculty_id '${userData.faculty_id}' already exists`);
        }
        
        // Create new user
        const newUser = new User({
          username: userData.username,
          password: userData.password || 'defaultPassword123',
          name: userData.name,
          faculty_id: userData.faculty_id,
          phone_number: userData.phone_number,
          role: userData.role || 'faculty'
        });
        
        await newUser.save();
        
        createdUsers.push({
          _id: newUser._id,
          username: newUser.username,
          name: newUser.name,
          faculty_id: newUser.faculty_id,
          role: newUser.role
        });
        
      } catch (error) {
        errors.push(error.message);
      }
    }
    
    res.status(201).json({
      message: `Bulk user creation completed. ${createdUsers.length} users created, ${errors.length} errors.`,
      data: {
        created: createdUsers,
        errors: errors
      }
    });
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creating users in bulk', error: error.message });
  }
});

module.exports = router;
