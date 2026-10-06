import { Skeleton, TableCell, TableRow } from '@mui/material'

interface LoadingRowsProps {
  columnCount: number
  rowCount?: number
}

/**
 * Renders a configurable number of skeleton table rows, shown while table data is loading.
 *
 * @param columnCount - Number of columns in the table, used to render one skeleton cell per column.
 * @param rowCount - Number of skeleton rows to render. Defaults to 5.
 */
export function LoadingRows({ columnCount, rowCount = 5 }: LoadingRowsProps) {
  return (
    <>
      {Array.from({ length: rowCount }).map((_, rowIndex) => (
        <TableRow key={rowIndex}>
          {Array.from({ length: columnCount }).map((_, colIndex) => (
            <TableCell key={colIndex}>
              <Skeleton variant='text' width='70%' />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  )
}
