@echo off
cd /d "%~dp0"
if not exist dist call npm run build
start "" http://localhost:3001
npm start
