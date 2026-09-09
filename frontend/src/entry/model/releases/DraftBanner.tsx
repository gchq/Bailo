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
  draft?: boolean
} & (
  | {
      showButton: false
      dialogTitle?: never
      disableButton?: never
      handlePublish?: never
      isLoading?: never
      errorMessage?: never
      setErrorMessage?: never
    }
  | {
      showButton: true
      dialogTitle: string
      disableButton: boolean
      handlePublish: () => void
      isLoading: boolean
      errorMessage?: string
      setErrorMessage: (err: string) => void
    }
)

export function DraftBanner({
  text,
  dialogTitle,
  draft = false,
  isLoading,
  errorMessage = '',
  setErrorMessage,
  handlePublish,
  showButton,
  disableButton,
}: DraftBannerProps) {
  const theme = useTheme()
  const [open, setOpen] = useState(false)
  if (!draft) {
    return <></>
  }
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
                title={dialogTitle}
                onConfirm={handlePublish}
                onCancel={() => [setOpen(false), setErrorMessage('')]}
                errorMessage={errorMessage}
                dialogMessage={'Are you sure you want to publish this? This is irreversible.'}
                confirmLoading={isLoading}
              />
            </>
          )}
        </Stack>
      </Paper>
    </>
  )
}
