#!/bin/bash
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
HTML_FILE="$DIR/vtt-zero.html"

echo "Launching VTT-ZERO DM Console..."
if command -v xdg-open > /dev/null; then
    xdg-open "$HTML_FILE"
    sleep 0.5
    xdg-open "$HTML_FILE?mode=player"
else
    echo "Opening files in default browser..."
    python3 -m webbrowser "file://$HTML_FILE" 2>/dev/null
    sleep 0.5
    python3 -m webbrowser "file://$HTML_FILE?mode=player" 2>/dev/null
fi
