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
import { EntryCardKindLabel, EntryInterface } from 'types/types'
import { sortByCreatedAtDescending } from 'utils/dateUtils'
import { toTitleCase } from 'utils/stringUtils'

type EntryCardHistoryDialogProps = {
  entry: EntryInterface
  open: boolean
  setOpen: (isOpen: boolean) => void
}

export default function EntryCardHistoryDialog({ entry, open, setOpen }: EntryCardHistoryDialogProps) {
  const theme = useTheme()
  const {
    modelCardRevisions: entryCardRevisions,
    isModelCardRevisionsLoading: isEntryCardRevisionsLoading,
    isModelCardRevisionsError: isEntryCardRevisionsError,
  } = useGetModelCardRevisions(entry.id)
  const sortedEntryCardRevisions = useMemo(
    () =>
      entryCardRevisions
        .sort(sortByCreatedAtDescending)
        .map((entryCardRevision) => (
          <EntryCardRevision key={entryCardRevision.version} entryCard={entryCardRevision} kind={entry.kind} />
        )),
    [entry.kind, entryCardRevisions],
  )

  if (isEntryCardRevisionsError) {
    return <MessageAlert message={isEntryCardRevisionsError.info.message} severity='error' />
  }

  return (
    <>
      {isEntryCardRevisionsLoading && <Loading />}
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth='sm'>
        <DialogTitle>
          {`${toTitleCase(EntryCardKindLabel[entry.kind])} History - `}
          <span style={{ color: theme.palette.primary.main }}>{entry.name}</span>
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
            {sortedEntryCardRevisions}
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
