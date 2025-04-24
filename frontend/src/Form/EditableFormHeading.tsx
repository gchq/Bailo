import { LoadingButton } from '@mui/lab'
import { Button, Stack } from '@mui/material'
import { ReactNode } from 'react'
import Restricted from 'src/common/Restricted'
import MessageAlert from 'src/MessageAlert'
import { RestrictedActionKeys } from 'types/types'

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
  editAction: RestrictedActionKeys
  deleteAction?: RestrictedActionKeys
  errorMessage?: string
  deleteButtonText?: string
  readOnly?: boolean
  disableSaveButton?: boolean
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
  editAction,
  deleteAction,
  errorMessage = '',
  deleteButtonText = 'Delete',
  isRegistryError = false,
  readOnly = false,
  disableSaveButton = false,
}: EditableFormHeadingProps) {
  return (
    <Stack sx={{ pb: 2 }}>
      <Stack direction='row' justifyContent={{ xs: 'center', sm: 'space-between' }} alignItems='center' spacing={2}>
        {heading}
        {!isEdit && !readOnly && (
          <Stack direction='row' spacing={1} justifyContent='flex-end' alignItems='center' sx={{ mb: { xs: 2 } }}>
            <Restricted action={editAction} fallback={<Button disabled>{editButtonText}</Button>}>
              <Button variant='outlined' onClick={onEdit} data-test='editFormButton' disabled={isRegistryError}>
                {editButtonText}
              </Button>
            </Restricted>
            {deleteAction && deleteButtonText && (
              <Restricted action={deleteAction} fallback={<Button disabled>{deleteButtonText}</Button>}>
                <Button
                  variant='contained'
                  color='secondary'
                  onClick={onDelete}
                  data-test='deleteFormButton'
                  disabled={isRegistryError}
                >
                  {deleteButtonText}
                </Button>
              </Restricted>
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
              disabled={isRegistryError || disableSaveButton}
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
