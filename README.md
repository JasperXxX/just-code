# claude-code-loadout

Mein Claude-Code-Setup als Loadout zum Anschauen, Klauen, oder Inspirieren-Lassen. Sanitisierter Snapshot — keine privaten Daten, keine Projektnamen.

> Wenn du die interaktive Übersicht willst: **`index.html`** im Browser öffnen. 15 Sections, deutsch.

## Was ist das?

Ein zusammenhängendes Setup für **Claude Code** (CLI in Ghostty), inklusive Hooks, Sound-/Status-Feedback, Memory-Architektur (Auto-Memory + Obsidian), Plugins, MCP-Server und das drumherum (Terminal, Shell, Editor).

Nicht als „Best Practice"-Pamphlet gemeint — eher als gewachsene Konstellation, die für mich funktioniert. Adaptier was passt, ignorier den Rest.

## Inhalt

```
claude-code-loadout/
├── README.md                    # diese Datei
├── index.html                   # interaktive Übersicht — 15 Sections
├── claude/
│   ├── CLAUDE.md                # globale Instructions als Template (sanitisiert)
│   ├── settings.json            # Permissions, Hooks, Plugins, Marketplaces
│   ├── keybindings.json         # Tastatur-Shortcuts
│   ├── commands/
│   │   └── extra.md             # eigener /extra Slash-Command
│   ├── hooks/
│   │   ├── notify-stop.sh       # macOS-Notification nach Turn-Ende (optional)
│   │   └── topic-summarize.sh   # generiert Topic-Titel via Haiku-4.5
│   └── scripts/
│       ├── play-random-sound.sh
│       ├── flash-screen.sh
│       ├── flash-border-show.sh
│       ├── flash-border-hide.sh
│       ├── flash-border.py
│       └── statusline-command.sh
├── ghostty/config               # Apple-Terminal-Pro-Theme
├── shell/
│   ├── zshrc                    # aliases (c/cc/cr), conda, bun
│   └── zprofile                 # brew + DaVinci Resolve scripting env
└── editor/
    └── zed-settings.json        # pure-black override, SF Mono, telemetry off
```

## Highlights

- **Sound + Visual Feedback** nach jedem Turn-Ende (configurable Hooks)
- **Auto-Memory + Obsidian-Vault** als zwei Memory-Layer (kurz/strukturiert vs. langform)
- **Working-Style-Pattern**: meta-files indexed in `CLAUDE.md`, only loaded on demand
- **15+ aktive Plugins**, ~190 Skills im Pool, Marketplaces aus mehreren Sources
- **Default Workflow Rules** in `CLAUDE.md`: Branch-Hygiene, kein AI-Co-Author, Subagent-Autopilot-Pause

## Sanitisiert

Was du **nicht** hier findest:
- persönliche Working-Style-Files (`prompt-style.md`, `tool-usage.md`, `feedback-log.md`, `patterns.md`)
- konkrete Projektnamen
- Nutzernamen / E-Mails / GitHub-Handles
- der konkrete Sound-Pool-Pfad — durch generischen `~/Sounds/claude/` ersetzt
- Per-Projekt-Auto-Memories
- Transcripts, Caches, Sessions

## Setup nachbauen

1. Ghostty installieren, Config nach `~/.config/ghostty/config` kopieren.
2. Claude Code installieren (`npm i -g @anthropic-ai/claude-code` oder via brew).
3. `claude/` Inhalt nach `~/.claude/` kopieren — danach `settings.json` öffnen, eigene Pfade prüfen.
4. Im Sound-Hook (`scripts/play-random-sound.sh`) Sound-Pool-Pfad anpassen, oder ein paar `.mp3`s nach `~/Sounds/claude/` legen.
5. Plugins via Claude Code installieren — die `extraKnownMarketplaces` in `settings.json` zeigen die Quellen.
6. Optional: Obsidian Vault aufsetzen, MCP-Server installieren, dann Tagging-Schema aus `CLAUDE.md` adaptieren.

## Lizenz

Mach was du willst. Kein Wartungsversprechen — ist ein Snapshot, keine gepflegte Lib.
