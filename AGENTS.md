# Pitwall Manager — Agent Guide

## Commands (pnpm, not npm)

| Command | Action |
|---------|--------|
| `pnpm run dev` | Dev server with live reload for `src/` (uses `servor`) |
| `pnpm run lint` | Oxlint (not eslint) — `oxlint src/` |
| `pnpm run format` | Oxfmt — `oxfmt src/` |
| `pnpm run test` | `node --test` (native Node test runner) |
| `pnpm run test:watch` | `node --test --watch` |
| `pnpm run deploy` | `gh-pages -d src/` |

## Project Structure

- **Vanilla JS** (ES6 modules, `"type": "module"` in package.json) — no framework, no bundler, no build step, no TypeScript.
- **Entrypoint:** `src/index.html` — open directly in browser or use `pnpm run dev`.
- **Global state** lives in the `state` object inside `src/js/app.js`.
- **Canvas rendering** in `src/js/track.js` (Track class, 2D circuit drawing).
- **Physics/formulas** in `src/js/physics.js` (tyre degradation, fuel consumption, pit stop timing).
- **CSS** in `src/css/style.css` — CSS Grid layout, dark theme, monospace font stack.
- **Game Design Document:** `docs/GDD.md` — read before implementing gameplay features.

## Architecture Notes

- No routing, no SSR, no API — pure browser-side game.
- Game loop via `requestAnimationFrame` in `app.js`.
- Modules use ES6 `import`/`export` — loaded natively by the browser, no bundler.
- Oxlint config at `.oxlintrc.json` (plugins: typescript, unicorn, oxc). Only `correctness` category is error.
- `.gitignore` excludes `node_modules/` only.
- No typechecking, no codegen, no migration tooling.

## Style Conventions

- No comments in code unless explaining a non-obvious decision.
- Variables named in camelCase; constants in UPPER_SNAKE_CASE.
- No semicolons (standard modern JS style).
- Prefer editing existing files over creating new ones.
