<p align="center">
  <h1 align="center">🎓 AI Timetable Generator</h1>
  <p align="center">
    <strong>Intelligent, automated timetable scheduling system for educational institutions</strong>
  </p>
  <p align="center">
    <a href="#features">Features</a> •
    <a href="#demo">Demo</a> •
    <a href="#installation">Installation</a> •
    <a href="#usage">Usage</a> •
    <a href="#api-documentation">API</a> •
    <a href="#contributing">Contributing</a>
  </p>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19.1.0-61DAFB?style=for-the-badge&logo=react&logoColor=white" alt="React">
  <img src="https://img.shields.io/badge/TypeScript-4.9.5-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js">
  <img src="https://img.shields.io/badge/Express-5.1.0-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express">
  <img src="https://img.shields.io/badge/MongoDB-6+-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB">
  <img src="https://img.shields.io/badge/OpenAI-GPT--4-412991?style=for-the-badge&logo=openai&logoColor=white" alt="OpenAI">
  <img src="https://img.shields.io/badge/TailwindCSS-3.x-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind">
</p>

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [Troubleshooting](#troubleshooting)
- [License](#license)

---

## 🎯 Overview

**AI Timetable Generator** is a comprehensive, full-stack web application designed to automate the complex task of creating academic timetables for educational institutions. Leveraging the power of OpenAI's GPT-4, this system intelligently schedules classes while respecting constraints such as faculty availability, room conflicts, consecutive lab periods, and balanced workload distribution.

The application features a modern React frontend with TypeScript, a robust Node.js/Express backend, and MongoDB for data persistence. It supports multi-year academic management, bulk data imports, customizable period templates, and real-time timetable generation with AI-powered optimization.

### Why This Project?

- **Time-Saving**: Automates hours of manual scheduling work
- **Conflict-Free**: AI ensures no faculty or room conflicts
- **Flexible**: Customizable templates and guidelines
- **Scalable**: Supports multiple classes, departments, and academic years
- **Modern**: Built with latest technologies and best practices

---

## ✨ Features

### 🤖 AI-Powered Timetable Generation
- **Smart Scheduling**: GPT-4 powered constraint satisfaction algorithms
- **Automatic Conflict Resolution**: Prevents faculty, room, and time slot conflicts
- **Load Balancing**: Distributes classes evenly across days and periods
- **Intelligent Lab Scheduling**: Automatically schedules labs as consecutive periods
- **Custom Constraints**: Support for institution-specific rules and preferences

### 📚 Complete Academic Management
| Module | Capabilities |
|--------|-------------|
| **Class Management** | Organize by branch (CSE, ECE, MECH, etc.), year, and section |
| **Subject Management** | Theory/Lab courses with credit hours and duration settings |
| **Faculty Management** | Profiles, subjects taught, availability, and workload tracking |
| **Academic Year** | Multi-year support with activation and archival |

### 🎨 Template System
- **Period Timing Templates**: Create reusable timing structures
- **Customizable Schedules**: Configure breaks, lunch, and period durations
- **Quick Setup**: Apply templates instantly to new timetables
- **Visual Designer**: Intuitive canvas for schedule design

### 🔐 Security & Authentication
- **JWT Authentication**: Secure token-based authentication
- **Role-Based Access**: Admin and Faculty roles with different permissions
- **Password Hashing**: bcrypt-based secure password storage
- **Rate Limiting**: Protection against brute-force attacks
- **Helmet.js**: HTTP security headers

### 📊 Data Management
- **Bulk Upload**: Import classes, subjects, and faculty via CSV
- **Excel Export**: Download timetables in Excel format
- **PDF Export**: Download timetables as formatted PDF documents
- **Template Downloads**: Sample CSV templates for easy onboarding
- **Database Scripts**: Easy setup, seeding, and cleanup utilities

### 🎨 Modern UI/UX
- **Responsive Design**: Works seamlessly on desktop and mobile
- **Grid-Based Timetable View**: Traditional timetable format with periods and days
- **Interactive Editing**: Click-to-edit timetable cells
- **Real-time Updates**: Instant feedback on changes
- **Download Options**: Export timetables as Excel or PDF
- **Tailwind CSS**: Clean, modern styling

---

## 🛠️ Tech Stack

### Backend
| Technology | Purpose |
|------------|---------|
| **Node.js 18+** | JavaScript runtime |
| **Express.js 5.x** | Web application framework |
| **MongoDB** | NoSQL database |
| **Mongoose** | MongoDB ODM |
| **JWT** | Authentication tokens |
| **bcryptjs** | Password hashing |
| **OpenAI API** | AI timetable generation |
| **Helmet** | Security middleware |
| **express-rate-limit** | Rate limiting |
| **xlsx** | Excel file generation |

### Frontend
| Technology | Purpose |
|------------|---------|
| **React 19** | UI library |
| **TypeScript** | Type-safe JavaScript |
| **React Router 7** | Client-side routing |
| **Axios** | HTTP client |
| **Tailwind CSS** | Utility-first styling |
| **Lucide React** | Icon library |
| **xlsx** | Excel file handling |
| **jsPDF** | PDF generation |
| **html2canvas** | HTML to canvas conversion |

---

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18.0.0 or higher) - [Download](https://nodejs.org/)
- **npm** (v9.0.0 or higher) - Comes with Node.js
- **MongoDB** (v6.0 or higher) - [Download](https://www.mongodb.com/try/download/community) or use [MongoDB Atlas](https://www.mongodb.com/atlas)
- **Git** - [Download](https://git-scm.com/)
- **OpenAI API Key** (for AI features) - [Get API Key](https://platform.openai.com/api-keys)

### Verify Installation
```bash
node --version    # Should be v18.x.x or higher
npm --version     # Should be v9.x.x or higher
mongod --version  # Should be v6.x.x or higher (if using local MongoDB)
```

---

## 🚀 Installation

### Quick Start (Automated)

#### Windows
```bash
git clone https://github.com/yourusername/ai-timetable-scheduler.git
cd ai-timetable-scheduler
setup.bat
```

#### Linux/macOS
```bash
git clone https://github.com/yourusername/ai-timetable-scheduler.git
cd ai-timetable-scheduler
npm run setup
```

### Manual Installation

#### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/ai-timetable-scheduler.git
cd ai-timetable-scheduler
```

#### 2. Install Root Dependencies
```bash
npm install
```

#### 3. Install Backend Dependencies
```bash
cd backend
npm install
```

#### 4. Install Frontend Dependencies
```bash
cd ../frontend
npm install
```

#### 5. Return to Root
```bash
cd ..
```

### One-Command Setup
```bash
npm run setup    # Installs all dependencies
npm run dev      # Starts both servers
```

---

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the `backend/` directory:

```env
# Server Configuration
PORT=5001
NODE_ENV=development

# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/timetable_scheduler

# JWT Configuration
JWT_SECRET=your-super-secure-jwt-secret-at-least-32-characters-long
JWT_EXPIRE=30d

# OpenAI Configuration (Required for AI features)
OPENAI_API_KEY=sk-your-openai-api-key-here

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3002
```

### Environment Variables Reference

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `PORT` | Backend server port | No | `5001` |
| `NODE_ENV` | Environment mode | No | `development` |
| `MONGODB_URI` | MongoDB connection string | Yes | - |
| `JWT_SECRET` | Secret key for JWT tokens | Yes | - |
| `JWT_EXPIRE` | JWT token expiration | No | `30d` |
| `OPENAI_API_KEY` | OpenAI API key for AI generation | For AI features | - |
| `FRONTEND_URL` | Frontend URL for CORS | No | `http://localhost:3002` |

### Database Setup

Initialize the database with an initial admin user:
```bash
cd backend
npm run setup
```

This will create the initial admin user. The credentials will be displayed in the console after setup. **Please change the default password after first login for security.**

---

## 📖 Usage

### Starting the Application

#### Development Mode (Both Servers)
```bash
npm run dev
```
This starts:
- Backend: `http://localhost:5001`
- Frontend: `http://localhost:3002`

#### Individual Servers
```bash
# Backend only
npm run backend

# Frontend only
npm run frontend
```

### Accessing the Application

1. Open your browser and navigate to `http://localhost:3002`
2. Login with the admin credentials created during database setup

### Complete Workflow

#### Phase 1: System Setup

1. **Configure Academic Year**
   - Navigate to Admin Dashboard → Academic Year Settings
   - Create a new academic year (e.g., "2025-2026")
   - Set start and end dates
   - **Activate** the academic year

2. **Add Classes**
   - Go to Manage → Classes
   - Add classes with branch, year, and section
   - Or use bulk CSV upload

3. **Add Subjects**
   - Go to Manage → Subjects
   - Add subjects with code, type (Theory/Lab), credits
   - Or use bulk CSV upload

4. **Add Faculty**
   - Go to Manage → Faculty
   - Add faculty with department and subjects
   - Or use bulk CSV upload

#### Phase 2: Create Timetable Structure

5. **Design Period Timings**
   - Go to Period Timing Canvas
   - Configure periods, breaks, and lunch
   - Save as a reusable template

6. **Create Timetable Structure**
   - Go to Manage Timetables
   - Select class and apply period template
   - Configure guidelines and constraints

#### Phase 3: AI Generation

7. **Generate Timetable**
   - Go to Generate Timetable
   - Select class → Select timetable structure
   - Assign faculty to subjects
   - Click "Generate with AI"
   - Review and save the generated timetable

#### Phase 4: View and Export

8. **View Timetables**
   - Faculty can view their assigned classes in the Faculty Dashboard
   - Admin can view and edit timetables in Manage Timetables
   - Grid-based view shows periods vs days format

9. **Export Timetables**
   - Download as Excel for spreadsheet applications
   - Download as PDF for printing and sharing
   - Available in both Faculty and Admin dashboards

---

## 📡 API Documentation

### Base URL
```
http://localhost:5001/api
```

### Authentication
All protected routes require a JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

### API Endpoints

#### Authentication
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/auth/login` | User login | No |
| `POST` | `/auth/register` | Register new user | Admin |
| `GET` | `/auth/me` | Get current user | Yes |

#### Users/Faculty
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/users` | Get all users | Admin |
| `GET` | `/users/:id` | Get user by ID | Yes |
| `POST` | `/users` | Create user | Admin |
| `PUT` | `/users/:id` | Update user | Admin |
| `DELETE` | `/users/:id` | Delete user | Admin |

#### Classes
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/classes` | Get all classes | Yes |
| `GET` | `/classes/:id` | Get class by ID | Yes |
| `POST` | `/classes` | Create class | Admin |
| `PUT` | `/classes/:id` | Update class | Admin |
| `DELETE` | `/classes/:id` | Delete class | Admin |
| `POST` | `/classes/bulk` | Bulk upload classes | Admin |

#### Subjects
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/subjects` | Get all subjects | Yes |
| `GET` | `/subjects/:id` | Get subject by ID | Yes |
| `POST` | `/subjects` | Create subject | Admin |
| `PUT` | `/subjects/:id` | Update subject | Admin |
| `DELETE` | `/subjects/:id` | Delete subject | Admin |
| `POST` | `/subjects/bulk` | Bulk upload subjects | Admin |

#### Timetables
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/timetables` | Get all timetables | Yes |
| `GET` | `/timetables/:id` | Get timetable by ID | Yes |
| `POST` | `/timetables` | Create timetable | Admin |
| `PUT` | `/timetables/:id` | Update timetable | Admin |
| `DELETE` | `/timetables/:id` | Delete timetable | Admin |

#### AI Generation
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/ai/generate` | Generate timetable with AI | Admin |

#### Templates
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/templates` | Get all templates | Yes |
| `POST` | `/templates` | Create template | Admin |
| `PUT` | `/templates/:id` | Update template | Admin |
| `DELETE` | `/templates/:id` | Delete template | Admin |

#### Academic Years
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/academic-years` | Get all academic years | Yes |
| `POST` | `/academic-years` | Create academic year | Admin |
| `PUT` | `/academic-years/:id/activate` | Activate academic year | Admin |

### Health Check
```bash
GET /api/health
```
Response:
```json
{
  "status": "OK",
  "message": "Timetable Scheduler API is running"
}
```

---

## 📁 Project Structure

```
ai-timetable-scheduler/
│
├── 📄 package.json              # Root package with scripts
├── 📄 README.md                 # This documentation
├── 🔧 setup.bat                 # Windows setup script
├── 🔧 start.sh                  # Linux/Mac start script
│
├── 📂 backend/                  # Node.js + Express Backend
│   ├── 📂 config/               # Configuration files
│   │   └── cloudStorage.js      # Cloud storage config
│   │
│   ├── 📂 middleware/           # Express middleware
│   │   ├── auth.js              # JWT authentication
│   │   └── upload.js            # File upload (multer)
│   │
│   ├── 📂 models/               # MongoDB Mongoose models
│   │   ├── AcademicYear.js      # Academic year schema
│   │   ├── Admin.js             # Admin user schema
│   │   ├── Class.js             # Class/section schema
│   │   ├── Notice.js            # Notice board schema
│   │   ├── Schedule.js          # Period schedule schema
│   │   ├── Subject.js           # Subject/course schema
│   │   ├── Template.js          # Timetable template schema
│   │   ├── Timetable.js         # Main timetable schema
│   │   └── User.js              # User (faculty) schema
│   │
│   ├── 📂 routes/               # API route handlers
│   │   ├── academicYears.js     # Academic year CRUD
│   │   ├── ai.js                # AI timetable generation
│   │   ├── auth.js              # Authentication routes
│   │   ├── classes.js           # Class management
│   │   ├── notices.js           # Notice board
│   │   ├── schedules.js         # Period schedules
│   │   ├── subjects.js          # Subject management
│   │   ├── templates.js         # Timetable templates
│   │   ├── timetables.js        # Timetable CRUD
│   │   └── users.js             # User management
│   │
│   ├── 📂 scripts/              # Database utilities
│   │   ├── setup-database.js    # Initialize database
│   │   ├── clear-database.js    # Clear all data
│   │   ├── seed.js              # Seed sample data
│   │   └── test-connection.js   # Test DB connection
│   │
│   ├── 📂 services/             # Business logic services
│   │   └── openai-service.js    # OpenAI GPT-4 integration
│   │
│   ├── 📂 uploads/              # Uploaded files storage
│   ├── 📄 server.js             # Main server entry point
│   └── 📄 package.json          # Backend dependencies
│
├── 📂 frontend/                 # React + TypeScript Frontend
│   ├── 📂 public/               # Static assets
│   │   ├── index.html           # HTML template
│   │   ├── manifest.json        # PWA manifest
│   │   └── test-classes.csv     # Sample CSV template
│   │
│   ├── 📂 src/                  # Source code
│   │   ├── 📂 components/       # Reusable components
│   │   │   ├── BulkUpload.tsx   # CSV bulk upload
│   │   │   ├── GuidelinesEditor.tsx # Timetable guidelines
│   │   │   ├── Navbar.tsx       # Navigation bar
│   │   │   ├── ProtectedRoute.tsx # Route protection
│   │   │   └── TimetableChatbot.tsx # AI chatbot
│   │   │
│   │   ├── 📂 context/          # React Context providers
│   │   │   ├── AuthContext.tsx  # Authentication state
│   │   │   └── index.ts         # Context exports
│   │   │
│   │   ├── 📂 pages/            # Page components
│   │   │   ├── 📂 admin/        # Admin pages
│   │   │   │   ├── AdminDashboard.tsx
│   │   │   │   ├── AcademicYearSettings.tsx
│   │   │   │   ├── GenerateTimetable.tsx
│   │   │   │   ├── ManageClasses.tsx
│   │   │   │   ├── ManageFaculty.tsx
│   │   │   │   ├── ManageSubjects.tsx
│   │   │   │   ├── ManageTimetables.tsx
│   │   │   │   ├── PeriodTimingCanvas.tsx
│   │   │   │   └── TimetableCanvas.tsx
│   │   │   │
│   │   │   ├── 📂 faculty/      # Faculty pages
│   │   │   │   └── FacultyDashboard.tsx
│   │   │   │
│   │   │   ├── Home.tsx         # Landing page
│   │   │   └── Login.tsx        # Login page
│   │   │
│   │   ├── 📂 types/            # TypeScript definitions
│   │   │   └── api.d.ts         # API response types
│   │   │
│   │   ├── 📂 utils/            # Utility functions
│   │   │   └── api.js           # Axios API client
│   │   │
│   │   ├── App.tsx              # Main App component
│   │   ├── index.tsx            # Entry point
│   │   └── index.css            # Global styles
│   │
│   ├── 📄 tailwind.config.js    # Tailwind configuration
│   ├── 📄 tsconfig.json         # TypeScript config
│   └── 📄 package.json          # Frontend dependencies
│
└── 📄 .gitignore                # Git ignore rules
```

---

## 🗄️ Database Schema

### Core Models

#### User (Faculty)
```javascript
{
  name: String,           // Full name
  faculty_id: String,     // Unique faculty ID (login username)
  email: String,          // Email address
  phone: String,          // Phone number
  department: String,     // Department (CSE, ECE, etc.)
  password: String,       // Hashed password
  role: String,           // 'admin' or 'faculty'
  subjects_taught: [ObjectId],  // References to Subject
  createdAt: Date
}
```

#### Class
```javascript
{
  name: String,           // Class name (e.g., "2ND CSE A")
  branch: String,         // Branch (CSE, ECE, MECH, etc.)
  year: Number,           // Year (1, 2, 3, 4)
  section: String,        // Section (A, B, C)
  academic_year: ObjectId, // Reference to AcademicYear
  strength: Number,       // Number of students
  createdAt: Date
}
```

#### Subject
```javascript
{
  name: String,           // Subject name
  code: String,           // Subject code (e.g., "CS201")
  is_lab: Boolean,        // Is it a lab subject?
  credit_hours: Number,   // Credit hours
  default_duration_periods: Number,  // Periods per session
  createdAt: Date
}
```

#### Timetable
```javascript
{
  class_id: ObjectId,     // Reference to Class
  template_id: ObjectId,  // Reference to Template
  academic_year_id: ObjectId,
  periods_per_day: Number,
  working_days: [String], // ['monday', 'tuesday', ...]
  period_timings: [{
    name: String,
    start_time: String,
    end_time: String,
    is_break: Boolean
  }],
  schedule: {
    monday: [{ period, subject_id, faculty_id, is_lab }],
    tuesday: [...],
    // ... other days
  },
  guidelines: {
    labs_consecutive: Boolean,
    labs_once_a_week: Boolean,
    sports_last_period_predefined_day: String,
    no_parallel_classes_same_faculty: Boolean,
    minimize_consecutive_faculty_periods: Boolean
  },
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🚀 Deployment

### Deployment Options

#### Option 1: Heroku + Vercel/Netlify

```bash
# Backend - Deploy to Heroku
heroku create your-app-backend
heroku config:set MONGODB_URI="your-atlas-uri"
heroku config:set JWT_SECRET="your-secret"
heroku config:set OPENAI_API_KEY="your-openai-key"
heroku config:set FRONTEND_URL="https://your-frontend-domain.com"
git push heroku main

# Frontend - Deploy to Vercel/Netlify
cd frontend
npm run build
# Upload build folder to your hosting provider
```

#### Option 2: Railway + Vercel
1. Deploy backend to [Railway](https://railway.app)
2. Deploy frontend to [Vercel](https://vercel.com)
3. Configure environment variables

#### Option 3: Docker
```dockerfile
# Coming soon
```

### Production Checklist

- [ ] Use MongoDB Atlas for production database
- [ ] Set secure `JWT_SECRET` (32+ characters)
- [ ] Configure proper CORS settings
- [ ] Enable HTTPS
- [ ] Set `NODE_ENV=production`
- [ ] Configure rate limiting
- [ ] Set up monitoring and logging

---

## 📜 Available Scripts

### Root Level
```bash
npm run dev           # Start both servers concurrently
npm run start         # Alias for dev
npm run setup         # Install all dependencies
npm run backend       # Start backend only
npm run frontend      # Start frontend only
npm run test          # Run all tests
npm run clean         # Remove node_modules
```

### Backend
```bash
npm run dev           # Start with nodemon (hot reload)
npm start             # Start production server
npm run setup         # Initialize database with admin user
npm run clear         # Clear all database data
npm run check-users   # List all users
npm run fix-admin     # Recreate admin user
```

### Frontend
```bash
npm start             # Start development server
npm run build         # Build for production
npm test              # Run tests
npm run eject         # Eject from Create React App
```

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

### Getting Started

1. **Fork the repository**
2. **Clone your fork**
   ```bash
   git clone https://github.com/your-username/ai-timetable-scheduler.git
   ```
3. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
4. **Make your changes**
5. **Commit your changes**
   ```bash
   git commit -m 'Add amazing feature'
   ```
6. **Push to your branch**
   ```bash
   git push origin feature/amazing-feature
   ```
7. **Open a Pull Request**

### Coding Standards

- Follow existing code style
- Use TypeScript for frontend components
- Write meaningful commit messages
- Add comments for complex logic
- Update documentation as needed

### Reporting Issues

- Use GitHub Issues for bug reports
- Include steps to reproduce
- Include expected vs actual behavior
- Include screenshots if applicable

---

## 🔧 Troubleshooting

### Common Issues

#### MongoDB Connection Error
```
Error: MongoNetworkError: failed to connect to server
```
**Solution**:
- Ensure MongoDB is running: `mongod`
- Check `MONGODB_URI` in `.env` file
- For Atlas, verify IP whitelist settings

#### Port Already in Use
```
Error: EADDRINUSE: address already in use :::5001
```
**Solution**:
```bash
# Windows
netstat -ano | findstr :5001
taskkill /PID <PID> /F

# Linux/Mac
lsof -i :5001
kill -9 <PID>

# Or change the PORT in backend/.env file
```

#### JWT Token Expired
**Solution**: 
- Login again to get a new token
- Check `JWT_EXPIRE` setting in `.env` file
- Default expiration is 30 days

#### OpenAI API Error
```
Error: 401 Unauthorized
```
**Solution**: 
- Verify `OPENAI_API_KEY` in `.env` file
- Ensure the API key is valid and has sufficient credits
- Check OpenAI API status if issues persist

#### Build Errors
```bash
# Clear cache and reinstall
rm -rf node_modules
rm -rf frontend/node_modules
rm -rf backend/node_modules
npm run setup
```

### Getting Help

- Check existing [GitHub Issues](https://github.com/yourusername/ai-timetable-scheduler/issues)
- Review the documentation sections above for detailed guides
- Ensure all environment variables are properly configured

---

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [OpenAI](https://openai.com/) for GPT-4 API
- [MongoDB](https://www.mongodb.com/) for database
- [React](https://reactjs.org/) team for the amazing framework
- [Tailwind CSS](https://tailwindcss.com/) for styling utilities
- All contributors and supporters

---

## 📞 Support

For issues, questions, or contributions, please use the GitHub Issues section of this repository.

---

<p align="center">
  Made with ❤️ for Education
</p>

<p align="center">
  <a href="#-ai-timetable-generator">Back to Top ⬆️</a>
</p>
