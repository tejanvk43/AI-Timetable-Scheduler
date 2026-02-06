@echo off
echo ================================
echo AI Timetable Scheduler Setup
echo ================================
echo.

echo Installing root dependencies...
call npm install
if %errorlevel% neq 0 (
    echo Error installing root dependencies
    pause
    exit /b 1
)

echo.
echo Installing backend dependencies...
cd backend
call npm install
if %errorlevel% neq 0 (
    echo Error installing backend dependencies
    cd ..
    pause
    exit /b 1
)

cd ..
echo.
echo Installing frontend dependencies...
cd frontend
call npm install
if %errorlevel% neq 0 (
    echo Error installing frontend dependencies
    cd ..
    pause
    exit /b 1
)

cd ..
echo.
echo ================================
echo Setup completed successfully!
echo ================================
echo.
echo Next steps:
echo 1. Configure your MongoDB connection in backend/.env
echo 2. Run 'npm run dev' or use start.bat to begin development
echo 3. Open http://localhost:3001 in your browser
echo.
echo Default login: Username: 1001, Password: admin123
echo.
pause
