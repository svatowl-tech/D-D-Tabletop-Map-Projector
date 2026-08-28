@echo off
title VTT-ZERO Projector View
echo ======================================================
echo    VTT-ZERO - TABLETOP MAP PROJECTOR (PLAYER VIEW)
echo ======================================================
echo Launching Projector / Player view...
echo Move this window to your TV / Projector and press F11 for Fullscreen.
echo.

set "HTML_FILE=%~dp0vtt-zero.html"

if not exist "%HTML_FILE%" (
    echo Error: vtt-zero.html not found in current directory!
    pause
    exit /b 1
)

start "" "%HTML_FILE%?mode=player"
exit /b 0
