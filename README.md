# SnapSim – Snapchat-style chat simulation (iPhone PWA)

An offline, installable web app that recreates a Snapchat-style chat screen from a reference screenshot, with working chats, camera, Snaps, stories, streak editing, backups and PNG screenshot export.

> **This is a local simulation.** It's not affiliated with Snap Inc. Nothing you type, send or snap leaves the device. No real accounts are contacted.

## Features

| Area | What works |
| --- | --- |
| Chat list | Pixel-matched layout (393 pt iPhone width): header, tabs, 10 default contacts in the screenshot order, Bitmoji avatars cropped from the screenshot, friend emojis, sent/opened/received icons, streaks, pin, story ring, yellow compose button, bottom nav |
| Conversations | Text, emoji picker, photo attachments, timestamps (tap a message), Zugestellt/Geöffnet, long-press → save in chat / copy / delete, typing indicator, optional simulated replies |
| Camera | `getUserMedia` live preview, front/rear switch, front "flash", capture, gallery upload. If the camera is denied or missing, you get an explanation and an upload button instead of a black screen |
| Snap editor | Caption bar or big text (drag, pinch or slider to resize, colours), freehand drawing with palette and undo, save as JPEG, send to contacts and/or My Story |
| Received Snaps | Simulate an incoming Snap (chat → tap name), then tap the row to view it. It closes on tap or after 10 s |
| Streaks | Per-contact count, show/hide, ⏳ hourglass, last interaction. Mode is either *manual* (never changes on its own) or *+1 on the first Snap you send per day*. Opening the app never changes a streak |
| Contact editor | ••• → Kontakte bearbeiten (or long-press a row): add, delete, rename, upload and crop an avatar, emoji, star badge, streak, status, time label (fixed or auto), pin, story ring, auto-reply, drag-and-drop or ▲▼ reorder, reset one contact, restore all defaults |
| Screens | Map (drawn offline map, no location unless you tap the locate button, which stays local), Chat, Camera, Stories (local, with viewer), Spotlight (local demo feed plus your own images) |
| Storage | IndexedDB (contacts, messages, Snap images, stories, settings). JSON backup export and import, full reset, storage usage display |
| Export | ••• → Screenshot exportieren, chat → tap name → export, or the share icon in the Snap and Story viewers. PNG at 3× (1179×2556 on a 393×852 screen), optional simulated status bar and a small "Simulation · SnapSim" mark. Sheets and edit buttons are left out |
| Web view | ••• → Ansicht: **iPhone / Web / Automatisch**. Web recreates the Snapchat Web desktop layout: sidebar with the install banner (can be hidden), search with My AI, contact rows with "Std." times and "Antworten", and a right panel with the camera card. Upload your own panel background (e.g. a screenshot of your Bitmoji scene) under ••• → Statusleiste & Profil. Chats, camera, Stories and Spotlight open inside the panel. Esc closes them |
| Apple emoji | All emoji in names, statuses, chats and badges are drawn as Apple emoji images, so they look like iOS on Windows and Android too, and in exports. They're bundled locally in `public/emoji/`, with no CDN |
| Clock | The simulated status bar shows the current time live by default. It can be switched to a fixed time |
| PWA | Manifest, service worker (offline after first load), apple-touch-icon, standalone full-screen mode with safe-area handling |

### Known limitations

- **Fonts:** iPhone uses SF Pro, which is very close to the original. Windows and Android use their system font, so text widths there differ slightly.
- **Avatars:** cropped from the reference screenshot (≈100 px source), so they're a bit softer than the originals. Friend-emoji badges that were baked into the source are covered by the rendered badge. Upload a sharper image per contact if needed.
- **Status bar:** on a real iPhone the real status bar is used, never a duplicate. The simulated one appears in the desktop preview and in exports (time, battery and signal are editable under ••• → Statusleiste & Profil).
- **Camera:** iOS only allows it over HTTPS. Video recording, lenses and filters aren't implemented.
- **Placeholders:** My AI, In meiner Nähe, Gruppen, Flashbacks, calls, comments, notifications and profile open an explicit "placeholder" sheet.
- **Data loss:** everything lives in this browser's IndexedDB. Clearing Safari website data or deleting the Home Screen app deletes it, so export JSON backups. iOS may also clear storage for sites you haven't opened in weeks.

## Develop

```bash
npm install
npm run dev          # http://localhost:5173
```

## Production build

```bash
npm run build        # outputs dist/
npm run preview      # serves dist/ on http://localhost:4173
```

## Tests (Playwright)

```bash
npx playwright install chromium webkit
npm test
```

The tests cover 11 flows in two engines: **WebKit with an iPhone 15 Pro profile** (no camera, so it tests the upload fallback) and **Chromium with a fake camera** (tests live capture). Each test also fails if any JavaScript error is logged.

## Deploy to GitHub Pages

1. Create a GitHub repository and push this folder to `main`.
2. In the repository, open **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. The included workflow `.github/workflows/deploy.yml` builds and publishes on every push. The site will be at `https://<user>.github.io/<repo>/`.

The build uses relative paths (`base: './'`), so it works from any sub-path. Any other static HTTPS host works too (Netlify, Cloudflare Pages, Vercel): upload `dist/`.

> **Privacy:** GitHub Pages sites are public, and `public/avatars/` plus `scripts/reference.webp` contain your friends' avatars and names from the screenshot. Before publishing, consider replacing them, using a private repo with a host that supports private sites, or at least not sharing the URL.

## Install on iPhone

1. Open the **https** URL in **Safari**. Opening `index.html` from the Files app won't work, because modules, IndexedDB and the camera need a real web origin.
2. Tap **Share** (square with arrow) → **Add to Home Screen** → **Add**.
3. Start it from the Home Screen icon. It runs full-screen, offline, and asks for camera access the first time you open the camera.

## Apple emoji

`public/emoji/*.webp` is generated from the `emoji-datasource-apple` package:

```bash
npm run build-emoji
```

The Apple emoji artwork is © Apple Inc. It's fine for personal use, but think twice before publishing it widely.

## Re-generating the avatars

Replace `scripts/reference.webp` with a new screenshot (852×1846) and run:

```bash
npm run crop-avatars
```

## Project layout

```
src/
  App.tsx                 screen router, status bar / safe-area logic
  store.ts                Zustand store + debounced IndexedDB persistence
  db.ts                   idb-keyval wrapper, storage estimate
  defaults.ts             default contacts (from the screenshot), settings, demo feed
  export.tsx              html-to-image PNG export + preview
  components/
    ChatList.tsx          header, tabs, contact rows, FAB
    ChatView.tsx          conversation, long-press menu, simulator options
    Camera.tsx            live camera, Snap editor, send-to
    Viewers.tsx           Snap viewer, Story viewer
    Stories.tsx / Spotlight.tsx / MapScreen.tsx
    ContactsEditor.tsx    contact list editor, form, avatar cropper
    Sheets.tsx            simulator menu, status bar, backup, about
public/  manifest, service worker, icons, avatars
e2e/     Playwright tests
```
