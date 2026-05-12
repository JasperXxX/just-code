#!/usr/bin/env bash
# UserPromptSubmit hook: clear stale ETA from previous task and inject
# a system reminder so Claude sets a fresh ETA at the start of any
# non-trivial response. Stdout from this script is added to the user
# prompt as additional context by Claude Code.

input=$(cat)
sid=$(printf '%s' "$input" | jq -r '.session_id // empty' 2>/dev/null)

# Clear stale ETA from the previous task in this session.
if [ -n "$sid" ]; then
  rm -f "/tmp/claude-eta-$sid.txt" 2>/dev/null
fi

# Inject reminder. Keep concise; appears on every prompt.
cat <<'EOF'
<system-reminder>
ETA requirement (statusline display):

If this task will plausibly run longer than 30 seconds (multi-tool work,
research, several edits, dispatching a subagent), call as the very first
action of your response:

  ~/.claude/bin/claude-eta <duration>

Examples: `claude-eta 30s`, `claude-eta 2m`, `claude-eta 5min`, `claude-eta 1h`.

When in doubt, call it — too generous is better than no ETA. Skip only for
pure-text answers (a quick explanation, a single question, no tools).

This writes your estimate into a state file the statusline bar reads.
Without it the user can't see how long they still have to wait.

Re-estimate mid-run if reality diverges: `claude-eta <new>` from now,
not from task start.
</system-reminder>
EOF
