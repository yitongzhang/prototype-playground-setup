import { useEffect, useState } from 'react'
import { DataViewerPage } from './DataViewerPage'
import { DesignSystemPage } from './DesignSystemPage'
import { IndexPage } from './IndexPage'
import { PrototypeChrome } from './PrototypeChrome'
import { prototypes } from './registry'
import { ToolChrome } from './ToolChrome'

function readSlug(): string {
  return decodeURIComponent(window.location.hash.replace(/^#\/?/, ''))
}

function useHashSlug(): string {
  const [slug, setSlug] = useState(readSlug)
  useEffect(() => {
    const onChange = () => setSlug(readSlug())
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return slug
}

export function App() {
  const slug = useHashSlug()
  if (slug === 'tools/design-system') {
    return (
      <ToolChrome tool="design-system">
        <DesignSystemPage />
      </ToolChrome>
    )
  }
  if (slug === 'tools/data') {
    return (
      <ToolChrome tool="data">
        <DataViewerPage />
      </ToolChrome>
    )
  }
  const entry = prototypes.find((p) => p.slug === slug)
  if (!entry) return <IndexPage missingSlug={slug || undefined} />
  return <PrototypeChrome entry={entry} />
}
