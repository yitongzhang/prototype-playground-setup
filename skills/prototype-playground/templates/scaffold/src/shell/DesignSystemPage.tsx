import tokensSource from '../design-system/tokens.css?raw'

/**
 * Living design-system catalog, permanently reachable at #/tools/design-system.
 *
 * The token sections render automatically by parsing the custom properties in
 * src/design-system/tokens.css — they stay current as extraction fills that
 * file in. The "Components" section is manual: during Phase 4/6, extend it
 * with demos of each extracted core component (buttons, badges, fields,
 * cards…) so the catalog shows the real primitives, not just their tokens.
 * Page chrome stays neutral pg-*; the specimens themselves are the product's.
 */

interface Token {
  name: string
  value: string
}

function parseTokens(css: string): Token[] {
  const withoutComments = css.replace(/\/\*[\s\S]*?\*\//g, '')
  return [...withoutComments.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)].map((match) => ({
    name: match[1],
    value: match[2].trim(),
  }))
}

const groups: Array<{ title: string; description: string; prefixes: string[]; swatch?: boolean }> = [
  { title: 'Color', description: 'Semantic color tokens.', prefixes: ['--color-'], swatch: true },
  { title: 'Typography', description: 'Font families, sizes, weights.', prefixes: ['--font-', '--text-', '--leading-', '--tracking-'] },
  { title: 'Spacing & radius', description: 'Layout rhythm and corner rounding.', prefixes: ['--spacing-', '--radius-'] },
  { title: 'Effects', description: 'Shadows, blurs, animations.', prefixes: ['--shadow-', '--blur-', '--animate-', '--ease-'] },
]

function Section({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <section className="pg-catalog-section">
      <div className="pg-catalog-heading">
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      <div>{children}</div>
    </section>
  )
}

export function DesignSystemPage() {
  const tokens = parseTokens(tokensSource)
  const grouped = groups
    .map((group) => ({
      ...group,
      tokens: tokens.filter((t) => group.prefixes.some((p) => t.name.startsWith(p))),
    }))
    .filter((group) => group.tokens.length > 0)
  const claimed = new Set(grouped.flatMap((g) => g.tokens.map((t) => t.name)))
  const other = tokens.filter((t) => !claimed.has(t.name))

  return (
    <div className="pg-tool-page">
      <header className="pg-tool-hero">
        <p className="pg-eyebrow">Extracted foundations</p>
        <h1>Design system</h1>
        <p>
          The shared visual language every prototype builds from. Token sections below read
          live from <code>src/design-system/tokens.css</code>; changes there propagate to every
          prototype and to this page.
        </p>
      </header>

      {tokens.length === 0 && (
        <p className="pg-empty">
          No tokens extracted yet — the design-system extraction step fills
          src/design-system/tokens.css, and this catalog populates itself.
        </p>
      )}

      {grouped.map((group) => (
        <Section description={group.description} key={group.title} title={group.title}>
          {group.swatch ? (
            <div className="pg-swatches">
              {/* Painted with the parsed literal value, not var(): Tailwind v4
                  only emits @theme variables that some utility actually uses. */}
              {group.tokens.map((token) => (
                <div className="pg-swatch" key={token.name}>
                  <div className="pg-swatch-color" style={{ background: token.value }} />
                  <strong>{token.name.replace('--color-', '')}</strong>
                  <span>{token.value}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="pg-token-list">
              {group.tokens.map((token) => (
                <div className="pg-token-row" key={token.name}>
                  <code>{token.name}</code>
                  <span>{token.value}</span>
                </div>
              ))}
            </div>
          )}
        </Section>
      ))}

      {other.length > 0 && (
        <Section description="Tokens outside the standard groups." title="Other">
          <div className="pg-token-list">
            {other.map((token) => (
              <div className="pg-token-row" key={token.name}>
                <code>{token.name}</code>
                <span>{token.value}</span>
              </div>
            ))}
          </div>
        </Section>
      )}

      <Section
        description="Core components extracted from the source app."
        title="Components"
      >
        {/* Extend during extraction: render each core component here with its
            variants and states (e.g. <Button>, <Badge tone=…>, fields, cards)
            so this page stays the one place to see the whole system. */}
        <p className="pg-empty">
          No component demos yet — as core components are extracted into
          src/design-system/components/, add a demo row for each one here.
        </p>
      </Section>
    </div>
  )
}
