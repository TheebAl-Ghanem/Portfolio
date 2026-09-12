#!/bin/bash
# Extract a poster frame for every video in public/data into public/posters/,
# mirroring the campaign folder structure. Posters let the grid use
# preload="none" while still showing artwork before playback.
# Also builds the short, low-bitrate hero loop in public/hero/.
# Skips existing output, so it is safe to re-run. Requires ffmpeg and cwebp.
set -u
cd "$(dirname "$0")/.."

find public/data -type f \( -iname '*.mp4' -o -iname '*.mov' -o -iname '*.m4v' \) -print0 |
while IFS= read -r -d '' f; do
  rel="${f#public/data/}"
  out="public/posters/${rel%.*}.webp"
  mkdir -p "$(dirname "$out")"
  [ -f "$out" ] && continue
  echo "poster: $rel"
  tmp="$(mktemp -t poster).png"
  # Seek 1s in; fall back to the very first frame for clips shorter than that.
  ffmpeg -nostdin -v error -y -ss 1 -i "$f" -frames:v 1 -f image2 -vcodec png "$tmp" </dev/null 2>/dev/null \
    || ffmpeg -nostdin -v error -y -i "$f" -frames:v 1 -f image2 -vcodec png "$tmp" </dev/null 2>/dev/null
  cwebp -quiet -q 72 -resize 640 0 "$tmp" -o "$out" || echo "FAILED: $rel"
  rm -f "$tmp"
done

# Hero loop: 8s, no audio, heavily compressed. It renders at 30% opacity in
# grayscale, so weight matters far more than fidelity.
HERO_SRC="$(find masters -type f -iname '*.mp4' | sort | head -1)"
if [ -n "$HERO_SRC" ] && [ ! -f public/hero/loop.mp4 ]; then
  mkdir -p public/hero
  echo "hero: $HERO_SRC"
  ffmpeg -nostdin -v error -y -t 8 -i "$HERO_SRC" -vf "scale=720:-2" \
    -c:v libx264 -preset slow -crf 31 -maxrate 1200k -bufsize 2400k \
    -pix_fmt yuv420p -an -movflags +faststart public/hero/loop.mp4 </dev/null
  tmp="$(mktemp -t hero).png"
  ffmpeg -nostdin -v error -y -ss 1 -i public/hero/loop.mp4 -frames:v 1 -f image2 -vcodec png "$tmp" </dev/null
  cwebp -quiet -q 70 -resize 720 0 "$tmp" -o public/hero/poster.webp
  rm -f "$tmp"
fi

echo "Posters done."
