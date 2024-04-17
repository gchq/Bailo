import { Close, Visibility, VisibilityOff } from '@mui/icons-material'
import { IconButton, Stack, Tooltip } from '@mui/material'

type CodeSnippetActionsProps = {
  disableVisibilityButton: boolean
  disableCloseButton: boolean
  showKeys: boolean
  onVisibilityChange: () => void
  onClose: () => void
}

export default function CodeSnippetActions({
  disableVisibilityButton,
  disableCloseButton,
  showKeys,
  onVisibilityChange,
  onClose,
}: CodeSnippetActionsProps) {
  return (
    <Stack direction='row'>
      {!disableVisibilityButton && (
        <Tooltip title={`${showKeys ? 'Hide' : 'Show'} keys`}>
          <IconButton
            color='primary'
            size='small'
            onClick={() => onVisibilityChange()}
            aria-label={`${showKeys ? 'Hide' : 'Show'} keys`}
            data-test='toggleKeyVisibilityButton'
          >
            {showKeys ? <VisibilityOff /> : <Visibility />}
          </IconButton>
        </Tooltip>
      )}
      {!disableCloseButton && (
        <Tooltip title='Close'>
          <IconButton
            color='primary'
            size='small'
            onClick={() => onClose()}
            aria-label='Close'
            data-test='closeCodeSnippetButton'
          >
            <Close />
          </IconButton>
        </Tooltip>
      )}
    </Stack>
  )
}
