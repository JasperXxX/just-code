# LaunchAgents

macOS `launchd` jobs that run in the background under your user account.
Sanitized templates only — adjust the path inside each plist before loading.

## What's in here

### `com.user.claude-progress-watcher.plist`

Runs `~/.claude/bin/claude-progress-watcher` continuously and feeds long-running
processes (3D-print jobs, ComfyUI queues, Remotion renders, ffmpeg, …) into
the Claude Code statusline. The watcher reads detector config from
`~/.claude/progress-watcher.env` — copy `claude/progress-watcher.env.template`
and uncomment what you actually use.

**Before loading:** replace `USERNAME` in the `ProgramArguments` path with your
macOS username (or edit it to your real `$HOME`-substituted absolute path).
`launchd` does not expand `~` or `$HOME`.

```bash
# Install + activate
cp launchagents/com.user.claude-progress-watcher.plist ~/Library/LaunchAgents/
# (edit USERNAME inside the file first)
launchctl load ~/Library/LaunchAgents/com.user.claude-progress-watcher.plist

# Check it's running
launchctl list | grep claude-progress

# Logs
tail -f /tmp/claude-progress-watcher.log
tail -f /tmp/claude-progress-watcher.err.log

# Stop / uninstall
launchctl unload ~/Library/LaunchAgents/com.user.claude-progress-watcher.plist
```

## Not yet packaged

The README mentions `com.user.killcaffeinate.plist` and
`com.user.micvolumeguard.plist` — those are still TODO templates. Open an
issue if you want them prioritized.
