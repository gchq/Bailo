import CheckIcon from '@mui/icons-material/Check'
import CompareArrowsIcon from '@mui/icons-material/CompareArrows'
import { IconButton, Stack, TableBody, TableCell, TableRow, Tooltip, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useMemo } from 'react'
import UserDisplay from 'src/common/UserDisplay'
import { EntryCardRevisionInterface, EntryKindKeys } from 'types/types'
import { formatDateString } from 'utils/dateUtils'

type EntryCardRevisionProps = {
  entryCard: EntryCardRevisionInterface
  entryKind: EntryKindKeys
  onRowClick: () => void
  onCompareSelect: () => void
  isCompareSelected?: boolean
  hasCompareSelected?: boolean
  isMirrored: boolean
}

export default function EntryCardRevision({
  entryCard,
  onRowClick,
  onCompareSelect,
  isMirrored,
  isCompareSelected = false,
  hasCompareSelected = false,
}: EntryCardRevisionProps) {
  const theme = useTheme()

  const compareTooltipText = useMemo(() => {
    if (isCompareSelected) {
      return 'Selected to compare'
    }
    if (!hasCompareSelected) {
      return 'Select to compare'
    }
    return
  }, [hasCompareSelected, isCompareSelected])

  const canCompare = (isMirrored || entryCard.version !== 1) && !isCompareSelected

  return (
    <TableBody>
      <Tooltip
        title={
          isCompareSelected || !hasCompareSelected || entryCard.version === 1 ? undefined : 'Compare with selected'
        }
      >
        <TableRow
          hover={canCompare}
          selected={isCompareSelected}
          onClick={canCompare ? onRowClick : undefined}
          sx={canCompare ? { '&:hover': { cursor: 'pointer' } } : undefined}
        >
          <TableCell>
            <Stack
              direction='row'
              spacing={1}
              sx={{
                alignItems: 'center',
              }}
            >
              <Typography sx={{ color: theme.palette.secondary.main }}>{entryCard.version}</Typography>
              <Typography variant='caption'>{entryCard.mirrored && `(Mirrored)`}</Typography>
            </Stack>
          </TableCell>
          <TableCell sx={{ color: theme.palette.primary.main }}>
            <UserDisplay dn={entryCard.createdBy} />
          </TableCell>
          <TableCell sx={{ color: theme.palette.primary.main }}>{formatDateString(entryCard.createdAt)}</TableCell>
          {!!entryCard.metadata && (
            <TableCell sx={{ color: theme.palette.primary.main }}>
              <Tooltip title={compareTooltipText}>
                <IconButton
                  onClick={(event) => {
                    event.stopPropagation()
                    onCompareSelect()
                  }}
                >
                  {isCompareSelected ? <CheckIcon /> : <CompareArrowsIcon />}
                </IconButton>
              </Tooltip>
            </TableCell>
          )}
        </TableRow>
      </Tooltip>
    </TableBody>
  )
}
