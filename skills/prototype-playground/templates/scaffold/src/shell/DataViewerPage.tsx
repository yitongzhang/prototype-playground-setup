import { useMemo, useState } from 'react'
import type { Store } from '../data/store'

/**
 * Fake-data viewer, permanently reachable at #/tools/data. Browses the live
 * in-memory store shared by every prototype: collections in the sidebar,
 * searchable records, and a field-by-field inspector.
 *
 * It discovers the store lazily via import.meta.glob so the fresh scaffold
 * (which has no src/data/index.ts yet) still builds — once Phase 5 creates
 * that module exporting `db`, this page lights up with no further wiring.
 */
type StoreState = Record<string, unknown>
type RecordValue = Record<string, unknown>

const dataModules = import.meta.glob('../data/index.ts', { eager: true }) as Record<
  string,
  { db?: Store<StoreState> }
>
const db = Object.values(dataModules)[0]?.db

function toRecords(value: unknown): RecordValue[] {
  const items = Array.isArray(value) ? value : value != null ? [value] : []
  return items.filter((item): item is RecordValue => typeof item === 'object' && item !== null)
}

function labelForRecord(record: RecordValue): string {
  const label = record.title ?? record.name ?? record.slug ?? record.id
  return typeof label === 'string' ? label : 'Untitled record'
}

function idForRecord(record: RecordValue, index: number): string {
  const id = record.id ?? record.slug
  return typeof id === 'string' ? id : String(index)
}

function matchesQuery(record: RecordValue, query: string): boolean {
  return JSON.stringify(record).toLocaleLowerCase().includes(query.toLocaleLowerCase())
}

export function DataViewerPage() {
  if (!db) {
    return (
      <div className="pg-tool-page">
        <header className="pg-tool-hero">
          <p className="pg-eyebrow">Fixture collections</p>
          <h1>Fake data</h1>
          <p>
            No data layer yet — the fake-data step creates src/data/index.ts exporting the
            fixture store as <code>db</code>, and this viewer picks it up automatically.
          </p>
        </header>
      </div>
    )
  }
  return <DataViewer store={db} />
}

function DataViewer({ store }: { store: Store<StoreState> }) {
  const data = store.useStore((state) => state)
  const collectionNames = Object.keys(data)
  const [collection, setCollection] = useState(collectionNames[0] ?? '')
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState<string | undefined>()
  const records = toRecords(data[collection])
  const filteredRecords = useMemo(
    () => records.filter((record) => matchesQuery(record, query)),
    [query, records],
  )
  const selectedRecord =
    filteredRecords.find((record, index) => idForRecord(record, index) === selectedId) ??
    filteredRecords[0]

  function chooseCollection(name: string) {
    setCollection(name)
    setSelectedId(undefined)
    setQuery('')
  }

  return (
    <div className="pg-data-viewer">
      <aside className="pg-data-sidebar">
        <div className="pg-data-sidebar-heading">
          <p className="pg-eyebrow">Fixture collections</p>
          <h1>Fake data</h1>
          <p>Live in-memory state shared by every prototype.</p>
        </div>
        <nav aria-label="Fake data collections">
          {collectionNames.map((name) => (
            <button
              className={collection === name ? 'is-active' : undefined}
              key={name}
              onClick={() => chooseCollection(name)}
              type="button"
            >
              <span>{name}</span>
              <span>{toRecords(data[name]).length}</span>
            </button>
          ))}
        </nav>
        <div className="pg-data-summary">
          <span>Total records</span>
          <strong>
            {collectionNames.reduce((total, name) => total + toRecords(data[name]).length, 0)}
          </strong>
        </div>
      </aside>

      <section className="pg-data-main">
        <header className="pg-data-toolbar">
          <div>
            <h2>{collection}</h2>
            <span>
              {records.length} record{records.length === 1 ? '' : 's'}
            </span>
          </div>
          <label className="pg-data-search">
            <span className="pg-visually-hidden">Search {collection}</span>
            <input
              onChange={(event) => {
                setQuery(event.target.value)
                setSelectedId(undefined)
              }}
              placeholder={`Search ${collection}…`}
              type="search"
              value={query}
            />
          </label>
        </header>

        <div className="pg-data-workspace">
          <div className="pg-data-records" role="list" aria-label={`${collection} records`}>
            {filteredRecords.map((record, index) => {
              const id = idForRecord(record, index)
              const isSelected = selectedRecord === record
              return (
                <button
                  aria-pressed={isSelected}
                  className={isSelected ? 'is-active' : undefined}
                  key={id}
                  onClick={() => setSelectedId(id)}
                  role="listitem"
                  type="button"
                >
                  <strong>{labelForRecord(record)}</strong>
                  <span>{id}</span>
                </button>
              )
            })}
            {filteredRecords.length === 0 && (
              <div className="pg-data-empty">No records match “{query}”.</div>
            )}
          </div>

          <article className="pg-data-inspector">
            {selectedRecord ? (
              <>
                <header>
                  <div>
                    <p className="pg-eyebrow">Selected record</p>
                    <h3>{labelForRecord(selectedRecord)}</h3>
                  </div>
                  <span>{collection}</span>
                </header>
                <div className="pg-property-list">
                  {Object.entries(selectedRecord).map(([key, value]) => (
                    <div className="pg-property" key={key}>
                      <span>{key}</span>
                      <code>
                        {typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
                      </code>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="pg-data-empty">Select a collection with records to inspect it.</div>
            )}
          </article>
        </div>
      </section>
    </div>
  )
}
