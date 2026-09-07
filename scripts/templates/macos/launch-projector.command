#!/bin/bash
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
HTML_FILE="$DIR/vtt-zero.html"

echo "Launching VTT-ZERO Projector View..."
if [ -f "$HTML_FILE" ]; then
    open "file://${HTML_FILE}?mode=player"
else
    echo "Error: vtt-zero.html not found in $DIR"
    read -p "Press Enter to exit..."
    exit 1
fi

