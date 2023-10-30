import { Box, Tooltip } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import useNotification from 'src/common/Snackbar'

export default function CodeLine({ line }: { line: string }) {
  const theme = useTheme()
  const sendNotification = useNotification()

  const handleButtonClick = () => {
    navigator.clipboard.writeText(line)
    sendNotification({ variant: 'success', msg: 'Copied to clipboard' })
  }

  return (
    <div
      style={{
        cursor: 'pointer',
      }}
      role='button'
      tabIndex={0}
      onClick={() => {
        handleButtonClick()
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          handleButtonClick()
        }
      }}
    >
      <Tooltip title='Copy to clipboard' arrow>
        <Box sx={{ backgroundColor: theme.palette.container.main, p: 1, borderRadius: 2 }}>$ {line}</Box>
      </Tooltip>
    </div>
  )
}
