#!/bin/bash
# UserPromptSubmit hook: maintains a chat-wide thematic title in
# /tmp/claude-session-<SID>-topic.txt. Reads the full transcript (not just
# the current prompt) so the title reflects the conversation's drift, not
# the last sentence the user typed. Regenerates every 3 prompts to stay
# stable between updates.

# Recursion guard — `claude -p` re-fires UserPromptSubmit hooks.
if [ -n "$CLAUDE_TOPIC_HOOK_NESTED" ]; then
  exit 0
fi

input=$(cat)
session_id=$(printf '%s' "$input" | jq -r '.session_id // empty')
prompt=$(printf '%s' "$input" | jq -r '.prompt // empty')
transcript_path=$(printf '%s' "$input" | jq -r '.transcript_path // empty')

[ -z "$session_id" ] && exit 0
[ -z "$prompt" ] && exit 0

# Defense: skip our own meta-call should it ever leak through.
case "$prompt" in
  "Generate a SHORT thematic title"*) exit 0 ;;
  "Summarize this conversation"*) exit 0 ;;
esac

topic_file="/tmp/claude-session-${session_id}-topic.txt"
count_file="/tmp/claude-session-${session_id}-topic-count.txt"

# Increment per-session prompt counter (only this hook writes it).
prev_count=0
[ -f "$count_file" ] && prev_count=$(cat "$count_file" 2>/dev/null || echo 0)
new_count=$((prev_count + 1))
printf '%s' "$new_count" > "$count_file"

# Generate on prompt #1, then every 3rd prompt thereafter (1, 4, 7, 10, ...).
# Between regenerations the existing topic stays put — no flicker per message.
if [ "$new_count" -gt 1 ] && [ $(( (new_count - 1) % 3 )) -ne 0 ]; then
  exit 0
fi

# Placeholder while the AI summary runs: first ~50 chars of the latest prompt.
# Only set it on the very first prompt, otherwise we'd briefly blow away a
# perfectly good chat-wide topic with a fragment of the user's latest sentence.
if [ "$new_count" -eq 1 ]; then
  placeholder=$(printf '%s' "$prompt" | tr '\n' ' ' | head -c 50)
  printf '%s' "$placeholder" > "$topic_file"
fi

# Async AI summary so we don't block the prompt.
(
  # Pull the recent transcript so the title reflects the conversation,
  # not just the latest prompt. Falls back to the prompt if no transcript.
  context=""
  if [ -n "$transcript_path" ] && [ -f "$transcript_path" ]; then
    # Last ~40 messages (user + assistant text), newest last. Strip JSON noise.
    context=$(tail -n 200 "$transcript_path" 2>/dev/null \
      | jq -r 'select(.type=="user" or .type=="assistant") |
               if .type=="user" then "USER: " else "ASSISTANT: " end +
               (.message.content // "" | if type=="array" then
                 map(select(.type=="text") | .text) | join(" ")
               else tostring end)' 2>/dev/null \
      | tail -n 40 \
      | tr '\n' ' ' \
      | head -c 6000)
  fi
  if [ -z "$context" ]; then
    context=$(printf '%s' "$prompt" | tr '\n' ' ' | head -c 800)
  fi

  tmp_out=$(mktemp -t claude-topic.XXXXXX)
  CLAUDE_TOPIC_HOOK_NESTED=1 claude -p --model claude-haiku-4-5-20251001 \
    "Generate a SHORT thematic title (3-5 words) for what this conversation is about overall — like a tab title. Examples: 'Statusline Bug Fix', 'Mobile App Refactor', 'Database Migration', 'Onboarding Doc Update'. Use the same language as the conversation. No punctuation, no quotes, no explanation — just the title. Conversation: $context" \
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
