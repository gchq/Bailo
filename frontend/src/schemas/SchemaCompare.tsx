import { Autocomplete, Container, Stack, TextField, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useGetSchemas } from 'actions/schema'
import { SyntheticEvent, useCallback, useMemo, useState } from 'react'
import ReactDiffViewer, { DiffMethod } from 'react-diff-viewer-continued'
import ComparisonSwapButton from 'src/common/ComparisonSwapButton'
import renderQueryState from 'src/common/renderQueryState'
import { SchemaInterface } from 'types/types'

export default function SchemaCompare() {
  const { schemas, isSchemasLoading, isSchemasError } = useGetSchemas()
  const theme = useTheme()

  const [beforeSchema, setBeforeSchema] = useState<SchemaInterface | null>(null)
  const [afterSchema, setAfterSchema] = useState<SchemaInterface | null>(null)

  const handleBeforeSchemaChange = useCallback((_event: SyntheticEvent, newValue: SchemaInterface | null) => {
    setBeforeSchema(newValue)
  }, [])

  const handleAfterSchemaChange = useCallback((_event: SyntheticEvent, newValue: SchemaInterface | null) => {
    setAfterSchema(newValue)
  }, [])

  const flipComparison = () => {
    const oldSchema = beforeSchema
    setBeforeSchema(afterSchema)
    setAfterSchema(oldSchema)
  }

  const schemaDiff = useMemo(() => {
    if (beforeSchema && afterSchema) {
      return (
        <ReactDiffViewer
          oldValue={JSON.stringify(beforeSchema, null, 2)}
          newValue={JSON.stringify(afterSchema, null, 2)}
          splitView={true}
          compareMethod={DiffMethod.WORDS}
          useDarkTheme={theme.palette.mode === 'dark'}
          styles={{
            gutter: {
              pre: {
                opacity: 1,
              },
            },
          }}
        />
      )
    } else {
      return <Typography sx={{ textAlign: 'center' }}>Please select two schemas to compare</Typography>
    }
  }, [beforeSchema, afterSchema, theme])

  const queryState = renderQueryState([isSchemasError], isSchemasLoading)
  if (queryState) {
    return queryState
  }

  return (
    <Container sx={{ my: 4 }}>
      <Stack spacing={4}>
        <Stack
          direction={{ md: 'column', lg: 'row' }}
          spacing={{ md: 2, lg: 4 }}
          sx={{
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Autocomplete
            disablePortal
            options={schemas}
            fullWidth
            size='small'
            getOptionDisabled={(option) => option.id === afterSchema?.id}
            getOptionLabel={(option: SchemaInterface) => option.name}
            sx={{ width: 300 }}
            renderInput={(params) => <TextField {...params} label='Source schema' />}
            onChange={handleBeforeSchemaChange}
          />
          <ComparisonSwapButton
            label='schema'
            onClick={flipComparison}
            disabled={!beforeSchema || !afterSchema}
            breakpoint='lg'
          />
          <Autocomplete
            disablePortal
            options={schemas}
            fullWidth
            size='small'
            getOptionDisabled={(option) => option.id === beforeSchema?.id}
            getOptionLabel={(option: SchemaInterface) => option.name}
            sx={{ width: 300 }}
            renderInput={(params) => <TextField {...params} label='Target schema' />}
            onChange={handleAfterSchemaChange}
          />
        </Stack>
        {schemaDiff}
      </Stack>
    </Container>
  )
}
