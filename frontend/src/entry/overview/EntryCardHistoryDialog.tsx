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
import EntryCardRevision, { EntryCardSnapshot } from 'src/entry/overview/EntryCardRevision'
import MessageAlert from 'src/MessageAlert'
import { EntryCardKindLabel, EntryCardRevisionInterface, EntryInterface, EntryKind } from 'types/types'
import { toTitleCase } from 'utils/stringUtils'

type EntryCardHistoryDialogProps = {
  entry: EntryInterface
  setOpen: (isOpen: boolean) => void
}

const MAX_SELECTED = 2

export function buildSnapshots(revisions: EntryCardRevisionInterface[]): EntryCardSnapshot[] {
  const ordered = [...revisions].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())

  let currentLocal: number | undefined
  let currentMirrored: number | undefined
  const snapshots: EntryCardSnapshot[] = []

  for (const revision of ordered) {
    if (revision.mirrored) {
      currentMirrored = revision.version
    } else {
      currentLocal = revision.version
    }
    snapshots.push({
      key: `local${currentLocal ?? '_'}-mirrored${currentMirrored ?? '_'}-@${revision.createdAt}`,
      local: currentLocal,
      mirrored: currentMirrored,
      createdAt: revision.createdAt,
      createdBy: revision.createdBy,
      changedStream: revision.mirrored ? 'mirrored' : 'local',
      changedVersion: revision.version,
    })
  }

  return snapshots
}

export default function EntryCardHistoryDialog({ entry, setOpen }: EntryCardHistoryDialogProps) {
  const theme = useTheme()
  const router = useRouter()
  const { entryCardRevisions, isEntryCardRevisionsLoading, isEntryCardRevisionsError } = useGetEntryCardRevisions(
    entry.id,
  )
  const [selected, setSelected] = useState<EntryCardSnapshot[]>([])

  const comparePath = entry.kind === EntryKind.DATA_CARD ? '/data-card/compare' : '/model-card/compare'

  // Oldest-first snapshot list.
  const snapshotsOldestFirst = useMemo(() => buildSnapshots(entryCardRevisions), [entryCardRevisions])

  // Newest-first for display in the table.
  const snapshotsNewestFirst = useMemo(() => [...snapshotsOldestFirst].reverse(), [snapshotsOldestFirst])

  const buildHref = (from: EntryCardSnapshot, to?: EntryCardSnapshot): string => {
    const query = new URLSearchParams()
    query.set('fromEntry', entry.id)
    if (to) {
      query.set('toEntry', entry.id)
    }

    if (from.local !== undefined) {
      query.set('fromVersion', String(from.local))
    }
    if (from.mirrored !== undefined) {
      query.set('fromMirroredVersion', String(from.mirrored))
    }
    if (to?.local !== undefined) {
      query.set('toVersion', String(to.local))
    }
    if (to?.mirrored !== undefined) {
      query.set('toMirroredVersion', String(to.mirrored))
    }

    return `${comparePath}?${query.toString()}`
  }

  const isSelected = (snapshot: EntryCardSnapshot) => selected.some((s) => s.key === snapshot.key)

  const toggleSelection = (snapshot: EntryCardSnapshot) => {
    setSelected((current) => {
      const alreadySelected = current.some((s) => s.key === snapshot.key)
      if (alreadySelected) {
        return current.filter((s) => s.key !== snapshot.key)
      }
      if (current.length >= MAX_SELECTED) {
        return current
      }
      return [...current, snapshot]
    })
  }

  const compareEnabled = selected.length === MAX_SELECTED

  const onCompareSelected = () => {
    if (!compareEnabled) {
      return
    }
    const sorted = [...selected].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    router.push(buildHref(sorted[0], sorted[1]))
  }

  const renderedSnapshots = useMemo(
    () =>
      snapshotsNewestFirst.map((snapshot) => {
        const checked = isSelected(snapshot)
        const hideCheckbox = selected.length >= MAX_SELECTED && !checked
        return (
          <EntryCardRevision
            key={snapshot.key}
            snapshot={snapshot}
            entryKind={entry.kind}
            isChecked={checked}
            hideCheckbox={hideCheckbox}
            onRowClick={() => {
              router.push(buildHref(snapshot))
            }}
            onCheckToggle={() => toggleSelection(snapshot)}
          />
        )
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [snapshotsNewestFirst, selected, entry.id, entry.kind, router],
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
            {renderedSnapshots}
          </Table>
        </TableContainer>
        <DialogActions>
          <Button color='primary' variant='contained' disabled={!compareEnabled} onClick={onCompareSelected}>
            Compare revisions
          </Button>
          <Button color='secondary' variant='outlined' onClick={() => setOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
