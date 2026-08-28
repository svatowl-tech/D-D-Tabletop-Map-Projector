#!/bin/bash
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
HTML_FILE="$DIR/vtt-zero.html"

echo "Launching VTT-ZERO DM Console and Projector..."
open "$HTML_FILE"
sleep 0.5
open "$HTML_FILE?mode=player"
