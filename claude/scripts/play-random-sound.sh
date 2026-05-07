#!/bin/bash
sounds=($HOME/Sounds/claude/*)
sound="${sounds[$((RANDOM % ${#sounds[@]}))]}"

assertions=$(pmset -g assertions 2>/dev/null)
if echo "$assertions" | grep -qE "coreaudiod.*:output\.context\.preventuseridlesleep|Resources: .*audio-in"; then
  volume=0.6
else
  volume=1.0
fi

afplay -v "$volume" "$sound" &
