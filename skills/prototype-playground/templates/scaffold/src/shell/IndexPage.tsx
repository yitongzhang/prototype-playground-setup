import type { PrototypeEntry } from './registry'
import { prototypes } from './registry'
import { ShellHeader } from './ShellHeader'

function Card({ entry }: { entry: PrototypeEntry }) {
  return (
    <a className="pg-card" href={`#/${entry.slug}`}>
      <div className="pg-card-thumb">
        {entry.thumbnail ? (
          <img src={entry.thumbnail} alt="" />
        ) : (
          <span className="pg-card-thumb-empty">No preview</span>
        )}
      </div>
      <div className="pg-card-body">
        <div className="pg-card-title">
          <span className="pg-card-name">{entry.name}</span>
          {entry.kind === 'master' && <span className="pg-badge">master</span>}
        </div>
        <p className="pg-card-desc">{entry.description}</p>
        <span className="pg-card-date">{entry.createdAt}</span>
      </div>
    </a>
  )
}

function Section({ title, entries, empty }: { title: string; entries: PrototypeEntry[]; empty?: string }) {
  return (
    <section className="pg-section">
      <h2>{title}</h2>
      {entries.length === 0 ? (
        <p className="pg-empty">{empty}</p>
      ) : (
        <div className="pg-grid">
          {entries.map((e) => (
            <Card key={e.slug} entry={e} />
          ))}
        </div>
      )}
    </section>
  )
}

export function IndexPage({ missingSlug }: { missingSlug?: string }) {
  return (
    <div className="pg-shell-page">
      <ShellHeader active="prototypes" />
      <main className="pg-index">
        <header className="pg-index-header">
          <h1>{{APP_NAME}} playground</h1>
          <span className="pg-count">
            {prototypes.length} prototype{prototypes.length === 1 ? '' : 's'}
          </span>
        </header>
        {missingSlug && <p className="pg-warning">No prototype named “{missingSlug}”.</p>}
        <Section title="Master" entries={prototypes.filter((p) => p.kind === 'master')} />
        <Section
          title="Iterations"
          entries={prototypes.filter((p) => p.kind === 'iteration')}
          empty="No iterations yet — copy src/prototypes/master/ to src/prototypes/<slug>/ and register it in src/shell/registry.ts."
        />
      </main>
    </div>
  )
}
