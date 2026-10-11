# Immersion Gift

A complete, multi-page **romantic digital gift platform** — "A Galaxy of Love for You."

A dark "deep space luxury" experience built on the master spec: a scannable 3D entry
gateway, a Three.js galaxy universe portal, glassmorphism love letters with a reading
modal, a multimedia Memories Vault with lightbox, and a persistent background
soundtrack.

Three separate, self-contained pages:

- `index.html` — 3D Entry & Universe Portal (Three.js galaxy core + floating floaters)
- `letters.html` — Love Letters archive with envelope cards and reading modal
- `memories.html` — Photos & videos gallery with full-screen lightbox

## Architecture

```
/
├── index.html                # 3D Entry & Universe Portal
├── letters.html              # Love Letters Archive
├── memories.html             # Multimedia Memories Gallery
├── css/
│   └── main.stylesheet.css   # Global design system & glassmorphism
├── js/
│   ├── three-scene.js        # Three.js galaxy & 3D QR/floating-heart logic
│   ├── audio-player.js       # Global persistent audio control
│   ├── letters.js            # Envelope modal logic
│   ├── memories.js           # Lightbox logic
│   └── universe.js           # Universe open handler
├── assets/
│   ├── audio/                # Background soundtrack (e.g. (meloaz.com) 120 - Adore You.mp3)
│   ├── images/               # Photo gallery assets
│   └── videos/               # Video gallery assets
```

## Design System

Deep space luxury — near-black background (`#000000` → `#0a0a0a`), neon pink
(`#ff2a85`), hot magenta (`#ff1493`), stardust white (`#f0f0f0`), deep crimson
shadows, glassmorphism with blur, Playfair Display (display) + Source Sans 3 (UI).

Tokens live in `:root` in `css/main.stylesheet.css` (primitive → semantic layers).

## Content — Persistent Audio

The blueprint's soundtrack is "Adore You" by Miley Cyrus. Place the audio file at
`assets/audio/(meloaz.com) 120 - Adore You.mp3` (or edit `audio-player.js` `TRACK_URL`). The player is
mounted in the global root and survives navigation; it does not force-play on load
(browser autoplay policy). Click the floating music widget to toggle.

## Deployment (GitHub Pages)

1. Init a git repo in the project root.
2. Commit all generated files with clear semantic messages.
3. Push to GitHub.
4. Enable GitHub Pages in repo settings, source branch `main`, root `/`.

## Testing on your PC

### Option A — Open directly in a browser (simplest)
Double-click `index.html`, `letters.html`, or `memories.html`. No server needed,
and everything loads locally. The only thing that needs an internet connection is
the Google Fonts link (`Playfair Display` + `Source Sans 3`) in the `<head>`.

### Option B — Local HTTP server (recommended for the 3D galaxy)
The Three.js scene needs a server in some browsers (WebGL context headers).
From the project root:

```bash
# Python 3
python -m http.server 8000

# then open http://localhost:8000/index.html
```

(On Windows, if `python` isn't on PATH: `py -3 -m http.server 8000`.)

### Option C — GitHub Pages (production)
Push to GitHub and enable Pages in repo settings: **Settings → Pages → Source:
`main` (root)**.

## Media Setup

The media placeholders (`assets/images/photo-*.jpg`, `assets/videos/video-*.mp4`)
are referenced by `memories.html`. Drop your real photos and videos into the
corresponding folders before deployment — do not commit placeholder artifacts.
See the existing `/d/girlfriend-gift-site/` project for the real assets.

## Audio — persistent background track

The blueprint's soundtrack is "Adore You" by Miley Cyrus. The player (`js/audio-
player.js`) is mounted in the global root and survives navigation so it never cuts
off between pages. It does NOT force-play on load (browser autoplay policy):

1. Save the track at `assets/audio/(meloaz.com) 120 - Adore You.mp3` (or edit `TRACK_URL` in
   `js/audio-player.js`).
2. Open any page, click the floating music widget (bottom corner, with play/pause
   and animated sound bars) to toggle.

Known: if the file is missing, the widget shows "Adore You · (track not found)"
instead of crashing.
