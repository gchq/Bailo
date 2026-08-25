import Home from '@mui/icons-material/Home'
import { Breadcrumbs, Link, Stack, Typography } from '@mui/material'
import { ReactElement, ReactNode, useCallback, useEffect, useMemo, useState } from 'react'
import Paginate, { SortingProperty } from 'src/common/Paginate'
import { FileInterface } from 'types/types'
import {
  buildFileTree,
  buildFolderSearchableText,
  type FileTreeNode,
  getBreadcrumbParts,
  getNodeAtPath,
} from 'utils/fileTreeUtils'

export type BrowseListItem = {
  key: string
  name: string
  searchableText: string
  size: number
  createdAt: Date
  updatedAt: Date
} & ({ kind: 'folder'; node: FileTreeNode } | { kind: 'file'; file: FileInterface })

interface FolderNavigableListProps {
  files: FileInterface[]
  children: (props: { data: BrowseListItem; onNavigate: (path: string) => void; searchQuery: string }) => ReactElement
  toolbarActions?: (props: { currentPath: string }) => ReactNode
  onPathChange?: (path: string) => void
  emptyListText?: string
  searchPlaceholderText?: string
  sortingProperties?: SortingProperty<BrowseListItem>[]
  defaultSortProperty?: keyof BrowseListItem
}

const DEFAULT_SORT_PROPERTIES: SortingProperty<BrowseListItem>[] = [
  { value: 'name', title: 'Name', iconKind: 'text' },
  { value: 'size', title: 'Size', iconKind: 'size' },
  { value: 'createdAt', title: 'Date uploaded', iconKind: 'date' },
  { value: 'updatedAt', title: 'Date updated', iconKind: 'date' },
]

export default function FolderNavigableList({
  files,
  children,
  toolbarActions,
  onPathChange,
  emptyListText = 'No files in this folder',
  searchPlaceholderText = 'Search files and folders',
  sortingProperties = DEFAULT_SORT_PROPERTIES,
  defaultSortProperty = 'name',
}: FolderNavigableListProps) {
  const [currentPath, _setCurrentPath] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  const setCurrentPath = useCallback(
    (path: string) => {
      _setCurrentPath(path)
      onPathChange?.(path)
    },
    [onPathChange],
  )

  const tree = useMemo(() => buildFileTree(files), [files])
  const currentNode = useMemo(() => getNodeAtPath(tree, currentPath), [tree, currentPath])
  const breadcrumbs = useMemo(() => getBreadcrumbParts(currentPath), [currentPath])

  useEffect(() => {
    if (currentPath && !getNodeAtPath(tree, currentPath)) {
      setCurrentPath('')
    }
  }, [tree, currentPath, setCurrentPath])

  const browseItems: BrowseListItem[] = useMemo(() => {
    if (!currentNode) {
      return []
    }
    const items: BrowseListItem[] = []
    for (const child of currentNode.children) {
      if (child.isDirectory) {
        items.push({
          key: `folder-${child.fullPath}`,
          kind: 'folder',
          node: child,
          name: child.name,
          searchableText: buildFolderSearchableText(child),
          size: child.totalFileCount,
          createdAt: new Date(0),
          updatedAt: new Date(0),
        })
      } else if (child.file) {
        items.push({
          key: child.file._id,
          kind: 'file',
          file: child.file,
          name: child.file.name,
          searchableText: child.file.name,
          size: child.file.size,
          createdAt: child.file.createdAt,
          updatedAt: child.file.updatedAt,
        })
      }
    }
    return items
  }, [currentNode])

  return (
    <Stack spacing={0} sx={{ width: '100%' }}>
      <Stack direction='row' spacing={1} sx={{ alignItems: 'center', justifyContent: 'space-between', px: 2, pt: 1 }}>
        <Breadcrumbs sx={{ flex: 1 }}>
          <Link
            component='button'
            underline='hover'
            onClick={() => setCurrentPath('')}
            sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
          >
            <Home fontSize='small' />
            Root
          </Link>
          {breadcrumbs.map((crumb, i) => {
            const isLast = i === breadcrumbs.length - 1
            return isLast ? (
              <Typography key={crumb.fullPath} fontWeight='bold'>
                {crumb.name}
              </Typography>
            ) : (
              <Link
                key={crumb.fullPath}
                component='button'
                underline='hover'
                onClick={() => setCurrentPath(crumb.fullPath)}
              >
                {crumb.name}
              </Link>
            )
          })}
        </Breadcrumbs>
        {toolbarActions && (
          <Stack direction='row' spacing={1} sx={{ alignItems: 'center' }}>
            {toolbarActions({ currentPath })}
          </Stack>
        )}
      </Stack>
      <Paginate
        list={browseItems}
        emptyListText={emptyListText}
        searchFilterProperty='searchableText'
        onSearchChange={setSearchQuery}
        sortingProperties={sortingProperties}
        defaultSortProperty={defaultSortProperty}
        searchPlaceholderText={searchPlaceholderText}
      >
        {({ data }) => children({ data, onNavigate: setCurrentPath, searchQuery })}
      </Paginate>
    </Stack>
  )
}
