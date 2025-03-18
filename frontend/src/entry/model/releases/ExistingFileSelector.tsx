import {
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
} from '@mui/material'
import { useGetFilesForModel } from 'actions/file'
import prettyBytes from 'pretty-bytes'
import { useCallback, useState } from 'react'
import Loading from 'src/common/Loading'
import MessageAlert from 'src/MessageAlert'
import { EntryInterface, FileInterface } from 'types/types'

interface ExistingFileSelectorProps {
  model: EntryInterface
  existingReleaseFiles: (File | FileInterface)[]
  onChange: (value: (File | FileInterface)[]) => void
}

export default function ExistingFileSelector({ model, existingReleaseFiles, onChange }: ExistingFileSelectorProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const { files, isFilesLoading, isFilesError } = useGetFilesForModel(model.id)

  const handleFileOnClick = useCallback(
    (newFile: FileInterface) => {
      const updatedFiles = [...existingReleaseFiles.filter((file) => newFile.name !== file.name), newFile]
      onChange(updatedFiles)
      setIsDialogOpen(false)
    },
    [existingReleaseFiles, onChange],
  )

  const fileList = () => {
    if (files) {
      return files.map((file) => (
        <ListItem key={file._id} disablePadding onClick={() => handleFileOnClick(file)}>
          <ListItemButton dense>
            <ListItemText
              primary={
                <>
                  <Typography color='primary' component='span'>
                    {file.name}
                  </Typography>
                </>
              }
              secondary={prettyBytes(file.size)}
            />
          </ListItemButton>
        </ListItem>
      ))
    }
  }

  if (isFilesError) {
    return <MessageAlert message={isFilesError.info.message} severity='error' />
  }

  if (isFilesLoading) {
    return <Loading />
  }

  return (
    <>
      <Button
        disabled={existingReleaseFiles.length === 0}
        variant='outlined'
        style={{ width: '100%' }}
        onClick={() => setIsDialogOpen(true)}
      >
        Select existing file
      </Button>
      <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)}>
        <DialogTitle>Select an existing file for {model.name}</DialogTitle>
        <DialogContent>
          <List>{fileList()}</List>
        </DialogContent>
      </Dialog>
    </>
  )
}
