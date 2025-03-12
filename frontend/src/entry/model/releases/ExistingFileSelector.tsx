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
import { useMemo, useState } from 'react'
import Loading from 'src/common/Loading'
import MessageAlert from 'src/MessageAlert'
import { EntryInterface, FileInterface } from 'types/types'

interface ExistingFileSelectorProps {
  model: EntryInterface
  onChange: (file: FileInterface[]) => void
}

export default function ExistingFileSelector({ model, onChange }: ExistingFileSelectorProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const { files, isFilesLoading, isFilesError } = useGetFilesForModel(model.id)

  function handleFileOnClick(file: FileInterface) {
    onChange([file])
    setIsDialogOpen(false)
  }

  const fileList = useMemo(() => {
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
  }, [files])

  if (isFilesError) {
    return <MessageAlert message={isFilesError.info.message} severity='error' />
  }

  if (isFilesLoading) {
    return <Loading />
  }

  return (
    <>
      <Button variant='outlined' style={{ width: '100%' }} onClick={() => setIsDialogOpen(true)}>
        Select existing file
      </Button>
      <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)}>
        <DialogTitle>Select an existing file for {model.name}</DialogTitle>
        <DialogContent>
          <List>{fileList}</List>
        </DialogContent>
      </Dialog>
    </>
  )
}
