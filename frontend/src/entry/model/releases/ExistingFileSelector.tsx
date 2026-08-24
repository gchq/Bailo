import Folder from '@mui/icons-material/Folder'
import {
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Typography,
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import prettyBytes from 'pretty-bytes'
import { useCallback, useState } from 'react'
import FolderNavigableList, { BrowseListItem } from 'src/common/FolderNavigableList'
import { EntryInterface, FileInterface, isFileInterface } from 'types/types'
import { formatDateString } from 'utils/dateUtils'
import { collectAllFiles, type FileTreeNode } from 'utils/fileTreeUtils'

interface ExistingFileSelectorProps {
  files: FileInterface[]
  model: EntryInterface
  existingReleaseFiles: (File | FileInterface)[]
  onChange: (value: (File | FileInterface)[]) => void
}

export default function ExistingFileSelector({
  files,
  model,
  existingReleaseFiles,
  onChange,
}: ExistingFileSelectorProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [checkedFiles, setCheckedFiles] = useState<FileInterface[]>([])
  const theme = useTheme()

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

  const handleFolderToggle = useCallback(
    (node: FileTreeNode) => {
      const folderFiles = collectAllFiles(node)
      const selectableFiles = folderFiles.filter((f) => !isFileDisabled(f))
      const allSelected =
        selectableFiles.length > 0 && selectableFiles.every((f) => checkedFiles.some((c) => c._id === f._id))

      if (allSelected) {
        const folderIds = new Set(folderFiles.map((f) => f._id))
        setCheckedFiles(checkedFiles.filter((f) => !folderIds.has(f._id)))
      } else {
        const existing = new Set(checkedFiles.map((f) => f._id))
        const toAdd = selectableFiles.filter((f) => !existing.has(f._id))
        setCheckedFiles([...checkedFiles, ...toAdd])
      }
    },
    [checkedFiles, isFileDisabled],
  )

  const getFolderCheckState = useCallback(
    (node: FileTreeNode) => {
      const folderFiles = collectAllFiles(node)
      const selectedCount = folderFiles.filter(
        (f) =>
          checkedFiles.some((c) => c._id === f._id) ||
          existingReleaseFiles.some((e) => isFileInterface(e) && e._id === f._id),
      ).length
      return {
        checked: selectedCount === folderFiles.length && folderFiles.length > 0,
        indeterminate: selectedCount > 0 && selectedCount < folderFiles.length,
      }
    },
    [checkedFiles, existingReleaseFiles],
  )

  const FileRow = ({ data }: { data: BrowseListItem & { kind: 'file' } }) => {
    const file = data.file
    const displayName = file.name.includes('/') ? file.name.split('/').pop() : file.name
    return (
      <ListItem disablePadding>
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

  return (
    <>
      <Button variant='outlined' sx={{ width: '100%' }} onClick={() => setIsDialogOpen(true)}>
        Select existing files
      </Button>
      <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)} maxWidth='md' fullWidth>
        <DialogTitle>Select an existing file for {model.name}</DialogTitle>
        <DialogContent sx={{ p: 1 }}>
          <FolderNavigableList files={files} emptyListText='No files found' searchPlaceholderText='Search by file name'>
            {({ data, onNavigate }) => {
              if (data.kind === 'folder') {
                const { checked, indeterminate } = getFolderCheckState(data.node)
                return (
                  <ListItem disablePadding>
                    <ListItemIcon sx={{ minWidth: 'auto', pl: 2 }}>
                      <Checkbox
                        edge='start'
                        checked={checked}
                        indeterminate={indeterminate}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleFolderToggle(data.node)
                        }}
                        tabIndex={-1}
                        disableRipple
                      />
                    </ListItemIcon>
                    <ListItemButton dense onClick={() => onNavigate(data.node.fullPath)}>
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
              return <FileRow data={data} />
            }}
          </FolderNavigableList>
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
