import { TableBody, TableCell, TableRow } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useRouter } from 'next/router'

import { ModelCardRevisionInterface } from '../../../types/v2/types'
import { formatDateString } from '../../../utils/dateUtils'

type revisionProp = {
  modelCard: ModelCardRevisionInterface
}

export default function ModelCardRevisionListDisplay({ modelCard }: revisionProp) {
  const router = useRouter()

  const theme = useTheme()

  return (
    <TableBody>
      <TableRow
        onClick={() => router.push(`/beta/model/${modelCard.modelId}/history/${modelCard.version}`)}
        sx={{ '&:hover': { cursor: 'pointer' } }}
        hover
      >
        <TableCell style={{ color: theme.palette.secondary.main }}>{modelCard.version}</TableCell>
        <TableCell style={{ color: theme.palette.primary.main }}>{modelCard.createdBy}</TableCell>
        <TableCell style={{ color: theme.palette.primary.main }}>{formatDateString(modelCard.createdAt)}</TableCell>
      </TableRow>
    </TableBody>
  )
}
