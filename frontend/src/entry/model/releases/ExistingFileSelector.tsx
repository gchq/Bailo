import Folder from '@mui/icons-material/Folder'
import Home from '@mui/icons-material/Home'
import {
  Breadcrumbs,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Link,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Typography,
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useGetFilesForModel } from 'actions/file'
import { memoize } from 'lodash-es'
import prettyBytes from 'pretty-bytes'
import { useCallback, useMemo, useState } from 'react'
import Loading from 'src/common/Loading'
import Paginate from 'src/common/Paginate'
import MessageAlert from 'src/MessageAlert'
import { EntryInterface, FileInterface, isFileInterface } from 'types/types'
import { formatDateString } from 'utils/dateUtils'
import {
  buildFileTree,
  type FileTreeNode,
  getBreadcrumbParts,
  getNodeAtPath,
  hasAnyNestedFiles,
} from 'utils/fileTreeUtils'

interface ExistingFileSelectorProps {
  model: EntryInterface
  existingReleaseFiles: (File | FileInterface)[]
  onChange: (value: (File | FileInterface)[]) => void
}

/** Union type for rendering both folders and files in the same Paginate list */
type SelectorListItem = {
  key: string
  name: string
  size: number
  createdAt: Date
  updatedAt: Date
} & ({ kind: 'folder'; node: FileTreeNode } | { kind: 'file'; file: FileInterface })

