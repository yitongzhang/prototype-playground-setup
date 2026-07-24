import type { ReactNode } from 'react'

export type ShellDestination = 'prototypes' | 'design-system' | 'data'

const destinations: Array<{ id: ShellDestination; href: string; label: string }> = [
  { id: 'prototypes', href: '#/', label: 'Prototypes' },
  { id: 'design-system', href: '#/tools/design-system', label: 'Design system' },
  { id: 'data', href: '#/tools/data', label: 'Fake data' },
]

/**
 * The permanent top bar, shared by every route: index, prototypes, and tool
 * views. Neutral pg-* chrome — never themed per app. `context` is the
 * center slot (current prototype/tool name), `actions` the right slot
 * (prev/next controls).
 */
export function ShellHeader({
  active,
  context,
  actions,
}: {
  active: ShellDestination
  context?: ReactNode
  actions?: ReactNode
}) {
  return (
    <header className="pg-shell-header">
      <div className="pg-shell-start">
        <a className="pg-shell-brand" href="#/">
          {{APP_NAME}} playground
        </a>
        <nav className="pg-shell-main-nav" aria-label="Playground">
          {destinations.map((destination) => (
            <a
              aria-current={active === destination.id ? 'page' : undefined}
              href={destination.href}
              key={destination.id}
            >
              {destination.label}
            </a>
          ))}
        </nav>
      </div>
      <div className="pg-shell-context">{context}</div>
      <div className="pg-shell-end">{actions}</div>
    </header>
  )
}
