import {
  Button,
  DialogActions,
  DialogTitle,
  Paper,
  Table,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material'
import Dialog from '@mui/material/Dialog'
import { useTheme } from '@mui/material/styles'
import { useGetModelCardRevisions } from 'actions/modelCard'
import { useMemo } from 'react'
import Loading from 'src/common/Loading'
import EntryCardRevision from 'src/entry/overview/EntryCardRevision'
import MessageAlert from 'src/MessageAlert'
import { EntryInterface } from 'types/types'
import { sortByCreatedAtDescending } from 'utils/dateUtils'

type EntryCardHistoryDialogProps = {
  entry: EntryInterface
  open: boolean
  setOpen: (isOpen: boolean) => void
}

export default function EntryCardHistoryDialog({ entry, open, setOpen }: EntryCardHistoryDialogProps) {
  const theme = useTheme()
  const { modelCardRevisions, isModelCardRevisionsLoading, isModelCardRevisionsError } = useGetModelCardRevisions(
    entry.id,
  )
  const sortedModelCardRevisions = useMemo(
    () => modelCardRevisions.sort(sortByCreatedAtDescending),
    [modelCardRevisions],
  )

  if (isModelCardRevisionsError) {
    return <MessageAlert message={isModelCardRevisionsError.info.message} severity='error' />
  }

  return (
    <>
      {isModelCardRevisionsLoading && <Loading />}
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth='sm'>
        <DialogTitle>
          History details for <span style={{ color: theme.palette.primary.main }}>{entry.name}</span>
        </DialogTitle>
        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 550 }}>
            <TableHead>
              <TableRow>
                <TableCell>Version</TableCell>
                <TableCell>Created By</TableCell>
                <TableCell>Created At</TableCell>
              </TableRow>
            </TableHead>
            {sortedModelCardRevisions.map((modelCardRevision) => (
              <EntryCardRevision key={entry.id} modelCard={modelCardRevision} />
            ))}
          </Table>
        </TableContainer>
        <DialogActions>
          <Button color='secondary' variant='outlined' onClick={() => setOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
