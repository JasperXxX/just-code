#!/bin/bash
# Hält den Mac wach solange:
#   (a) ein Claude-Agent gerade arbeitet (= Claude hat selbst caffeinate gestartet)
#   (b) ODER ein "Workload"-Prozess läuft, der von Claude gestartet wurde
#       (pnpm/next dev, ffmpeg, ComfyUI, python AI-jobs, vite, …)
# Sobald nichts mehr → eigenes caffeinate killen → Mac darf schlafen.
#
# Sicherheits-Cap: Workload-Prozesse, die älter als MAX_WORKLOAD_AGE_S
# sind, werden ignoriert (verhindert "ewig wach" wenn was hängt).
export PATH="/usr/bin:/bin:/usr/sbin:/sbin"

PIDFILE=/tmp/agent-caffeinate.pid
MAX_WORKLOAD_AGE_S=14400   # 4h

# Process-Kommando-Patterns die als "echte Workload" zählen.
# Konservativ: nur Sachen, die typischerweise lange laufen UND wo's wirklich weh
# tut wenn sie wegen Sleep sterben. Generisches `node`/`python` ist NICHT drin.
WORKLOAD_PATTERNS=(
    "next dev"
    "next-server"
    "pnpm dev"
    "npm run dev"
    "yarn dev"
    "vite"
    "remotion render"
    "remotion still"
    "ffmpeg"
    "ComfyUI"
    "comfyui"
    "main.py.*--port"        # heuristisch: ein python server
    "uvicorn"
    "gunicorn"
    "ollama serve"
    "whisper"
    "supabase start"
)

# Hat Claude (in der Parent-Chain) PID $1 gestartet?
parented_by_claude() {
    local cur=$1
    for _ in 1 2 3 4 5 6 7 8; do
        cur=$(ps -o ppid= -p "$cur" 2>/dev/null | xargs)
        { [ -z "$cur" ] || [ "$cur" -le 1 ]; } && break
        local cmd
        cmd=$(ps -o comm= -p "$cur" 2>/dev/null)
        case "$cmd" in
            *claude*) return 0 ;;
        esac
    done
    return 1
}

# (a) Claude-Agent aktiv (eigenes caffeinate gestartet)
agent_working() {
    for pid in $(pgrep -x caffeinate); do
        if [ -f "$PIDFILE" ] && [ "$pid" = "$(cat "$PIDFILE" 2>/dev/null)" ]; then
            continue
        fi
        parented_by_claude "$pid" && return 0
    done
    return 1
}

# (b) Workload-Prozess von Claude gestartet, jünger als 4h
workload_running() {
    local now
    now=$(date +%s)
    for pat in "${WORKLOAD_PATTERNS[@]}"; do
        # pgrep -f matcht volles Argument-Set
        for pid in $(pgrep -f "$pat" 2>/dev/null); do
            # Selbst der eigene LaunchAgent-Bash darf hier nicht reinrutschen
            [ "$pid" = "$$" ] && continue
            # Alter prüfen
            local started
            started=$(ps -o lstart= -p "$pid" 2>/dev/null)
            [ -z "$started" ] && continue
            local age
            age=$(( now - $(date -j -f "%a %b %e %H:%M:%S %Y" "$started" +%s 2>/dev/null || echo "$now") ))
            [ "$age" -gt "$MAX_WORKLOAD_AGE_S" ] && continue
            # Muss in Claude-Parent-Chain sein
            parented_by_claude "$pid" && return 0
        done
    done
    return 1
}

if agent_working || workload_running; then
    if [ -f "$PIDFILE" ] && kill -0 "$(cat "$PIDFILE")" 2>/dev/null; then
        exit 0
    fi
    nohup /usr/bin/caffeinate -dimsu </dev/null >/dev/null 2>&1 &
    echo $! > "$PIDFILE"
else
    if [ -f "$PIDFILE" ]; then
        kill "$(cat "$PIDFILE")" 2>/dev/null
        rm -f "$PIDFILE"
    fi
    # Bonus: kill rogue caffeinates, die nicht von Claude geparented sind
    for pid in $(pgrep -x caffeinate); do
        ppid=$(ps -o ppid= -p "$pid" 2>/dev/null | xargs)
        pcmd=$(ps -o comm= -p "$ppid" 2>/dev/null)
        case "$pcmd" in
            *claude*) ;;
            *) kill "$pid" 2>/dev/null ;;
        esac
    done
fi
