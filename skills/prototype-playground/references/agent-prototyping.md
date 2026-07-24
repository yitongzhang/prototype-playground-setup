# Agent Prototyping

How to prototype agent/chat surfaces in a playground: an assistant panel, an
agent session view, a chat with streaming, thinking states, and tool-call
cards. Principle: **prototypes need believable motion, not intelligence** —
what is being design-tested is choreography (streaming feel, tool-card
placement, thinking collapse), so a deterministic fake is the default and a
real model is an optional upgrade.

No agent framework, ever. Frameworks earn their weight with real tools,
memory, and server orchestration; a prototype's tools are fake, its memory is
fixtures, and there is no server. The whole runtime is the ~150-line
`src/agent/` module already in the scaffold.

## The transport layer (already in the scaffold)

`src/agent/` ships with every playground:

- `transport.ts` — the one interface: `send(messages, onEvent, signal)`
  emitting `thinking` / `text-delta` / `tool-call` / `tool-result` / `done` /
  `error` events. UI renders from events; transports are swappable.
- `scripted.ts` + `scripts.ts` — the **default**: fixture-defined
  conversations played with realistic pacing (word-chunk streaming, thinking
  pauses, tool delays). Deterministic, offline, works on deployed static
  builds. During setup, replace the example scripts with 2–4 scripts in the
  product's domain, using fixture data in the replies so the agent and the
  UI tell one coherent story.
- `ovh.ts` — the **live option**: OVHcloud AI Endpoints' anonymous tier.
  Zero-auth by design — no account, no API key, no `.env` file, nothing for
  the user to create. Calls go browser-direct to
  `https://oai.endpoints.kepler.ai.cloud.ovh.net/v1/chat/completions`
  (OpenAI-compatible, streaming, CORS `*`), so live mode works in dev **and
  on deployed static builds**. Default model `gpt-oss-20b`; any model in
  OVH's current catalog works.
- `fallback.ts` — chains transports: try the live one, and if it errors
  before producing output, replay the turn on the scripted agent. **Always
  wrap the live transport in this**, and surface which mode answered (a
  small "live / scripted" indicator near the composer) so a throttled demo
  degrades honestly instead of dying or silently faking it.

Live-mode constraints worth knowing: the anonymous tier is limited to about
**2 requests/minute per IP per model** — fine for a hands-on demo, useless
for load — and it carries no SLA or longevity promise (OVH's docs say "as
of now"; model ids rotate). That is exactly why the scripted transport stays
the default and the fallback wrapper is mandatory. Keep prompts small:
inject a summary of the fixtures into the system prompt, not the whole
dataset.

Why not GitHub Models or another keyed free tier: they require the user to
create and manage a credential (a PAT), and not every user can get one.
Zero-auth means the "make it real" request is a one-line transport swap with
no user homework. If a user explicitly wants a specific keyed provider, wire
it as another transport behind the same interface — the user handles their
own credential; never create or store it for them.

## The chat UI: harvest shadcn, restyle to the product

Do not build message lists, scroll anchoring, or streaming markdown from
scratch, and do not use embedded chat widgets (ChatKit-style iframes) that
cannot be restyled to pixel fidelity. shadcn/ui ships purpose-built chat
components (June 2026):

```bash
npx shadcn@latest add message-scroller message bubble attachment marker
```

- `message-scroller` — the hard one: anchored turns, streamed replies,
  saved-thread restore, prepended history, jump-to-message, scroll controls.
- `message` / `bubble` — conversation rows and message surfaces.
- `attachment` — files/images with upload states.
- `marker` — status rows for streaming state, tool activity, date breaks.
- `shimmer` / `scroll-fade` CSS utilities for "Thinking…" text and edge fades.

The scaffold is pre-wired for the CLI: `components.json` lands components in
`src/design-system/components/ui/`, the `@` alias and `cn` helper exist. Then
apply the harvest rule from
[design-system-extraction.md](design-system-extraction.md) §4: keep the
behavior, replace the styling with the product's. Map every visual decision
(bubble radius, gutter, type ramp, tool-card borders) to extracted tokens; if
the source app already has a chat surface, its code/screenshots are the
styling truth. **Stock-shadcn-looking chat in a prototype is a bug** — it
reads as a template, not as the product.

## Wiring a chat prototype

1. Build the chat surface in the iteration from the harvested, restyled
   components.
2. Hold conversation state in the iteration (or a `src/data/` hook if shared
   across iterations); append `AgentEvent`s into renderable message parts.
3. Default to `scriptedAgent` from `src/agent`. When the user asks to
   "actually talk to it", swap in live mode — no credentials involved:

   ```ts
   const transport = createFallbackTransport(
     createOvhAnonymousTransport({ system }),
     scriptedAgent,
     { onFallback: (reason) => setMode('scripted') },
   )
   ```

4. Give the scripted agent one script per demo moment the user cares about,
   and keep the fallback reply honest about being scripted.
5. In the handoff report, say explicitly whether the agent surface is
   scripted or live — users otherwise discover it by typing at it and
   asking why it isn't connected.
