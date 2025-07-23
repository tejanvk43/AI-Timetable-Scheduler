# AI Timetable Scheduler

A comprehensive web application for managing academic timetables with AI-powered scheduling capabilities.

## Features

- **Admin Dashboard**: Manage faculty, classes, subjects, and generate timetables
- **Faculty Dashboard**: View assigned classes and teaching schedules
- **AI-Powered Scheduling**: Intelligent timetable generation with conflict resolution
- **Role-Based Access**: Secure authentication with admin and faculty roles
- **Responsive Design**: Modern UI with Tailwind CSS

## Tech Stack

### Backend
- Node.js & Express.js
- MongoDB with Mongoose
- JWT Authentication
- bcrypt for password hashing

### Frontend
- React with TypeScript
- Tailwind CSS for styling
- React Router for navigation
- Axios for API calls

## Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

### Quick Setup (Run from Root Directory)

**Option 1: Using setup script (Windows)**
```bash
setup.bat
```

**Option 2: Manual setup**
```bash
# Install all dependencies
npm run setup

# Configure environment variables (see Backend Setup section)

# Start both frontend and backend
npm run dev
```

**Option 3: Using start script (Windows)**
```bash
start.bat
```

### Available Scripts from Root Directory

- `npm run dev` - Start both frontend and backend concurrently
- `npm run start` - Same as dev
- `npm run backend` - Start only backend
- `npm run frontend` - Start only frontend  
- `npm run setup` - Install all dependencies
- `npm run install:all` - Install frontend and backend deps
- `npm run frontend:build` - Build frontend for production
- `npm run clean` - Remove all node_modules

### Individual Project Setup

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the backend directory:
   ```env
   MONGODB_URI=mongodb://localhost:27017/timetable_scheduler
   JWT_SECRET=your-secret-key-here
   JWT_EXPIRE=30d
   NODE_ENV=development
   PORT=5000
   ```

4. Set up the database (creates admin user):
   ```bash
   node scripts/setup-database.js
   ```

5. Start the backend server:
   ```bash
   npm run dev
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the frontend development server:
   ```bash
   npm start
   ```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## Default Credentials

After running the setup script, use these credentials to login:
- **Username**: 1001
- **Password**: admin123
- **Role**: Admin

## Database Management

### Clear Database
To remove all data and start fresh:
```bash
cd backend/scripts
node clear-database.js
```

### Setup Fresh Database
To create a clean database with just an admin user:
```bash
cd backend/scripts
node setup-database.js
```

### Check Users
To view all users in the database:
```bash
cd backend
node check-users.js
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - Register new faculty (admin only)
- `GET /api/auth/me` - Get current user profile
- `PUT /api/auth/change-password` - Change password

### Users
- `GET /api/users` - Get all users (admin only)
- `GET /api/users/faculty` - Get all faculty members (admin only)
- `PUT /api/users/:id` - Update user (admin only)
- `DELETE /api/users/:id` - Delete user (admin only)

### Classes
- `GET /api/classes` - Get all classes
- `POST /api/classes` - Create new class (admin only)
- `PUT /api/classes/:id` - Update class (admin only)
- `DELETE /api/classes/:id` - Delete class (admin only)

### Subjects
- `GET /api/subjects` - Get all subjects
- `POST /api/subjects` - Create new subject (admin only)
- `PUT /api/subjects/:id` - Update subject (admin only)
- `DELETE /api/subjects/:id` - Delete subject (admin only)
- `POST /api/subjects/assign` - Assign subjects to faculty (admin only)

### Timetables
- `GET /api/timetables` - Get all timetables
- `GET /api/timetables/class/:classId` - Get timetable for specific class
- `GET /api/timetables/faculty/:facultyId` - Get timetable for faculty
- `POST /api/timetables` - Create new timetable (admin only)
- `PUT /api/timetables/:id` - Update timetable (admin only)
- `DELETE /api/timetables/:id` - Delete timetable (admin only)

### AI Generation
- `POST /api/ai/generate-timetable` - Generate timetable using AI (admin only)

## Usage Guide

### For Administrators

1. **Login** with admin credentials
2. **Manage Faculty**: Add, edit, or remove faculty members
3. **Manage Subjects**: Create subjects and assign them to faculty
4. **Manage Classes**: Create classes and assign class teachers
5. **Generate Timetables**: Use AI-powered generation with customizable guidelines

### For Faculty

1. **Login** with faculty credentials
2. **View Dashboard**: See assigned subjects and classes
3. **View Schedule**: Check weekly or daily teaching schedule
4. **Switch Between Classes**: View timetables for different assigned classes

## Project Structure

```
├── backend/
│   ├── middleware/       # Authentication middleware
│   ├── models/          # MongoDB schemas
│   ├── routes/          # API routes
│   ├── scripts/         # Database management scripts
│   ├── server.js        # Main server file
│   └── .env            # Environment variables
└── frontend/
    ├── public/         # Static files
    ├── src/
    │   ├── components/ # Reusable components
    │   ├── context/    # React context providers
    │   ├── pages/      # Page components
    │   ├── utils/      # API utilities
    │   └── App.tsx     # Main app component
    └── package.json
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.
