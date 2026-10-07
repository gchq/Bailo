import { RuleType } from 'markdown-to-jsx'
import { alignSequence, diffText } from 'src/common/InlineDiff/diffEngine'
import { ASTNode, getMediaKind, MarkdownAST } from 'utils/markdownUtils'

export type RichDiff =
  | { kind: 'equal'; node: ASTNode }
  | { kind: 'insert'; node: ASTNode }
  | { kind: 'delete'; node: ASTNode }
  | { kind: 'text'; node?: ASTNode; chunks: ReturnType<typeof diffText> }
  | { kind: 'container'; node: ASTNode; children: RichDiff[] }
  | { kind: 'list'; node: ASTNode; items: RichDiff[][] }
  | { kind: 'table'; node: ASTNode; header: RichDiff[][]; cells: RichDiff[][][] }
  | { kind: 'replace'; from: ASTNode; to: ASTNode }

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
      return `table:${node.header.length}:${node.align.join(',')}`
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

function sameTableShape(
  from: Extract<ASTNode, { type: typeof RuleType.table }>,
  to: Extract<ASTNode, { type: typeof RuleType.table }>,
): boolean {
  return (
    from.header.length === to.header.length &&
    from.cells.length === to.cells.length &&
    from.cells.every((row, index) => row.length === to.cells[index].length) &&
    JSON.stringify(from.align) === JSON.stringify(to.align)
  )
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

    if (edit.from.type === RuleType.table && edit.to.type === RuleType.table && sameTableShape(edit.from, edit.to)) {
      const fromTable = edit.from
      const toTable = edit.to

      return [
        {
          kind: 'table',
          node: toTable,
          header: fromTable.header.map((cell, index) => diffMarkdown(cell, toTable.header[index])),
          cells: fromTable.cells.map((row, rowIndex) =>
            row.map((cell, cellIndex) => diffMarkdown(cell, toTable.cells[rowIndex][cellIndex])),
          ),
        },
      ]
    }

    const fromChildren = diffableChildren(edit.from)
    const toChildren = diffableChildren(edit.to)

    if (fromChildren && toChildren) {
      return [{ kind: 'container', node: edit.to, children: diffMarkdown(fromChildren, toChildren) }]
    }

    return [{ kind: 'replace', from: edit.from, to: edit.to }]
  })
}
