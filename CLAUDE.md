# CLAUDE.md — SG Protein Tracker

## Project structure

```
protein-tracker/
├── index.html   # Entire app — HTML, CSS, and all React components in one file
└── sw.js        # Service worker (network-first with cache fallback)
```

Everything lives in `index.html`. There is no build step, no bundler, no `node_modules`. React and Babel are loaded from CDN via `<script>` tags and JSX is transpiled in the browser at runtime.

---

## Tech stack

| Concern | Choice |
|---|---|
| UI framework | React 18 (UMD build from unpkg) |
| JSX transpilation | Babel Standalone 7.29 (in-browser) |
| Styling | Inline styles only — no CSS framework |
| Fonts | Google Fonts: DM Serif Display, Outfit, Space Grotesk, JetBrains Mono |
| Persistence | `localStorage` (key: `pt_v1`) |
| Offline / PWA | Service worker (`sw.js`), network-first strategy |
| Hosting | GitHub Pages at `https://ckodin.github.io/protein-tracker/` |
| Deployment | Automatic on push to `main` |

---

## Key architectural decisions

**Single-file app.** No build tooling. The entire app — data, components, logic — is in `index.html`. This makes deployment trivial (just push the file) and keeps the project portable, but means all code is co-located.

**In-browser Babel.** JSX is compiled at runtime by Babel Standalone. Acceptable for a prototype of this size; would be a performance problem at scale.

**Inline styles throughout.** All styling is done via React's `style` prop using a shared `THEME` object. No CSS classes, no stylesheet. Makes the component tree self-contained and eliminates specificity issues.

**`interactive-widget=resizes-content` in the viewport meta.** This causes the layout viewport (and `dvh` units) to shrink when the iOS keyboard opens. Combined with `position: fixed; bottom: 0` on the bottom sheets, this keeps sheets above the keyboard without any JS measurement. Several commits iterated on this — it was the trickiest part of the iOS PWA experience.

**Search input in fixed sheet header (not scrollable area).** `SearchInput` is rendered above the `overflowY: auto` scroll container inside `LogSheet`. This prevents iOS from scrolling the focused input out of view when the keyboard opens.

**`height` (not `maxHeight`) on the log drawer.** The sheet uses a fixed `height: 88dvh` so it stays the same size regardless of how many search results are showing. Prevents the distracting resize as results filter.

**`font-size: 16px` on the search input.** iOS Safari auto-zooms any input with `font-size < 16px` on focus. Keeping it at exactly 16px prevents the zoom-and-misalign bug on iPhone.

**Day-roll logic on mount.** On app load, if `logDate` in localStorage differs from today, yesterday's total is appended to `history` and logs are cleared. This happens in `useMemo` before first render — no flicker.

**Food data is a static array (`window.SG_FOODS`).** 33 Singapore hawker foods with protein estimates. No API, no database. Hardcoded and accurate enough for the use case.

**`proteinBucket` / `tierColor` as globals.** Shared utility functions are attached to `window` so they're available across the separate `<script>` blocks in the file.

**Service worker: `skipWaiting` + `clients.claim`.** Updates take effect on the next app open without the user needing to re-add to home screen.

---

## Screens

| Screen | Key component | Notes |
|---|---|---|
| Onboarding (3 steps) | `Onboarding1/2/3` | Weight + activity → suggested goal |
| Today | `Today` | Ring chart, log list, week bar chart |
| Stats | `Week` | 7-day bars + insights (shown after 3+ days of data) |
| Settings | `Profile` | Goal slider, about info, re-run onboarding |

Sheets (rendered inside `ProtoApp`, above the tab bar):
- `LogSheet` — food picker with tiles / search / recents variants
- `EditLogSheet` — edit or delete a logged item, or add a custom food

---

## Current state & next steps

### Current state
The app is a functional PWA installable from Safari on iPhone. Core loop works: onboard → set goal → log meals → track weekly progress. Data persists across sessions. Keyboard and sheet behaviour is stable on iOS.

### Known gaps / potential next steps
- **Food database is hardcoded.** No way to add persistent custom foods beyond the current session.
- **No unit — only grams.** Some users may want oz or a per-meal target view.
- **Insights section is sparse.** Only shows after 3 days; only two insight types.
- **No iCloud / sync.** Data lives in `localStorage` on one device only. Clearing browser data loses everything.
- **In-browser Babel is slow on first load.** If the app grows, moving to a proper build (Vite, etc.) would improve startup time and enable proper code splitting.
- **`variant` prop on `LogSheet` is always `"tiles"`.** The `search` and `recents` variants exist but are never used — could be removed or wired up.
- **Hardcoded user name ("Clarisse").** Should come from onboarding or settings.
