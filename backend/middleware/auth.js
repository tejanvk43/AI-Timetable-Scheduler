const jwt = require('jsonwebtoken');
<<<<<<< HEAD
const User = require('../models/User');

// Protect routes
exports.protect = async (req, res, next) => {
  let token;
  
  console.log('Auth middleware called for:', req.method, req.path);
  console.log('Authorization header:', req.headers.authorization ? 'Present' : 'Missing');
  
  // Get token from authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    // Set token from Bearer token in header
    token = req.headers.authorization.split(' ')[1];
    console.log('Token extracted from header');
  }
  
  // Check if token exists
  if (!token) {
    console.log('No token found - returning 401');
    return res.status(401).json({
      message: 'Not authorized to access this route'
    });
  }
  
  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token decoded for user ID:', decoded.id);
    
    // Attach user to request object
    req.user = await User.findById(decoded.id);
    
    if (!req.user) {
      console.log('User not found in database');
      return res.status(401).json({
        message: 'User not found'
      });
    }
    
    console.log('User authenticated:', req.user.username, 'Role:', req.user.role);
    next();
  } catch (error) {
    console.log('Token verification failed:', error.message);
    return res.status(401).json({
      message: 'Not authorized to access this route'
    });
  }
};

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    console.log('Authorization middleware called');
    console.log('Required roles:', roles);
    console.log('User role:', req.user ? req.user.role : 'No user');
    
    if (!req.user) {
      console.log('No user in request - returning 401');
      return res.status(401).json({
        message: 'Not authorized to access this route'
      });
    }
    
    if (!roles.includes(req.user.role)) {
      console.log(`User role ${req.user.role} not in required roles - returning 403`);
      return res.status(403).json({
        message: `User role ${req.user.role} is not authorized to access this route`
      });
    }
    
    console.log('Authorization successful');
    next();
  };
};
=======
const Admin = require('../models/Admin');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const admin = await Admin.findById(decoded.id);
    
    if (!admin) {
      return res.status(401).json({ message: 'Token is not valid' });
    }

    req.admin = admin;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ message: 'Token is not valid' });
  }
};

module.exports = auth;
>>>>>>> debf9d8f561b2b4afadb34eaacb87ca9cfc020cb
