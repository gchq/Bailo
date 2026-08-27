import { Stack } from '@mui/material'
import DisplayDialog from 'src/common/DisplayDialog'
import LabelledValue from 'src/common/LabelledValue'
import ValueDisplay from 'src/common/ValueDisplay'
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
        <LabelledValue label='ID'>
          <ValueDisplay value={schema.id} />
        </LabelledValue>
        <LabelledValue label='Name'>
          <ValueDisplay value={schema.name} />
        </LabelledValue>
        <LabelledValue label='Description'>
          <ValueDisplay value={schema.description} richText />
        </LabelledValue>
      </Stack>
    </DisplayDialog>
  )
}
