import Warning from '@mui/icons-material/Warning'
import Button from '@mui/material/Button'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import { useTheme } from '@mui/material/styles'
import Typography from '@mui/material/Typography'
import { useState } from 'react'
import ConfirmationDialogue from 'src/common/ConfirmationDialogue'

type DraftBannerProps = {
  text: string
} & (
  | {
      showButton: false
      disableButton?: never
      handlePublish?: never
      isLoading?: never
      errorMessage?: never
    }
  | {
      showButton: true
      disableButton: boolean
      handlePublish: () => void
      isLoading: boolean
      errorMessage?: string
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
  const [open, setOpen] = useState(false)
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
            <>
              <Button
                variant='outlined'
                sx={{ borderColor: 'white', color: theme.palette.common.white }}
                onClick={() => {
                  setOpen(true)
                }}
                disabled={disableButton}
                loading={isLoading}
              >
                <Typography>Publish</Typography>
              </Button>
              <ConfirmationDialogue
                open={open}
                title='Delete Release'
                onConfirm={handlePublish}
                onCancel={() => setOpen(false)}
                errorMessage={errorMessage}
                dialogMessage={'Are you sure you want to publish this release? This is irreversable.'}
                confirmLoading={isLoading}
              />
            </>
          )}
        </Stack>
      </Paper>
    </>
  )
}
