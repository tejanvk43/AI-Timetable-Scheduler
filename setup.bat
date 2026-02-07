@echo off
setlocal enabledelayedexpansion

echo ========================================
echo   AI Timetable Scheduler - Setup
echo ========================================
echo.

REM Check if Node.js is installed
where node >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    echo.
    pause
    exit /b 1
)

REM Check if npm is installed
where npm >nul 2>&1
if errorlevel 1 (
    echo [ERROR] npm is not installed or not in PATH
    echo Please install npm (comes with Node.js)
    echo.
    pause
    exit /b 1
)

echo [INFO] Node.js version:
node --version
echo [INFO] npm version:
npm --version
echo.

echo ========================================
echo   Step 1/4: Root Dependencies
echo ========================================
echo Installing root dependencies...
call npm install
if errorlevel 1 (
    echo.
    echo [ERROR] Failed to install root dependencies
    echo Please check your internet connection and try again
    pause
    exit /b 1
)
echo [OK] Root dependencies installed successfully
echo.

echo ========================================
echo   Step 2/4: Backend Dependencies
echo ========================================
echo Installing backend dependencies...
if not exist "backend" (
    echo [ERROR] Backend directory not found
    pause
    exit /b 1
)
cd backend
call npm install
if errorlevel 1 (
    echo.
    echo [ERROR] Failed to install backend dependencies
    cd ..
    pause
    exit /b 1
)
cd ..
echo [OK] Backend dependencies installed successfully
echo.

echo ========================================
echo   Step 3/4: Frontend Dependencies
echo ========================================
echo Installing frontend dependencies...
if not exist "frontend" (
    echo [ERROR] Frontend directory not found
    pause
    exit /b 1
)
cd frontend
call npm install
if errorlevel 1 (
    echo.
    echo [ERROR] Failed to install frontend dependencies
    cd ..
    pause
    exit /b 1
)
cd ..
echo [OK] Frontend dependencies installed successfully
echo.

echo ========================================
echo   Step 4/4: Environment Check
echo ========================================
if not exist "backend\.env" (
    echo [WARNING] .env file not found in backend/ directory
    echo.
    echo You need to create a .env file with the following variables:
    echo   - MONGODB_URI (MongoDB connection string)
    echo   - JWT_SECRET (Secret key for JWT tokens)
    echo   - OPENAI_API_KEY (Optional, for AI features)
    echo   - FRONTEND_URL (Frontend URL for CORS)
    echo.
    echo See README.md for detailed configuration instructions.
    echo.
) else (
    echo [OK] .env file found in backend/ directory
)
echo.

echo ========================================
echo   Setup Complete!
echo ========================================
echo.
echo Next steps:
echo.
echo 1. Configure Environment Variables (if not done):
echo    - Create .env file in backend/ directory
echo    - Set required variables (see README.md)
echo.
echo 2. Initialize Database:
echo    cd backend
echo    npm run setup
echo    (This creates the initial admin user)
echo.
echo 3. Start the Application:
echo    npm run dev
echo    (Starts both backend and frontend servers)
echo.
echo 4. Access the Application:
echo    - Frontend: http://localhost:3002
echo    - Backend API: http://localhost:5001
echo.
echo ========================================
echo   For more information, see README.md
echo ========================================
echo.
pause
