import CloseIcon from '@mui/icons-material/Close'
import {
  Button,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { type Registry, type RJSFSchema } from '@rjsf/utils'
import { type ReactNode } from 'react'
import DiffMark from 'src/common/InlineDiff/DiffMark'
import InlineTypographyDiff from 'src/common/InlineDiff/InlineTypographyDiff'
import { alignKeyedRows } from 'src/common/InlineDiff/rowAlignment'
import LimitedTextField from 'src/common/LimitedTextField'
import getCompareFieldState from 'src/hooks/useCompareField'
import MessageAlert from 'src/MessageAlert'
import AdditionalInformation from 'src/MuiForms/AdditionalInformation'

export type TableRowValue = Record<string, string>

type RowPair = { from?: TableRowValue; to?: TableRowValue }

interface Column {
  key: string
  title: string
}

interface TableWidgetProps {
  onChange: (newValue: TableRowValue[]) => void
  value?: TableRowValue[]
  label: string
  id: string
  registry?: Registry
  required?: boolean
  schema: RJSFSchema
}

const normaliseCell = (value: string | undefined) => (value ?? '').toLowerCase()

/** Columns come from the item properties in schema order, using each property title as the heading. */
function getColumns(schema: RJSFSchema): Column[] {
  const items = schema.items as RJSFSchema | undefined
  return Object.entries(items?.properties ?? {}).map(([key, property]) => ({
    key,
    title: typeof property === 'object' && property.title ? property.title : key,
  }))
}

/** Pairs old and new rows by the first column, treating a row as edited if any other column still matches. */
function alignRows(from: TableRowValue[], to: TableRowValue[], columns: Column[]): RowPair[] {
  const [keyColumn, ...otherColumns] = columns
  return alignKeyedRows(
    from.map((row) => normaliseCell(row[keyColumn?.key])),
    to.map((row) => normaliseCell(row[keyColumn?.key])),
    (fromIndex, toIndex) =>
      otherColumns.some(
        (column) => normaliseCell(from[fromIndex][column.key]) === normaliseCell(to[toIndex][column.key]),
      ),
  ).map(({ from: fromIndex, to: toIndex }) => ({
    from: fromIndex === undefined ? undefined : from[fromIndex],
    to: toIndex === undefined ? undefined : to[toIndex],
  }))
}

function CellDiff({ pair, columnKey }: { pair: RowPair; columnKey: string }) {
  if (pair.from && pair.to) {
    return <InlineTypographyDiff from={pair.from[columnKey] ?? ''} to={pair.to[columnKey] ?? ''} />
  }

  const row = pair.to ?? pair.from

  return (
    <DiffMark operation={pair.to ? 'insert' : 'delete'}>
      <Typography component='span'>{row?.[columnKey] ?? ''}</Typography>
    </DiffMark>
  )
}

export default function TableWidget({ onChange, value, label, id, registry, required, schema }: TableWidgetProps) {
  const theme = useTheme()
  const rows = value ?? []
  const columns = getColumns(schema)

  if (!registry || !registry.formContext) {
    return <MessageAlert message='Unable to render widget due to missing context' severity='error' />
  }

  const compare = getCompareFieldState<TableRowValue[]>(id, registry.formContext)

  const handleAddRow = () => onChange([...rows, Object.fromEntries(columns.map((column) => [column.key, '']))])

  const handleCellChange = (rowIndex: number, columnKey: string, cellValue: string) =>
    onChange(rows.map((row, index) => (index === rowIndex ? { ...row, [columnKey]: cellValue } : row)))

  const handleDeleteRow = (rowIndex: number) => onChange(rows.filter((_row, index) => index !== rowIndex))

  const tableRows = (current?: TableRowValue[], compareWith?: TableRowValue[]) => {
    // Outside compare mode every row is shown as-is, so there is nothing to pair
    const pairs: RowPair[] = compare.inCompareMode
      ? alignRows(compareWith ?? [], current ?? [], columns)
      : (current ?? []).map((row) => ({ to: row }))

    return pairs.map((pair, index) => (
      <TableRow key={index} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
        {columns.map((column) => (
          <TableCell key={column.key} sx={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap', verticalAlign: 'top' }}>
            {compare.inCompareMode ? <CellDiff pair={pair} columnKey={column.key} /> : pair.to?.[column.key]}
          </TableCell>
        ))}
      </TableRow>
    ))
  }

  const renderTable = (body: ReactNode) => (
    <TableContainer component={Paper}>
      <Table size='small'>
        <TableHead>
          <TableRow>
            {columns.map((column) => (
              <TableCell key={column.key}>{column.title}</TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>{body}</TableBody>
      </Table>
    </TableContainer>
  )

  // In compare mode the table is also shown when only the older version has rows, so removals are visible
  const compareFromRows = compare.inCompareMode ? (compare.compareFromState ?? []) : []
  const showTable = rows.length > 0 || compareFromRows.length > 0
  const hasMirroredRows =
    (compare.mirroredState ?? []).length > 0 || (compare.compareFromMirroredState ?? []).length > 0

  return (
    <AdditionalInformation
      editMode={compare.editMode}
      mirroredState={
        hasMirroredRows ? renderTable(tableRows(compare.mirroredState, compare.compareFromMirroredState)) : undefined
      }
      display={compare.isMirroredModel && rows.length > 0}
      label={label}
      required={required}
      id={id}
      mirroredModel={compare.isMirroredModel}
      description={schema.description}
    >
      {compare.editMode && (
        <Stack spacing={2}>
          {rows.map((row, rowIndex) => (
            <Stack key={rowIndex} direction='row' spacing={1} sx={{ alignItems: 'flex-start' }}>
              {columns.map((column) => (
                <LimitedTextField
                  key={column.key}
                  multiline
                  fullWidth
                  size='small'
                  label={column.title}
                  value={row[column.key] ?? ''}
                  onChange={(e) => handleCellChange(rowIndex, column.key, e.target.value)}
                  slotProps={{ htmlInput: { 'aria-label': `${column.title} row ${rowIndex + 1}` } }}
                />
              ))}
              <Tooltip title='Remove row'>
                <IconButton aria-label={`remove row ${rowIndex + 1}`} onClick={() => handleDeleteRow(rowIndex)}>
                  <CloseIcon sx={{ color: theme.palette.error.main }} />
                </IconButton>
              </Tooltip>
            </Stack>
          ))}
          <Button onClick={handleAddRow} aria-label='add row button' sx={{ width: 'fit-content' }}>
            Add row
          </Button>
        </Stack>
      )}
      {!compare.editMode && (
        <>
          {!compare.isMirroredModel && !showTable && (
            <Typography
              sx={{ fontStyle: 'italic', color: theme.palette.customTextInput?.main ?? theme.palette.text.secondary }}
            >
              Unanswered
            </Typography>
          )}
          {showTable && renderTable(tableRows(rows, compare.compareFromState))}
        </>
      )}
    </AdditionalInformation>
  )
}
