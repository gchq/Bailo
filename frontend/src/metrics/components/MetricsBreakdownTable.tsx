import { Box, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useMemo } from 'react'
import { EmptyRow } from 'src/common/table/EmptyRow'
import { LoadingRows } from 'src/common/table/LoadingRows'
import UserDisplay from 'src/common/UserDisplay'
import Link from 'src/Link'
import { EntryKindLabel, ModelBreakdown } from 'types/types'
import { entryKindForRedirect } from 'utils/routerUtils'
import { toTitleCase } from 'utils/stringUtils'

interface MetricsBreakdownTableProps {
  title?: string
  headers: string[]
  data: ModelBreakdown[]
  isLoading?: boolean
}

export function MetricsBreakdownTable({ title, headers, data, isLoading = false }: MetricsBreakdownTableProps) {
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
            <Link
              href={`/${entryKindForRedirect(row.entryKind)}/${row.entryId}`}
              target='_blank'
              rel='noopener noreferrer'
            >
              {row.entryId}
            </Link>
          </Typography>
        </TableCell>
        <TableCell>{row.entryName}</TableCell>
        <TableCell>{toTitleCase(EntryKindLabel[row.entryKind])}</TableCell>
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
              {headers.map((header) => (
                <TableCell key={header}>{header}</TableCell>
              ))}
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
