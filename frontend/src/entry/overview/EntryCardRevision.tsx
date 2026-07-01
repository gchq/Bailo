import CheckIcon from '@mui/icons-material/Check'
import CompareArrowsIcon from '@mui/icons-material/CompareArrows'
import { IconButton, Stack, TableBody, TableCell, TableRow, Tooltip, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import UserDisplay from 'src/common/UserDisplay'
import { EntryCardRevisionInterface, EntryKindKeys } from 'types/types'
import { formatDateString } from 'utils/dateUtils'

type EntryCardRevisionProps = {
  entryCard: EntryCardRevisionInterface
  entryKind: EntryKindKeys
  onRowClick: () => void
  onCompareSelect: () => void
  isCompareSelected?: boolean
}

export default function EntryCardRevision({
  entryCard,
  onRowClick,
  onCompareSelect,
  isCompareSelected = false,
}: EntryCardRevisionProps) {
  const theme = useTheme()

  return (
    <TableBody>
      <TableRow
        hover={entryCard.version !== 1}
        selected={isCompareSelected}
        onClick={entryCard.version !== 1 ? onRowClick : undefined}
        sx={entryCard.version !== 1 ? { '&:hover': { cursor: 'pointer' } } : undefined}
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
            <Tooltip title={isCompareSelected ? 'Selected for compare' : 'Select for compare'}>
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
    </TableBody>
  )
}
