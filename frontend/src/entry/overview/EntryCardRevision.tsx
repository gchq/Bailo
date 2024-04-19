import { TableBody, TableCell, TableRow } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useRouter } from 'next/router'
import { EntryCardRevisionInterface } from 'types/types'
import { formatDateString } from 'utils/dateUtils'

type EntryCardRevisionProps = {
  modelCard: EntryCardRevisionInterface
}

export default function EntryCardRevision({ modelCard }: EntryCardRevisionProps) {
  const router = useRouter()
  const theme = useTheme()

  return (
    <TableBody>
      <TableRow
        hover
        onClick={() => router.push(`/model/${modelCard.modelId}/history/${modelCard.version}`)}
        sx={{ '&:hover': { cursor: 'pointer' } }}
      >
        <TableCell sx={{ color: theme.palette.secondary.main }}>{modelCard.version}</TableCell>
        <TableCell sx={{ color: theme.palette.primary.main }}>{modelCard.createdBy}</TableCell>
        <TableCell sx={{ color: theme.palette.primary.main }}>{formatDateString(modelCard.createdAt)}</TableCell>
      </TableRow>
    </TableBody>
  )
}
