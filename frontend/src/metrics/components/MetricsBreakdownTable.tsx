import { Box, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useMemo } from 'react'
import { EmptyRow } from 'src/common/table/EmptyRow'
import { LoadingRows } from 'src/common/table/LoadingRows'
import UserDisplay from 'src/common/UserDisplay'
import Link from 'src/Link'
import { EntryKind, ModelBreakdown } from 'types/types'

interface MetricsBreakdownTableProps {
  title?: string
  data: ModelBreakdown[]
  isLoading?: boolean
}

function toFirstLetterUppercase(text?: string | null): string {
  return text ? `${text.charAt(0).toUpperCase()}${text.slice(1)}` : ''
}

function getLinkRoute(entryKind?: string | null): string {
  // Return the model route for all entries other than data cards
  return entryKind ? (entryKind === EntryKind.DATA_CARD ? EntryKind.DATA_CARD : EntryKind.MODEL) : ''
}

export function MetricsBreakdownTable({ title, data, isLoading = false }: MetricsBreakdownTableProps) {
  const theme = useTheme()

  const tableRows = useMemo(() => {
    return data.map((row) => (
      <TableRow
        key={row.entryId}
        sx={{
          '& .MuiTableCell-root': {
            py: 2,
          },
          '&:last-child td, &:last-child th': {
            border: 0,
          },
        }}
      >
        <TableCell component='th' scope='row'>
          <Typography sx={{ maxWidth: '500px' }}>
            <Link href={`/${getLinkRoute(row.entryKind)}/${row.entryId}`} target='_blank' rel='noopener noreferrer'>
              {row.entryId}
            </Link>
          </Typography>
        </TableCell>
        <TableCell>{row.entryName}</TableCell>
        <TableCell>{toFirstLetterUppercase(row.entryKind)}</TableCell>
        <TableCell>
          {row.modelOwners.length > 0 ? (
            row.modelOwners.map((owner) => <UserDisplay key={owner} dn={owner} />)
          ) : (
            <em>None</em>
          )}
        </TableCell>
      </TableRow>
    ))
  }, [data])

  return (
    <Stack spacing={2} sx={{ width: '100%' }}>
      {title && (
        <Typography sx={{ fontWeight: 'bold' }} variant='h6' color='primary'>
          {title}
        </Typography>
      )}
      <Box sx={{ backgroundColor: theme.palette.container.main, p: 2, borderRadius: 1 }}>
        <Table sx={{ minWidth: 300 }} size='small'>
          <TableHead>
            <TableRow>
              <TableCell>Entry ID</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Kind</TableCell>
              <TableCell>Owner</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading && <LoadingRows columnCount={3} />}
            {!isLoading && data.length === 0 && <EmptyRow colSpan={3} text='No entries found.' />}
            {!isLoading && tableRows}
          </TableBody>
        </Table>
      </Box>
    </Stack>
  )
}
