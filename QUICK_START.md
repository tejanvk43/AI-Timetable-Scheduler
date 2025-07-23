# Quick Start Guide

## 🚀 Running the Application

### Method 1: Windows Batch Script (Easiest)
```bash
# Double-click or run in command prompt
start.bat
```

### Method 2: NPM Commands (Cross-platform)
```bash
# Start both frontend and backend
npm run dev

# Or alternatively
npm start
```

### Method 3: Individual Services
```bash
# Backend only (http://localhost:5000)
npm run backend

# Frontend only (http://localhost:3000)  
npm run frontend
```

## 🔧 First Time Setup

### Windows Users
```bash
# Run the setup script
setup.bat
```

### All Platforms
```bash
# Install all dependencies
npm run setup

# Configure backend/.env file (see below)

# Start the application
npm run dev
```

## ⚙️ Environment Configuration

Create `backend/.env` file:
```env
MONGODB_URI=mongodb://localhost:27017/timetable
JWT_SECRET=your-secret-key-here
JWT_EXPIRE=30d
NODE_ENV=development
PORT=5000
```

## 🌐 Access URLs

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Login**: Username: `1001`, Password: `admin123`

## 📋 Available Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start both services |
| `npm run backend` | Start backend only |
| `npm run frontend` | Start frontend only |
| `npm run setup` | Install all dependencies |
| `npm run frontend:build` | Build for production |
| `npm run clean` | Remove node_modules |

## 🐛 Troubleshooting

### Port Already in Use
- Change PORT in `backend/.env`
- Or kill the process using the port

### MongoDB Connection Issues
- Ensure MongoDB is running
- Check MONGODB_URI in `backend/.env`

### Dependencies Issues
```bash
npm run clean
npm run setup
```

---

✅ **You're all set! Run `npm run dev` to start developing!**