export default function ExistingFileSelector({ model, existingReleaseFiles, onChange }: ExistingFileSelectorProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const { files, isFilesLoading, isFilesError } = useGetFilesForModel(model.id)
  const [checkedFiles, setCheckedFiles] = useState<FileInterface[]>([])
  const [currentPath, setCurrentPath] = useState('')
  const theme = useTheme()

  const hasNested = useMemo(() => hasAnyNestedFiles(files), [files])
  const tree = useMemo(() => buildFileTree(files), [files])
  const currentNode = useMemo(() => getNodeAtPath(tree, currentPath), [tree, currentPath])
  const breadcrumbs = useMemo(() => getBreadcrumbParts(currentPath), [currentPath])

  // Build unified list of folders and files at current level
  const listItems: SelectorListItem[] = useMemo(() => {
    if (!currentNode) {
      return []
    }
    const items: SelectorListItem[] = []
    for (const child of currentNode.children) {
      if (child.isDirectory) {
        items.push({
          key: `folder-${child.fullPath}`,
          kind: 'folder',
          node: child,
          name: child.name,
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
          size: child.file.size,
          createdAt: child.file.createdAt,
          updatedAt: child.file.updatedAt,
        })
      }
    }
    return items
  }, [currentNode])

  const handleAddFilesOnClick = () => {
    if (checkedFiles.length === 0) {
      setIsDialogOpen(false)
      return
    }
    if (existingReleaseFiles) {
      const updatedFiles = [
        ...existingReleaseFiles.filter((existingFile) =>
          checkedFiles.some((checkedFile) => checkedFile.name !== existingFile.name),
        ),
        ...checkedFiles,
      ]
      onChange(updatedFiles)
    } else {
      onChange(checkedFiles)
    }
    setIsDialogOpen(false)
    setCheckedFiles([])
    setCurrentPath('')
  }

  const handleToggle = useCallback(
    (file: FileInterface) => () => {
      const currentIndex = checkedFiles.indexOf(file)
      const newCheckedFiles = checkedFiles.filter((checkedFile) => file._id !== checkedFile._id)
      if (currentIndex === -1) {
        newCheckedFiles.push(file)
        setCheckedFiles(newCheckedFiles)
      } else {
        setCheckedFiles(newCheckedFiles)
      }
    },
    [checkedFiles],
  )

  const isFileDisabled = useCallback(
    (file: FileInterface) => {
      return (
        existingReleaseFiles.find(
          (existingFile) => isFileInterface(existingFile) && existingFile.name === file.name,
        ) !== undefined ||
        (checkedFiles.find(
          (existingCheckedFile) => isFileInterface(existingCheckedFile) && existingCheckedFile.name === file.name,
        ) !== undefined &&
          checkedFiles.find(
            (existingCheckedFile) => isFileInterface(existingCheckedFile) && existingCheckedFile._id === file._id,
          ) === undefined)
      )
    },
    [existingReleaseFiles, checkedFiles],
  )

  // For flat view (no nested files) or as fallback
  const FlatFileRow = memoize(({ data }) => (
    <ListItem key={data._id} disablePadding>
      <ListItemButton dense onClick={handleToggle(data)} disabled={isFileDisabled(data)}>
        <ListItemIcon>
          <Checkbox
            edge='start'
            checked={
              checkedFiles.find((checkedFile) => checkedFile._id === data._id) !== undefined ||
              existingReleaseFiles.find(
                (existingFile) => isFileInterface(existingFile) && existingFile._id === data._id,
              ) !== undefined
            }
            tabIndex={-1}
            disableRipple
          />
        </ListItemIcon>
        <ListItemText
          primary={
            <Stack>
              <Typography color='primary' component='span'>
                {data.name}
              </Typography>
              {isFileDisabled(data) && (
                <Typography variant='caption' color={theme.palette.error.main}>
                  A file with this name has either been selected, or is already on this release
                </Typography>
              )}
            </Stack>
          }
          secondary={`Added on ${formatDateString(data.createdAt.toString())} - ${prettyBytes(data.size)}`}
        />
      </ListItemButton>
    </ListItem>
  ))

  const BrowseRow = ({ data }: { data: SelectorListItem }) => {
    if (data.kind === 'folder') {
      return (
        <ListItem key={data.key} disablePadding>
          <ListItemButton dense onClick={() => setCurrentPath(data.node.fullPath)}>
            <ListItemIcon>
              <Folder color='action' />
            </ListItemIcon>
            <ListItemText
              primary={data.node.name}
              secondary={`${data.node.totalFileCount} file${data.node.totalFileCount !== 1 ? 's' : ''}`}
            />
          </ListItemButton>
        </ListItem>
      )
    }
    const file = data.file
    const displayName = file.name.includes('/') ? file.name.split('/').pop() : file.name
    return (
      <ListItem key={file._id} disablePadding>
        <ListItemButton dense onClick={handleToggle(file)} disabled={isFileDisabled(file)}>
          <ListItemIcon>
            <Checkbox
              edge='start'
              checked={
                checkedFiles.find((checkedFile) => checkedFile._id === file._id) !== undefined ||
                existingReleaseFiles.find(
                  (existingFile) => isFileInterface(existingFile) && existingFile._id === file._id,
                ) !== undefined
              }
              tabIndex={-1}
              disableRipple
            />
          </ListItemIcon>
          <ListItemText
            primary={
              <Stack>
                <Typography color='primary' component='span'>
                  {displayName}
                </Typography>
                {isFileDisabled(file) && (
                  <Typography variant='caption' color={theme.palette.error.main}>
                    A file with this name has either been selected, or is already on this release
                  </Typography>
                )}
              </Stack>
            }
            secondary={`Added on ${formatDateString(file.createdAt.toString())} - ${prettyBytes(file.size)}`}
          />
        </ListItemButton>
      </ListItem>
    )
  }

  if (isFilesError) {
    return <MessageAlert message={isFilesError.info.message} severity='error' />
  }

  if (isFilesLoading) {
    return <Loading />
  }

  return (
    <>
      <Button variant='outlined' sx={{ width: '100%' }} onClick={() => setIsDialogOpen(true)}>
        Select existing files
      </Button>
      <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)} maxWidth='md' fullWidth>
        <DialogTitle>Select an existing file for {model.name}</DialogTitle>
        <DialogContent sx={{ p: 1 }}>
          {hasNested ? (
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
              <Paginate
                list={listItems}
                emptyListText='No files found'
                sortingProperties={[
                  { value: 'name', title: 'Name', iconKind: 'text' },
                  { value: 'size', title: 'Size', iconKind: 'size' },
                  { value: 'createdAt', title: 'Date uploaded', iconKind: 'date' },
                ]}
                defaultSortProperty='name'
                searchFilterProperty='name'
                searchPlaceholderText='Search by file name'
              >
                {BrowseRow}
              </Paginate>
            </>
          ) : (
            <Paginate
              list={files}
              emptyListText='No files found'
              sortingProperties={[
                { value: 'name', title: 'Name', iconKind: 'text' },
                { value: 'size', title: 'Size', iconKind: 'size' },
                { value: 'createdAt', title: 'Date uploaded', iconKind: 'date' },
                { value: 'updatedAt', title: 'Date updated', iconKind: 'date' },
              ]}
              defaultSortProperty='createdAt'
              searchFilterProperty='name'
              searchPlaceholderText='Search by file name'
            >
              {FlatFileRow}
            </Paginate>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDialogOpen(false)}>Close</Button>
          <Button onClick={handleAddFilesOnClick} disabled={checkedFiles.length === 0} variant='contained'>
            Add files
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
