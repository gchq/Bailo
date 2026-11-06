import { TableCell, TableRow, Typography } from '@mui/material'

interface EmptyTableRowProps {
  colSpan: number
  text?: string
}

/**
 * Renders a placeholder row spanning the table width, shown when there is no data to display.
 *
 * @param colSpan - Number of columns in the table, used to span the row.
 * @param text - Message to display. Defaults to 'No data found.'
 */
export function EmptyRow({ colSpan, text = 'No data found.' }: EmptyTableRowProps) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} align='center'>
        <Typography variant='body2' color='text.secondary' sx={{ py: 2 }}>
          {text}
        </Typography>
      </TableCell>
    </TableRow>
  )
}
