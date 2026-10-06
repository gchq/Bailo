import { MarkdownToJSX, parser, RuleType } from 'markdown-to-jsx'
import { astToMarkdown } from 'markdown-to-jsx/markdown'

type ASTNode = MarkdownToJSX.ASTNode

function getVisibleLength(nodes: ASTNode[]): number {
  return nodes.reduce((length, node) => {
    switch (node.type) {
      case RuleType.text:
      case RuleType.codeInline:
      case RuleType.codeBlock:
      case RuleType.footnoteReference:
        return length + node.text.length
      case RuleType.blockQuote:
      case RuleType.heading:
      case RuleType.link:
      case RuleType.paragraph:
      case RuleType.textFormatted:
        return length + getVisibleLength(node.children)
      case RuleType.htmlBlock:
        if (node.tag === 'script' || node.tag === 'style') {
          return length
        }
        return length + getVisibleLength(node.children || [])
      case RuleType.orderedList:
      case RuleType.unorderedList:
        return length + node.items.reduce((itemLength, item) => itemLength + getVisibleLength(item), 0)
      case RuleType.table:
        return (
          length +
          node.header.reduce((headerLength, cell) => headerLength + getVisibleLength(cell), 0) +
          node.cells.reduce(
            (rowsLength, row) => rowsLength + row.reduce((rowLength, cell) => rowLength + getVisibleLength(cell), 0),
            0,
          )
        )
      default:
        return length
    }
  }, 0)
}

function truncateText(text: string, remaining: number): { remaining: number; text: string } {
  if (text.length < remaining) {
    return { remaining: remaining - text.length, text }
  }

  return { remaining: 0, text: `${text.slice(0, remaining).trimEnd()}...` }
}

function truncateNodes(nodes: ASTNode[], maxLength: number): ASTNode[] {
  let remaining = maxLength

  const truncateChildren = (children: ASTNode[]) => {
    const truncatedChildren: ASTNode[] = []

    for (const child of children) {
      if (remaining === 0) {
        break
      }

      const truncatedChild = truncateNode(child)
      if (truncatedChild) {
        truncatedChildren.push(truncatedChild)
      }
    }

    return truncatedChildren
  }

  const truncateItems = (items: ASTNode[][]) => {
    const truncatedItems: ASTNode[][] = []

    for (const item of items) {
      if (remaining === 0) {
        break
      }

      const truncatedItem = truncateChildren(item)
      if (truncatedItem.length > 0) {
        truncatedItems.push(truncatedItem)
      }
    }

    return truncatedItems
  }

  const truncateNode = (node: ASTNode): ASTNode | null => {
    switch (node.type) {
      case RuleType.text:
      case RuleType.codeInline:
      case RuleType.codeBlock:
      case RuleType.footnoteReference: {
        const truncated = truncateText(node.text, remaining)
        remaining = truncated.remaining
        return { ...node, text: truncated.text }
      }
      case RuleType.blockQuote:
      case RuleType.heading:
      case RuleType.link:
      case RuleType.paragraph:
      case RuleType.textFormatted: {
        const children = truncateChildren(node.children)
        return children.length > 0 ? { ...node, children } : null
      }
      case RuleType.htmlBlock: {
        if (node.tag === 'script' || node.tag === 'style') {
          return null
        }

        const children = truncateChildren(node.children || [])
        return children.length > 0 ? { ...node, children } : null
      }
      case RuleType.orderedList:
      case RuleType.unorderedList: {
        const items = truncateItems(node.items)
        return items.length > 0 ? { ...node, items } : null
      }
      case RuleType.table: {
        const header = node.header.map(truncateChildren).filter((cell) => cell.length > 0)
        const cells = node.cells
          .map((row) => row.map(truncateChildren).filter((cell) => cell.length > 0))
          .filter((row) => row.length > 0)

        return header.length > 0 || cells.length > 0 ? { ...node, header, cells } : null
      }
      case RuleType.image:
      default:
        return node
    }
  }

  if (maxLength === 0) {
    return [{ type: RuleType.text, text: '...' }]
  }

  return truncateChildren(nodes)
}

export type MarkdownPreview = {
  markdown: string
  truncated: boolean
}

export function getMarkdownPreview(markdown: string, maxLength: number): MarkdownPreview {
  const ast = parser(markdown)
  const normalisedMaxLength = Math.max(0, maxLength)
  const truncated = getVisibleLength(ast) > normalisedMaxLength

  if (!truncated) {
    return { markdown, truncated: false }
  }

  return {
    markdown: astToMarkdown(truncateNodes(ast, normalisedMaxLength)),
    truncated: true,
  }
}
