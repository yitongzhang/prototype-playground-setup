---
name: prototype-playground
description: Scaffold a standalone prototype playground from any product repo — extract a cleaned design system (tokens, typography, icons, core components), build a local fake-data layer, and clone the app's main screen pixel-perfect, all wrapped in a Figma-files-style index that holds many prototype iterations. Use when asked to set up a prototype playground, clone an app for fast UI prototyping, or create a design sandbox detached from production builds, backends, and secrets.
argument-hint: "[source-repo-path] [main screen to clone]"
---

# Prototype Playground

Prototyping inside a production repo is slow: heavy CI builds, missing
secrets, backend dependencies, and fear of breaking things. This skill builds
a **standalone clone-for-prototyping** next to the source repo: a small Vite +
React app with the product's design system, fake local data, and a
pixel-perfect copy of its main screen. From there, requests like "make six
versions with six navigation styles" become six cheap iteration directories
behind one Figma-files-style index.

## Done means

1. **Design system** — cleaned tokens (`tokens.css`), typography, icons,
   illustrations, and the core components, extracted as they *should* exist:
   one semantic system, duplicates collapsed, same rendered pixels.
2. **Fake data** — typed local fixtures replicating the app's core data
   shapes; the whole app runs off one editable `fixtures.ts`, no network.
3. **Master prototype** — the agreed scope (a named screen, or the main
   screen plus its one-click surfaces) rendered pixel-perfect against
   production reference screenshots, with working navigation between its
   surfaces, registered as the frozen source of truth.
4. **Playground shell** — index page listing master + iterations
   (Figma-file navigation), a permanent top nav on every route, prototype
   chrome with prev/next switching, built-in tool views (`#/tools/design-system`
   catalog and `#/tools/data` fixture viewer), and a playground `AGENTS.md`
   so future agents extend it correctly.
5. `npm install && npm run dev` is the entire setup. No secrets, no backend.

## Phase 0 — Inputs

- **Source repo**: the argument, else the current working directory.
- **Master scope — ask the user**: do they want a **specific part** cloned
  (a named screen or flow), or a **generic setup**? This is the one question
  to always ask up front; it shapes everything downstream.
  - *Specific*: clone exactly what they name.
  - *Generic*: identify the main screen — where users spend their time
    after login (the inbox / board / feed / editor — not the marketing
    page, not settings) — then go **one level deeper**: every major surface
    reachable in one click from it (detail views, item modals, primary nav
    destinations, the composer). "Major" means surfaces users spend time
    in; skip trivial menus, tooltips, and confirmations.
- **Playground location**: sibling directory `<source>-playground` unless the
  user says otherwise. Never inside the source repo.

## Phase 1 — Survey the source repo (read-only)

Establish, without modifying the source repo:

- Framework, styling system, and where the design tokens live (see the
  token-location table in
  [references/design-system-extraction.md](references/design-system-extraction.md)).
- Which package/app owns the main screen (monorepos: survey only that app and
  the design packages it imports).
- The component tree of every screen in the master scope: read the actual
  page components and what they render, top to bottom — for generic scope,
  the main screen and each one-click surface.
- Core domain entities behind that screen — from its props/queries/store
  types, API types, or DB schema. Name 3–8 entities, not the whole schema.
- Fonts, icon system, logos, illustrations, global CSS reset.

For large repos, fan out parallel read-only subagents if the harness
supports them (one each for tokens/theme, main-screen tree, data shapes,
assets); otherwise survey those four areas sequentially. Keep the
conclusions in a scratch survey note.

## Phase 2 — Get reference pixels

Follow [references/pixel-perfect-verification.md](references/pixel-perfect-verification.md)
§1: run the source app locally if it starts without missing secrets,
otherwise ask the user for production screenshots. Capture the main screen
plus, for a generic-scope master, each one-click surface in scope (click
into the detail view, open the modal, visit each nav destination). Do this
**before** building — the main-screen reference gates the pixel-perfect
claim, and this is the one step that may need the user. Save all captures
to `reference/` in the playground; a surface with no reference gets the
honest "faithful reconstruction" downgrade, not a pixel-perfect claim.

## Phase 3 — Scaffold

