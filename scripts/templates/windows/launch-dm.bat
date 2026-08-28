@echo off
title VTT-ZERO DM Console
echo ======================================================
echo    VTT-ZERO - TABLETOP MAP PROJECTOR (DM CONSOLE)
echo ======================================================
echo Launching Dungeon Master view...
echo.

set "HTML_FILE=%~dp0vtt-zero.html"

if not exist "%HTML_FILE%" (
    echo Error: vtt-zero.html not found in current directory!
    pause
    exit /b 1
)

start "" "%HTML_FILE%"
exit /b 0
