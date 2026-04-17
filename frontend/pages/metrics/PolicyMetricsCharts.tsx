import { Box, List, ListItem, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import OverviewStatPanel from 'pages/metrics/OverviewStatPanel'
import { useMemo } from 'react'
import EmptyBlob from 'src/common/EmptyBlob'

interface PolicyMetricsChartsProps {
  data: any
}

export default function PolicywMetricsCharts({ data }: PolicyMetricsChartsProps) {
  const theme = useTheme()

  const tableRows = useMemo(() => {
    return data.models.map((row) => (
      <TableRow key={row.modelId} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
        <TableCell component='th' scope='row'>
          {row.modelId}
        </TableCell>
        <TableCell>{row.name}</TableCell>
        <TableCell>
          <List dense>
            {row.missingRoles.map((missingRole) => (
              <ListItem key={missingRole} sx={{ pl: 0 }}>
                {missingRole}
              </ListItem>
            ))}
          </List>
        </TableCell>
      </TableRow>
    ))
  }, [data.models])

  if (!data) {
    return <EmptyBlob text='Cannot find any metrics for selected organisation' />
  }

  const getMissingRoleCount = (role: string) => {
    const roleCount = data.summary.find((roleSummary) => roleSummary.role === role)
    if (roleCount) {
      return roleCount.count
    } else {
      return 0
    }
  }

  return (
    <Stack spacing={4}>
      <Stack spacing={2}>
        <Typography fontWeight='bold' variant='h6' color='primary'>
          General overview
        </Typography>
        <Stack direction={{ md: 'row', sm: 'column' }} spacing={2}>
          <OverviewStatPanel label='Total models missing MSRO' value={getMissingRoleCount('msro')} />
          <OverviewStatPanel label='Total models missing MTR' value={getMissingRoleCount('mtr')} />
          <OverviewStatPanel label='Total models missing Model Developer' value={getMissingRoleCount('owner')} />
        </Stack>
      </Stack>
      <Stack spacing={2}>
        <Typography fontWeight='bold' variant='h6' color='primary'>
          Models missing roles
        </Typography>
        <Box sx={{ backgroundColor: theme.palette.container.main, p: 2, borderRadius: 1 }}>
          <Table sx={{ minWidth: 650 }} size='small'>
            <TableHead>
              <TableRow>
                <TableCell>Model ID</TableCell>
                <TableCell>Model name</TableCell>
                <TableCell>Missing roles</TableCell>
                <TableCell>Created</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>{tableRows}</TableBody>
          </Table>
        </Box>
      </Stack>
    </Stack>
  )
}
