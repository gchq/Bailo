import { TableCell, TableHead, TableRow } from '@mui/material'

export default function ModelCardHistoryHeaderTable() {
  return (
    <TableHead>
      <TableRow>
        <TableCell>Version</TableCell>
        <TableCell>Created By</TableCell>
        <TableCell>Created At</TableCell>
      </TableRow>
    </TableHead>
  )
}
