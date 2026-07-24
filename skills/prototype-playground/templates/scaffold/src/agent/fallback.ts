import type { AgentTransport } from './transport'

/**
 * Chain two transports: try the primary (a live model), and if it errors
 * before producing any output, replay the turn on the fallback (the scripted
 * agent). This is how a live prototype survives rate limits and outages —
 * pair it with a visible live/scripted indicator via onFallback so the demo
 * never silently pretends the fallback reply came from the model.
 */
export function createFallbackTransport(
  primary: AgentTransport,
  fallback: AgentTransport,
  options: { onFallback?: (reason: string) => void } = {},
): AgentTransport {
  return {
    async send(messages, onEvent, signal) {
      let fallbackReason: string | undefined
      let primaryProducedOutput = false

      await primary.send(
        messages,
        (event) => {
          if (event.type === 'error' && !primaryProducedOutput) {
            fallbackReason = event.message
            return
          }
          if (event.type === 'text-delta' || event.type === 'tool-call') {
            primaryProducedOutput = true
          }
          onEvent(event)
        },
        signal,
      )

      if (!fallbackReason || signal?.aborted) return
      options.onFallback?.(fallbackReason)
      onEvent({ type: 'thinking', text: 'Live model unavailable — using local fallback…' })
      await fallback.send(messages, onEvent, signal)
    },
  }
}
