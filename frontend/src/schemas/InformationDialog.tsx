import { Stack } from '@mui/material'
import DisplayDialog from 'src/common/DisplayDialog'
import LabelledValue from 'src/common/LabelledValue'
import { SchemaInterface } from 'types/types'

type SchemaDialogProps = {
  open: boolean
  schema: SchemaInterface
  onClose: () => void
}

export default function InformationDialog({ open = false, onClose, schema }: SchemaDialogProps) {
  return (
    <DisplayDialog open={open} onClose={onClose} title='Schema information'>
      <Stack spacing={2}>
        <LabelledValue label='ID' value={schema.id} />
        <LabelledValue label='Name' value={schema.name} />
        <LabelledValue label='Description' value={schema.description} richText />
      </Stack>
    </DisplayDialog>
  )
}
