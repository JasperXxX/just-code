#!/bin/bash
# Hide animated marching-ants border. Safe to call when none is running.

PIDFILE="/tmp/claude-flash-border.pid"

if [ -f "$PIDFILE" ]; then
  PID=$(cat "$PIDFILE" 2>/dev/null)
  [ -n "$PID" ] && kill "$PID" 2>/dev/null
  rm -f "$PIDFILE"
fi

# Belt-and-suspenders: kill any stragglers that might own the script.
pkill -f "flash-border.py" 2>/dev/null

exit 0
