import { Checkbox, Stack, TableBody, TableCell, TableRow, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { type KeyboardEvent } from 'react'
import UserDisplay from 'src/common/UserDisplay'
import Link from 'src/Link'
import { type EntryKindKeys } from 'types/types'
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
  href: string
  onRowClick: () => void
  onCheckToggle: () => void
  isChecked: boolean
  hideCheckbox: boolean
}

export default function EntryCardRevision({
  snapshot,
  href,
  onRowClick,
  onCheckToggle,
  isChecked,
  hideCheckbox,
}: EntryCardRevisionProps) {
  const theme = useTheme()

  const changedIsLocal = snapshot.changedStream === 'local'
  const primaryColor = theme.palette.secondary.main
  const mutedColor = theme.palette.text.secondary

  const versionLabel = [
    snapshot.local !== undefined ? `v${snapshot.local}` : undefined,
    snapshot.mirrored !== undefined ? `Mirrored v${snapshot.mirrored}` : undefined,
  ]
    .filter(Boolean)
    .join(', ')

  // Keys from the checkbox bubble up to the row, so only act when the row itself has focus
  const onRowKeyDown = (event: KeyboardEvent<HTMLTableRowElement>) => {
    if (event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault()
      onRowClick()
    }
  }

  const versionStyle = (isChanged: boolean) => ({
    color: isChanged ? primaryColor : mutedColor,
    fontWeight: isChanged ? 'bold' : undefined,
    fontStyle: isChanged ? undefined : 'italic',
  })

  // Only the changed version is a link, so the unchanged one stays plain text
  const renderVersion = (isChanged: boolean, label: string) =>
    isChanged ? (
      <Link
        href={href}
        variant='body2'
        underline='always'
        onClick={(event) => event.stopPropagation()}
        sx={versionStyle(true)}
      >
        {label}
      </Link>
    ) : (
      <Typography variant='body2' sx={versionStyle(false)}>
        {label}
      </Typography>
    )

  return (
    <TableBody>
      <TableRow tabIndex={0} selected={isChecked} onClick={onRowClick} onKeyDown={onRowKeyDown}>
        <TableCell>
          <Stack direction='column' spacing={0}>
            {snapshot.local !== undefined && renderVersion(changedIsLocal, `v${snapshot.local}`)}
            {snapshot.mirrored !== undefined && renderVersion(!changedIsLocal, `Mirrored v${snapshot.mirrored}`)}
          </Stack>
        </TableCell>
        <TableCell sx={{ color: theme.palette.primary.main }}>
          <UserDisplay dn={snapshot.createdBy} />
        </TableCell>
        <TableCell sx={{ color: theme.palette.primary.main }}>{formatDateTimeString(snapshot.createdAt)}</TableCell>
        <TableCell sx={{ color: theme.palette.primary.main }}>
          <Checkbox
            checked={isChecked}
            slotProps={{ input: { 'aria-label': `Select ${versionLabel} for comparison` } }}
            onClick={(event) => event.stopPropagation()}
            onChange={onCheckToggle}
            disabled={hideCheckbox}
            sx={{ '&:hover': { backgroundColor: 'transparent' } }}
          />
        </TableCell>
      </TableRow>
    </TableBody>
  )
}
