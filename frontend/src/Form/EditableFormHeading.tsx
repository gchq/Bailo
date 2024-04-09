import { LoadingButton } from '@mui/lab'
import { Button, Stack } from '@mui/material'
import { ReactNode } from 'react'
import MessageAlert from 'src/MessageAlert'

type EditableFormHeadingProps = {
  heading: ReactNode
  editButtonText: string
  isEdit: boolean
  isLoading: boolean
  onEdit: () => void
  onCancel: () => void
  onSubmit: () => void
  registryError?: boolean
  errorMessage?: string
}

export default function EditableFormHeading({
  heading,
  editButtonText,
  isEdit,
  isLoading,
  onEdit,
  onCancel,
  onSubmit,
  registryError,
  errorMessage = '',
}: EditableFormHeadingProps) {
  return (
    <Stack sx={{ pb: 2 }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent={{ xs: 'center', sm: 'space-between' }}
        alignItems='center'
        spacing={2}
      >
        {heading}
        {!isEdit && (
          <Button
            variant='outlined'
            onClick={onEdit}
            sx={{ mb: { xs: 2 } }}
            data-test='editFormButton'
            disabled={registryError}
          >
            {editButtonText}
          </Button>
        )}
        {isEdit && (
          <Stack direction='row' spacing={1} justifyContent='flex-end' alignItems='center' sx={{ mb: { xs: 2 } }}>
            <Button variant='outlined' onClick={onCancel} data-test='cancelEditFormButton'>
              Cancel
            </Button>
            <LoadingButton
              variant='contained'
              loading={isLoading}
              onClick={onSubmit}
              data-test='saveEditFormButton'
              disabled={registryError}
            >
              Save
            </LoadingButton>
          </Stack>
        )}
      </Stack>
      <MessageAlert message={errorMessage} severity='error' />
    </Stack>
  )
}
