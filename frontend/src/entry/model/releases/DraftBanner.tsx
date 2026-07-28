import Warning from '@mui/icons-material/Warning'
import Button from '@mui/material/Button'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import { useTheme } from '@mui/material/styles'
import Typography from '@mui/material/Typography'
import MessageAlert from 'src/MessageAlert'

type DraftBannerProps = {
  text: string
  isLoading: boolean
  errorMessage?: string
} & (
  | {
      showButton: false
      disableButton?: never
      handlePublish?: never
    }
  | {
      showButton: true
      disableButton: boolean
      handlePublish: () => void
    }
)

export function DraftBanner({
  text,
  isLoading,
  errorMessage = '',
  handlePublish,
  showButton,
  disableButton,
}: DraftBannerProps) {
  const theme = useTheme()
  return (
    <>
      <Paper
        sx={{
          color: 'white',
          backgroundColor: theme.palette.info.main,
          py: 1,
          px: 2,
          alignItems: 'center',
          borderRadius: 0,
          width: '100%',
        }}
      >
        <Stack direction='row' sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
          <Stack direction={'row'} spacing={1}>
            <Warning />
            <Typography>{text}</Typography>
          </Stack>
          {showButton && (
            <Button
              variant='outlined'
              sx={{ borderColor: 'white', color: theme.palette.common.white }}
              onClick={handlePublish}
              disabled={disableButton}
              loading={isLoading}
            >
              <Typography>Publish</Typography>
            </Button>
          )}
        </Stack>
        {errorMessage && <MessageAlert message={errorMessage} severity='error' />}
      </Paper>
    </>
  )
}
