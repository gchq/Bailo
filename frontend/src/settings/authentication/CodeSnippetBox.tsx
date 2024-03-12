import { Close, Visibility, VisibilityOff } from '@mui/icons-material'
import { IconButton, Stack, Tooltip, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { ReactNode } from 'react'

type CodeSnippetProps = {
  children: ReactNode
} & (
  | {
      disableVisibilityButton?: false
      showKeys: boolean
      onShowKeysChange: (value: boolean) => void
    }
  | {
      disableVisibilityButton: true
      showKeys?: never
      onShowKeysChange?: never
    }
) &
  (
    | {
        disableCloseButton?: false
        onClose: () => void
      }
    | {
        disableCloseButton: true
        onClose?: never
      }
  )

export default function CodeSnippetBox({
  children,
  disableVisibilityButton = false,
  disableCloseButton = false,
  showKeys = false,
  onShowKeysChange = () => undefined,
  onClose = () => undefined,
}: CodeSnippetProps) {
  const theme = useTheme()

  const handleToggleKeyVisibility = () => {
    onShowKeysChange(!showKeys)
  }

  const handleClose = () => {
    onClose()
  }

  return (
    <Stack
      direction='row'
      spacing={1}
      alignItems='flex-start'
      justifyContent='space-between'
      sx={{
        p: theme.spacing(1),
        backgroundColor: theme.palette.container.main,
        width: '100%',
      }}
    >
      <Typography
        sx={{
          px: theme.spacing(1),
          whiteSpace: 'pre-wrap',
          overflowX: 'auto',
        }}
      >
        {children}
      </Typography>
      <Stack direction='row' spacing={1}>
        {!disableVisibilityButton && (
          <Tooltip title={`${showKeys ? 'Hide' : 'Show'} keys`}>
            <IconButton
              color='primary'
              onClick={handleToggleKeyVisibility}
              aria-label={`${showKeys ? 'Hide' : 'Show'} keys`}
              data-test='toggleKeyVisibilityButton'
            >
              {showKeys ? <VisibilityOff /> : <Visibility />}
            </IconButton>
          </Tooltip>
        )}
        {!disableCloseButton && (
          <Tooltip title='Close'>
            <IconButton color='primary' onClick={handleClose} aria-label='Close' data-test='closeCodeSnippetBoxButton'>
              <Close />
            </IconButton>
          </Tooltip>
        )}
      </Stack>
    </Stack>
  )
}
