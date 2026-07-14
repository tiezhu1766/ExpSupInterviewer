@echo off
chcp 65001 >nul 2>&1
title ExpSup-Backend
cd /d "%~dp0"
if exist backend\.venv\Scripts\activate.bat call backend\.venv\Scripts\activate.bat
echo [Backend] Starting on http://127.0.0.1:9400
python -m uvicorn backend.main:app --reload --port 9400
