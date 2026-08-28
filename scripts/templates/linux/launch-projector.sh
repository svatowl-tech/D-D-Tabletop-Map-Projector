#!/bin/bash
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
HTML_FILE="$DIR/vtt-zero.html"

if command -v xdg-open > /dev/null; then
    xdg-open "$HTML_FILE?mode=player"
elif command -v sensible-browser > /dev/null; then
    sensible-browser "$HTML_FILE?mode=player"
else
    echo "Opening $HTML_FILE?mode=player in default browser..."
    python3 -m webbrowser "file://$HTML_FILE?mode=player" 2>/dev/null || echo "Please open $HTML_FILE?mode=player manually."
fi
