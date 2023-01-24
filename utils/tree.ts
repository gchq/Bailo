import { MinimalEntry } from '../types/interfaces'

export interface RenderTree {
  id: string
  name: string
  children?: RenderTree[]
}

export function filesArrayToTree(files: Array<MinimalEntry>): RenderTree {
  const tree: RenderTree = {
    id: 'code/',
    name: 'Code',
    children: [],
  }

  for (const file of files) {
    // Ignore folders
    if (file.fileName.endsWith('/')) continue

    const parts = file.fileName.split('/')
    let leaf = tree
    let currentId = ''

    for (const part of parts) {
      const isLastPart = part === parts[parts.length - 1]
      currentId += part + (isLastPart ? '' : '/')

      let child = leaf.children?.find((node) => node.name === part)
      if (!child) {
        if (!leaf.children) leaf.children = []

        leaf.children.push({
          id: currentId,
          name: part,
          ...(isLastPart ? {} : { children: [] }),
        })
        child = leaf.children[leaf.children.length - 1]
      }

      leaf = child
    }
  }

  return tree
}
