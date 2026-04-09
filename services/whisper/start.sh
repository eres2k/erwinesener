#!/usr/bin/env bash
# Startup script for Tricorder Whisper STT service.
# This replaces the 'faster-whisper-server' CLI with the correct
# custom whisper_server.py using the 'faster-whisper' library.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Install dependencies if needed
if ! python3 -c "import faster_whisper" 2>/dev/null; then
    echo "Installing whisper dependencies..."
    pip install -r requirements.txt
fi

# Default settings (override via environment variables)
HOST="${WHISPER_HOST:-0.0.0.0}"
PORT="${WHISPER_PORT:-8080}"
MODEL="${WHISPER_MODEL:-base}"
DEVICE="${WHISPER_DEVICE:-auto}"

exec python3 whisper_server.py \
    --host "$HOST" \
    --port "$PORT" \
    --model "$MODEL" \
    --device "$DEVICE"
