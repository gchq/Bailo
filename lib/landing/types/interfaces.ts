export type DocHeading = {
  title: string
  slug: string
  hasIndex: boolean
  children: DocFileOrHeading[]
  priority: number
}

export type DocFile = {
  title: string
  slug: string
  priority: number
}

export type DocFileOrHeading = DocHeading | DocFile

export type DocsMenuContent = DocFileOrHeading[]
