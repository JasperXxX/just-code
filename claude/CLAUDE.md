# Global Claude Settings (template)

> Generic version. Adapt the working-style index, Obsidian paths, project tags,
> and skill list to your own setup. Personal observations belong in `~/.claude/working-style/`
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

## Obsidian as cross-session knowledge layer

Use an Obsidian vault as the long-form, cross-project knowledge layer that
complements per-project auto-memory. Every Claude Code session, in every
working directory, reads and writes here.

### Division of labor
- **Auto-memory** (per-project, path-scoped): short structured facts — user profile, feedback rules, project pointers, reference links.
- **Obsidian vault** (global, cross-project): long-form notes — brainstorm outputs, decision logs, project state, patterns. Persists across sessions and working directories.

### Vault structure
- `Projects/` — one note per active project. Living docs; update in place.
- `Brainstorms/` — long-form thinking sessions, datestamped filename.
- `Decisions/` — decision logs, datestamped filename.
- `Patterns/` — approaches/solutions that worked. Reusable across projects.

### When to read
At the start of substantive work on a known topic, search the vault before answering. If a `Projects/<Name>.md` exists, read it.

### When to write
After **substantive** work, persist what's worth remembering:
- Brainstorm sessions of more than ~10 min → new note in `Brainstorms/`.
- Real decisions (architecture, scope, direction) → new note in `Decisions/`.
- Project state shifts → update `Projects/<Name>.md` via `read-note` then `edit-note`.
- Patterns the user validated as good → new note in `Patterns/`.

Don't write trivial chatter, code (lives in repos), or duplicate auto-memory entries verbatim.

### Tagging convention (adapt to your projects)
- Project: `project/<short-name>`
- Status: `status/active`, `status/parked`, `status/done`
- Type: `type/decision`, `type/brainstorm`, `type/project`, `type/pattern`

### Frontmatter for notes you write
```yaml
---
tags: [project/<name>, status/active, type/project]
created: YYYY-MM-DD
updated: YYYY-MM-DD
---
```

### Confirm before destructive ops
`delete-note`, `move-note`, and full-content `replace` operations need user confirmation. `append` and `prepend` are safe.

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
