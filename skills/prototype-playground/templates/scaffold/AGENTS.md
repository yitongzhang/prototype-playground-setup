# {{APP_NAME}} Prototype Playground

This is a **prototype playground**, not a production app. It is a standalone
clone of {{APP_NAME}} (source repo: `{{SOURCE_REPO}}`) built for one purpose:
cheap, fast UI iteration. There is no backend, no network, no secrets — the
design system, the fake data, and every prototype run entirely locally:

```bash
npm install
npm run dev
```

The index page (`#/`) is a Figma-files-style list of every prototype. Each
prototype is a full app screen at `#/<slug>`.

## How to interpret requests

The user talks about the product, not about this repo's structure. Map their
words to the right action:

| The user says | You do |
| --- | --- |
| "Try a version where…", "redesign…", "what if the nav was…", "make it more…" | **Start a new iteration.** Copy master (or the iteration they name as the base), register it, build the idea there. |
| "Make six variants of…" | Six new iteration directories, six registry entries. |
| "Keep going on / tweak the sidebar one" | Edit **that existing iteration** only. |
| "Add more tasks / change the data / longer titles" | Edit `src/data/fixtures.ts`. Nothing else changes. |
| "The button looks off everywhere" | Fix the component or token in `src/design-system/` — it propagates to every prototype. |
| "Master doesn't match production" | The **only** reason to touch master: re-verify against `reference/` and correct it toward production. |
| "Add a chat / assistant / agent panel" | New iteration using `src/agent/` (scripted transport) + shadcn chat components restyled to the design system. See "Prototyping agent chat". |
| "Make the agent real / why isn't it connected?" | Swap in the zero-auth live transport with scripted fallback — one line, no credentials. See "Prototyping agent chat". |
| "Show me the design system / the tokens / the fake data" | Already built in: `#/tools/design-system` and `#/tools/data` in the top nav. Extend those shell tool views if something is missing — never an iteration. |

When in doubt: **new iteration**. Iterations are cheap and disposable; that
is the whole point of this repo. Never burn an existing prototype to try a
new idea, and never edit master to try anything.

## The rules

1. **Master is sacred.** `src/prototypes/master/` is the pixel-verified clone
   of production and the baseline every iteration is judged against. It only
   ever changes to match production better — never to explore an idea.
2. **One directory per iteration.** Iterations are self-contained: shared code
   lives in `design-system/` and `data/`, everything else is copied, not
   imported across iterations. Divergence between iterations is the point.
3. **All visuals come from the design system.** Use tokens and components from
   `src/design-system/`. Tokens live in the Tailwind v4 `@theme` block in
   `tokens.css`, so token-derived utilities (`bg-surface`, `text-muted`) are
   the normal way to style. If an iteration needs a new primitive, add it to
   the design system (token-driven), not inline.
4. **All data comes from fixtures.** Read state via the hooks in `src/data/`.
   To change what the app shows, edit `src/data/fixtures.ts` — nothing else.
   No fetch calls, no APIs, no timers pretending to be servers.
5. **Keep the registry truthful.** Every prototype has an entry in
   `src/shell/registry.ts` with an honest description of what it explores.
6. **Harvest shadcn, never ship it stock.** For behavior-heavy primitives
   (Select, Menu, Dialog, Tooltip, Combobox, chat surfaces), start from
   `npx shadcn@latest add <component>` — `components.json` lands it in
   `src/design-system/components/ui/` — keep its behavior and accessibility,
   and replace its styling with this design system's tokens and the
   product's exact spec. A control that still looks like stock shadcn is a
   bug.
7. **Don't restyle the shell.** `src/shell/` (`pg-*` styles) is neutral
   playground chrome, deliberately not part of the product's design system.

## Layout

| Path | Owns |
| --- | --- |
| `src/shell/` | Playground navigation: the permanent top nav (`ShellHeader`), index page, prototype chrome, registry, and the built-in tool views (design-system catalog at `#/tools/design-system`, fixture viewer at `#/tools/data`). |
| `src/design-system/` | Extracted tokens, typography, icons, illustrations, and core components. Single source of truth for all visual primitives. |
| `src/data/` | Fake data: `types.ts` (domain types), `fixtures.ts` (the editable dataset), `index.ts` (store + hooks). |
| `src/agent/` | Fake-agent runtime: event transport, scripted player (`scripts.ts` is the editable conversation fixture), zero-auth live transport (`ovh.ts`) and the fallback wrapper (`fallback.ts`). |
| `src/prototypes/master/` | Pixel-perfect clone of production — the main screen and its one-click surfaces, with working navigation. **Sacred — see rule 1.** |
| `src/prototypes/<slug>/` | One directory per iteration. |
| `reference/` | Production screenshots the master was verified against. |
| `public/thumbnails/` | Card images for the index page. |

## Adding an iteration

1. Copy the starting point: `cp -r src/prototypes/master src/prototypes/<slug>`
   (or copy another iteration if that is the stated base).
2. Register it in `src/shell/registry.ts` with `kind: 'iteration'`, today's
   date, and a description of the idea being explored.
3. Build the variation. Reuse design-system components; extend the design
   system if the variation genuinely needs a new primitive.
4. Verify in the browser at `#/<slug>`, and check the index page still lists
   everything.
5. Optional: drop a screenshot at `public/thumbnails/<slug>.png` and set
   `thumbnail: '/thumbnails/<slug>.png'` on the registry entry.

## Prototyping agent chat

Prototypes need believable motion, not intelligence. `src/agent/` is the
whole runtime — no agent framework, no SDK:

- **Default: the scripted agent** (`scriptedAgent` from `src/agent`). It
  plays conversations defined in `src/agent/scripts.ts` with realistic
  streaming pacing, thinking pauses, and tool-call events. Edit that file
  like fixtures: one script per demo moment, replies grounded in the fake
  data. Deterministic, offline, and it works on the deployed static build.
- **Live mode: zero-auth via OVHcloud anonymous endpoints.** No account, no
  API key, nothing for the user to create — and it works on deployed static
  builds too. Always wrap it in the fallback so rate limits (about 2
  requests/minute per IP) degrade to the scripted agent, and show which mode
  answered:

  ```ts
  const transport = createFallbackTransport(
    createOvhAnonymousTransport({ system }),
    scriptedAgent,
    { onFallback: () => setMode('scripted') },
  )
  ```

  If the user wants a specific keyed provider instead, add it as another
  transport behind the same interface; the user manages their own
  credential — never ask for or handle the value yourself.
- **Chat UI**: harvest shadcn's chat components
  (`npx shadcn@latest add message-scroller message bubble attachment marker`)
  and restyle them per rule 6. Don't rebuild scroll anchoring or streaming
  rendering by hand, and don't embed third-party chat widgets.

## Deploying

`npm run build` emits a plain static site in `dist/` — no server, no env
vars. The included GitHub Actions workflow (`.github/workflows/deploy-pages.yml`)
publishes to GitHub Pages on every push to `main` once the repo's
Settings → Pages → Source is set to "GitHub Actions". Any other static host
(Netlify drop, `npx vercel`, Cloudflare Pages) also works; hash routing means
no rewrite rules are needed. Note: GitHub Pages sites are **public** even
when the repo is private.
