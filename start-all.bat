@echo off
echo ====================================================
echo Launching PaalVandi (Full Stack: Java Backend + Vite Frontend)
echo ====================================================
start "PaalVandi Backend (Java 21)" cmd /k "run-backend.bat"
start "PaalVandi Frontend (React 18)" cmd /k "run-frontend.bat"
echo Both services are starting in separate windows!
echo Frontend will be accessible at: http://localhost:3000
echo Backend API is running at: http://localhost:8080
pause
