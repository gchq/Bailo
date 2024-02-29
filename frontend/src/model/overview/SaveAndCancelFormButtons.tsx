import { LoadingButton } from '@mui/lab'
import { Button, Divider, Stack } from '@mui/material'

interface SaveAndCancelButtonsProps {
  onCancel: () => void
  onSubmit: () => void
  loading: boolean
  cancelDataTestId?: string
  saveDataTestId?: string
}
export default function SaveAndCancelButtons({
  onCancel,
  onSubmit,
  loading,
  cancelDataTestId = '',
  saveDataTestId = '',
}: SaveAndCancelButtonsProps) {
  return (
    <Stack
      direction='row'
      spacing={1}
      justifyContent='flex-end'
      divider={<Divider orientation='vertical' flexItem />}
      sx={{ mb: { xs: 2 } }}
    >
      <Button variant='outlined' onClick={onCancel} data-test={cancelDataTestId}>
        Cancel
      </Button>
      <LoadingButton variant='contained' onClick={onSubmit} loading={loading} data-test={saveDataTestId}>
        Save
      </LoadingButton>
    </Stack>
  )
}
