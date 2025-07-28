# Copilot Instructions for MERN Stack Notice Board

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

This is a MERN stack college notice board web application with the following structure:

## Backend (Node.js + Express.js + MongoDB)
- JWT authentication for admin users
- RESTful API for notice CRUD operations
- Image upload handling with multer
- Mongoose models for Notices and Admins
- Protected routes using JWT middleware

## Frontend (React + Tailwind CSS)
- Public notice viewing (no authentication required)
- Admin dashboard with authentication
- Responsive design with card-based layout
- Filter and search functionality
- Dark mode toggle

## Key Features
- Admin can create, edit, delete notices
- Public can view notices without authentication
- Image uploads for notices
- Audience targeting (All, CSE, ECE, Hostel, etc.)
- Auto-hide expired notices
- Search and filter functionality

## Tech Stack
- Backend: Node.js, Express.js, MongoDB, Mongoose, JWT, bcrypt, multer
- Frontend: React, React Router, Axios, Tailwind CSS
- Authentication: JWT tokens with bcrypt password hashing

When generating code, ensure:
- Follow REST API conventions
- Use proper error handling
- Implement secure authentication practices
- Create responsive, accessible UI components
- Follow React best practices with hooks
