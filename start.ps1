# ExpSupInterviewer - Start both frontend and backend in separate terminals

$ErrorActionPreference = "Stop"
$Root = $PSScriptRoot

if (-not (Test-Path "$Root\backend\config.yaml")) {
    Write-Host "[ERROR] backend\config.yaml not found" -ForegroundColor Red
    Write-Host "  Run: copy backend\config.example.yaml backend\config.yaml" -ForegroundColor Yellow
    exit 1
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " ExpSupInterviewer" -ForegroundColor White
Write-Host "========================================" -ForegroundColor Cyan

# Backend
Start-Process pwsh -WorkingDirectory $Root -ArgumentList @(
    "-NoExit", "-Command",
    "if (Test-Path 'backend\.venv\Scripts\Activate.ps1') { & 'backend\.venv\Scripts\Activate.ps1' }; Write-Host '[Backend] http://127.0.0.1:9400' -ForegroundColor Cyan; python -m uvicorn backend.main:app --reload --port 9400"
)

# Frontend
Start-Process pwsh -WorkingDirectory $Root -ArgumentList @(
    "-NoExit", "-Command",
    "Write-Host '[Frontend] http://localhost:5173' -ForegroundColor Green; npm run dev"
)

Write-Host ""
Write-Host "  Frontend: http://localhost:5173" -ForegroundColor Green
Write-Host "  Backend:  http://127.0.0.1:9400" -ForegroundColor Cyan
Write-Host ""
