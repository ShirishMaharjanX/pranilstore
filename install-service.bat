@echo off
echo ========================================
echo   Pranil Store - Windows Service Setup
echo ========================================
echo.

REM Check if running as administrator
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo ERROR: Please run this script as Administrator
    echo Right-click on this file and select "Run as administrator"
    pause
    exit /b 1
)

set SERVICE_NAME=PranilStore
set EXE_PATH=%~dp0node.exe
set SCRIPT_PATH=%~dp0backend\server.js

REM Find node.exe in current directory or PATH
where node >nul 2>&1
if %errorLevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)

echo Installing Pranil Store as Windows Service...
echo Service Name: %SERVICE_NAME%
echo.

REM Check if service already exists
sc query %SERVICE_NAME% >nul 2>&1
if %errorLevel% equ 0 (
    echo Service already exists. Stopping and deleting...
    net stop %SERVICE_NAME% 2>nul
    sc delete %SERVICE_NAME% 2>nul
)

REM Create the service
sc create %SERVICE_NAME% binPath= "cmd /c \"node %SCRIPT_PATH%\"" DisplayName= "Pranil Store" start= auto

if %errorLevel% neq 0 (
    echo ERROR: Failed to create service
    pause
    exit /b 1
)

REM Set service description
sc description %SERVICE_NAME% "Pranil Sales & Marketing E-Commerce Platform"

REM Set recovery options
sc failure %SERVICE_NAME% reset= 86400 actions= restart/60000/restart/60000/restart/60000

echo.
echo ========================================
echo Service installed successfully!
echo ========================================
echo.
echo Starting service...
net start %SERVICE_NAME%

if %errorLevel% equ 0 (
    echo.
    echo SUCCESS: Pranil Store is now running!
    echo Open your browser and go to: http://localhost:3000
) else (
    echo.
    echo WARNING: Service may have started but there was an issue.
)

echo.
echo To manage the service:
echo   - Stop:   net stop %SERVICE_NAME%
echo   - Start:  net start %SERVICE_NAME%
echo   - Delete: sc delete %SERVICE_NAME%
echo.
pause
