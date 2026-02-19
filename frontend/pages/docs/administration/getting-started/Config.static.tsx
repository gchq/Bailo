/**
 * Statically generated config docs for lib/landing pages.
 *
 * See also: ./Config.tsx for dynamic implementation.
 */
import { JSX } from 'react'

// @ts-expect-error path correct for lib/landing
import configDocs from '../../../../public/config/config-docs.json'

type Node = {
  name: string
  type?: string
  doc: string
  children?: Node[]
}

function render(nodes: Node[], level = 0): JSX.Element[] {
  return nodes.flatMap((n) => [
    <div key={`${level}-${n.name}`} style={{ marginLeft: level * 16 }}>
      <strong>{n.name}</strong>
      {n.type && <code> {n.type}</code>}
      <div>{n.doc}</div>
    </div>,
    ...(n.children ? render(n.children, level + 1) : []),
  ])
}

export default function ConfigStatic() {
  return <>{render(configDocs.config)}</>
}
