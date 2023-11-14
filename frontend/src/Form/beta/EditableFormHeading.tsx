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
  errorMessage = '',
}: EditableFormHeadingProps) {
  return (
    <Stack sx={{ pb: 2 }}>
      <Stack
        direction={{ sx: 'column', sm: 'row' }}
        justifyContent={{ sx: 'center', sm: 'space-between' }}
        alignItems='center'
        spacing={2}
      >
        {heading}
        {!isEdit && (
          <Button variant='outlined' onClick={onEdit} sx={{ mb: { xs: 2 } }}>
            {editButtonText}
          </Button>
        )}
        {isEdit && (
          <Stack direction='row' spacing={1} justifyContent='flex-end' alignItems='center' sx={{ mb: { xs: 2 } }}>
            <Button variant='outlined' onClick={onCancel}>
              Cancel
            </Button>
            <LoadingButton variant='contained' loading={isLoading} onClick={onSubmit}>
              Save
            </LoadingButton>
          </Stack>
        )}
      </Stack>
      <MessageAlert message={errorMessage} severity='error' />
    </Stack>
  )
}
