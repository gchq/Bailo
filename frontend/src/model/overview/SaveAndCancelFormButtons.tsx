import Code from '@mui/icons-material/Code'
import { LoadingButton } from '@mui/lab'
import { Button, Divider, Stack } from '@mui/material'

interface SaveAndCancelButtonsProps {
  onCancel: () => void
  onSubmit: () => void
  openTextInputDialog: () => void
  loading: boolean
  cancelDataTestId?: string
  saveDataTestId?: string
}
export default function SaveAndCancelButtons({
  onCancel,
  onSubmit,
  openTextInputDialog,
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
      <Button
        variant='contained'
        startIcon={<Code />}
        color='secondary'
        onClick={openTextInputDialog}
        data-test='addJsonToFormButton'
      >
        Add JSON to form
      </Button>
      <Button variant='outlined' onClick={onCancel} data-test={cancelDataTestId}>
        Cancel
      </Button>
      <LoadingButton variant='contained' onClick={onSubmit} loading={loading} data-test={saveDataTestId}>
        Save
      </LoadingButton>
    </Stack>
  )
}
