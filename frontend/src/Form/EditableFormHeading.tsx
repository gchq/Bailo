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
  isRegistryError?: boolean
  onDelete?: () => void
  errorMessage?: string
  deleteButtonText?: string
  showDeleteButton?: boolean
}

export default function EditableFormHeading({
  heading,
  editButtonText,
  isEdit,
  isLoading,
  onEdit,
  onCancel,
  onSubmit,
  onDelete,
  errorMessage = '',
  deleteButtonText = 'Delete',
  showDeleteButton = false,
  isRegistryError = false,
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
          <Stack direction='row' spacing={1} justifyContent='flex-end' alignItems='center' sx={{ mb: { xs: 2 } }}>
            <Button variant='outlined' onClick={onEdit} data-test='editFormButton' disabled={isRegistryError}>
              {editButtonText}
            </Button>
            {showDeleteButton && (
              <Button
                variant='contained'
                color='secondary'
                onClick={onDelete}
                data-test='deleteFormButton'
                disabled={isRegistryError}
              >
                {deleteButtonText}
              </Button>
            )}
          </Stack>
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
              disabled={isRegistryError}
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
