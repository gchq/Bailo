import { TableBody, TableCell, TableRow } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useRouter } from 'next/router'
import UserDisplay from 'src/common/UserDisplay'
import { EntryCardRevisionInterface, EntryKindKeys } from 'types/types'
import { formatDateString } from 'utils/dateUtils'

type EntryCardRevisionProps = {
  entryCard: EntryCardRevisionInterface
  kind: EntryKindKeys
}

export default function EntryCardRevision({ entryCard, kind }: EntryCardRevisionProps) {
  const router = useRouter()
  const theme = useTheme()

  return (
    <TableBody>
      <TableRow
        hover
        onClick={() => router.push(`/${kind}/${entryCard.modelId}/history/${entryCard.version}`)}
        sx={{ '&:hover': { cursor: 'pointer' } }}
      >
        <TableCell sx={{ color: theme.palette.secondary.main }}>{entryCard.version}</TableCell>
        <TableCell sx={{ color: theme.palette.primary.main }}>
          <UserDisplay dn={entryCard.createdBy} />
        </TableCell>
        <TableCell sx={{ color: theme.palette.primary.main }}>{formatDateString(entryCard.createdAt)}</TableCell>
      </TableRow>
    </TableBody>
  )
}
