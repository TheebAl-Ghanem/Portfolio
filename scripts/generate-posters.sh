#!/bin/bash
# Extract a poster frame for every video in public/data into public/posters/,
# mirroring the campaign folder structure. Posters let the grid use
# preload="none" while still showing artwork before playback.
# Skips existing posters, so it is safe to re-run. Requires ffmpeg.
set -u
cd "$(dirname "$0")/.."

find public/data -type f \( -iname '*.mp4' -o -iname '*.mov' -o -iname '*.m4v' \) -print0 |
while IFS= read -r -d '' f; do
  rel="${f#public/data/}"
  out="public/posters/${rel%.*}.jpg"
  mkdir -p "$(dirname "$out")"
  [ -f "$out" ] && continue
  echo "poster: $rel"
  # Seek 1s in; fall back to the very first frame for clips shorter than that.
  ffmpeg -nostdin -v error -y -ss 1 -i "$f" -frames:v 1 -vf "scale=720:-2" -q:v 6 "$out" </dev/null 2>/dev/null \
    || ffmpeg -nostdin -v error -y -i "$f" -frames:v 1 -vf "scale=720:-2" -q:v 6 "$out" </dev/null \
    || echo "FAILED: $rel"
done
echo "Posters done."
