import AccountTree from '@mui/icons-material/AccountTree'
import Delete from '@mui/icons-material/Delete'
import Folder from '@mui/icons-material/Folder'
import Home from '@mui/icons-material/Home'
import MoreVert from '@mui/icons-material/MoreVert'
import ViewList from '@mui/icons-material/ViewList'
import {
  Box,
  Breadcrumbs,
  IconButton,
  Link,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material'
import { deleteEntryFile, useGetModelFiles } from 'actions/entry'
import { useRouter } from 'next/router'
import { useCallback, useMemo, useState } from 'react'
import ConfirmationDialogue from 'src/common/ConfirmationDialogue'
import Paginate from 'src/common/Paginate'
import FileDisplay, { MutateFiles, MutateReleases } from 'src/entry/model/files/FileDisplay'
import useNotification from 'src/hooks/useNotification'
import { EntryKind, FileInterface, ReleaseInterface } from 'types/types'
import { getErrorMessage } from 'utils/fetcher'
import {
  buildFileTree,
  collectAllFileNames,
  countMatchingFiles,
  type FileTreeNode,
  getBreadcrumbParts,
  getNodeAtPath,
  hasAnyNestedFiles,
} from 'utils/fileTreeUtils'

type ViewMode = 'flat' | 'folder'

/** Union type for rendering both folders and files in the same Paginate list */
type BrowseListItem = {
  key: string
  name: string
  searchableText: string
  size: number
  createdAt: Date
  updatedAt: Date
} & ({ kind: 'folder'; node: FileTreeNode } | { kind: 'file'; file: FileInterface })

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
  const [folderSearchQuery, setFolderSearchQuery] = useState('')

  const tree = useMemo(() => buildFileTree(files), [files])
  const currentNode = useMemo(() => getNodeAtPath(tree, currentPath), [tree, currentPath])
  const breadcrumbs = useMemo(() => getBreadcrumbParts(currentPath), [currentPath])

  // Build a unified list of folder and file items at the current level for Paginate.
  // Folder searchableText includes the folder name plus all nested file names so
  // Paginate's text filter matches folders containing matching files deeper in the tree.
  const browseItems: BrowseListItem[] = useMemo(() => {
    if (!currentNode) {
      return []
    }
    const items: BrowseListItem[] = []
    for (const child of currentNode.children) {
      if (child.isDirectory) {
        const nestedNames = collectAllFileNames(child)
        items.push({
          key: `folder-${child.fullPath}`,
          kind: 'folder',
          node: child,
          name: child.name,
          searchableText: [child.name, ...nestedNames].join(' '),
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

  // Filter browse items by the managed search query so folders with matching nested files are shown
  const filteredBrowseItems = useMemo(() => {
    if (!folderSearchQuery) {
      return browseItems
    }
    const lowerQuery = folderSearchQuery.toLowerCase()
    return browseItems.filter((item) => item.searchableText.toLowerCase().includes(lowerQuery))
  }, [browseItems, folderSearchQuery])

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

  const BrowseListRow = ({ data }: { data: BrowseListItem }) => {
    if (data.kind === 'folder') {
      return (
        <Box sx={{ width: '100%' }}>
          <Stack spacing={1} sx={{ p: 2 }}>
            <FolderRow
              node={data.node}
              modelId={modelId}
              modelKind={modelKind}
              releases={releases}
              readOnly={readOnly}
              onNavigate={setCurrentPath}
              searchQuery={folderSearchQuery}
            />
          </Stack>
        </Box>
      )
    }
    return (
      <Box key={data.file._id} sx={{ width: '100%' }}>
        <Stack spacing={1} sx={{ p: 2 }}>
          <FileDisplay
            showMenuItems={{
              associatedReleases: !readOnly,
              deleteFile: !readOnly && modelKind === EntryKind.MODEL,
              rescanFile: !readOnly,
            }}
            file={data.file}
            modelId={modelId}
            mutator={mutator}
            releases={releases}
            displayName={data.file.name.includes('/') ? data.file.name.split('/').pop() : undefined}
          />
        </Stack>
      </Box>
    )
  }

  return (
    <Stack spacing={1} sx={{ width: '100%' }}>
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
          <TextField
            size='small'
            placeholder='Search files and folders...'
            value={folderSearchQuery}
            onChange={(e) => setFolderSearchQuery(e.target.value)}
            sx={{ px: 2, pb: 1 }}
            fullWidth
          />
          <Paginate
            list={filteredBrowseItems}
            emptyListText={folderSearchQuery ? 'No matching files or folders' : 'No files in this folder'}
            searchFilterProperty='searchableText'
            hideSearchInput
            sortingProperties={[
              { value: 'name', title: 'Name', iconKind: 'text' },
              { value: 'size', title: 'Size', iconKind: 'size' },
              { value: 'createdAt', title: 'Date uploaded', iconKind: 'date' },
              { value: 'updatedAt', title: 'Date updated', iconKind: 'date' },
            ]}
            searchPlaceholderText='Search by name'
            defaultSortProperty='name'
          >
            {BrowseListRow}
          </Paginate>
        </>
      )}
    </Stack>
  )
}

/** Renders a folder row with the same visual weight as FileDisplay, including a delete action menu. */
function FolderRow({
  node,
  modelId,
  modelKind,
  releases,
  readOnly,
  onNavigate,
  searchQuery = '',
}: {
  node: FileTreeNode
  modelId: string
  modelKind?: string
  releases: ReleaseInterface[]
  readOnly: boolean
  onNavigate: (path: string) => void
  searchQuery?: string
}) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const sendNotification = useNotification()
  const { mutateModelFiles } = useGetModelFiles(modelId)
  const router = useRouter()

  // Collect all files recursively under this folder
  const allFilesInFolder = useMemo(() => {
    const result: FileInterface[] = []
    const collect = (n: FileTreeNode) => {
      if (!n.isDirectory && n.file) {
        result.push(n.file)
      }
      for (const child of n.children) {
        collect(child)
      }
    }
    collect(node)
    return result
  }, [node])

  // Find releases that reference any file in this folder
  const associatedReleases = useMemo(
    () => releases.filter((release) => allFilesInFolder.some((file) => release.fileIds.includes(file._id))),
    [releases, allFilesInFolder],
  )

  const handleDeleteConfirm = useCallback(async () => {
    if (isDeleting) {
      return
    }
    try {
      setIsDeleting(true)
      setDeleteError('')
      for (const file of allFilesInFolder) {
        const res = await deleteEntryFile(modelId, file._id)
        if (!res.ok) {
          setDeleteError(await getErrorMessage(res))
          return
        }
      }
      sendNotification({
        variant: 'success',
        msg: `Folder "${node.name}" and ${allFilesInFolder.length} file(s) deleted`,
        anchorOrigin: { horizontal: 'center', vertical: 'bottom' },
      })
      mutateModelFiles()
      setDeleteOpen(false)
      router.push(`/model/${modelId}?tab=files`)
    } catch (err) {
      setDeleteError(`Failed to delete folder.\n${err}`)
    } finally {
      setIsDeleting(false)
    }
  }, [isDeleting, allFilesInFolder, modelId, node.name, sendNotification, mutateModelFiles, router])

  const canDelete = !readOnly && modelKind === EntryKind.MODEL

  // When a search is active, show the count of matching files instead of the total
  const displayCount = useMemo(() => countMatchingFiles(node, searchQuery), [node, searchQuery])
  const totalCount = node.totalFileCount

  return (
    <>
      <Stack
        direction={{ sm: 'column', md: 'row' }}
        spacing={2}
        sx={{ alignItems: 'center', justifyContent: 'space-between', width: '100%' }}
      >
        <Stack
          direction='row'
          spacing={2}
          sx={{ alignItems: 'center', cursor: 'pointer', flex: 1 }}
          onClick={() => onNavigate(node.fullPath)}
        >
          <Folder color='action' />
          <Typography variant='h6'>{node.name}</Typography>
          <Typography variant='caption' sx={{ width: 'max-content' }}>
            {searchQuery && displayCount !== totalCount
              ? `${displayCount} of ${totalCount} file${totalCount !== 1 ? 's' : ''} match`
              : `${totalCount} file${totalCount !== 1 ? 's' : ''}`}
          </Typography>
        </Stack>
        {canDelete && (
          <>
            <IconButton
              size='small'
              onClick={(e) => setAnchorEl(e.currentTarget)}
              data-test={`folder-menu-${node.name}`}
            >
              <MoreVert />
            </IconButton>
            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
              <MenuItem
                onClick={() => {
                  setAnchorEl(null)
                  setDeleteOpen(true)
                }}
              >
                <ListItemIcon>
                  <Delete color='error' fontSize='small' />
                </ListItemIcon>
                <ListItemText>Delete folder</ListItemText>
              </MenuItem>
            </Menu>
          </>
        )}
      </Stack>
      <ConfirmationDialogue
        open={deleteOpen}
        title={`Delete folder "${node.name}"?`}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteOpen(false)}
        confirmLoading={isDeleting}
        errorMessage={deleteError}
      >
        <Stack spacing={1}>
          <Typography>
            This will delete <strong>{allFilesInFolder.length}</strong> file{allFilesInFolder.length !== 1 ? 's' : ''}{' '}
            in this folder and all sub-folders.
          </Typography>
          {associatedReleases.length > 0 && (
            <Typography color='error'>
              Warning: {associatedReleases.length} release{associatedReleases.length !== 1 ? 's' : ''} reference files
              in this folder: {associatedReleases.map((r) => r.semver).join(', ')}
            </Typography>
          )}
          <Typography variant='caption'>Files to be deleted:</Typography>
          <Box sx={{ maxHeight: 200, overflow: 'auto', pl: 2 }}>
            {allFilesInFolder.map((file) => (
              <Typography key={file._id} variant='body2'>
                {file.name}
              </Typography>
            ))}
          </Box>
        </Stack>
      </ConfirmationDialogue>
    </>
  )
}
