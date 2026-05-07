# Global Claude Settings (template)

> Generic version. Adapt the working-style index, project tags, and skill list
> to your own setup. Personal observations belong in `~/.claude/working-style/`
> (not committed in this template repo).

## Working style — meta about how you work (read on-demand)

Optional: build out a `~/.claude/working-style/` directory with detail files
indexed here, so Claude reads structure up front and only loads the relevant
detail file when its topic comes up. Suggested files:

- `prompt-style.md` — how you communicate, tone, language mix, signals to read
- `tool-usage.md` — observed tool/skill usage, friction points, rejections
- `feedback-log.md` — dated stream of what worked / didn't; promote repeated patterns
- `patterns.md` — recurring cross-project workflows

Update rule: edit the detail file, not this index.

## Auto-memory: per-project structured facts

Each working directory gets its own memory under
`~/.claude/projects/<encoded-cwd>/memory/`. Short, structured facts —
user profile, feedback rules, project pointers, reference links — live here.

The directory has a flat layout: one `MEMORY.md` index plus one `.md` file
per memory entry. Each entry has frontmatter (`name`, `description`, `type`)
and a short body. The index `MEMORY.md` lists the entries, one line each,
under ~150 chars. See `memory/` in this repo for sanitized templates.

### Memory types
- **user** — who the user is, role, expertise, preferences
- **feedback** — corrections + validations on how to work; lead with the rule, then `**Why:**` and `**How to apply:**`
- **project** — non-derivable facts about ongoing work; absolute dates only
- **reference** — pointers to external systems (Linear, Slack, dashboards, repos)

### When to write
- Whenever the user explicitly says "remember", "save", "merk dir das".
- After substantive work, when something non-obvious would help next session.
- After corrections — save the rule + why.
- After non-obvious validations — when the user confirmed an unusual approach worked.

### When NOT to write
- Code patterns, architecture, file paths — readable from the project.
- Git history — `git log` / `git blame` are authoritative.
- Anything already in CLAUDE.md.
- Ephemeral task state — that's what TodoWrite is for.

## Proactive skill awareness

Claude Code installs ship with hundreds of skills. Most go unused.

**When a user request matches a skill they likely don't remember, surface it before acting.**

How to apply:
- If the task fits a skill in your *active set*, just use it silently.
- If the task fits a skill they have but **don't normally use**, surface it briefly: one sentence — "Du hast übrigens den `<skill>`-Skill — soll ich den nehmen?". Then wait or proceed based on the cue.
- If no skill fits, don't pretend one exists.
- Don't surface every match — pick the *one* most likely to surprise+help.

Define your own active vs. likely-forgotten set based on actual usage. Inspect transcripts to ground this in data.

**Teach, don't just do.** When you proactively pick a skill the user might not know, briefly say *why* — one short clause. Goal: they remember it next time.

## Default workflow rules

These apply to every project unless explicitly overridden.

### Spec/feature work goes on dedicated branches
Never bundle new spec docs or feature work onto an unrelated existing branch. Each spec/feature gets its own branch off `main` (e.g. `spec/<topic>`). Before any `git add`/`git commit` for new work, check the current branch (`git branch --show-current`) and if it doesn't match, `git switch -c spec/<name> main` first. Confirm before assuming a commit is wanted — sometimes the branch-with-changes saved locally is enough.

### Never add Claude as Co-Authored-By in commits
Do NOT include `Co-Authored-By: Claude ...` (or any AI co-author footer) in any git commit message — even though Claude Code's default flow suggests it. Pass this instruction explicitly to any subagent that may commit. If older commits in the current session already have the footer, offer to amend/rebase, but do not do so unilaterally.

**Why:** Many users want their git history to attribute commits solely to themselves. Co-author footers from an AI tool are unwanted noise.

### Pause subagent autopilot before real code tasks
In subagent-driven-development mode, do not steamroll through every task. Trivial setup (deps, configs, gitignore tweaks) — fine to delegate. First **real** code task in any sequence — pause, present the task and prepared code, let the user run/test/commit themselves. Once they confirm the pattern works, ask whether to resume autopilot or continue with manual checkpoints.

**Why:** Letting agents commit autonomously on real code, before the user has verified the pattern, leads to branch-hygiene mishaps and lost trust. Manual checkpoint on first code task per sequence builds confidence.
