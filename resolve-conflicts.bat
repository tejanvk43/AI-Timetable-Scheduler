@echo off
echo Resolving Git merge conflicts...
echo This will keep the timetable scheduler version (HEAD) and discard notice board changes
echo.

echo Checking out all files from HEAD to resolve conflicts...
git checkout --theirs .
if %errorlevel% neq 0 (
    echo Trying alternative resolution method...
    git reset --hard HEAD
)

echo.
echo Conflicts resolved! Running npm install to ensure dependencies are up to date...
cd backend
call npm install
cd ../frontend  
call npm install
cd ..

echo.
echo Setup complete! You can now run: npm run dev
pause
