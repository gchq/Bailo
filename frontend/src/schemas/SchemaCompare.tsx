import { Forward } from '@mui/icons-material'
import { Autocomplete, Box, Stack, TextField, Typography } from '@mui/material'
import { useGetSchemas } from 'actions/schema'
import { SyntheticEvent, useCallback, useState } from 'react'
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

  if (isSchemasError) {
    return <MessageAlert message={isSchemasError.info.message} severity='error' />
  }

  if (isSchemasLoading) {
    return <Loading />
  }

  return (
    <Box sx={{ p: 4 }}>
      <Stack spacing={4}>
        <Stack direction='row' spacing={12} justifyContent='center' alignItems='center'>
          <Autocomplete
            disablePortal
            options={schemas}
            fullWidth
            size='small'
            getOptionDisabled={(option) => option.id === afterSchema?.id}
            getOptionLabel={(option: SchemaInterface) => option.name}
            sx={{ width: 300 }}
            renderInput={(params) => <TextField {...params} label='Schema ' />}
            onChange={handleBeforeSchemaChange}
          />
          <Forward color='primary' fontSize='large' />
          <Autocomplete
            disablePortal
            options={schemas}
            fullWidth
            size='small'
            getOptionDisabled={(option) => option.id === beforeSchema?.id}
            getOptionLabel={(option: SchemaInterface) => option.name}
            sx={{ width: 300 }}
            renderInput={(params) => <TextField {...params} label='Schema' />}
            onChange={handleAfterSchemaChange}
          />
        </Stack>
        {beforeSchema && afterSchema ? (
          <ReactDiffViewer
            oldValue={JSON.stringify(beforeSchema, null, 2)}
            newValue={JSON.stringify(afterSchema, null, 2)}
            splitView={true}
            compareMethod={DiffMethod.WORDS}
          />
        ) : (
          <Typography sx={{ textAlign: 'center' }}>Please select two schemas to compare</Typography>
        )}
      </Stack>
    </Box>
  )
}
