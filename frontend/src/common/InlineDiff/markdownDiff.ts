import { RuleType } from 'markdown-to-jsx'
import { alignSequence, diffText } from 'src/common/InlineDiff/diffEngine'
import { alignByKey, alignByPosition, alignKeyedRows, IndexPair } from 'src/common/InlineDiff/rowAlignment'
import { ASTNode, getMediaKind, MarkdownAST } from 'utils/markdownUtils'

export type RichDiff =
  | { kind: 'equal'; node: ASTNode }
  | { kind: 'insert'; node: ASTNode }
  | { kind: 'delete'; node: ASTNode }
  | { kind: 'text'; node?: ASTNode; chunks: ReturnType<typeof diffText> }
  | { kind: 'container'; node: ASTNode; children: RichDiff[] }
  | { kind: 'list'; node: ASTNode; items: RichDiff[][] }
  | { kind: 'table'; node: ASTNode; align: TableAlignment[]; header: RichDiff[][]; cells: RichDiff[][][] }
  | { kind: 'replace'; from: ASTNode; to: ASTNode }

type TableAlignment = 'left' | 'right' | 'center' | null | undefined

function isNonVisualNode(node: ASTNode): boolean {
  return (
    node.type === RuleType.ref ||
    node.type === RuleType.refCollection ||
    node.type === RuleType.footnote ||
    node.type === RuleType.frontmatter ||
    node.type === RuleType.htmlComment
  )
}

function isLayoutOnlyNode(node: ASTNode): boolean {
  return node.type === RuleType.breakLine || node.type === RuleType.breakThematic
}

// Compare the parsed nodes directly - converting back to Markdown drops raw HTML, so changed HTML would look equal
function identical(from: ASTNode | ASTNode[], to: ASTNode | ASTNode[]): boolean {
  return JSON.stringify(from) === JSON.stringify(to)
}

/** Nodes of the same kind are aligned with each other, then diffed or replaced. */
function nodeKind(node: ASTNode): string {
  // Media of the same kind pair up regardless of source, so a changed file is shown as a replacement
  const mediaKind = getMediaKind(node)
  if (mediaKind) {
    return `media:${mediaKind}`
  }

  switch (node.type) {
    case RuleType.heading:
      return `heading:${node.level}`
    case RuleType.codeBlock:
      return `code:${node.lang ?? ''}`
    case RuleType.textFormatted:
      return `formatted:${node.tag}`
    case RuleType.link:
      return `link:${node.target ?? ''}:${node.title ?? ''}`
    case RuleType.orderedList:
      return `ordered-list:${node.start ?? 1}`
    case RuleType.table:
      return 'table'
    case RuleType.htmlBlock:
      return `html:${node.tag}:${JSON.stringify(node.attrs ?? {})}:${node._verbatim ? 'verbatim' : ''}`
    case RuleType.htmlSelfClosing:
      return `html-self-closing:${node.tag}:${JSON.stringify(node.attrs ?? {})}`
    case RuleType.gfmTask:
      return `task:${node.completed}`
    case RuleType.footnoteReference:
      return `footnote-reference:${node.target}`
    default:
      return String(node.type)
  }
}

function canAlign(from: ASTNode, to: ASTNode): boolean {
  return nodeKind(from) === nodeKind(to)
}

function canAlignListItem(from: ASTNode[], to: ASTNode[]): boolean {
  return from.some((fromNode) => to.some((toNode) => canAlign(fromNode, toNode))) || identical(from, to)
}

function diffListItems(from: ASTNode[][], to: ASTNode[][]): RichDiff[][] {
  return alignSequence(from, to, canAlignListItem).map((edit) => {
    if (edit.operation === 'insert') {
      return edit.to.map((node) => ({ kind: 'insert' as const, node }))
    }

    if (edit.operation === 'delete') {
      return edit.from.map((node) => ({ kind: 'delete' as const, node }))
    }

    return diffMarkdown(edit.from, edit.to)
  })
}

type TableNode = Extract<ASTNode, { type: typeof RuleType.table }>

function cellKey(cell: ASTNode[] | undefined): string {
  return JSON.stringify(cell ?? []).toLowerCase()
}

function sharesCell(from: ASTNode[][], to: ASTNode[][]): boolean {
  const emptyKey = cellKey([])
  const fromKeys = new Set(from.map(cellKey))

  return to.map(cellKey).some((key) => key !== emptyKey && fromKeys.has(key))
}

