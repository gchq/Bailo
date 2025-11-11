import { Container, Paper } from '@mui/material'
import { useGetSchema } from 'actions/schema'
import { useGetSchemaMigrations } from 'actions/schemaMigration'
import { useEffect, useState } from 'react'
import Loading from 'src/common/Loading'
import ErrorWrapper from 'src/errors/ErrorWrapper'
import SchemaMigrator from 'src/schemas/SchemaMigrator'
import { CombinedSchema, QuestionMigration } from 'types/types'
import { getStepsFromSchema } from 'utils/formUtils'
export default function SchemaMigrationEditor() {
  const { schemaMigrations, isSchemaMigrationsLoading, isSchemaMigrationsError } = useGetSchemaMigrations() //TODO add query parameter here (id)
  const {
    schema: sourceSchema,
    isSchemaLoading: isSourceSchemaLoading,
    isSchemaError: isSourceSchemaError,
  } = useGetSchema(schemaMigrations[0].sourceSchema)
  const {
    schema: targetSchema,
    isSchemaLoading: isTargetSchemaLoading,
    isSchemaError: isTargetSchemaError,
  } = useGetSchema(schemaMigrations[0].targetSchema)
  const [questionMigrations, setQuestionMigrations] = useState<QuestionMigration[]>([])
  const [sourceSchemaCombined, setSourceSchemaCombined] = useState<CombinedSchema>()
  const [targetSchemaCombined, setTargetSchemaCombined] = useState<CombinedSchema>()
  const [submitErrorText, setSubmitErrorText] = useState('')
  const [migrationName, setMigrationName] = useState('')
  const [migrationDescription, setMigrationDescription] = useState('')

  useEffect(() => {
    if (sourceSchema) {
      const sourceSteps = getStepsFromSchema(sourceSchema, {}, [])
      for (const step of sourceSteps) {
        step.steps = sourceSteps
      }
      setSourceSchemaCombined({
        schema: sourceSchema,
        splitSchema: { reference: sourceSchema.name, steps: sourceSteps },
      })
    }
  }, [sourceSchema])

  useEffect(() => {
    if (targetSchema) {
      const sourceSteps = getStepsFromSchema(targetSchema, {}, [])
      for (const step of sourceSteps) {
        step.steps = sourceSteps
      }
      setTargetSchemaCombined({
        schema: targetSchema,
        splitSchema: { reference: targetSchema.name, steps: sourceSteps },
      })
    }
  }, [targetSchema])

  const handleSubmitMigrationPlan = async (_draft: boolean) => {
    setSubmitErrorText('')
    if (migrationName === '') {
      return setSubmitErrorText('You must set a name for this migration plan')
    }
    if (questionMigrations.length === 0) {
      return setSubmitErrorText('You must have at least one action before submitting a migration plan.')
    }
    //TODO implement this when patch hook and endpoint are finished
    // const res = await postSchemaMigration({
    //   name: migrationName,
    //   description: migrationDescription,
    //   questionMigrations: questionMigrations,
    //   draft: draft,
    // })
    // if (!res.ok) {
    //   setSubmitErrorText(await getErrorMessage(res))
    // } else {
    //   router.push('/schemas/list?tab=migrations')
    // }
  }

  if (isSchemaMigrationsLoading || isSourceSchemaLoading || isTargetSchemaLoading) {
    return <Loading />
  }

  if (isSchemaMigrationsError) {
    return <ErrorWrapper message={isSchemaMigrationsError.info.message} />
  }

  if (isSourceSchemaError) {
    return <ErrorWrapper message={isSourceSchemaError.info.message} />
  }

  if (isTargetSchemaError) {
    return <ErrorWrapper message={isTargetSchemaError.info.message} />
  }

  return (
    <>
      {sourceSchemaCombined && targetSchemaCombined && (
        <Container maxWidth='xl'>
          <Paper sx={{ my: 4, p: 4 }}>
            <SchemaMigrator
              questionMigrations={questionMigrations}
              setQuestionMigrations={setQuestionMigrations}
              sourceSchema={sourceSchemaCombined}
              targetSchema={targetSchemaCombined}
              handleSubmitMigrationPlan={handleSubmitMigrationPlan}
              submitErrorText={submitErrorText}
              migrationName={migrationName}
              setMigrationName={setMigrationName}
              migrationDescription={migrationDescription}
              setMigrationDescription={setMigrationDescription}
            />
          </Paper>
        </Container>
      )}
    </>
  )
}
