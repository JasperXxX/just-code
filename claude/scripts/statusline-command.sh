#!/usr/bin/env bash
input=$(cat)

cwd=$(printf '%s' "$input" | jq -r '.workspace.current_dir // .cwd // empty')
model=$(printf '%s' "$input" | jq -r '.model.display_name // empty')
remaining=$(printf '%s' "$input" | jq -r '.context_window.remaining_percentage // empty')
session_id=$(printf '%s' "$input" | jq -r '.session_id // empty')

project=$(basename "$cwd" 2>/dev/null)
[ -z "$project" ] && project="claude"

# --- Topic (what Claude is currently working on) ----------------------------
# Cap at ~30 chars. If the raw label is longer, truncate at the last word
# boundary that fits and append "…" instead of slicing mid-word.
topic=""
topic_file="/tmp/claude-session-${session_id}-topic.txt"
if [ -n "$session_id" ] && [ -f "$topic_file" ]; then
  raw=$(head -c 200 "$topic_file" | tr -d '\n')
  topic_max=30
  if [ "${#raw}" -le "$topic_max" ]; then
    topic="$raw"
  else
    cut="${raw:0:$topic_max}"
    # Drop trailing partial word if there's still a space to cut at.
    case "$cut" in
      *" "*) cut="${cut% *}" ;;
    esac
    topic="${cut}…"
  fi
fi

