import type { ReactNode } from 'react'
import { ShellHeader, type ShellDestination } from './ShellHeader'

type ShellTool = Extract<ShellDestination, 'design-system' | 'data'>

const toolNames: Record<ShellTool, string> = {
  'design-system': 'Design system',
  data: 'Fake data viewer',
}

export function ToolChrome({ tool, children }: { tool: ShellTool; children: ReactNode }) {
  return (
    <div className="pg-chrome">
      <ShellHeader
        active={tool}
        context={
          <div className="pg-shell-current">
            <strong>{toolNames[tool]}</strong>
            <span className="pg-tool-badge">playground tool</span>
          </div>
        }
      />
      <main className="pg-tool-stage">{children}</main>
    </div>
  )
}
