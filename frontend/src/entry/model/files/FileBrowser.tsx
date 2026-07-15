import AccountTree from '@mui/icons-material/AccountTree'
import Folder from '@mui/icons-material/Folder'
import Home from '@mui/icons-material/Home'
import ViewList from '@mui/icons-material/ViewList'
import {
  Badge,
  Box,
  Breadcrumbs,
  Link,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material'
import { useMemo, useState } from 'react'
import Paginate from 'src/common/Paginate'
import FileDisplay, { MutateFiles, MutateReleases } from 'src/entry/model/files/FileDisplay'
import { EntryKind, FileInterface, ReleaseInterface } from 'types/types'
import {
  buildFileTree,
  type FileTreeNode,
  getBreadcrumbParts,
  getNodeAtPath,
  hasAnyNestedFiles,
} from 'utils/fileTreeUtils'

type ViewMode = 'flat' | 'folder'

interface FileBrowserProps {
  files: FileInterface[]
  modelId: string
  modelKind?: string
  releases: ReleaseInterface[]
  mutator?: MutateFiles | MutateReleases
  readOnly?: boolean
}

export default function FileBrowser({
  files,
  modelId,
  modelKind,
  releases,
  mutator,
  readOnly = false,
}: FileBrowserProps) {
  const hasNested = useMemo(() => hasAnyNestedFiles(files), [files])
  const [viewMode, setViewMode] = useState<ViewMode>(hasNested ? 'folder' : 'flat')
  const [currentPath, setCurrentPath] = useState('')

  const tree = useMemo(() => buildFileTree(files), [files])

  // Get the directory node at the current browsing path
  const currentNode = useMemo(() => getNodeAtPath(tree, currentPath), [tree, currentPath])
  const breadcrumbs = useMemo(() => getBreadcrumbParts(currentPath), [currentPath])

  // Separate directories and files at the current level, directories first
  const { directories, filesAtLevel } = useMemo(() => {
    if (!currentNode) {
      return { directories: [], filesAtLevel: [] }
    }
    const dirs: FileTreeNode[] = []
    const fileNodes: FileInterface[] = []
    for (const child of currentNode.children) {
      if (child.isDirectory) {
        dirs.push(child)
      } else if (child.file) {
        fileNodes.push(child.file)
      }
    }
    dirs.sort((a, b) => a.name.localeCompare(b.name))
    return { directories: dirs, filesAtLevel: fileNodes }
  }, [currentNode])

  // Reset path when switching to flat view
  const handleViewModeChange = (_: unknown, newMode: ViewMode | null) => {
    if (newMode) {
      setViewMode(newMode)
      if (newMode === 'flat') {
        setCurrentPath('')
      }
    }
  }

  const FlatFileListItem = ({ data }: { data: FileInterface & { key: string } }) => (
    <Box key={data._id} sx={{ width: '100%' }}>
      <Stack spacing={1} sx={{ p: 2 }}>
        <FileDisplay
          showMenuItems={{
            associatedReleases: !readOnly,
            deleteFile: !readOnly && modelKind === EntryKind.MODEL,
            rescanFile: !readOnly,
          }}
          file={data}
          modelId={modelId}
          mutator={mutator}
          releases={releases}
        />
      </Stack>
    </Box>
  )

  // Folder view: show breadcrumbs, directories, then files at current level
  const FolderFileListItem = ({ data }: { data: FileInterface & { key: string } }) => (
    <Box key={data._id} sx={{ width: '100%' }}>
      <Stack spacing={1} sx={{ p: 2 }}>
        <FileDisplay
          showMenuItems={{
            associatedReleases: !readOnly,
            deleteFile: !readOnly && modelKind === EntryKind.MODEL,
            rescanFile: !readOnly,
          }}
          file={data}
          modelId={modelId}
          mutator={mutator}
          releases={releases}
          displayName={data.name.includes('/') ? data.name.split('/').pop() : undefined}
        />
      </Stack>
    </Box>
  )

  return (
    <Stack spacing={1} sx={{ width: '100%' }}>
      {/* Only show the view toggle if there are nested files */}
      {hasNested && (
        <Stack direction='row' sx={{ justifyContent: 'flex-end' }}>
          <ToggleButtonGroup value={viewMode} exclusive onChange={handleViewModeChange} size='small'>
            <ToggleButton value='folder' data-test='folderViewToggle'>
              <Tooltip title='Folder view'>
                <AccountTree fontSize='small' />
              </Tooltip>
            </ToggleButton>
            <ToggleButton value='flat' data-test='flatViewToggle'>
              <Tooltip title='Flat list view'>
                <ViewList fontSize='small' />
              </Tooltip>
            </ToggleButton>
          </ToggleButtonGroup>
        </Stack>
      )}
      {viewMode === 'flat' ? (
        <Paginate
          list={files.map((f) => ({ key: f._id, ...f }))}
          emptyListText='No files found'
          searchFilterProperty='name'
          sortingProperties={[
            { value: 'name', title: 'Name', iconKind: 'text' },
            { value: 'size', title: 'Size', iconKind: 'size' },
            { value: 'createdAt', title: 'Date uploaded', iconKind: 'date' },
            { value: 'updatedAt', title: 'Date updated', iconKind: 'date' },
          ]}
          searchPlaceholderText='Search by file name'
          defaultSortProperty='createdAt'
        >
          {FlatFileListItem}
        </Paginate>
      ) : (
        <>
          {/* Breadcrumb navigation */}
          <Breadcrumbs sx={{ px: 2, py: 1 }}>
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
          {/* Directory entries */}
          {directories.length > 0 && (
            <List disablePadding>
              {directories.map((dir) => (
                <ListItemButton
                  key={dir.fullPath}
                  onClick={() => setCurrentPath(dir.fullPath)}
                  data-test={`folder-${dir.name}`}
                >
                  <ListItemIcon>
                    <Badge badgeContent={dir.totalFileCount} color='primary' max={999}>
                      <Folder color='action' />
                    </Badge>
                  </ListItemIcon>
                  <ListItemText primary={dir.name} />
                </ListItemButton>
              ))}
            </List>
          )}
          {/* Files at current directory level */}
          {filesAtLevel.length > 0 ? (
            <Paginate
              list={filesAtLevel.map((f) => ({ key: f._id, ...f }))}
              emptyListText='No files in this folder'
              searchFilterProperty='name'
              sortingProperties={[
                { value: 'name', title: 'Name', iconKind: 'text' },
                { value: 'size', title: 'Size', iconKind: 'size' },
                { value: 'createdAt', title: 'Date uploaded', iconKind: 'date' },
                { value: 'updatedAt', title: 'Date updated', iconKind: 'date' },
              ]}
              searchPlaceholderText='Search files in this folder'
              defaultSortProperty='name'
            >
              {FolderFileListItem}
            </Paginate>
          ) : (
            directories.length === 0 && (
              <Typography sx={{ px: 2, py: 4, textAlign: 'center' }} color='text.secondary'>
                No files in this folder
              </Typography>
            )
          )}
        </>
      )}
    </Stack>
  )
}
