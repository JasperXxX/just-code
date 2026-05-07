#!/bin/bash
# UserPromptSubmit hook: writes a 3-5 word thematic summary of the user's prompt
# to a session-specific file. The statusline reads it to show "what Claude is
# currently working on". Runs the AI summary asynchronously so the prompt
# isn't blocked.

# --- Recursion guard --------------------------------------------------------
# This hook calls `claude -p`, which spawns a fresh Claude process that ALSO
# fires UserPromptSubmit hooks. Without this guard, every user prompt triggers
# an endless chain of `claude -p` invocations.
if [ -n "$CLAUDE_TOPIC_HOOK_NESTED" ]; then
  exit 0
fi

input=$(cat)
session_id=$(printf '%s' "$input" | jq -r '.session_id // empty')
prompt=$(printf '%s' "$input" | jq -r '.prompt // empty')

[ -z "$session_id" ] && exit 0
[ -z "$prompt" ] && exit 0

# Defense in depth: if the prompt looks like our own meta-call, skip.
case "$prompt" in
  "Generate a SHORT thematic title"*) exit 0 ;;
esac

topic_file="/tmp/claude-session-${session_id}-topic.txt"

# Immediate placeholder: first ~50 chars of the raw prompt
placeholder=$(printf '%s' "$prompt" | tr '\n' ' ' | head -c 50)
printf '%s' "$placeholder" > "$topic_file"

# Async AI summary so we don't block the prompt
(
  prompt_clean=$(printf '%s' "$prompt" | tr '\n' ' ' | head -c 800)

  # Run claude -p in background and enforce a manual 30s timeout
  # (macOS has no `timeout` binary; this is portable bash.)
  tmp_out=$(mktemp -t claude-topic.XXXXXX)
  CLAUDE_TOPIC_HOOK_NESTED=1 claude -p --model claude-haiku-4-5-20251001 \
    "Generate a SHORT thematic title (3-5 words) for what the user is working on, like a tab title. Examples: 'Statusline Bug Fix', 'Mobile App Refactor', 'Database Migration', 'Onboarding Doc Update'. Use the same language as the request. No punctuation, no quotes, no explanation — just the title. Request: $prompt_clean" \
    < /dev/null > "$tmp_out" 2>/dev/null &
  claude_pid=$!

  ( sleep 30 && kill -9 "$claude_pid" 2>/dev/null ) >/dev/null 2>&1 &
  killer_pid=$!

  wait "$claude_pid" 2>/dev/null
  kill -9 "$killer_pid" 2>/dev/null
  wait "$killer_pid" 2>/dev/null

  summary=$(tr -d '\n"' < "$tmp_out" | head -c 60)
  rm -f "$tmp_out"

  if [ -n "$summary" ] && [ "${#summary}" -gt 2 ]; then
    printf '%s' "$summary" > "$topic_file"
  fi
) >/dev/null 2>&1 &
disown

exit 0
