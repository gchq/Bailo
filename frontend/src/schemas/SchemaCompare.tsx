import { Forward } from '@mui/icons-material'
import { Autocomplete, Box, Stack, TextField, Typography } from '@mui/material'
import { useGetSchemas } from 'actions/schema'
import { SyntheticEvent, useCallback, useMemo, useState } from 'react'
import ReactDiffViewer, { DiffMethod } from 'react-diff-viewer-continued'
import Loading from 'src/common/Loading'
import MessageAlert from 'src/MessageAlert'
import { SchemaInterface } from 'types/types'

export default function SchemaCompare() {
  const { schemas, isSchemasLoading, isSchemasError } = useGetSchemas()

  const [beforeSchema, setBeforeSchema] = useState<SchemaInterface | null>(null)
  const [afterSchema, setAfterSchema] = useState<SchemaInterface | null>(null)

  const handleBeforeSchemaChange = useCallback((_event: SyntheticEvent, newValue: SchemaInterface | null) => {
    setBeforeSchema(newValue)
  }, [])

  const handleAfterSchemaChange = useCallback((_event: SyntheticEvent, newValue: SchemaInterface | null) => {
    setAfterSchema(newValue)
  }, [])

  const schemaDiff = useMemo(() => {
    if (beforeSchema && afterSchema) {
      return (
        <ReactDiffViewer
          oldValue={JSON.stringify(beforeSchema, null, 2)}
          newValue={JSON.stringify(afterSchema, null, 2)}
          splitView={true}
          compareMethod={DiffMethod.WORDS}
        />
      )
    } else {
      return <Typography sx={{ textAlign: 'center' }}>Please select two schemas to compare</Typography>
    }
  }, [beforeSchema, afterSchema])

  if (isSchemasError) {
    return <MessageAlert message={isSchemasError.info.message} severity='error' />
  }

  if (isSchemasLoading) {
    return <Loading />
  }

  return (
    <Box sx={{ p: 4 }}>
      <Stack spacing={4}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={{ xs: 2, sm: 6 }}
          justifyContent='center'
          alignItems='center'
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
          <Forward color='primary' fontSize='large' aria-label='Compare arrow' />
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
    </Box>
  )
}
