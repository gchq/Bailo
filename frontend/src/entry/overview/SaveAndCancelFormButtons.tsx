import { Close, Save } from '@mui/icons-material'
import Code from '@mui/icons-material/Code'
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
      direction={{ xs: 'column', sm: 'row' }}
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
      <Button variant='outlined' onClick={onCancel} data-test={cancelDataTestId} startIcon={<Close />}>
        Cancel
      </Button>
      <Button variant='contained' onClick={onSubmit} loading={loading} data-test={saveDataTestId} startIcon={<Save />}>
        Save
      </Button>
    </Stack>
  )
}
