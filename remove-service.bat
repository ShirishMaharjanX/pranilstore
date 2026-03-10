@echo off
echo ========================================
echo   Pranil Store - Remove Service
echo ========================================
echo.

set SERVICE_NAME=PranilStore

echo Stopping service...
net stop %SERVICE_NAME% 2>nul

echo Deleting service...
sc delete %SERVICE_NAME% 2>nul

echo.
echo ========================================
echo Service removed successfully!
echo ========================================
echo.
pause
