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

type CompareSelection = {
  version: number
  mirrored: boolean
}

export default function EntryCardHistoryDialog({ entry, setOpen }: EntryCardHistoryDialogProps) {
  const theme = useTheme()
  const router = useRouter()
  const { entryCardRevisions, isEntryCardRevisionsLoading, isEntryCardRevisionsError } = useGetEntryCardRevisions(
    entry.id,
  )
  const [compareWith, setCompareWith] = useState<CompareSelection | undefined>(undefined)

  const entryKindPath =
    entry.kind === EntryKind.MIRRORED_MODEL || entry.kind === EntryKind.MODEL ? EntryKind.MODEL : entry.kind

  const comparePath = entry.kind === EntryKind.DATA_CARD ? '/data-card/compare' : '/model-card/compare'

  const isMirroredEntry = !!entry.settings.mirror?.sourceModelId

  const latestLocalRevision = useMemo(
    () =>
      [...entryCardRevisions]
        .filter((revision) => revision.version !== 1 && !revision.mirrored)
        .sort(sortByCreatedAtDescending)[0],
    [entryCardRevisions],
  )
  const latestMirroredRevision = useMemo(
    () =>
      [...entryCardRevisions]
        .filter((revision) => revision.version !== 1 && revision.mirrored)
        .sort(sortByCreatedAtDescending)[0],
    [entryCardRevisions],
  )

  const buildHref = (revision: EntryCardRevisionInterface) => {
    const query = new URLSearchParams()
    query.set('fromModel', entry.id)
    query.set('toModel', entry.id)

    // Start each side pinned to the latest of each stream so the diff opens with both mirrored
    // and additional-information cards populated.
    const fromLocal = latestLocalRevision?.version
    const fromMirrored = latestMirroredRevision?.version
    let toLocal = latestLocalRevision?.version
    let toMirrored = latestMirroredRevision?.version

    // The clicked row overrides the "to" side of the matching stream.
    if (revision.mirrored) {
      toMirrored = revision.version
    } else {
      toLocal = revision.version
    }

    // A selected "compare with" row overrides the "from" side of the matching stream.
    const fromLocalOverride = compareWith && !compareWith.mirrored ? compareWith.version : fromLocal
    const fromMirroredOverride = compareWith && compareWith.mirrored ? compareWith.version : fromMirrored

    if (fromLocalOverride !== undefined) {
      query.set('fromVersion', String(fromLocalOverride))
    }
    if (fromMirroredOverride !== undefined) {
      query.set('fromMirroredVersion', String(fromMirroredOverride))
    }
    if (toLocal !== undefined) {
      query.set('toVersion', String(toLocal))
    }
    if (toMirrored !== undefined) {
      query.set('toMirroredVersion', String(toMirrored))
    }
    return `${comparePath}?${query.toString()}`
  }

  const sortedEntryCardRevisions = useMemo(
    () =>
      entryCardRevisions.sort(sortByCreatedAtDescending).map((entryCardRevision) => (
        <EntryCardRevision
          onRowClick={() => {
            router.push(buildHref(entryCardRevision))
          }}
          onCompareSelect={() => {
            if (
              compareWith &&
              compareWith.version === entryCardRevision.version &&
              compareWith.mirrored === entryCardRevision.mirrored
            ) {
              setCompareWith(undefined)
            } else {
              setCompareWith({ version: entryCardRevision.version, mirrored: entryCardRevision.mirrored })
            }
          }}
          isMirrored={isMirroredEntry}
          hasCompareSelected={compareWith !== undefined}
          isCompareSelected={
            !!compareWith &&
            compareWith.version === entryCardRevision.version &&
            compareWith.mirrored === entryCardRevision.mirrored
          }
          key={`${entryCardRevision.mirrored ? 'mirrored-' : ''}${entryCardRevision.version}`}
          entryCard={entryCardRevision}
          entryKind={entry.kind}
        />
      )),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [entry.id, entry.kind, entryKindPath, entryCardRevisions, compareWith, router],
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
