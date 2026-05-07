# claude-code-loadout

Mein Claude-Code-Setup als Loadout zum Anschauen, Klauen, oder Inspirieren-Lassen. Sanitisierter Snapshot — keine privaten Daten, keine Projektnamen.

> Wenn du die interaktive Übersicht willst: **`index.html`** im Browser öffnen. 15 Sections, deutsch.

## Was ist das?

Ein zusammenhängendes Setup für **Claude Code** (CLI in Ghostty), inklusive Hooks, Sound-/Status-Feedback, Auto-Memory, Plugins, MCP-Server, Voice-Input und das drumherum (Terminal, Shell, Editor, Window-Management).

Nicht als „Best Practice"-Pamphlet gemeint — eher als gewachsene Konstellation, die für mich funktioniert. Adaptier was passt, ignorier den Rest.

## Inhalt

```
claude-code-loadout/
├── README.md                    # diese Datei
├── index.html                   # interaktive Übersicht — alle Sections
├── claude/
│   ├── CLAUDE.md                # globale Instructions als Template (sanitisiert)
│   ├── settings.json            # Permissions, Hooks, Plugins, Marketplaces
│   ├── keybindings.json         # Tastatur-Shortcuts
│   ├── commands/
│   │   └── extra.md             # eigener /extra Slash-Command
│   ├── hooks/
│   │   ├── notify-stop.sh       # macOS-Notification nach Turn-Ende (optional)
│   │   └── topic-summarize.sh   # generiert Topic-Titel via Haiku-4.5
│   ├── memory/
│   │   ├── MEMORY.md            # Index-Template
│   │   └── *.md                 # Beispiel-Memos (sanitisiert)
│   └── scripts/
│       ├── play-random-sound.sh
│       ├── flash-screen.sh
│       ├── flash-border-show.sh
│       ├── flash-border-hide.sh
│       ├── flash-border.py
│       └── statusline-command.sh
├── editor/
│   └── zed-settings.json        # pure-black override, SF Mono, telemetry off
├── ghostty/config               # Apple-Terminal-Pro-Theme
├── shell/
│   ├── zshrc                    # aliases (c/cc/cr), conda, bun
│   └── zprofile                 # brew + DaVinci Resolve scripting env
├── spokenly/
│   └── README.md                # Voice-to-Text Setup, Hotkeys, Custom Vocab
├── launchagents/
│   ├── com.user.killcaffeinate.plist
│   ├── com.user.micvolumeguard.plist
│   └── README.md                # was sie tun, wie aktivieren
└── apps/
    └── README.md                # Daily-Driver-Apps (Raycast, Rectangle, Claude Desktop)
```

## Highlights

- **Sound + Visual Feedback** nach jedem Turn-Ende (configurable Hooks)
- **Auto-Memory + Working-Style-Files** als zwei Layer (kurze Facts pro Projekt vs. cross-project Patterns)
- **Voice-Input** via Spokenly (Whisper-basiert, system-weit) — schneller tippen geht nicht
- **22 aktive Plugins**, ~190 Skills im Pool, Marketplaces aus mehreren Sources
- **Default Workflow Rules** in `CLAUDE.md`: Branch-Hygiene, kein AI-Co-Author, Subagent-Autopilot-Pause
- **LaunchAgents** für Mac-wach-halten (`killcaffeinate`) und Mic-Schutz (`micvolumeguard`)

## Sanitisiert

Was du **nicht** hier findest:
- persönliche Working-Style-Files (`prompt-style.md`, `tool-usage.md`, `feedback-log.md`, `patterns.md`)
- konkrete Projektnamen
- Nutzernamen / E-Mails / GitHub-Handles
- der konkrete Sound-Pool-Pfad — durch generischen `~/Sounds/claude/` ersetzt
- Per-Projekt-Auto-Memories (nur Templates + sanitisierte Beispiele)
- Transcripts, Caches, Sessions
- Spokenly Custom-Vocabulary (zu projektspezifisch)

## Setup nachbauen

1. **Ghostty** installieren, Config nach `~/.config/ghostty/config` kopieren.
2. **Claude Code** installieren (`npm i -g @anthropic-ai/claude-code` oder via brew).
3. **Zed** installieren (`brew install --cask zed`), `editor/zed-settings.json` nach `~/.config/zed/settings.json`.
4. **Spokenly** aus dem App Store installieren — siehe `spokenly/README.md` für Hotkey + Setup.
5. **Raycast** und **Rectangle** installieren — Details in `apps/README.md`.
6. `claude/` Inhalt nach `~/.claude/` kopieren — danach `settings.json` öffnen, eigene Pfade prüfen.
7. Im Sound-Hook (`scripts/play-random-sound.sh`) Sound-Pool-Pfad anpassen, oder ein paar `.mp3`s nach `~/Sounds/claude/` legen.
8. Plugins via Claude Code installieren — die `extraKnownMarketplaces` in `settings.json` zeigen die Quellen.
9. Optional: LaunchAgents aus `launchagents/` aktivieren (`launchctl load ~/Library/LaunchAgents/com.user.*.plist`).
10. CLI-Tools die du brauchst: `gh`, `uv`, `node`, `tmux` (alle via Homebrew).

## Lizenz

Mach was du willst. Kein Wartungsversprechen — ist ein Snapshot, keine gepflegte Lib.
