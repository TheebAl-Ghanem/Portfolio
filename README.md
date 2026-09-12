# THEEB Portfolio Site

This project is a Vite + React portfolio that auto-loads campaigns and media from `public/data`.

## What happens automatically

When you run the project, it scans `public/data` and builds `public/data/manifest.json` from:
- folder names (used as campaign names)
- media file names (used as reel titles)

You do not need to manually edit campaign lists in code.

## 1. Install from scratch

Requirements:
- Node.js 18+ (recommended: 20+)
- npm

Install dependencies:

```bash
npm install
```

## 2. Add your media

Put your files in this structure:

```text
public/
  data/
    campaign folder 1/
      video1.mp4
      image1.png
    campaign folder 2/
      clip-a.mp4
```

Notes:
- Each folder inside `public/data` becomes a campaign section.
- Each media file name becomes the card title.
- Supported formats: `.mp4`, `.mov`, `.webm`, `.m4v`, `.png`, `.jpg`, `.jpeg`, `.webp`, `.gif`
- Hidden files like `.DS_Store` are ignored.

## 3. Run locally

```bash
npm run dev
```

Open the local URL shown in terminal (usually `http://localhost:5173`).

## 4. Build for production

```bash
npm run build
npm run preview
```

## Data flow

- Script: `scripts/generate-manifest.mjs`
- Output: `public/data/manifest.json`
- App reads this manifest in `src/App.jsx` and renders campaigns/reels dynamically.

## If new files do not show

1. Stop the dev server.
2. Run `npm run dev` again.
3. Hard refresh browser.

This regenerates the manifest and reloads the latest folders/files.