1. Copy `templates/scaffold/` (from this skill's directory) to the playground
   location.
2. Replace placeholders everywhere: `{{APP_NAME}}` (display name),
   `{{APP_SLUG}}` (package name), `{{SOURCE_REPO}}` (path or URL),
   `{{TODAY}}` (YYYY-MM-DD).
3. `git init`, install with the user's package manager (default `npm
   install`), run `npm run dev`, and confirm the index page, the placeholder
   master, and both tool views (`#/tools/design-system`, `#/tools/data`)
   render. Commit the working scaffold.

The stack is fixed: **Vite + React + TypeScript + Tailwind v4, static SPA,
hash routing, no router/state libraries**. It is chosen for instant HMR (the
user watches changes land live while the agent works), maximum agent fluency,
and zero-config static hosting (`dist/` deploys to any static host; hash
routing needs no rewrite rules). Do not swap in Next.js or another
meta-framework — there is no server to render and no API to route. The shell
(`src/shell/`) is neutral `pg-*` plain CSS and is never themed per app.

## Phase 4 — Extract the design system

Follow [references/design-system-extraction.md](references/design-system-extraction.md).
Order: tokens → fonts/icons/illustrations (copied verbatim) → core
components. Extraction is a cleanup: collapse duplicate values into semantic
tokens, but never change what pixels render — when purity and fidelity
conflict on the main screen, fidelity wins. For behavior-heavy primitives
(selects, menus, dialogs, chat), harvest shadcn/ui as the baseline and
restyle it to the product's exact spec — the scaffold is pre-wired for
`npx shadcn add`; stock shadcn styling must never survive into a prototype.

The shell's design-system catalog (`#/tools/design-system`) reads
`tokens.css` automatically, so token sections populate themselves as
extraction proceeds. As core components land, extend that page's
"Components" section with a demo of each (variants + states) — it is the
one place to see the whole system.

## Phase 5 — Build the fake data layer

1. `src/data/types.ts` — TypeScript types for the surveyed core entities,
   simplified to what the UI consumes (flatten joins, drop bookkeeping
   columns). This is the data model as the prototype wishes it were.
2. `src/data/fixtures.ts` — one editable dataset: ~10–30 records per entity,
   **realistic content** (plausible names, titles, timestamps relative to a
   fixed "now" — no lorem ipsum), covering the states the main screen shows
   (unread/done, statuses, edge lengths). Content should be shaped like the
   reference screenshot so layouts compare.
3. `src/data/index.ts` — wrap fixtures in the provided `createStore`
   (`src/data/store.ts`), export the store as `db`, and export typed hooks
   (`useTasks()`, `useUser()`…). Prototypes read only through these hooks,
   so interactions (complete, archive, reorder) work via `db.set` and the
   data stays swappable. The shell's fixture viewer (`#/tools/data`)
   discovers the exported `db` automatically — check it renders the
   collections once this module exists.

## Phase 6 — Master prototype, pixel-perfect

1. Build `src/prototypes/master/` using only design-system components and
   data hooks. Structure it as production does (sidebar/header/content as
   separate files if the screen is big).
2. Run the verification loop in
   [references/pixel-perfect-verification.md](references/pixel-perfect-verification.md)
   §2–4 with whatever screenshot capability the environment has (preview
   browser, Playwright, or a temp browser test). Iterate until only accepted
   differences remain.
3. Fix root causes in the **design system**, not with local overrides in the
   master — every fix there pays off in all future iterations.
4. **Depth boundary — set by the Phase 0 scope.** *Specific scope*: build
   exactly the named screen or flow. *Generic scope*: the main screen
   pixel-perfect, plus every in-scope one-click surface — and the clicks
   really work: selecting an item opens its detail view, the nav navigates,
   the composer opens. Verify the main screen against its reference in the
   full loop; verify each one-click surface against its own capture (or
   mark it faithful-reconstruction if no reference exists). Both scopes
   include component interaction states (hover/focus/active — free from
   extraction) and the cheap local interactions the screens imply (check
   off an item, select a row) via the data store. Out of scope always:
   surfaces two clicks deep, minor menus/confirmations, responsive
   breakpoints, and elaborate animation — iteration work, or an explicit
   master extension when the user supplies a new reference.
5. Capture `public/thumbnails/master.png`, set it on the registry entry, and
   copy the final verified screenshot into `reference/` alongside the
   production original.

## Phase 7 — Hand off

1. Finish the playground `AGENTS.md` (from
   [templates/scaffold/AGENTS.md](templates/scaffold/AGENTS.md)): correct
   names, plus a short "Data model" section naming the entities and any
   app-specific extraction notes. This file is what makes future sessions
   work when a user just talks to their agent with no idea how the repo is
   set up — its request-interpretation table maps product language ("try a
   version where…") to the right action (new iteration, never touch master).
   `AGENTS.md` is the cross-tool standard (Codex, Cursor, Devin, Copilot,
   and others read it natively); the
   [templates/scaffold/CLAUDE.md](templates/scaffold/CLAUDE.md) shim
   (`@AGENTS.md`) covers Claude Code and is inert elsewhere — leave both
   as they are.
2. Final check: fresh `npm install && npm run build` passes; dev server
   shows index → master → back; commit.
   If the user wants it hosted, `dist/` is a plain static site — Netlify
   drop, `npx vercel`, Cloudflare Pages, or GitHub Pages all work with no
   config.
3. Report: playground path, how to run it, the three deliverables, the
   verification evidence (reference vs. master screenshots), and every known
   remaining visual difference — honestly.

## Agent surfaces

When the product has (or the user wants) an assistant/chat/agent-session
surface, follow
[references/agent-prototyping.md](references/agent-prototyping.md). Summary:
the scaffold's `src/agent/` module is the whole runtime — a scripted
transport (default: deterministic, offline, deploys with the static build)
and a zero-auth live transport (OVHcloud anonymous endpoints — no account,
no API key, works on deployed builds; always wrapped in the scripted
fallback) behind one event interface; no agent framework. Chat UI is
harvested from shadcn's chat components and restyled to the extracted
design system. The handoff report must say whether the agent surface is
scripted or live.

## Robustness notes

- **Unknown/messy repos**: the survey is the anchor. Never copy source files
  wholesale into the playground; everything is re-expressed through the clean
  design system and fixtures.
- **Multiple design systems** in one repo: extract the one the main screen
  actually renders; normalize stragglers to it.
- **No token definitions at all**: harvest computed styles from the running
  app or reference screenshot; still emit clean semantic tokens.
- **Source app won't run locally**: don't burn time on its infrastructure —
  that's the exact problem this skill routes around. Get a screenshot from
  the user instead.
- **Non-React source (Vue/Svelte/Angular)**: keep the identical playground
  structure and contracts but recreate the five small shell files in the
  source framework, so design-system extraction stays a port, not a rewrite.
  The provided templates are React.
- **Desktop apps (Electron)**: clone the main window as a web page; match
  its default window dimensions in the reference screenshot.
