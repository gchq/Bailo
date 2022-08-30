import Alert from '@mui/material/Alert'
import Snackbar from '@mui/material/Snackbar'

export default function CopiedSnackbar({ openSnackbar, setOpenSnackbar }) {
  return (
    <Snackbar open={openSnackbar} autoHideDuration={6000} onClose={() => setOpenSnackbar(false)}>
      <Alert onClose={() => setOpenSnackbar(false)} severity='success' sx={{ width: '100%' }}>
        Copied to Clipboard
      </Alert>
    </Snackbar>
  )
}
