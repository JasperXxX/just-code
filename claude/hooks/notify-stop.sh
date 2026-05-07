#!/bin/bash
# Stop hook: macOS notification + visual bell when Claude finishes a turn.
# Title  = "<project> · <topic>"
# Body   = "<N tools> · <last assistant text snippet>"

input=$(cat)
session_id=$(printf '%s' "$input" | jq -r '.session_id // empty')
transcript_path=$(printf '%s' "$input" | jq -r '.transcript_path // empty')
cwd=$(printf '%s' "$input" | jq -r '.cwd // .workspace.current_dir // empty')

project=$(basename "$cwd" 2>/dev/null)
[ -z "$project" ] && project="claude"

topic_file="/tmp/claude-session-${session_id}-topic.txt"
topic=""
if [ -f "$topic_file" ]; then
  topic=$(head -c 50 "$topic_file" | tr -d '\n')
fi
[ -z "$topic" ] && topic="ready"

# Build body from transcript: count tool_use entries since last user message
# and grab the last assistant text block.
summary=""
if [ -n "$transcript_path" ] && [ -f "$transcript_path" ]; then
  last_user_line=$(grep -n '"role":"user"' "$transcript_path" 2>/dev/null | tail -1 | cut -d: -f1)
  if [ -n "$last_user_line" ]; then
    tail_slice=$(tail -n +"$last_user_line" "$transcript_path")
    tool_count=$(printf '%s\n' "$tail_slice" | grep -c '"type":"tool_use"' 2>/dev/null)
    [ -z "$tool_count" ] && tool_count=0
    last_text=$(printf '%s\n' "$tail_slice" | jq -rs '
      [.[]
       | select(.message?.role == "assistant")
       | .message.content[]?
       | select(.type == "text")
       | .text]
      | last // empty
    ' 2>/dev/null | tr '\n' ' ' | head -c 100)

    if [ -n "$last_text" ]; then
      summary="${tool_count} tools · ${last_text}"
    elif [ "$tool_count" -gt 0 ]; then
      summary="${tool_count} tools used"
    fi
  fi
fi
[ -z "$summary" ] && summary="done"

# Escape for AppleScript string literal
title="${project} · ${topic}"
title_esc=$(printf '%s' "$title"   | sed 's/\\/\\\\/g; s/"/\\"/g')
body_esc=$(printf '%s' "$summary"  | sed 's/\\/\\\\/g; s/"/\\"/g')

osascript -e "display notification \"${body_esc}\" with title \"${title_esc}\"" >/dev/null 2>&1

# Visual bell on the controlling terminal (triggers Visual Bell flash)
(printf '\a' > /dev/tty) 2>/dev/null || true

exit 0
