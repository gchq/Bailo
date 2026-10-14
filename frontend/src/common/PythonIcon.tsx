import CodeIcon from '@mui/icons-material/Code'
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile'
import { Box } from '@mui/material'
import { useTheme } from '@mui/material/styles'

export default function PythonIcon() {
  const theme = useTheme()
  return (
    <Box sx={{ position: 'relative', display: 'inline-flex' }}>
      <InsertDriveFileIcon />
      <CodeIcon
        sx={{
          position: 'absolute',
          fill: theme.palette.mode === 'light' ? 'white' : 'black',
          fontSize: 16,
          top: 7,
          left: 4,
        }}
      />
    </Box>
  )
}
