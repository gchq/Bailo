import { Box, Skeleton, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useMemo } from 'react'
import UserDisplay from 'src/common/UserDisplay'
import Link from 'src/Link'
import { ModelBreakdown } from 'types/types'

interface MetricsBreakdownTableProps {
  title: string
  data: ModelBreakdown[]
  isLoading?: boolean
}

/** Rendered while data is being fetched. */
function LoadingRows() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <TableRow key={i}>
          <TableCell>
            <Skeleton variant='text' width='60%' />
          </TableCell>
          <TableCell>
            <Skeleton variant='text' width='80%' />
          </TableCell>
          <TableCell>
            <Skeleton variant='text' width='40%' />
          </TableCell>
        </TableRow>
      ))}
    </>
  )
}

/** Rendered when the query succeeds but returns nothing. */
function EmptyRow() {
  return (
    <TableRow>
      <TableCell colSpan={3} align='center'>
        <Typography variant='body2' color='text.secondary' sx={{ py: 2 }}>
          No models found.
        </Typography>
      </TableCell>
    </TableRow>
  )
}

export default function MetricsBreakdownTable({ title, data, isLoading = false }: MetricsBreakdownTableProps) {
  const theme = useTheme()

  const tableRows = useMemo(() => {
    return data.map((row) => (
      <TableRow key={row.entryId} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
        <TableCell component='th' scope='row'>
          <Typography sx={{ maxWidth: '500px' }}>
            <Link href={`/model/${row.entryId}`} target='_blank' rel='noopener noreferrer'>
              {row.entryId}
            </Link>
          </Typography>
        </TableCell>
        <TableCell>{row.entryName}</TableCell>
        <TableCell>
          {row.modelOwners.map((owner) => (
            <UserDisplay key={owner} dn={owner} />
          ))}
        </TableCell>
      </TableRow>
    ))
  }, [data])

  return (
    <Stack spacing={2} sx={{ width: '100%' }}>
      <Typography sx={{ fontWeight: 'bold' }} variant='h6' color='primary'>
        {title}
      </Typography>
      <Box sx={{ backgroundColor: theme.palette.container.main, p: 2, borderRadius: 1 }}>
        <Table sx={{ minWidth: 650 }} size='small'>
          <TableHead>
            <TableRow>
              <TableCell>Model ID</TableCell>
              <TableCell>Model Name</TableCell>
              <TableCell>Owner</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading && <LoadingRows />}
            {!isLoading && data.length === 0 && <EmptyRow />}
            {!isLoading && tableRows}
          </TableBody>
        </Table>
      </Box>
    </Stack>
  )
}
