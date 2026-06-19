import CodeIcon from '@mui/icons-material/Code'
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile'
import { Box } from '@mui/material'

export default function PythonIcon() {
  return (
    <Box sx={{ position: 'relative', display: 'inline-flex' }}>
      <InsertDriveFileIcon />
      <CodeIcon
        sx={{
          position: 'absolute',
          fill: 'white',
          fontSize: 16,
          top: 7,
          left: 4,
        }}
      />
    </Box>
  )
}
