import { Divider, Stack, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import DisplayDialog from 'src/common/DisplayDialog'
import MarkdownDisplay from 'src/common/MarkdownDisplay'
import { SchemaInterface } from 'types/types'

type SchemaDialogProps = {
  open: boolean
  schema: SchemaInterface
  onClose: () => void
}

export default function InformationDialog({ open = false, onClose, schema }: SchemaDialogProps) {
  const theme = useTheme()

  return (
    <DisplayDialog open={open} onClose={onClose} title='Schema information'>
      <Stack spacing={2} divider={<Divider flexItem />}>
        <Stack spacing={1}>
          <Stack
            direction='row'
            spacing={1}
            sx={{
              alignItems: 'center',
            }}
          >
            <Typography
              sx={{
                fontWeight: 'bold',
                color: theme.palette.primary.main,
              }}
            >
              ID:
            </Typography>
            <Typography>{schema.id}</Typography>
          </Stack>
          <Stack
            direction='row'
            spacing={1}
            sx={{
              alignItems: 'center',
            }}
          >
            <Typography
              sx={{
                fontWeight: 'bold',
                color: theme.palette.primary.main,
              }}
            >
              Name:
            </Typography>
            <Typography>{schema.name}</Typography>
          </Stack>
          <MarkdownDisplay>{schema.description}</MarkdownDisplay>
        </Stack>
      </Stack>
    </DisplayDialog>
  )
}
