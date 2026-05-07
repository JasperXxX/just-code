#!/bin/bash
# Show animated marching-ants border. Idempotent: kills any prior instance.

PIDFILE="/tmp/claude-flash-border.pid"

if [ -f "$PIDFILE" ]; then
  OLD=$(cat "$PIDFILE" 2>/dev/null)
  if [ -n "$OLD" ] && kill -0 "$OLD" 2>/dev/null; then
    # Already running — leave it alone.
    exit 0
  fi
  rm -f "$PIDFILE"
fi

nohup /usr/bin/python3 $HOME/.claude/flash-border.py >/dev/null 2>&1 &
echo $! > "$PIDFILE"
disown 2>/dev/null || true
exit 0
