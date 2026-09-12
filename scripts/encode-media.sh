#!/bin/bash
# Re-encode originals in masters/ into web-ready files in public/data/.
# Skips anything already encoded, so it is safe to re-run after adding media.
# Requires ffmpeg and cwebp (brew install ffmpeg webp).
set -u
cd "$(dirname "$0")/.."

[ -d masters ] || { echo "No masters/ directory found."; exit 1; }
find masters -name .DS_Store -delete

find masters -type f \( -iname '*.mp4' -o -iname '*.mov' -o -iname '*.m4v' \) -print0 |
while IFS= read -r -d '' f; do
  out="public/data/${f#masters/}"
  mkdir -p "$(dirname "$out")"
  [ -f "$out" ] && continue
  echo "video: $f"
  ffmpeg -nostdin -v error -y -i "$f" \
    -vf "scale='min(1080,iw)':'min(1920,ih)':force_original_aspect_ratio=decrease,scale=trunc(iw/2)*2:trunc(ih/2)*2" \
    -c:v libx264 -preset medium -crf 23 -maxrate 5M -bufsize 10M -pix_fmt yuv420p \
    -c:a aac -b:a 128k -movflags +faststart "$out" </dev/null || echo "FAILED: $f"
done

find masters -type f \( -iname '*.png' -o -iname '*.jpg' -o -iname '*.jpeg' \) -print0 |
while IFS= read -r -d '' f; do
  out="public/data/${f#masters/}"; out="${out%.*}.webp"
  mkdir -p "$(dirname "$out")"
  [ -f "$out" ] && continue
  echo "image: $f"
  cwebp -quiet -q 80 -resize 1400 0 "$f" -o "$out" || echo "FAILED: $f"
done

echo "Done. Run 'npm run build' to refresh the manifest."
