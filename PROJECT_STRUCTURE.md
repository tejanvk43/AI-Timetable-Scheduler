# Project Structure

## 📁 Directory Organization

```
ai-time-table-scheduler/
│
├── backend/                          # Node.js + Express Backend
│   ├── config/                       # Configuration files
│   │   └── cloudStorage.js          # Cloud storage configuration
│   │
│   ├── middleware/                   # Express middleware
│   │   ├── auth.js                  # Authentication middleware (JWT)
│   │   └── upload.js                # File upload middleware (multer)
│   │
│   ├── models/                       # MongoDB Mongoose models
│   │   ├── AcademicYear.js          # Academic year model
│   │   ├── Admin.js                 # Admin user model
│   │   ├── Class.js                 # Class/section model
│   │   ├── Notice.js                # Notice board model
│   │   ├── Schedule.js              # Period schedule model
│   │   ├── Subject.js               # Subject/course model
│   │   ├── Template.js              # Timetable template model
│   │   ├── Timetable.js             # Main timetable model
│   │   └── User.js                  # User (faculty) model
│   │
│   ├── routes/                       # API route handlers
│   │   ├── academicYears.js         # Academic year CRUD
│   │   ├── ai.js                    # AI timetable generation
│   │   ├── auth.js                  # Authentication routes
│   │   ├── classes.js               # Class management
│   │   ├── notices.js               # Notice board
│   │   ├── schedules.js             # Period schedules
│   │   ├── subjects.js              # Subject management
│   │   ├── templates.js             # Timetable templates
│   │   ├── timetables.js            # Timetable CRUD
│   │   └── users.js                 # User management
│   │
│   ├── scripts/                      # Database scripts
│   │   ├── clear-database.js        # Clear all data
│   │   ├── seed.js                  # Seed sample data
│   │   ├── seedNotices.js           # Seed notice data
│   │   ├── setup-database.js        # Initial setup
│   │   ├── setup.js                 # Setup script
│   │   └── test-connection.js       # Test DB connection
│   │
│   ├── uploads/                      # Uploaded files storage
│   │
│   ├── .env                          # Environment variables (not in git)
│   ├── .env.example                 # Example environment file
│   ├── .env.production              # Production environment
│   ├── create-excel-templates.js    # Generate Excel templates
│   ├── package.json                 # Node dependencies
│   ├── server.js                    # Main server file
│   └── setup.js                     # Setup script
│
├── frontend/                         # React + TypeScript Frontend
│   ├── public/                       # Static files
│   │   ├── index.html               # HTML template
│   │   ├── manifest.json            # PWA manifest
│   │   ├── robots.txt               # SEO robots file
│   │   └── test-classes.csv         # Sample CSV template
│   │
│   ├── src/                          # Source code
│   │   ├── components/              # Reusable components
│   │   │   ├── BulkUpload.tsx       # CSV bulk upload component
│   │   │   ├── GuidelinesEditor.tsx # Timetable guidelines editor
│   │   │   ├── Navbar.js            # Navigation bar
│   │   │   ├── ProtectedRoute.tsx   # Route protection wrapper
│   │   │   └── TimetableChatbot.tsx # AI chatbot component
│   │   │
│   │   ├── context/                 # React Context providers
│   │   │   ├── AuthContext.d.ts     # Type definitions
│   │   │   ├── AuthContext.js       # Authentication context
│   │   │   ├── AuthContext.tsx      # TypeScript version
│   │   │   └── index.ts             # Context exports
│   │   │
│   │   ├── pages/                   # Page components
│   │   │   ├── admin/               # Admin pages
│   │   │   │   ├── AcademicYearSettings.tsx    # Academic year management
│   │   │   │   ├── AdminDashboard.tsx          # Admin dashboard
│   │   │   │   ├── GenerateTimetableNew.tsx    # AI timetable generation
│   │   │   │   ├── ManageClasses.tsx           # Class management
│   │   │   │   ├── ManageFaculty.tsx           # Faculty management
│   │   │   │   ├── ManageSubjects.tsx          # Subject management
│   │   │   │   ├── ManageTimetables.tsx        # Timetable structure management
│   │   │   │   ├── PeriodTimingCanvas.tsx      # Period timing designer
│   │   │   │   └── TimetableCanvas.tsx         # Manual timetable editor
│   │   │   │
│   │   │   ├── faculty/             # Faculty pages
│   │   │   │   └── FacultyDashboard.tsx        # Faculty view
│   │   │   │
│   │   │   ├── Home.tsx             # Landing page
│   │   │   └── Login.tsx            # Login page
│   │   │
│   │   ├── types/                   # TypeScript type definitions
│   │   │   └── api.d.ts             # API response types
│   │   │
│   │   ├── utils/                   # Utility functions
│   │   │   └── api.js               # API client (axios)
│   │   │
│   │   ├── App.css                  # App styles
│   │   ├── App.test.tsx             # App tests
│   │   ├── App.tsx                  # Main App component
│   │   ├── index.css                # Global styles
│   │   ├── index.tsx                # App entry point
│   │   ├── react-app-env.d.ts       # React types
│   │   ├── reportWebVitals.ts       # Performance monitoring
│   │   └── setupTests.ts            # Test setup
│   │
│   ├── build/                        # Production build (generated)
│   ├── package.json                 # Frontend dependencies
│   ├── postcss.config.js            # PostCSS configuration
│   ├── tailwind.config.js           # Tailwind CSS config
│   └── tsconfig.json                # TypeScript config
│
├── .github/                          # GitHub specific files
│   └── copilot-instructions.md      # GitHub Copilot instructions
│
├── DEPLOYMENT.md                     # Deployment guide
├── QUICK_START.md                   # Quick start guide
├── README.md                        # Main readme
├── RENDER_DEPLOYMENT.md             # Render platform deployment
├── SETUP.md                         # Setup instructions
├── WORKFLOW.md                      # Complete workflow guide
├── PROJECT_STRUCTURE.md             # This file
├── package.json                     # Root package file
├── render.yaml                      # Render config
├── resolve-conflicts.bat            # Conflict resolution script
├── setup.bat                        # Windows setup script
├── start.bat                        # Windows start script
└── start.sh                         # Linux/Mac start script
```

