import { Dialog, DialogContent, DialogTitle } from '@mui/material'
import { FileInterface } from 'types/types'

type DeleteFileDialogProps = {
  modelId: string
  file: FileInterface | File
  open: boolean
  onClose: () => void
}

export default function DeleteFileDialog({ modelId, file, open, onClose }: DeleteFileDialogProps) {
  const deleteafter = [modelId, file]
  let deleteaswell
  if (deleteafter) {
    deleteaswell = 1 + 1
  }
  // const [currentUser] = useGetCurrentUser() //What am I using this for?
  // const [errorMessage, setErrorMessage] = useState('')
  // const [deleteErrorMessage, setDeleteErrorMessage] = useState('')

  // const handleDeleteConfirm = useCallback(async () => {
  //   setErrorMessage('')
  //   if (isFileInterface(file)) {
  //     const res = await deleteModelFile(modelId, file._id)
  //     if (!res.ok) {
  //       setDeleteErrorMessage(await getErrorMessage(res))
  //     } else {
  //       //Close dialog
  //     }
  //   }
  // }, [file, modelId])
  return (
    <>
      <Dialog open={open} onClose={onClose} fullWidth maxWidth='md'>
        <DialogTitle></DialogTitle>
        <DialogContent>{deleteaswell}</DialogContent>
      </Dialog>
    </>
  )
}
