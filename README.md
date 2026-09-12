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

## Deployment (GitHub Pages)

The site deploys automatically. Any push to `main` triggers
`.github/workflows/deploy.yml`, which builds the site and publishes it to
GitHub Pages at:

**https://theebal-ghanem.github.io/Portfolio/**

One-time setup (needs repo admin): in **Settings > Pages**, set
**Source** to **GitHub Actions**.

Because the site lives under `/Portfolio/` rather than a domain root,
`vite.config.js` sets `base: '/Portfolio/'` and the app builds media URLs
from `import.meta.env.BASE_URL`. If the repo is ever renamed, or moved to a
custom domain, update `base` to match.

## Media: masters vs. web files

GitHub rejects files over 100 MB and caps Pages sites at about 1 GB, so the
original camera files cannot be committed.

- `masters/` holds the untouched originals. It is gitignored and stays on
  your machine only — back it up separately.
- `public/data/` holds web-optimized versions that are committed and served:
  video at 1080p H.264 (CRF 23, faststart), stills as quality-4 JPEG.

To re-encode after adding new masters, re-run the ffmpeg pass that produced
`public/data` (it skips files that already exist).

## Data flow

- Script: `scripts/generate-manifest.mjs`
- Output: `public/data/manifest.json`
- App reads this manifest in `src/App.jsx` and renders campaigns/reels dynamically.

## If new files do not show

1. Stop the dev server.
2. Run `npm run dev` again.
3. Hard refresh browser.

This regenerates the manifest and reloads the latest folders/files.