# --- Project color: stable per session, clustered by topic across windows ---
# Default: hash of cwd. Override: if another active Claude session has a topic
# that shares non-trivial words with mine, adopt its color (= same theme,
# same color across windows). Decision is cached per session so the color
# doesn't shift after the first prompt.
colors=(31 32 33 34 35 36 91 92 93 94 95 96)
hash_int=$(printf '%s' "$cwd" | cksum | awk '{print $1}')
project_color=${colors[$((hash_int % ${#colors[@]}))]}

color_cache="/tmp/claude-session-${session_id}-color.txt"
if [ -n "$session_id" ] && [ -f "$color_cache" ]; then
  cached=$(cat "$color_cache" 2>/dev/null)
  [ -n "$cached" ] && project_color=$cached
elif [ -n "$session_id" ] && [ -n "$topic" ]; then
  # First time deciding for this session and we have a topic. Try clustering.
  stopwords='der|die|das|den|dem|des|ein|eine|einen|einem|und|oder|mit|für|fuer|ist|sind|war|waren|in|an|auf|von|zu|wie|als|the|and|or|with|for|to|from|of|is|are|was|were|on|have|has|had|new|neu|alt|old'
  to_sigs() {
    printf '%s' "$1" \
      | tr '[:upper:]' '[:lower:]' \
      | tr -c 'a-z0-9äöüß\n' ' ' \
      | tr -s ' ' '\n' \
      | awk 'length($0) >= 3' \
      | grep -Ev "^($stopwords)$" \
      | sort -u
  }
  my_sigs=$(to_sigs "$topic")

  if [ -n "$my_sigs" ]; then
    best_overlap=0
    best_color=""
    now_ts=$(date +%s)
    for other in /tmp/claude-session-*-topic.txt; do
      [ -f "$other" ] || continue
      [ "$other" = "$topic_file" ] && continue
      other_mtime=$(stat -f %m "$other" 2>/dev/null)
      [ -z "$other_mtime" ] && continue
      [ $((now_ts - other_mtime)) -gt 21600 ] && continue  # >6h = stale
      other_sid=$(basename "$other" -topic.txt | sed 's/^claude-session-//')
      other_color_file="/tmp/claude-session-${other_sid}-color.txt"
      [ -f "$other_color_file" ] || continue
      other_topic=$(head -c 60 "$other" | tr -d '\n')
      other_sigs=$(to_sigs "$other_topic")
      [ -z "$other_sigs" ] && continue
      overlap=$(comm -12 <(printf '%s\n' "$my_sigs") <(printf '%s\n' "$other_sigs") | wc -l | tr -d ' ')
      if [ "$overlap" -gt "$best_overlap" ]; then
        best_overlap=$overlap
        best_color=$(cat "$other_color_file" 2>/dev/null)
      fi
    done

    if [ "$best_overlap" -ge 1 ] && [ -n "$best_color" ]; then
      project_color=$best_color
    fi
  fi

  printf '%s' "$project_color" > "$color_cache"
fi

# --- Elapsed time + progress bar (only while Claude is working) -------------
# Sentinel /tmp/claude-running-$SID is created by the UserPromptSubmit hook
# and removed by the Stop hook, so it exists exactly while Claude is working.
#
# If /tmp/claude-eta-$SID.txt exists (written by ~/.claude/bin/claude-eta at
# the start of Claude's response), the bar fills against that ETA and we
# show remaining time as a countdown. Without an ETA, fall back to a fixed
# 90s cap with green/yellow/red coloring purely by elapsed.
elapsed_str=""
bar_str=""
running_file="/tmp/claude-running-${session_id}"
eta_file="/tmp/claude-eta-${session_id}.txt"
if [ -n "$session_id" ] && [ -f "$running_file" ]; then
  start_mtime=$(stat -f %m "$running_file" 2>/dev/null)
  if [ -n "$start_mtime" ]; then
    now=$(date +%s)
    elapsed=$((now - start_mtime))
    if [ "$elapsed" -ge 0 ] && [ "$elapsed" -lt 86400 ]; then
      mins=$((elapsed / 60))
      secs=$((elapsed % 60))
      elapsed_str=$(printf "%d:%02d" "$mins" "$secs")

      eta_secs=""
      if [ -f "$eta_file" ]; then
        eta_secs=$(tr -dc '0-9' < "$eta_file" 2>/dev/null | head -c 8)
        [ -z "$eta_secs" ] && eta_secs=""
      fi

      width=12
      if [ -n "$eta_secs" ] && [ "$eta_secs" -gt 0 ] 2>/dev/null; then
        # ETA mode: bar fills against the model's own estimate. The number
        # next to the bar shows REMAINING time (countdown), not elapsed.
        cap=$eta_secs
        if [ "$elapsed" -ge "$cap" ]; then
          over=$((elapsed - cap))
          over_m=$((over / 60))
          over_s=$((over % 60))
          elapsed_str=$(printf "+%d:%02d" "$over_m" "$over_s")
          filled=$width
          overflow="+"
          bar_color=31           # red: overran the estimate
        else
          remaining_secs=$((cap - elapsed))
          rem_m=$((remaining_secs / 60))
          rem_s=$((remaining_secs % 60))
          elapsed_str=$(printf "%d:%02d" "$rem_m" "$rem_s")
          filled=$((elapsed * width / cap))
          overflow=""
          # 0–60% green, 60–90% yellow, >90% magenta (close to overrun)
          pct=$((elapsed * 100 / cap))
          if [ "$pct" -ge 90 ]; then
            bar_color=35
          elif [ "$pct" -ge 60 ]; then
            bar_color=33
          else
            bar_color=32
          fi
        fi
      else
        # No ETA from the model: fall back to fixed 90s cap, time-only color.
        cap=90
        if [ "$elapsed" -ge "$cap" ]; then
          filled=$width
          overflow="+"
          bar_color=31
        else
          filled=$((elapsed * width / cap))
          overflow=""
          if [ "$elapsed" -ge 30 ]; then
            bar_color=33
          else
            bar_color=32
          fi
        fi
      fi

      [ "$filled" -gt "$width" ] && filled=$width
      empty=$((width - filled))
      bar=""
      i=0
      while [ "$i" -lt "$filled" ]; do bar="${bar}█"; i=$((i+1)); done
      i=0
      while [ "$i" -lt "$empty" ]; do bar="${bar}░"; i=$((i+1)); done

      # \033[22m turns off dim so the bar pops inside the dim brackets;
      # \033[0;2m at the end resets and re-enters dim for the elapsed time.
      bar_str=$(printf "\033[22;%sm%s%s\033[0;2m" "$bar_color" "$bar" "$overflow")
    fi
  fi
fi

# --- External progress (e.g. video render, long build) ---------------------
# A helper script (~/.claude/bin/claude-progress) writes a JSON file with
# {label, percent, eta} that we render inline. File absent or stale (>1h) =
# nothing shown. Per-session preferred, falls back to a global file.
progress_str=""
progress_file=""
if [ -n "$session_id" ] && [ -f "/tmp/claude-progress-${session_id}.json" ]; then
  progress_file="/tmp/claude-progress-${session_id}.json"
elif [ -f "/tmp/claude-progress.json" ]; then
  progress_file="/tmp/claude-progress.json"
fi
if [ -n "$progress_file" ]; then
  pf_mtime=$(stat -f %m "$progress_file" 2>/dev/null)
  now_ts_p=$(date +%s)
  if [ -n "$pf_mtime" ] && [ $((now_ts_p - pf_mtime)) -lt 3600 ]; then
    p_label=$(jq -r '.label // empty' "$progress_file" 2>/dev/null)
    p_percent=$(jq -r '.percent // empty' "$progress_file" 2>/dev/null)
    p_eta=$(jq -r '.eta // empty' "$progress_file" 2>/dev/null)
    if [ -n "$p_label" ]; then
      if [ -n "$p_percent" ] && [ "$p_percent" -ge 0 ] 2>/dev/null && [ "$p_percent" -le 100 ] 2>/dev/null; then
        pwidth=10
        pfilled=$((p_percent * pwidth / 100))
        [ "$pfilled" -gt "$pwidth" ] && pfilled=$pwidth
        pempty=$((pwidth - pfilled))
        pbar=""
        i=0
        while [ "$i" -lt "$pfilled" ]; do pbar="${pbar}▓"; i=$((i+1)); done
        i=0
        while [ "$i" -lt "$pempty" ]; do pbar="${pbar}░"; i=$((i+1)); done
        # Cyan progress block, label dim so it doesn't fight the topic.
        progress_str=$(printf "\033[2m%s\033[22;36m %s\033[0;2m %d%%" "$p_label" "$pbar" "$p_percent")
        [ -n "$p_eta" ] && progress_str="${progress_str} · ${p_eta}"
      else
        progress_str=$(printf "\033[2m%s\033[0m" "$p_label")
      fi
    fi
  fi
fi

# --- Compose left section ---------------------------------------------------
# Project name + topic share the session color (cluster-by-topic across windows)
left=$(printf "\033[1;%sm%s\033[0m" "$project_color" "$project")
if [ -n "$topic" ]; then
  left="${left} \033[2m·\033[0m \033[1;${project_color}m${topic}\033[0m"
fi
if [ -n "$progress_str" ]; then
  left="${left} \033[2m·\033[0m ${progress_str}"
fi

# --- Compose right section (model | ctx | elapsed) --------------------------
right=""
[ -n "$model" ] && right="$model"
if [ -n "$remaining" ]; then
  remaining_int=$(printf "%.0f" "$remaining")
  if [ -n "$right" ]; then
    right="$right | ctx ${remaining_int}%"
  else
    right="ctx ${remaining_int}%"
  fi
fi
if [ -n "$elapsed_str" ]; then
  pair="${bar_str} ${elapsed_str}"
  if [ -n "$right" ]; then
    right="$right | ${pair}"
  else
    right="${pair}"
  fi
fi

if [ -n "$right" ]; then
  printf "%b  \033[2m[%s]\033[0m" "$left" "$right"
else
  printf "%b" "$left"
fi
