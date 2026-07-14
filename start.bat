@echo off
chcp 65001 >nul 2>&1
title ExpSupInterviewer

if not exist "%~dp0backend\config.yaml" (
    echo [ERROR] backend\config.yaml not found
    echo Run: copy backend\config.example.yaml backend\config.yaml
    pause
    exit /b 1
)

echo ========================================
echo  ExpSupInterviewer
echo ========================================

start "ExpSup-Backend" cmd /k "%~dp0start_backend.bat"
start "ExpSup-Frontend" /D "%~dp0" cmd /k "echo [Frontend] http://localhost:5173 && npm run dev"

echo.
echo  Frontend: http://localhost:5173
echo  Backend:  http://127.0.0.1:9400
echo.
pause
