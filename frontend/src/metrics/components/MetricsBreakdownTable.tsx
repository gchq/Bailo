import { Box, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useMemo } from 'react'
import { EmptyRow } from 'src/common/table/EmptyRow'
import { LoadingRows } from 'src/common/table/LoadingRows'
import UserDisplay from 'src/common/UserDisplay'
import Link from 'src/Link'
import { ModelBreakdown } from 'types/types'

interface MetricsBreakdownTableProps {
  title?: string
  data: ModelBreakdown[]
  isLoading?: boolean
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
            <Link href={`/model/${row.entryId}`} target='_blank' rel='noopener noreferrer'>
              {row.entryId}
            </Link>
          </Typography>
        </TableCell>
        <TableCell>{row.entryName}</TableCell>
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
              <TableCell>Model ID</TableCell>
              <TableCell>Model Name</TableCell>
              <TableCell>Owner</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading && <LoadingRows columnCount={3} />}
            {!isLoading && data.length === 0 && <EmptyRow colSpan={3} text='No models found.' />}
            {!isLoading && tableRows}
          </TableBody>
        </Table>
      </Box>
    </Stack>
  )
}
