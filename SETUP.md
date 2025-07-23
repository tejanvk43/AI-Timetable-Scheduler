# Quick Start Guide

## 🚀 Getting Started

### 1. Install Dependencies

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
cd frontend
npm install
```

### 2. Environment Setup

Create `backend/.env` file:
```env
MONGODB_URI=mongodb://localhost:27017/timetable_scheduler
JWT_SECRET=your-secret-key-here
JWT_EXPIRE=30d
NODE_ENV=development
PORT=5000
```

### 3. Database Setup

Initialize database with admin user:
```bash
cd backend
npm run setup
```

### 4. Start Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```

### 5. Access Application

- **URL**: http://localhost:3000
- **Admin Login**: 
  - Username: `1001`
  - Password: `admin123`

## 📋 Available Scripts

### Backend Scripts
```bash
npm run dev          # Start development server
npm run setup        # Initialize database with admin user
npm run clear        # Clear all data from database
npm run check-users  # View all users in database
npm run fix-admin    # Recreate admin user
```

### Frontend Scripts
```bash
npm start    # Start development server
npm run build # Build for production
```

## 🗂️ First Steps After Setup

1. **Login** as admin (1001/admin123)
2. **Add Faculty** - Go to Manage Faculty
3. **Add Subjects** - Go to Manage Subjects 
4. **Add Classes** - Go to Manage Classes
5. **Assign Subjects to Faculty** - Edit faculty members
6. **Generate Timetable** - Use AI generation feature

## 🔄 Reset Everything

To start completely fresh:
```bash
cd backend
npm run clear
npm run setup
```

## 🆘 Common Issues

**MongoDB Connection Error:**
- Ensure MongoDB is running locally
- Check MONGODB_URI in .env file

**Port Already in Use:**
- Backend runs on port 5000
- Frontend runs on port 3000
- Change ports in respective configs if needed

**Admin Login Not Working:**
```bash
cd backend
npm run fix-admin
```
