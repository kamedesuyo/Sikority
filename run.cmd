@echo off
start cmd /k "%~dp0scripts/start_backend.bat"
timeout /t 5
start cmd /k "%~dp0scripts/start_frontend.bat" 
timeout /t 3
start http://localhost:5173/