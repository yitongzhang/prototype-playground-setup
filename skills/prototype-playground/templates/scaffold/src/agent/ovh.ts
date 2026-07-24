import type { AgentEvent, AgentTransport } from './transport'

/**
 * Live agent over OVHcloud AI Endpoints' anonymous tier — no account, no API
 * key, no auth header. Requests go browser-direct (OVH sends CORS `*`), so
 * this transport works in dev AND on deployed static builds.
 *
 * The anonymous tier is rate-limited to ~2 requests/minute per IP per model
 * and carries no SLA, so always wrap this in createFallbackTransport with the
 * scripted agent as the fallback — a throttled demo should degrade, not die.
 */
const OVH_CHAT_COMPLETIONS_URL =
  'https://oai.endpoints.kepler.ai.cloud.ovh.net/v1/chat/completions'

interface OvhStreamChunk {
  choices?: Array<{ delta?: { content?: string | null } }>
  error?: { message?: string }
}

function errorEvent(message: string): AgentEvent {
  return { type: 'error', message }
}

export function createOvhAnonymousTransport(
  options: { model?: string; system?: string } = {},
): AgentTransport {
  const model = options.model ?? 'gpt-oss-20b'

  return {
    async send(messages, onEvent, signal) {
      try {
        const response = await fetch(OVH_CHAT_COMPLETIONS_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model,
            stream: true,
            max_tokens: 512,
            messages: [
              ...(options.system ? [{ role: 'system', content: options.system }] : []),
              ...messages,
            ],
          }),
          signal,
        })

        if (!response.ok || !response.body) {
          const reset = response.headers.get('ratelimit-reset')
          const retry = response.status === 429 && reset ? ` Retry in about ${reset}s.` : ''
          onEvent(
            errorEvent(`OVH anonymous inference unavailable (HTTP ${response.status}).${retry}`),
          )
          return
        }

        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''
        let receivedText = false

        const processLine = (line: string) => {
          if (!line.startsWith('data:')) return
          const data = line.slice(5).trim()
          if (!data || data === '[DONE]') return
          try {
            const chunk = JSON.parse(data) as OvhStreamChunk
            if (chunk.error?.message) {
              onEvent(errorEvent(chunk.error.message))
              return
            }
            const text = chunk.choices?.[0]?.delta?.content
            if (text) {
              receivedText = true
              onEvent({ type: 'text-delta', text })
            }
          } catch {
            // Incomplete SSE frame; the remainder arrives with the next read.
          }
        }

        for (;;) {
          const { done, value } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() ?? ''
          for (const line of lines) processLine(line)
        }
        if (buffer.trim()) processLine(buffer)

        if (!receivedText) {
          onEvent(errorEvent('OVH returned no displayable text.'))
          return
        }
        onEvent({ type: 'done' })
      } catch (error) {
        if (signal?.aborted) return
        onEvent(errorEvent(error instanceof Error ? error.message : String(error)))
      }
    },
  }
}
