import { Stack, Typography } from '@mui/material'
import DisplayDialog from 'src/common/DisplayDialog'
import LabelledValue from 'src/common/LabelledValue'
import MarkdownDisplay from 'src/common/MarkdownDisplay'
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
          <Typography>{schema.id}</Typography>
        </LabelledValue>
        <LabelledValue label='Name'>
          <Typography>{schema.name}</Typography>
        </LabelledValue>
        <LabelledValue label='Description'>
          {!schema.description ? (
            <Typography sx={{ fontStyle: 'italic' }}>Empty</Typography>
          ) : (
            <MarkdownDisplay>{schema.description}</MarkdownDisplay>
          )}
        </LabelledValue>
      </Stack>
    </DisplayDialog>
  )
}
