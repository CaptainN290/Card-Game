# Card Battler — Phase 1 Foundation

A mobile-first, collectible deck-building strategy game. Dark fantasy theme,
five tribes, lane-based combat, booster packs, and a Collection/Deck Builder
— built as a solid, expandable foundation rather than a finished game.

This is **Phase 1**: one AI opponent, no story mode, no crafting yet. The
architecture is deliberately laid out so those things can be added later
without a rewrite (see [Architecture & extending this](#architecture--extending-this)
at the bottom).

100% client-side. No backend, no database, no accounts, no API keys, no paid
services. Progress is saved to the browser's LocalStorage.

## What's in Phase 1

- **Combat**: 5-lane board per side, energy curve, monsters that persist on
  the board until destroyed. Simple, readable rules — no spells, traps, or
  status effects yet.
- **30 cards** across 5 tribes (Beast, Dragon, Machine, Undead, Mage) and 4
  rarities (Common, Rare, Epic, Legendary).
- **Collection** with a **Deck Builder** built in as a second tab (20-card
  decks, max 2 copies per card).
- **Booster packs** with a shake → open → reveal animation.
- **Battle rewards**: after a win, choose Gold, a New Card, or a Booster Pack.
- Everything autosaves to LocalStorage as you play.

## Tech stack

- [React 19](https://react.dev/) + TypeScript
- [Vite](https://vite.dev/) for dev server and production builds
- No UI framework, no router, no state-management library, no backend —
  just React state and LocalStorage. Nothing to configure beyond what's
  already in this repo.

## Project structure

```
card-battler/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── public/              # static assets (empty for now — see public/README.md)
└── src/
    ├── main.tsx         # React entry point
    ├── App.tsx          # top-level state + screen routing
    ├── index.css        # all styling (design tokens, components, animations)
    ├── types.ts          # shared TypeScript types
    ├── cards.ts          # the 30-card database + pack/reward logic
    ├── battle.ts          # the combat engine (pure functions, no UI)
    ├── save.ts            # LocalStorage read/write
    ├── Card.tsx            # the reusable card visual
    ├── Menu.tsx             # main menu
    ├── Board.tsx             # battle screen
    ├── Collection.tsx        # collection + deck builder
    ├── PackOpening.tsx        # pack opening animation
    └── Settings.tsx            # settings screen
```

## Running it locally

You'll need [Node.js](https://nodejs.org/) 18 or newer.

1. Open a terminal in the project folder.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the dev server:
   ```bash
   npm run dev
   ```
4. Open the URL it prints (usually `http://localhost:5173`). Vite hot-reloads
   as you edit files.

No additional configuration is needed — this works immediately after
`npm install`.

## Creating a production build

```bash
npm run build
```

This runs Vite's production build and writes fully static files (HTML, CSS,
JS — no Node required to serve them) to a new `dist/` folder. To preview
that exact build locally before deploying:

```bash
npm run preview
```

There's also an optional type-check script you can run any time:

```bash
npm run typecheck
```

## Putting it on GitHub

1. Create a new, empty repository on [github.com](https://github.com/new)
   (don't initialize it with a README — you already have one).
2. In your project folder:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO.git
   git push -u origin main
   ```
   `node_modules` and `dist` are already excluded via `.gitignore`, so only
   source files get pushed.

## Deploying

The production build is fully static, so it works unmodified on any of
these. `vite.config.ts` is already set to `base: './'` (relative asset
paths), which is what makes the same `dist` folder work whether it's served
from a domain root (Render, Netlify, Cloudflare Pages) or a subpath
(`username.github.io/repo-name/` on GitHub Pages).

### Render (detailed)

1. Push your code to GitHub (see above).
2. Go to [dashboard.render.com](https://dashboard.render.com) and sign in.
3. Click **New** → **Static Site**.
4. Connect your GitHub account if you haven't, then select your repository.
5. Fill in the form:
   - **Build Command**: `npm run build`
   - **Publish Directory**: `dist`
6. Click **Create Static Site**.

Render builds and deploys automatically, and your game will be live at
`https://YOUR-SITE-NAME.onrender.com`. By default, every push to your main
branch triggers a new deploy automatically.

### GitHub Pages

1. Push your code to GitHub.
2. In your repo, go to **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to "GitHub Actions" and
   use a Vite-based deploy workflow (GitHub suggests one automatically), or
   build locally with `npm run build` and deploy the `dist` folder to a
   `gh-pages` branch using a tool like [`gh-pages`](https://www.npmjs.com/package/gh-pages).
4. Your site will be live at `https://YOUR-USERNAME.github.io/YOUR-REPO/`.

### Netlify

1. Push your code to GitHub.
2. In the Netlify dashboard, click **Add new site → Import an existing project**.
3. Connect the repository.
4. **Build command**: `npm run build`, **Publish directory**: `dist`.
5. Click **Deploy**.

### Cloudflare Pages

1. Push your code to GitHub.
2. In the Cloudflare dashboard, go to **Workers & Pages → Create → Pages**
   and connect your repository.
3. **Build command**: `npm run build`, **Build output directory**: `dist`.
4. Click **Save and Deploy**.

## Architecture & extending this

A few decisions were made specifically to make Phase 2+ easier:

- **`types.ts` is the single source of truth** for data shapes. New tribes
  are one more string in the `Tribe` union; new card mechanics start as new
  optional fields on `CardDefinition`.
- **`battle.ts` has no UI code in it.** It's pure `(state, action) -> state`
  functions. Status effects, spells, or trap cards would extend
  `BoardMonster`/`BattleState` and add new branches in `endTurn`/`playCard`
  without touching any component.
- **`save.ts` is the only file that touches LocalStorage**, and `SaveData`
  already carries a `version` field. Swapping in cloud saves later means
  giving `save.ts` a second implementation behind the same three functions
  (`loadSave`, `writeSave`, `resetSave`) — nothing else in the app would
  need to change.
- **Screens are swapped with plain state in `App.tsx`**, not a router. Adding
  a Story Mode, a Shop, or Daily Challenges is a new entry in the
  `GameScreen` union and a new component, following the same pattern as
  `Settings.tsx` or `PackOpening.tsx`.
- **`gold` and `packsUnopened` are already tracked** in save data with no
  spending path yet — a future Shop screen can spend the one and grant the
  other without any data-model changes.
- **Deck building already respects owned copies**, not just a flat 2-per-card
  cap, so Crafting (converting spare copies into new cards) has real data
  to work with (`collection[cardId]` counts) as soon as it's built.

Not implemented yet, by design: Crafting, Relics, Status Effects, Boss
Battles, Story Mode, Shops, Daily Challenges, PvP, and any backend/database/
cloud saves. The intent is that none of these require restructuring what's
already here.
