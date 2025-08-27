import { Forward } from '@mui/icons-material'
import {
  Autocomplete,
  Box,
  Container,
  MenuItem,
  Select,
  SelectChangeEvent,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useGetSchemas } from 'actions/schema'
import { SyntheticEvent, useCallback, useState } from 'react'
import Loading from 'src/common/Loading'
import MessageAlert from 'src/MessageAlert'
import SchemaMigrator from 'src/schemas/SchemaMigrator'
import { SchemaInterface } from 'types/types'

export default function SchemaMigrationSelector() {
  const { schemas, isSchemasLoading, isSchemasError } = useGetSchemas()

  const [beforeSchema, setBeforeSchema] = useState<SchemaInterface | null>()
  const [afterSchema, setAfterSchema] = useState<SchemaInterface | null>()

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
            renderInput={(params) => <TextField {...params} label='Old schema ' />}
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
            renderInput={(params) => <TextField {...params} label='New schema' />}
            onChange={handleAfterSchemaChange}
          />
        </Stack>
        {beforeSchema && afterSchema ? (
          <SchemaMigrator
            sourceSchema={schemas.find((schema) => schema.id === beforeSchema.id)}
            targetSchema={schemas.find((schema) => schema.id === afterSchema.id)}
          ></SchemaMigrator>
        ) : (
          <Typography sx={{ textAlign: 'center' }}>Please select two schemas to migrate</Typography>
        )}
      </Stack>
    </Box>
  )
}
