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
import { useGetFilesForModel } from 'actions/file'
import { memoize } from 'lodash-es'
import prettyBytes from 'pretty-bytes'
import { useCallback, useState } from 'react'
import Loading from 'src/common/Loading'
import Paginate from 'src/common/Paginate'
import MessageAlert from 'src/MessageAlert'
import { EntryInterface, FileInterface, isFileInterface } from 'types/types'
import { formatDateString } from 'utils/dateUtils'

interface ExistingFileSelectorProps {
  model: EntryInterface
  existingReleaseFiles: (File | FileInterface)[]
  onChange: (value: (File | FileInterface)[]) => void
}

export default function ExistingFileSelector({ model, existingReleaseFiles, onChange }: ExistingFileSelectorProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const { files, isFilesLoading, isFilesError } = useGetFilesForModel(model.id)
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

  const FileRow = memoize(({ data, index }) => (
    <ListItem key={data[index]._id} disablePadding>
      <ListItemButton dense onClick={handleToggle(data[index])} disabled={isFileDisabled(data[index])}>
        <ListItemIcon>
          <Checkbox
            edge='start'
            checked={
              checkedFiles.find((checkedFile) => checkedFile._id === data[index]._id) !== undefined ||
              existingReleaseFiles.find(
                (existingFile) => isFileInterface(existingFile) && existingFile._id === data[index]._id,
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
                {data[index].name}
              </Typography>
              {isFileDisabled(data[index]) && (
                <Typography variant='caption' color={theme.palette.error.main}>
                  A file with this name has either been selected, or is already on this release
                </Typography>
              )}
            </Stack>
          }
          secondary={`Added on ${formatDateString(data[index].createdAt.toString())} - ${prettyBytes(data[index].size)}`}
        />
      </ListItemButton>
    </ListItem>
  ))

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
          <Paginate
            list={files}
            emptyListText='No files found'
            sortingProperties={[
              { value: 'name', title: 'Name', iconKind: 'text' },
              { value: 'createdAt', title: 'Date uploaded', iconKind: 'date' },
              { value: 'updatedAt', title: 'Date updated', iconKind: 'date' },
            ]}
            defaultSortProperty='createdAt'
            searchFilterProperty='name'
            searchPlaceholderText='Search by file name'
          >
            {FileRow}
          </Paginate>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDialogOpen(false)}>Close</Button>
          <Button onClick={handleAddFilesOnClick} disabled={checkedFiles.length === 0}>
            Add files
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
