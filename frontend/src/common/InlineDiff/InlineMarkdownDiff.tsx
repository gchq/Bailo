import { Box, Link } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { MarkdownToJSX, RuleType } from 'markdown-to-jsx'
import { astToJSX } from 'markdown-to-jsx/react'
import { cloneElement, Fragment, isValidElement, ReactNode, useId, useMemo } from 'react'
import { diffText } from 'src/common/InlineDiff/diffEngine'
import DiffMark, { DiffChunks, WholeValueDiff } from 'src/common/InlineDiff/DiffMark'
import { diffMarkdown, RichDiff } from 'src/common/InlineDiff/markdownDiff'
import MarkdownDisplay, { createMarkdownOptions } from 'src/common/MarkdownDisplay'
import { ASTNode, getMediaKind, MarkdownAST, parseMarkdown } from 'utils/markdownUtils'

type RenderContext = {
  footnotes: Map<string, ReturnType<typeof diffText>>
  footnoteId: (label: string) => string
  markdownOptions: Partial<MarkdownToJSX.Options>
}

/** Renders nodes through markdown-to-jsx so its sanitiser, tag filter and overrides are applied. */
function renderNode(node: ASTNode, context: RenderContext): ReactNode {
  return astToJSX([node], context.markdownOptions)
}

function containsMediaChange(entries: RichDiff[]): boolean {
  return entries.some(
    (entry) =>
      (entry.kind === 'replace' && !!getMediaKind(entry.to)) ||
      ((entry.kind === 'insert' || entry.kind === 'delete') && !!getMediaKind(entry.node)),
  )
}

/** Renders the container element itself through markdown-to-jsx, then fills it with the diffed children. */
function renderContainer(node: ASTNode, children: ReactNode, context: RenderContext, entries: RichDiff[]): ReactNode {
  const rendered = astToJSX([{ ...node, children: [] } as ASTNode], context.markdownOptions)
  const element = Array.isArray(rendered) ? rendered[0] : rendered

  if (!isValidElement<{ component?: string }>(element)) {
    return children
  }

  if (node.type === RuleType.htmlBlock) {
    const override = context.markdownOptions.overrides?.[node.tag]
    const expectedType = override && typeof override === 'object' ? override.component : (override ?? node.tag)

    if (element.type !== expectedType) {
      return renderNode(node, context)
    }
  }

  // Media comparisons are rendered as grids, which are not valid inside a <p>
  if (node.type === RuleType.paragraph && containsMediaChange(entries)) {
    return cloneElement(element, { component: 'div' }, children)
  }

  return cloneElement(element, undefined, children)
}

function renderEntries(entries: RichDiff[], context: RenderContext, inline: boolean): ReactNode {
  return entries.map((entry, index) => <Fragment key={index}>{renderRichDiff(entry, context, inline)}</Fragment>)
}

function renderFootnotes(context: RenderContext): ReactNode {
  if (context.footnotes.size === 0) {
    return null
  }

  return (
    <Box component='ol' data-diff-footnotes sx={{ fontSize: '0.875em', mt: 0.5, mb: 0, pl: 4 }}>
      {[...context.footnotes].map(([label, chunks]) => (
        <li key={label} id={context.footnoteId(label)}>
          <DiffChunks chunks={chunks} />
        </li>
      ))}
    </Box>
  )
}

function renderList(entry: Extract<RichDiff, { kind: 'list' }>, context: RenderContext): ReactNode {
  const start = entry.node.type === RuleType.orderedList ? entry.node.start : undefined

  return (
    <Box component={entry.node.type === RuleType.orderedList ? 'ol' : 'ul'} start={start}>
      {entry.items.map((item, index) => (
        <Box component='li' sx={{ mt: 1, wordWrap: 'break-word' }} key={index}>
          {renderEntries(item, context, true)}
        </Box>
      ))}
    </Box>
  )
}

