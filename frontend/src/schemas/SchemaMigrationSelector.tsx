import { ArrowBack, Delete, Forward, InfoOutlined, MoveDown } from '@mui/icons-material'
import { Autocomplete, Box, Button, Divider, Stack, TextField, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
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

  const theme = useTheme()

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
            aria-label={'Return to schema select button'}
          >
            Back to schema selection
          </Button>
          <SchemaMigrator
            sourceSchema={schemas.find((schema) => sourceSchema && schema.id === sourceSchema.id)}
            targetSchema={schemas.find((schema) => targetSchema && schema.id === targetSchema.id)}
          ></SchemaMigrator>
        </Stack>
      ) : (
        <Stack spacing={4} alignItems='center'>
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
              aria-label={'Being schema migration button'}
            >
              Begin migration
            </Button>
          </Box>
          <Box
            sx={{
              borderStyle: 'solid',
              borderWidth: '1px',
              borderColor: theme.palette.divider,
              p: 2,
              maxWidth: '730px',
            }}
          >
            <Stack spacing={2}>
              <Stack direction='row' alignItems='center' spacing={2}>
                <Box sx={{ textAlign: 'center' }}>
                  <InfoOutlined fontSize='large' color='primary' />
                </Box>
                <Typography>
                  This page allows you to create a migration plan so that users can easily move from one schema to
                  another at the click of the button.
                </Typography>
              </Stack>
              <Divider flexItem />
              <Stack direction='row' alignItems='center' spacing={2}>
                <Delete fontSize='large' color='primary' />
                <Typography>
                  {`Questions on an older schema can be mapped to a new question (using the the "Move" action type) so that
                  existing data is not lost when a question is moved from one section on the form to another.`}
                </Typography>
              </Stack>
              <Stack direction='row' alignItems='center' spacing={2}>
                <MoveDown fontSize='large' color='primary' />
                <Typography>
                  {`Questions can also be marked as deleted (using the "Delete" action type) so that data that is no longer needed on the new schema can be
                  removed from the model card.`}
                </Typography>
              </Stack>
            </Stack>
          </Box>
        </Stack>
      )}
    </Box>
  )
}
