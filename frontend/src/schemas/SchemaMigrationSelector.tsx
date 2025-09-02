import { ArrowBack, Forward } from '@mui/icons-material'
import { Autocomplete, Box, Button, Stack, TextField, Typography } from '@mui/material'
import { useGetSchemas } from 'actions/schema'
import { SyntheticEvent, useCallback, useState } from 'react'
import Loading from 'src/common/Loading'
import MessageAlert from 'src/MessageAlert'
import SchemaMigrator from 'src/schemas/SchemaMigrator'
import { SchemaInterface } from 'types/types'

export default function SchemaMigrationSelector() {
  const { schemas, isSchemasLoading, isSchemasError } = useGetSchemas()

  const [sourceSchema, setSourceSchema] = useState<SchemaInterface | null>()
  const [targetSchema, setTargetSchema] = useState<SchemaInterface | null>()
  const [isMigrationPlannerActive, setIsMigrationPlannerActive] = useState(false)

  const handleSourceSchemaChange = useCallback((_event: SyntheticEvent, newValue: SchemaInterface | null) => {
    setSourceSchema(newValue)
  }, [])

  const handleTargetSchemaChange = useCallback((_event: SyntheticEvent, newValue: SchemaInterface | null) => {
    setTargetSchema(newValue)
  }, [])

  const handleReturnToSelection = () => {
    setIsMigrationPlannerActive(false)
    setTargetSchema(null)
    setSourceSchema(null)
  }

  if (isSchemasError) {
    return <MessageAlert message={isSchemasError.info.message} severity='error' />
  }

  if (isSchemasLoading) {
    return <Loading />
  }

  return (
    <Box sx={{ p: 4 }}>
      {isMigrationPlannerActive ? (
        <Stack spacing={1}>
          <Button
            size='small'
            sx={{ width: 'fit-content', pb: 2 }}
            startIcon={<ArrowBack />}
            onClick={handleReturnToSelection}
          >
            Back to schema selection
          </Button>
          <SchemaMigrator
            sourceSchema={schemas.find((schema) => sourceSchema && schema.id === sourceSchema.id)}
            targetSchema={schemas.find((schema) => targetSchema && schema.id === targetSchema.id)}
          ></SchemaMigrator>
        </Stack>
      ) : (
        <Stack spacing={4}>
          <Stack direction='row' spacing={6} justifyContent='center' alignItems='center'>
            <Autocomplete
              disablePortal
              options={schemas}
              fullWidth
              size='small'
              getOptionDisabled={(option) => option.id === targetSchema?.id}
              getOptionLabel={(option: SchemaInterface) => option.name}
              sx={{ width: 300 }}
              renderInput={(params) => <TextField {...params} label='Source schema ' />}
              onChange={handleSourceSchemaChange}
            />
            <Forward color='primary' fontSize='large' />
            <Autocomplete
              disablePortal
              options={schemas}
              fullWidth
              size='small'
              getOptionDisabled={(option) => option.id === sourceSchema?.id}
              getOptionLabel={(option: SchemaInterface) => option.name}
              sx={{ width: 300 }}
              renderInput={(params) => <TextField {...params} label='Target schema' />}
              onChange={handleTargetSchemaChange}
            />
          </Stack>
          <Typography sx={{ textAlign: 'center' }}>Please select two schemas to migrate</Typography>
          <Box textAlign='center'>
            <Button
              variant='contained'
              sx={{ width: 'max-content' }}
              onClick={() => setIsMigrationPlannerActive(true)}
              disabled={!sourceSchema || !targetSchema}
            >
              Begin migration
            </Button>
          </Box>
        </Stack>
      )}
    </Box>
  )
}
