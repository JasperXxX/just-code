#!/usr/bin/env bash
input=$(cat)

cwd=$(printf '%s' "$input" | jq -r '.workspace.current_dir // .cwd // empty')
model=$(printf '%s' "$input" | jq -r '.model.display_name // empty')
remaining=$(printf '%s' "$input" | jq -r '.context_window.remaining_percentage // empty')
session_id=$(printf '%s' "$input" | jq -r '.session_id // empty')

project=$(basename "$cwd" 2>/dev/null)
[ -z "$project" ] && project="claude"

# --- Topic (what Claude is currently working on) ----------------------------
topic=""
topic_file="/tmp/claude-session-${session_id}-topic.txt"
if [ -n "$session_id" ] && [ -f "$topic_file" ]; then
  topic=$(head -c 60 "$topic_file" | tr -d '\n')
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
# Tempo: green <30s, yellow 30–90s, red >90s.
elapsed_str=""
bar_str=""
running_file="/tmp/claude-running-${session_id}"
if [ -n "$session_id" ] && [ -f "$running_file" ]; then
  start_mtime=$(stat -f %m "$running_file" 2>/dev/null)
  if [ -n "$start_mtime" ]; then
    now=$(date +%s)
    elapsed=$((now - start_mtime))
    if [ "$elapsed" -ge 0 ] && [ "$elapsed" -lt 86400 ]; then
      mins=$((elapsed / 60))
      secs=$((elapsed % 60))
      elapsed_str=$(printf "%d:%02d" "$mins" "$secs")

      width=12
      cap=90
      if [ "$elapsed" -ge "$cap" ]; then
        filled=$width
        overflow="+"
      else
        filled=$((elapsed * width / cap))
        overflow=""
      fi
      [ "$filled" -gt "$width" ] && filled=$width
      empty=$((width - filled))
      bar=""
      i=0
      while [ "$i" -lt "$filled" ]; do bar="${bar}█"; i=$((i+1)); done
      i=0
      while [ "$i" -lt "$empty" ]; do bar="${bar}░"; i=$((i+1)); done

      if [ "$elapsed" -ge "$cap" ]; then
        bar_color=31
      elif [ "$elapsed" -ge 30 ]; then
        bar_color=33
      else
        bar_color=32
      fi
      # \033[22m turns off dim so the bar pops inside the dim brackets;
      # \033[0;2m at the end resets and re-enters dim for the elapsed time.
      bar_str=$(printf "\033[22;%sm%s%s\033[0;2m" "$bar_color" "$bar" "$overflow")
    fi
  fi
fi

# --- Compose left section ---------------------------------------------------
# Project name + topic share the session color (cluster-by-topic across windows)
left=$(printf "\033[1;%sm%s\033[0m" "$project_color" "$project")
if [ -n "$topic" ]; then
  left="${left} \033[2m·\033[0m \033[1;${project_color}m${topic}\033[0m"
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
