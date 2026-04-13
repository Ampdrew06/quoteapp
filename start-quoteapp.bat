@echo off
cd /d "%~dp0"
REM Optional: lock a port (default CRA is 3000)
REM set PORT=3000
npm start
