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
      dialogMessage?: never
      buttonText?: never
      disableButton?: never
      handleSubmit?: never
      isLoading?: never
      errorMessage?: never
      setErrorMessage?: never
      validateBeforeSubmit?: never
    }
  | {
      showButton: true
      dialogTitle: string
      dialogMessage?: string
      buttonText?: string
      disableButton: boolean
      handleSubmit: () => void
      isLoading: boolean
      errorMessage?: string
      setErrorMessage: (err: string) => void
      /** Runs when the submit button is clicked. Returning false stops the confirmation dialogue from opening. */
      validateBeforeSubmit?: () => boolean
    }
)

export function DraftBanner({
  text,
  dialogTitle,
  dialogMessage = 'Are you sure you want to submit this for review? This is irreversible.',
  buttonText = 'Submit for Review',
  draft = false,
  isLoading,
  errorMessage = '',
  setErrorMessage,
  handleSubmit,
  showButton,
  disableButton,
  validateBeforeSubmit,
}: DraftBannerProps) {
  const theme = useTheme()
  const [open, setOpen] = useState(false)
  if (!draft) {
    return <></>
  }

  function handleSubmitClick() {
    if (validateBeforeSubmit && !validateBeforeSubmit()) {
      return
    }
    setOpen(true)
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
        data-test='draftBanner'
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
                onClick={handleSubmitClick}
                disabled={disableButton}
                loading={isLoading}
                data-test='publishDraftButton'
              >
                <Typography>{buttonText}</Typography>
              </Button>
              <ConfirmationDialogue
                open={open}
                title={dialogTitle}
                onConfirm={handleSubmit}
                onCancel={() => [setOpen(false), setErrorMessage('')]}
                errorMessage={errorMessage}
                dialogMessage={dialogMessage}
                confirmLoading={isLoading}
              />
            </>
          )}
        </Stack>
      </Paper>
    </>
  )
}
