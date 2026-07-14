import { Checkbox, Stack, TableBody, TableCell, TableRow, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import UserDisplay from 'src/common/UserDisplay'
import { EntryKindKeys } from 'types/types'
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

type EntryCardRevisionProps = {
  snapshot: EntryCardSnapshot
  entryKind: EntryKindKeys
  onRowClick: () => void
  onCheckToggle: () => void
  isChecked: boolean
  hideCheckbox: boolean
}

export default function EntryCardRevision({
  snapshot,
  onRowClick,
  onCheckToggle,
  isChecked,
  hideCheckbox,
}: EntryCardRevisionProps) {
  const theme = useTheme()

  const changedIsLocal = snapshot.changedStream === 'local'
  const primaryColor = theme.palette.secondary.main
  const mutedColor = theme.palette.text.secondary

  const versionStyle = (isChanged: boolean) => ({
    color: isChanged ? primaryColor : mutedColor,
    fontWeight: isChanged ? 'bold' : undefined,
    fontStyle: isChanged ? undefined : 'italic',
  })

  return (
    <TableBody>
      <TableRow
        hover={snapshot.local !== 1}
        selected={isChecked}
        onClick={snapshot.local !== 1 ? onRowClick : () => {}}
        sx={{ '&:hover': { cursor: snapshot.local !== 1 ? 'pointer' : 'default' } }}
      >
        <TableCell>
          <Stack direction='column' spacing={0}>
            {snapshot.local !== undefined && (
              <Typography sx={versionStyle(changedIsLocal)}>{`v${snapshot.local}`}</Typography>
            )}
            {snapshot.mirrored !== undefined && (
              <Typography sx={versionStyle(!changedIsLocal)}>{`Mirrored v${snapshot.mirrored}`}</Typography>
            )}
          </Stack>
        </TableCell>
        <TableCell sx={{ color: theme.palette.primary.main }}>
          <UserDisplay dn={snapshot.createdBy} />
        </TableCell>
        <TableCell sx={{ color: theme.palette.primary.main }}>{formatDateTimeString(snapshot.createdAt)}</TableCell>
        <TableCell sx={{ color: theme.palette.primary.main }}>
          {snapshot.local !== 1 && (
            <Checkbox
              checked={isChecked}
              onClick={(event) => event.stopPropagation()}
              onChange={onCheckToggle}
              disabled={hideCheckbox}
            />
          )}
        </TableCell>
      </TableRow>
    </TableBody>
  )
}
