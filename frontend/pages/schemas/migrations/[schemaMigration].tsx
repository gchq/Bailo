import { ArrowBack } from '@mui/icons-material'
import { Button, Container, Paper } from '@mui/material'
import { useGetSchema } from 'actions/schema'
import { putSchemaMigration, useGetSchemaMigrations } from 'actions/schemaMigration'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import Loading from 'src/common/Loading'
import ErrorWrapper from 'src/errors/ErrorWrapper'
import Link from 'src/Link'
import SchemaMigrator from 'src/schemas/SchemaMigrator'
import { CombinedSchema, QuestionMigration } from 'types/types'
import { getErrorMessage } from 'utils/fetcher'
import { getStepsFromSchema } from 'utils/formUtils'
export default function SchemaMigrationEditor() {
  const router = useRouter()
  const { schemaMigration: schemaMigrationId }: { schemaMigration?: string } = router.query
  const { schemaMigrations, isSchemaMigrationsLoading, isSchemaMigrationsError } =
    useGetSchemaMigrations(schemaMigrationId)

  const {
    schema: sourceSchema,
    isSchemaLoading: isSourceSchemaLoading,
    isSchemaError: isSourceSchemaError,
  } = useGetSchema(schemaMigrations[0] ? schemaMigrations[0].sourceSchema : '')
  const {
    schema: targetSchema,
    isSchemaLoading: isTargetSchemaLoading,
    isSchemaError: isTargetSchemaError,
  } = useGetSchema(schemaMigrations[0] ? schemaMigrations[0].targetSchema : '')
  const [questionMigrations, setQuestionMigrations] = useState<QuestionMigration[]>(
    schemaMigrations[0] ? schemaMigrations[0].questionMigrations : [],
  )
  const [sourceSchemaCombined, setSourceSchemaCombined] = useState<CombinedSchema>()
  const [targetSchemaCombined, setTargetSchemaCombined] = useState<CombinedSchema>()
  const [submitErrorText, setSubmitErrorText] = useState('')
  const [migrationName, setMigrationName] = useState(schemaMigrations[0] ? schemaMigrations[0].name : '')
  const [migrationDescription, setMigrationDescription] = useState(
    schemaMigrations[0] && schemaMigrations[0].description ? schemaMigrations[0].description : '',
  )

  useEffect(() => {
    if (schemaMigrations[0]) {
      setQuestionMigrations(schemaMigrations[0].questionMigrations)
      setMigrationName(schemaMigrations[0].name)
      if (schemaMigrations[0].description) {
        setMigrationDescription(schemaMigrations[0].description)
      }
    }
  }, [schemaMigrations])

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

  const handleSubmitMigrationPlan = async (draft: boolean) => {
    setSubmitErrorText('')
    if (migrationName === '') {
      return setSubmitErrorText('You must set a name for this migration plan')
    }
    if (questionMigrations.length === 0) {
      return setSubmitErrorText('You must have at least one action before submitting a migration plan.')
    }

    const res = await putSchemaMigration(schemaMigrations[0].id, {
      name: migrationName,
      description: migrationDescription,
      questionMigrations: questionMigrations,
      draft: draft,
    })
    if (!res.ok) {
      setSubmitErrorText(await getErrorMessage(res))
    } else {
      router.push('/schemas/list?tab=migrations')
    }
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
            <Link href={`/schemas/list?tab=migrations`}>
              <Button
                size='small'
                sx={{ width: 'fit-content', pb: 2 }}
                startIcon={<ArrowBack />}
                aria-label={'Return to schema select button'}
              >
                Back to migration list
              </Button>
            </Link>
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
