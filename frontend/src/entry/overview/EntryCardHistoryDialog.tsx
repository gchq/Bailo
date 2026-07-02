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
import { useGetEntryCardRevisions } from 'actions/modelCard'
import { useRouter } from 'next/router'
import { useMemo, useState } from 'react'
import Loading from 'src/common/Loading'
import { Transition } from 'src/common/Transition'
import EntryCardRevision from 'src/entry/overview/EntryCardRevision'
import MessageAlert from 'src/MessageAlert'
import { EntryCardKindLabel, EntryCardRevisionInterface, EntryInterface, EntryKind } from 'types/types'
import { sortByCreatedAtDescending } from 'utils/arrayUtils'
import { toTitleCase } from 'utils/stringUtils'

type EntryCardHistoryDialogProps = {
  entry: EntryInterface
  setOpen: (isOpen: boolean) => void
}

export default function EntryCardHistoryDialog({ entry, setOpen }: EntryCardHistoryDialogProps) {
  const theme = useTheme()
  const router = useRouter()
  const { entryCardRevisions, isEntryCardRevisionsLoading, isEntryCardRevisionsError } = useGetEntryCardRevisions(
    entry.id,
  )
  const [compareWithVersion, setCompareWithVersion] = useState<number | undefined>(undefined)

  const entryKindPath =
    entry.kind === EntryKind.MIRRORED_MODEL || entry.kind === EntryKind.MODEL ? EntryKind.MODEL : entry.kind

  const buildHref = (entryCardRevision: EntryCardRevisionInterface) => {
    const queryParams = new URLSearchParams()
    if (compareWithVersion !== undefined) {
      queryParams.set('compareWith', String(compareWithVersion))
    }
    if (entryCardRevision.mirrored) {
      queryParams.set('mirrored', 'true')
    }
    const queryString = queryParams.toString()
    return `/${entryKindPath}/${entry.id}/history/${entryCardRevision.version}${queryString ? `?${queryString}` : ''}`
  }

  const sortedEntryCardRevisions = useMemo(
    () =>
      entryCardRevisions.sort(sortByCreatedAtDescending).map((entryCardRevision) => (
        <EntryCardRevision
          onRowClick={() => {
            router.push(buildHref(entryCardRevision))
          }}
          onCompareSelect={() => {
            if (compareWithVersion === entryCardRevision.version) {
              setCompareWithVersion(undefined)
            } else {
              setCompareWithVersion(entryCardRevision.version)
            }
          }}
          isCompareSelected={compareWithVersion === entryCardRevision.version}
          key={entryCardRevision.version}
          entryCard={entryCardRevision}
          entryKind={entry.kind}
        />
      )),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [entry.id, entry.kind, entryKindPath, entryCardRevisions, compareWithVersion, router],
  )

  if (isEntryCardRevisionsError) {
    return <MessageAlert message={isEntryCardRevisionsError.info.message} severity='error' />
  }

  return (
    <>
      {isEntryCardRevisionsLoading && <Loading />}
      <Dialog open onClose={() => setOpen(false)} fullWidth maxWidth='sm' slots={{ transition: Transition }}>
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
                <TableCell>Compare</TableCell>
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
