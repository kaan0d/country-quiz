# country-quiz

World map quiz in Turkish and English: find countries on the map, or name the one that is marked. Next.js 16, React 19, Tailwind 4, react-simple-maps; runs fully in the browser with no backend.

## Features

- **Modes:** country name, flag only, capital only, or reverse (a country is marked in yellow, pick its name from four options).
- **Runs:** all 202 countries, a single continent with the map zoomed to it, or a 60 second timed run.
- **Help:** a hint shows the continent and a circle around the target and counts as a miss; after 3 misses the answer is shown and the country goes to the back of the queue.
- **Small countries:** island states and micro-states get a dot that stays clickable at any zoom; they can also be left out.
- **Progress:** the unfinished game, settings and lifetime misses per country are kept in `localStorage`.
- **Practice:** a round of the 20 most missed countries; a clean find lowers a country's miss count.
- **End screen:** time, accuracy, best score for the same setup and this game's most missed countries.
- **Controls:** pan and pinch on touch, drag and wheel on desktop; keys H hint, S skip, N new game, 1-4 options.
- **Feedback:** synthesized sound and phone vibration on answers, can be turned off.
- **Offline:** map shapes (world-atlas 50m) and flags are served from `public/`.

## Setup

```sh
pnpm install
pnpm dev      # http://localhost:3000
pnpm test     # reducer and stats tests (node:test)
pnpm build && pnpm start
```

## Limits

- Tuvalu and French Guiana are not in the game: the 50m map has no separate shape for them.
- Somaliland and Northern Cyprus are drawn but not playable.
- Stats live in one browser; clearing site data resets them.

## Layout

```
app/                     layout, page, global styles, icon
components/
  country-game.tsx       settings, game wiring, header, footer, reverse options
  world-map.tsx          map rendering, touch gestures, focus zoom, tiny-country dots
  game-summary.tsx       end screen
  settings-modal.tsx     settings panel
  country-list-modal.tsx searchable country list
  modal.tsx              shared modal shell and chip button
lib/
  countries.ts           202 countries: Turkish and English names, capitals, continent
  geo.ts                 ISO numeric to alpha-3, country centers, continent bounds, hint circle
  game.ts                pure game reducer (+ game.test.ts)
  stats.ts               lifetime misses and best scores (+ stats.test.ts)
  i18n.ts                UI strings
  feedback.ts            Web Audio tones and vibration
  storage.ts             safe localStorage load/save
public/                  countries-50m.json, flags/*.png
```
