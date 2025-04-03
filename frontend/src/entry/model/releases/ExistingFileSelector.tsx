import {
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
} from '@mui/material'
import { useGetFilesForModel } from 'actions/file'
import prettyBytes from 'pretty-bytes'
import { useCallback, useMemo, useState } from 'react'
import EmptyBlob from 'src/common/EmptyBlob'
import Loading from 'src/common/Loading'
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

  const fileList = useMemo(() => {
    if (!files || files.length === 0) {
      return <EmptyBlob text='No existing files available' />
    }
    if (files) {
      return (
        <List>
          {files.map((file) => (
            <ListItem key={file._id} disablePadding>
              <ListItemButton
                dense
                onClick={handleToggle(file)}
                disabled={
                  existingReleaseFiles.find(
                    (existingFile) => isFileInterface(existingFile) && existingFile._id === file._id,
                  ) !== undefined
                }
              >
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
                    <>
                      <Typography color='primary' component='span'>
                        {file.name}
                      </Typography>
                    </>
                  }
                  secondary={`Added on ${formatDateString(file.createdAt.toString())} - ${prettyBytes(file.size)}`}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      )
    }
  }, [checkedFiles, existingReleaseFiles, files, handleToggle])

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
      <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)}>
        <DialogTitle>Select an existing file for {model.name}</DialogTitle>
        <DialogContent>{fileList}</DialogContent>
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
