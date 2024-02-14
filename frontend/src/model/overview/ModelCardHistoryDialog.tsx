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
import { useMemo } from 'react'

import { useGetModelCardRevisions } from '../../../actions/modelCard'
import { ModelInterface } from '../../../types/interfaces'
import { sortByCreatedAtDescending } from '../../../utils/dateUtils'
import Loading from '../../common/Loading'
import MessageAlert from '../../MessageAlert'
import ModelCardRevisionListDisplay from './ModelCardRevisionListDisplay'

type DialogProps = {
  model: ModelInterface
  open: boolean
  setOpen: (isOpen: boolean) => void
}

export default function ViewModelCardHistoryDialog({
  model,

  open,
  setOpen,
}: DialogProps) {
  const theme = useTheme()
  const { modelCardRevisions, isModelCardRevisionsLoading, isModelCardRevisionsError } = useGetModelCardRevisions(
    model.id,
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
          History details for <span style={{ color: theme.palette.primary.main }}>{model.name}</span>
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
              <ModelCardRevisionListDisplay key={model.id} modelCard={modelCardRevision} />
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
