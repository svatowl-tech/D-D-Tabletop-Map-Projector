@echo off
title VTT-ZERO Dual Screen Launcher
echo ======================================================
echo    VTT-ZERO - DUAL-SCREEN AUTO LAUNCHER
echo ======================================================
echo 1. Launching Master Console on Primary Monitor...
echo 2. Launching Projector View on Secondary Monitor / Window...
echo.

set "HTML_FILE=%~dp0vtt-zero.html"

if not exist "%HTML_FILE%" (
    echo Error: vtt-zero.html not found!
    pause
    exit /b 1
)

start "" "%HTML_FILE%"
timeout /t 1 /nobreak >nul
start "" "%HTML_FILE%?mode=player"

echo Done!
exit /b 0