/** Columns are matched by header. Returns undefined when the tables share no columns and cannot be compared. */
function alignColumns(from: TableNode, to: TableNode): IndexPair[] | undefined {
  const getColumn = (table: TableNode, index: number) => table.cells.map((row) => row[index])
  const columns = alignByKey(from.header.map(cellKey), to.header.map(cellKey), (fromIndex, toIndex) =>
    sharesCell(getColumn(from, fromIndex), getColumn(to, toIndex)),
  )

  if (columns.some((column) => column.from !== undefined && column.to !== undefined)) {
    return columns
  }

  return from.header.length === to.header.length ? alignByPosition(from.header.length, to.header.length) : undefined
}

/** Rows are matched by their first cell when it uniquely identifies each row, otherwise by position. */
function alignRows(from: TableNode, to: TableNode): IndexPair[] {
  return alignKeyedRows(
    from.cells.map((row) => cellKey(row[0])),
    to.cells.map((row) => cellKey(row[0])),
    (fromIndex, toIndex) => sharesCell(from.cells[fromIndex], to.cells[toIndex]),
  )
}

function diffTableCell(from: ASTNode[] | undefined, to: ASTNode[] | undefined): RichDiff[] {
  if (!from) {
    return (to ?? []).map((node) => ({ kind: 'insert', node }))
  }

  if (!to) {
    return from.map((node) => ({ kind: 'delete', node }))
  }

  return diffMarkdown(from, to)
}

function diffTable(from: TableNode, to: TableNode): RichDiff | undefined {
  const columns = alignColumns(from, to)

  if (!columns) {
    return undefined
  }

  const getCell = (cells: ASTNode[][][], row: number | undefined, column: number | undefined) =>
    row === undefined || column === undefined ? undefined : cells[row]?.[column]

  return {
    kind: 'table',
    node: to,
    align: columns.map((column) => (column.to === undefined ? from.align[column.from!] : to.align[column.to])),
    header: columns.map((column) =>
      diffTableCell(
        column.from === undefined ? undefined : from.header[column.from],
        column.to === undefined ? undefined : to.header[column.to],
      ),
    ),
    cells: alignRows(from, to).map((row) =>
      columns.map((column) =>
        diffTableCell(getCell(from.cells, row.from, column.from), getCell(to.cells, row.to, column.to)),
      ),
    ),
  }
}

/** Returns the children of containers whose content can be diffed in place, keeping the container itself. */
function diffableChildren(node: ASTNode): ASTNode[] | undefined {
  // Media is replaced as a whole - diffing inside a <video> would only compare its <source> tags
  if (getMediaKind(node)) {
    return undefined
  }

  switch (node.type) {
    case RuleType.paragraph:
    case RuleType.heading:
    case RuleType.blockQuote:
    case RuleType.textFormatted:
    case RuleType.link:
      return node.children
    case RuleType.htmlBlock:
      return node._verbatim ? undefined : node.children
    default:
      return undefined
  }
}

export function diffMarkdown(from: MarkdownAST, to: MarkdownAST): RichDiff[] {
  return alignSequence(from, to, canAlign).flatMap<RichDiff>((edit) => {
    if (edit.operation !== 'equal') {
      const node = edit.operation === 'insert' ? edit.to : edit.from
      return isNonVisualNode(node) || isLayoutOnlyNode(node) ? [] : [{ kind: edit.operation, node }]
    }

    if (isNonVisualNode(edit.to)) {
      return []
    }

    if (identical(edit.from, edit.to)) {
      return [{ kind: 'equal', node: edit.to }]
    }

    if (edit.from.type === RuleType.text && edit.to.type === RuleType.text) {
      return [{ kind: 'text', chunks: diffText(edit.from.text, edit.to.text) }]
    }

    if (edit.from.type === RuleType.codeInline && edit.to.type === RuleType.codeInline) {
      return [{ kind: 'text', node: edit.to, chunks: diffText(edit.from.text, edit.to.text) }]
    }

    if (
      (edit.from.type === RuleType.orderedList || edit.from.type === RuleType.unorderedList) &&
      (edit.to.type === RuleType.orderedList || edit.to.type === RuleType.unorderedList)
    ) {
      return [{ kind: 'list', node: edit.to, items: diffListItems(edit.from.items, edit.to.items) }]
    }

    if (edit.from.type === RuleType.table && edit.to.type === RuleType.table) {
      const table = diffTable(edit.from, edit.to)
      if (table) {
        return [table]
      }
    }

    const fromChildren = diffableChildren(edit.from)
    const toChildren = diffableChildren(edit.to)

    if (fromChildren && toChildren) {
      return [{ kind: 'container', node: edit.to, children: diffMarkdown(fromChildren, toChildren) }]
    }

    return [{ kind: 'replace', from: edit.from, to: edit.to }]
  })
}
