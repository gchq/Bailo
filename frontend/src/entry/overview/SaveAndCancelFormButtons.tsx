import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import Close from '@mui/icons-material/Close'
import Code from '@mui/icons-material/Code'
import Save from '@mui/icons-material/Save'
import { Button, Divider, Stack } from '@mui/material'

interface SaveAndCancelButtonsProps {
  onCancel: () => void
  onSubmit: () => void
  openTextInputDialog: () => void
  openImportTextDialog?: () => void
  showImportFromText?: boolean
  loading: boolean
  cancelDataTestId?: string
  saveDataTestId?: string
}
export default function SaveAndCancelButtons({
  onCancel,
  onSubmit,
  openTextInputDialog,
  openImportTextDialog,
  showImportFromText = false,
  loading,
  cancelDataTestId = '',
  saveDataTestId = '',
}: SaveAndCancelButtonsProps) {
  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      spacing={1}
      divider={<Divider orientation='vertical' flexItem />}
      sx={{
        justifyContent: 'flex-end',
        mb: { xs: 2 },
      }}
    >
      {showImportFromText && openImportTextDialog && (
        <Button
          variant='contained'
          startIcon={<AutoAwesomeIcon />}
          color='secondary'
          onClick={openImportTextDialog}
          data-test='importModelCardTextButton'
        >
          Import from Text
        </Button>
      )}
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
