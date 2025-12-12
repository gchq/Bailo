import { Stack, TableBody, TableCell, TableRow, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useRouter } from 'next/router'
import UserDisplay from 'src/common/UserDisplay'
import { EntryCardRevisionInterface, EntryKind, EntryKindKeys } from 'types/types'
import { formatDateString } from 'utils/dateUtils'

type EntryCardRevisionProps = {
  entryCard: EntryCardRevisionInterface
  entryKind: EntryKindKeys
}

export default function EntryCardRevision({ entryCard, entryKind }: EntryCardRevisionProps) {
  const router = useRouter()
  const theme = useTheme()

  return (
    <TableBody>
      <TableRow
        hover
        onClick={() =>
          router.push(
            `/${entryKind === EntryKind.MIRRORED_MODEL || entryKind === EntryKind.MODEL ? EntryKind.MODEL : entryKind}/${entryCard.modelId}/history/${entryCard.version}`,
          )
        }
        sx={{ '&:hover': { cursor: 'pointer' } }}
      >
        <TableCell>
          <Stack direction='row' alignItems='center' spacing={1}>
            <Typography sx={{ color: theme.palette.secondary.main }}>{entryCard.version}</Typography>
            <Typography variant='caption'>{entryCard.mirrored && `(Mirrored)`}</Typography>
          </Stack>
        </TableCell>
        <TableCell sx={{ color: theme.palette.primary.main }}>
          <UserDisplay dn={entryCard.createdBy} />
        </TableCell>
        <TableCell sx={{ color: theme.palette.primary.main }}>{formatDateString(entryCard.createdAt)}</TableCell>
      </TableRow>
    </TableBody>
  )
}
