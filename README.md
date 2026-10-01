# country-quiz

Interactive world map quiz in Turkish: find each named country on the map. Next.js 16, React 19, Tailwind 4, react-simple-maps.

## Features

- **Quiz loop:** 202 countries in shuffled order; skipped ones go to the back of the queue.
- **Hints:** shows the continent and a circle around the target area.
- **Map:** pan and pinch zoom on touch, mouse drag and wheel on desktop.
- **Settings:** leave out small island nations, show the name of a wrongly clicked country. Saved in `localStorage`.
- **Country list:** search, filter by continent, see which countries are done.

## Setup

```sh
pnpm install
pnpm dev      # http://localhost:3000
pnpm build && pnpm start
```

## Limits

- Progress is not saved; a reload starts a new game.

## Layout

```
app/                 layout, page, global styles, icon
components/
  country-game.tsx   game state, header, footer, ISO code tables
  world-map.tsx      map rendering, touch gestures, hint circle
  country-list-modal.tsx
lib/countries.ts     country list (Turkish names, continent, island flag)
```
