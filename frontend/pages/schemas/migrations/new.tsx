import { ArrowBack, Delete, Forward, InfoOutlined, MoveDown } from '@mui/icons-material'
import { Autocomplete, Box, Button, Container, Divider, Paper, Stack, TextField, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useGetSchemas } from 'actions/schema'
import { postSchemaMigration } from 'actions/schemaMigration'
import { useRouter } from 'next/router'
import { SyntheticEvent, useCallback, useState } from 'react'
import Loading from 'src/common/Loading'
import Title from 'src/common/Title'
import Link from 'src/Link'
import MessageAlert from 'src/MessageAlert'
import SchemaMigrator from 'src/schemas/SchemaMigrator'
import { CombinedSchema, QuestionMigration, SchemaInterface } from 'types/types'
import { getErrorMessage } from 'utils/fetcher'
import { getStepsFromSchema } from 'utils/formUtils'

export default function SchemaMigrationSelector() {
  const { schemas, isSchemasLoading, isSchemasError } = useGetSchemas()

  const [questionMigrations, setQuestionMigrations] = useState<QuestionMigration[]>([])
  const [submitErrorText, setSubmitErrorText] = useState('')
  const [isMigrationPlannerActive, setIsMigrationPlannerActive] = useState(false)
  const [sourceSchema, setSourceSchema] = useState<CombinedSchema>()
  const [targetSchema, setTargetSchema] = useState<CombinedSchema>()
  const [errorText, setErrorText] = useState('')
  const [migrationName, setMigrationName] = useState('')
  const [migrationDescription, setMigrationDescription] = useState('')

  const router = useRouter()
  const theme = useTheme()

  const handleSourceSchemaChange = useCallback(
    (_event: SyntheticEvent, newValue: SchemaInterface | undefined | null) => {
      setErrorText('')
      if (newValue) {
        const sourceSteps = getStepsFromSchema(newValue, {}, [])
        for (const step of sourceSteps) {
          step.steps = sourceSteps
        }
        setSourceSchema({ schema: newValue, splitSchema: { reference: newValue.name, steps: sourceSteps } })
      }
    },
    [],
  )

  const handleTargetSchemaChange = useCallback(
    (_event: SyntheticEvent, newValue: SchemaInterface | undefined | null) => {
      setErrorText('')
      if (newValue) {
        const targetSteps = getStepsFromSchema(newValue, {}, [])
        for (const step of targetSteps) {
          step.steps = targetSteps
        }
        setTargetSchema({ schema: newValue, splitSchema: { reference: newValue.name, steps: targetSteps } })
      }
    },
    [],
  )

  const handleReturnToSelection = () => {
    setIsMigrationPlannerActive(false)
  }

  const beginMigration = () => {
    if (!targetSchema || !sourceSchema) {
      return setErrorText('You need to select both a source and target schema to start a migration')
    } else if (targetSchema.schema.kind !== sourceSchema.schema.kind) {
      return setErrorText('You can only migrate schemas of the same kind')
    } else {
      setIsMigrationPlannerActive(true)
    }
  }

  const handleSubmitMigrationPlan = async (draft: boolean) => {
    setSubmitErrorText('')
    if (migrationName === '') {
      return setSubmitErrorText('You must set a name for this migration plan')
    }
    if (questionMigrations.length === 0) {
      return setSubmitErrorText('You must have at least one action before submitting a migration plan.')
    }
    if (!sourceSchema || !targetSchema) {
      return setSubmitErrorText('You need both a source and target schema.')
    }
    const res = await postSchemaMigration({
      name: migrationName,
      description: migrationDescription,
      sourceSchema: sourceSchema.schema.id,
      targetSchema: targetSchema.schema.id,
      questionMigrations: questionMigrations,
      draft: draft,
    })
    if (!res.ok) {
      setSubmitErrorText(await getErrorMessage(res))
    } else {
      router.push('/schemas/list?tab=migrations')
    }
  }

  if (isSchemasError) {
    return <MessageAlert message={isSchemasError.info.message} severity='error' />
  }

  if (isSchemasLoading) {
    return <Loading />
  }

  return (
    <>
      <Title text='Create a new schema migration plan' />
      {isMigrationPlannerActive && sourceSchema && targetSchema ? (
        <Container maxWidth='xl'>
          <Paper sx={{ my: 4, p: 4 }}>
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
                questionMigrations={questionMigrations}
                setQuestionMigrations={setQuestionMigrations}
                sourceSchema={sourceSchema}
                targetSchema={targetSchema}
                handleSubmitMigrationPlan={handleSubmitMigrationPlan}
                submitErrorText={submitErrorText}
                migrationName={migrationName}
                setMigrationName={setMigrationName}
                migrationDescription={migrationDescription}
                setMigrationDescription={setMigrationDescription}
              />
            </Stack>
          </Paper>
        </Container>
      ) : (
        <Container maxWidth='md'>
          <Paper sx={{ my: 4, p: 4 }}>
            <Stack spacing={4} alignItems='center' sx={{ maxWidth: '750px' }}>
              <Box sx={{ textAlign: 'left', width: '100%' }}>
                <Link href={`/schemas/list?tab=migrations`}>
                  <Button
                    size='small'
                    sx={{ width: 'fit-content', pb: 2 }}
                    startIcon={<ArrowBack />}
                    aria-label={'Back to schema migrations list select button'}
                  >
                    Back to schema migrations list
                  </Button>
                </Link>
              </Box>
              <Stack direction='row' spacing={6} justifyContent='center' alignItems='center'>
                <Autocomplete
                  disablePortal
                  options={schemas}
                  fullWidth
                  size='small'
                  getOptionDisabled={(option) => option.name === targetSchema?.schema.name}
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
                  getOptionDisabled={(option) => option.id === sourceSchema?.schema.name}
                  getOptionLabel={(option: SchemaInterface) => option.name}
                  sx={{ width: 300 }}
                  renderInput={(params) => <TextField {...params} label='Target schema' />}
                  onChange={handleTargetSchemaChange}
                />
              </Stack>
              <Box textAlign='center'>
                <Button
                  variant='contained'
                  sx={{ width: 'max-content' }}
                  onClick={beginMigration}
                  disabled={!sourceSchema || !targetSchema}
                  aria-label={'Begin schema migration button'}
                >
                  Begin migration
                </Button>
                <Typography sx={{ pt: 1 }} color='error'>
                  {errorText}
                </Typography>
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
                    <MoveDown fontSize='large' color='primary' />
                    <Typography>
                      {`Questions on an older schema can be mapped to a new question (using the the "Move" action type) so that
                  existing data is not lost when a question is moved from one section on the form to another.`}
                    </Typography>
                  </Stack>
                  <Stack direction='row' alignItems='center' spacing={2}>
                    <Delete fontSize='large' color='primary' />
                    <Typography>
                      {`Questions can also be marked as deleted (using the "Delete" action type) so that data that is no longer needed on the new schema can be
                  removed from the model card.`}
                    </Typography>
                  </Stack>
                </Stack>
              </Box>
            </Stack>
          </Paper>
        </Container>
      )}
    </>
  )
}
