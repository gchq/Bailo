import {
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import Dialog from '@mui/material/Dialog'
import { useTheme } from '@mui/material/styles'
import { useState } from 'react'
import { Transition } from 'src/common/Transition'
import UserDisplay from 'src/common/UserDisplay'
import { EntryCardRevisionInterface } from 'types/types'
import { formatDateTimeString } from 'utils/dateUtils'

export type EntryCardSnapshot = {
  key: string
  local?: number
  mirrored?: number
  createdAt: string
  createdBy: string
  changedStream: 'local' | 'mirrored'
  changedVersion: number
}

type EntryCardSnapshotSelectorProps = {
  snapshots: EntryCardSnapshot[]
  selected?: EntryCardSnapshot
  disabled?: boolean
  isSnapshotDisabled?: (snapshot: EntryCardSnapshot) => boolean
  onSelect: (snapshot: EntryCardSnapshot) => void
}

export type EntryCardSnapshotStream = 'local' | 'mirrored'

export function buildSnapshots(
  revisions: EntryCardRevisionInterface[],
  stream?: EntryCardSnapshotStream,
): EntryCardSnapshot[] {
  const ordered = [...revisions]
    .filter((revision) => stream === undefined || revision.mirrored === (stream === 'mirrored'))
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())

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

const SnapshotVersions = ({ snapshot }: { snapshot?: EntryCardSnapshot }) => {
  const theme = useTheme()

  if (!snapshot) {
    return <Typography variant='body2'>No revision selected</Typography>
  }

  const changedIsLocal = snapshot.changedStream === 'local'
  const versionStyle = (isChanged: boolean) => ({
    color: isChanged ? theme.palette.secondary.main : theme.palette.text.secondary,
    fontWeight: isChanged ? 'bold' : undefined,
    fontStyle: isChanged ? undefined : 'italic',
  })

  return (
    <Stack spacing={0}>
      {snapshot.local !== undefined && (
        <Typography variant='body2' sx={versionStyle(changedIsLocal)}>
          {`v${snapshot.local}`}
        </Typography>
      )}
      {snapshot.mirrored !== undefined && (
        <Typography variant='body2' sx={versionStyle(!changedIsLocal)}>
          {`Mirrored v${snapshot.mirrored}`}
        </Typography>
      )}
    </Stack>
  )
}

export default function EntryCardSnapshotSelector({
  snapshots,
  selected,
  disabled = false,
  isSnapshotDisabled = () => false,
  onSelect,
}: EntryCardSnapshotSelectorProps) {
  const theme = useTheme()
  const [open, setOpen] = useState(false)

  const selectSnapshot = (snapshot: EntryCardSnapshot) => {
    if (disabled || isSnapshotDisabled(snapshot)) {
      return
    }

    onSelect(snapshot)
    setOpen(false)
  }

  return (
    <>
      {selected && (
        <Paper
          component='button'
          type='button'
          variant='outlined'
          disabled={disabled}
          onClick={() => setOpen(true)}
          aria-haspopup='dialog'
          sx={{
            p: 2,
            height: '100%',
            textAlign: 'left',
            cursor: disabled ? 'default' : 'pointer',
            '&:hover': disabled ? undefined : { backgroundColor: 'action.hover' },
          }}
        >
          <Stack spacing={1} direction='row' sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <Stack>
              <SnapshotVersions snapshot={selected} />
              <Stack direction='row' spacing={0.5} sx={{ alignItems: 'center' }}>
                <UserDisplay dn={selected.createdBy} />
                <Typography variant='caption'>{formatDateTimeString(selected.createdAt)}</Typography>
              </Stack>
            </Stack>
          </Stack>
        </Paper>
      )}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        fullWidth
        maxWidth='sm'
        slots={{ transition: Transition }}
        aria-labelledby='revision-selector-title'
      >
        <DialogTitle id='revision-selector-title'>Card History</DialogTitle>
        <DialogContent dividers sx={{ p: 0, maxHeight: '60vh' }}>
          <TableContainer component={Paper}>
            <Table stickyHeader aria-label='Card revision' sx={{ minWidth: 550 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Version</TableCell>
                  <TableCell>Created By</TableCell>
                  <TableCell>Created At</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {[...snapshots].reverse().map((snapshot) => {
                  const isSelected = selected?.key === snapshot.key
                  const isDisabled = disabled || isSnapshotDisabled(snapshot)
                  return (
                    <TableRow
                      hover={!isDisabled}
                      selected={isSelected}
                      key={snapshot.key}
                      onClick={() => selectSnapshot(snapshot)}
                      aria-disabled={isDisabled}
                      sx={{
                        height: 72,
                        '&:hover': { cursor: isDisabled ? 'default' : 'pointer' },
                        opacity: isDisabled ? 0.5 : 1,
                      }}
                    >
                      <TableCell>
                        <SnapshotVersions snapshot={snapshot} />
                      </TableCell>
                      <TableCell sx={{ color: theme.palette.primary.main }}>
                        <UserDisplay dn={snapshot.createdBy} />
                      </TableCell>
                      <TableCell sx={{ color: theme.palette.primary.main }}>
                        {formatDateTimeString(snapshot.createdAt)}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button color='secondary' variant='outlined' onClick={() => setOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