function renderTable(entry: Extract<RichDiff, { kind: 'table' }>, context: RenderContext): ReactNode {
  const align = entry.node.type === RuleType.table ? entry.node.align : []

  return (
    <Box sx={{ overflowX: 'auto' }}>
      <table>
        <thead>
          <tr>
            {entry.header.map((cell, index) => (
              <th key={index} style={{ textAlign: align[index] ?? undefined }}>
                {renderEntries(cell, context, true)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {entry.cells.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} style={{ textAlign: align[cellIndex] ?? undefined }}>
                  {renderEntries(cell, context, true)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </Box>
  )
}

function renderReplacement(from: ASTNode, to: ASTNode, context: RenderContext, inline: boolean): ReactNode {
  const media = getMediaKind(to)

  // nodeKind only pairs media of the same kind, so `from` is the same kind of media as `to`
  if (media) {
    // Audio players are wide and short, so old and new are stacked rather than placed side by side
    const columns = media === 'audio' ? 'minmax(0, 1fr)' : { xs: 'minmax(0, 1fr)', sm: 'repeat(2, minmax(0, 1fr))' }

    return (
      <Box data-diff-media-comparison={media} sx={{ display: 'grid', gridTemplateColumns: columns, gap: 1 }}>
        <DiffMark operation='delete' media={media}>
          {renderNode(from, context)}
        </DiffMark>
        <DiffMark operation='insert' media={media}>
          {renderNode(to, context)}
        </DiffMark>
      </Box>
    )
  }

  const marks = (
    <>
      <DiffMark operation='delete' block={!inline}>
        {renderNode(from, context)}
      </DiffMark>
      <DiffMark operation='insert' block={!inline}>
        {renderNode(to, context)}
      </DiffMark>
    </>
  )

  return inline ? marks : <Box sx={{ display: 'grid', gap: 0.5 }}>{marks}</Box>
}

function renderRichDiff(entry: RichDiff, context: RenderContext, inline = false): ReactNode {
  switch (entry.kind) {
    case 'equal':
      return renderNode(entry.node, context)
    case 'insert':
    case 'delete': {
      const media = getMediaKind(entry.node)
      return (
        <DiffMark operation={entry.kind} block={!inline && !media} media={media}>
          {renderNode(entry.node, context)}
        </DiffMark>
      )
    }
    case 'replace':
      return renderReplacement(entry.from, entry.to, context, inline)
    case 'text': {
      const content = <DiffChunks chunks={entry.chunks} />
      return entry.node?.type === RuleType.codeInline ? <code>{content}</code> : content
    }
    case 'container': {
      const childrenAreInline = entry.node.type !== RuleType.blockQuote
      return renderContainer(
        entry.node,
        renderEntries(entry.children, context, childrenAreInline),
        context,
        entry.children,
      )
    }
    case 'list':
      return renderList(entry, context)
    case 'table':
      return renderTable(entry, context)
  }
}

function getFootnotes(ast: MarkdownAST): Map<string, string> {
  const references = ast.find((node) => node.type === RuleType.refCollection)

  if (references?.type !== RuleType.refCollection) {
    return new Map()
  }

  return new Map(
    Object.entries(references.refs)
      .filter(([label]) => label.startsWith('^'))
      .map(([label, reference]) => [label.slice(1), reference.target]),
  )
}

function diffFootnotes(from: MarkdownAST, to: MarkdownAST): RenderContext['footnotes'] {
  const fromFootnotes = getFootnotes(from)
  const toFootnotes = getFootnotes(to)
  const labels = new Set([...fromFootnotes.keys(), ...toFootnotes.keys()])

  return new Map(
    [...labels].map((label) => [label, diffText(fromFootnotes.get(label) ?? '', toFootnotes.get(label) ?? '')]),
  )
}

function createFootnoteReferenceRule(footnoteId: RenderContext['footnoteId']): MarkdownToJSX.Options['renderRule'] {
  return function renderFootnoteReference(next, node, _renderChildren, state) {
    if (node.type !== RuleType.footnoteReference) {
      return next()
    }

    // Point references at the diffed footnote list, using IDs that are unique to this field
    return (
      <sup key={state.key}>
        <Link href={`#${footnoteId(node.text)}`}>{node.text}</Link>
      </sup>
    )
  }
}

function renderMarkdown(value: string) {
  return <MarkdownDisplay>{value}</MarkdownDisplay>
}

export type InlineMarkdownDiffProps = {
  from?: string
  to?: string
}

export default function InlineMarkdownDiff({ from = '', to = '' }: InlineMarkdownDiffProps) {
  const theme = useTheme()
  const footnotePrefix = useId().replace(/[^a-zA-Z0-9_-]/g, '')

  const result = useMemo(() => {
    if (from === to || !from || !to) {
      return undefined
    }

    const footnoteId = (label: string) => `diff-${footnotePrefix}-footnote-${label.replace(/[^a-zA-Z0-9_-]/g, '-')}`
    const markdownOptions: Partial<MarkdownToJSX.Options> = {
      ...createMarkdownOptions(theme),
      wrapper: null,
      renderRule: createFootnoteReferenceRule(footnoteId),
    }

    const fromAST = parseMarkdown(from)
    const toAST = parseMarkdown(to)
    const context: RenderContext = { footnotes: diffFootnotes(fromAST, toAST), footnoteId, markdownOptions }
    return { diff: diffMarkdown(fromAST, toAST), context }
  }, [from, to, theme, footnotePrefix])

  if (!result) {
    return <WholeValueDiff from={from} to={to} render={renderMarkdown} />
  }

  return (
    <Box data-diff-markdown sx={{ overflowWrap: 'anywhere', wordBreak: 'break-word' }}>
      {renderEntries(result.diff, result.context, false)}
      {renderFootnotes(result.context)}
    </Box>
  )
}
