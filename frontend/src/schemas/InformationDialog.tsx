import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Stack,
  Typography,
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import MarkdownDisplay from 'src/common/MarkdownDisplay'
import { Transition } from 'src/common/Transition'
import { SchemaInterface } from 'types/types'

type SchemaDialogProps = {
  open: boolean
  schema: SchemaInterface
  onClose: () => void
}

export default function InformationDialog({ open = false, onClose, schema }: SchemaDialogProps) {
  const theme = useTheme()

  return (
    <Dialog fullWidth open={open} onClose={onClose} maxWidth='sm' slots={{ transition: Transition }}>
      <DialogTitle>Schema information</DialogTitle>
      <DialogContent>
        <Box>
          <Stack spacing={2} divider={<Divider flexItem />}>
            <Stack spacing={1}>
              <Stack direction='row' alignItems='center' spacing={1}>
                <Typography fontWeight='bold' sx={{ color: theme.palette.primary.main }}>
                  ID:
                </Typography>
                <Typography>{schema.id}</Typography>
              </Stack>
              <Stack direction='row' alignItems='center' spacing={1}>
                <Typography fontWeight='bold' sx={{ color: theme.palette.primary.main }}>
                  Name:
                </Typography>
                <Typography>{schema.name}</Typography>
              </Stack>
              <Stack direction='row' alignItems='center' spacing={1}>
                <MarkdownDisplay>{schema.description}</MarkdownDisplay>
              </Stack>
            </Stack>
          </Stack>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button variant='contained' onClick={onClose}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  )
}