---

## 🔑 Key Files Explained

### Backend

| File | Purpose |
|------|---------|
| `server.js` | Main Express server, route mounting, middleware |
| `models/Timetable.js` | Core timetable data structure |
| `models/Template.js` | Reusable period timing templates |
| `routes/ai.js` | AI generation algorithms |
| `routes/timetables.js` | Timetable CRUD operations |
| `middleware/auth.js` | JWT authentication & authorization |

### Frontend

| File | Purpose |
|------|---------|
| `App.tsx` | Main app, routing configuration |
| `utils/api.js` | Centralized API calls |
| `pages/admin/GenerateTimetableNew.tsx` | Main AI generation interface |
| `pages/admin/PeriodTimingCanvas.tsx` | Period timing template designer |
| `pages/admin/ManageTimetables.tsx` | Timetable structure management |
| `context/AuthContext.js` | Global authentication state |

---

## 🗂️ Data Models

### Core Entities

1. **AcademicYear**
   - Manages academic calendar
   - Tracks current active year

2. **Class**
   - Represents a class/section (e.g., "2ND CSE A")
   - Links to subjects and timetables

3. **Subject**
   - Course information
   - Lab vs Theory designation
   - Credit hours

4. **User (Faculty)**
   - Faculty profile
   - Subjects taught
   - Availability

5. **Timetable**
   - Main schedule container
   - Links to class, academic year
   - Contains weekly schedule grid

6. **Template**
   - Reusable period timing structure
   - Guidelines preset
   - Can be public or private

7. **Schedule**
   - Period timing definitions
   - Break schedules
   - Time slots

---

## 🔄 Data Flow

```
User Login → Authentication
    ↓
Select/Create Class
    ↓
Create Timetable Structure (with Template)
    ↓
Assign Subjects & Faculty
    ↓
AI Generation (routes/ai.js)
    ↓
Generated Timetable Saved
    ↓
View/Edit Timetable
```

---

## 🚀 API Endpoints

### Authentication
- POST `/api/auth/login` - User login
- GET `/api/auth/me` - Get current user
- PUT `/api/auth/change-password` - Change password

### Classes
- GET `/api/classes` - List all classes
- POST `/api/classes` - Create class
- PUT `/api/classes/:id` - Update class
- DELETE `/api/classes/:id` - Delete class

### Subjects
- GET `/api/subjects` - List all subjects
- POST `/api/subjects` - Create subject
- PUT `/api/subjects/:id` - Update subject
- DELETE `/api/subjects/:id` - Delete subject

### Timetables
- GET `/api/timetables` - List all timetables
- POST `/api/timetables` - Create timetable structure
- GET `/api/timetables/:id` - Get specific timetable
- PUT `/api/timetables/:id` - Update timetable
- DELETE `/api/timetables/:id` - Delete timetable

### Templates
- GET `/api/templates` - List templates
- POST `/api/templates` - Create template
- GET `/api/templates/:id` - Get template
- PUT `/api/templates/:id` - Update template
- DELETE `/api/templates/:id` - Delete template

### AI Generation
- POST `/api/ai/generate-timetable` - Generate timetable with AI
- PUT `/api/ai/edit-timetable-entry` - Edit single entry
- POST `/api/ai/regenerate-timetable` - Regenerate

---

## 🎨 Frontend Architecture

### State Management
- **React Context API**: Global auth state
- **Component State**: Local UI state
- **API Responses**: Server-side data

### Routing
- **react-router-dom**: Client-side routing
- **ProtectedRoute**: Role-based access control

### Styling
- **Tailwind CSS**: Utility-first CSS framework
- **Custom CSS**: Component-specific styles

---

## 🔒 Security

- **JWT Tokens**: Stateless authentication
- **bcrypt**: Password hashing
- **Role-based Access**: Admin vs Faculty permissions
- **Protected Routes**: Frontend & backend protection
- **CORS**: Configured for security

---

## 📦 Dependencies

### Backend Core
- `express` - Web framework
- `mongoose` - MongoDB ODM
- `jsonwebtoken` - JWT auth
- `bcryptjs` - Password hashing
- `cors` - Cross-origin requests
- `dotenv` - Environment variables

### Frontend Core
- `react` - UI library
- `react-router-dom` - Routing
- `axios` - HTTP client
- `typescript` - Type safety
- `tailwindcss` - Styling

---

**Last Updated**: February 4, 2026
