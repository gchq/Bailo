import { ArrowBack } from '@mui/icons-material'
import { Button, Container, Paper } from '@mui/material'
import { useGetSchema } from 'actions/schema'
import { putSchemaMigration, useGetSchemaMigration } from 'actions/schemaMigration'
import { useRouter } from 'next/router'
import { useEffect, useMemo, useRef, useState } from 'react'
import Loading from 'src/common/Loading'
import ErrorWrapper from 'src/errors/ErrorWrapper'
import Link from 'src/Link'
import SchemaMigrator from 'src/schemas/SchemaMigrator'
import { CombinedSchema, QuestionMigration } from 'types/types'
import { getErrorMessage } from 'utils/fetcher'
import { getStepsFromSchema } from 'utils/formUtils'
export default function SchemaMigrationEditor() {
  const router = useRouter()
  const { schemaMigrationId }: { schemaMigrationId?: string } = router.query

  const { schemaMigration, isSchemaMigrationLoading, isSchemaMigrationError } = useGetSchemaMigration(schemaMigrationId)

  const {
    schema: sourceSchema,
    isSchemaLoading: isSourceSchemaLoading,
    isSchemaError: isSourceSchemaError,
  } = useGetSchema(schemaMigration ? schemaMigration.sourceSchema : '')
  const {
    schema: targetSchema,
    isSchemaLoading: isTargetSchemaLoading,
    isSchemaError: isTargetSchemaError,
  } = useGetSchema(schemaMigration ? schemaMigration.targetSchema : '')

  const [submitErrorText, setSubmitErrorText] = useState('')
  const [migrationName, setMigrationName] = useState('')
  const [migrationDescription, setMigrationDescription] = useState('')
  const [questionMigrations, setQuestionMigrations] = useState<QuestionMigration[]>([])

  const hasInitialised = useRef(false)

  useEffect(() => {
    if (schemaMigration && hasInitialised.current === false) {
      setQuestionMigrations(schemaMigration.questionMigrations)
      setMigrationName(schemaMigration.name)
      setMigrationDescription(schemaMigration.description || '')
      hasInitialised.current = true
    }
  }, [schemaMigration])

  const sourceSchemaCombined: CombinedSchema | undefined = useMemo(() => {
    if (sourceSchema) {
      const sourceSteps = getStepsFromSchema(sourceSchema, {}, [])
      for (const step of sourceSteps) {
        step.steps = sourceSteps
      }
      return {
        schema: sourceSchema,
        splitSchema: { reference: sourceSchema.name, steps: sourceSteps },
      }
    }
  }, [sourceSchema])

  const targetSchemaCombined: CombinedSchema | undefined = useMemo(() => {
    if (targetSchema) {
      const targetSteps = getStepsFromSchema(targetSchema, {}, [])
      for (const step of targetSteps) {
        step.steps = targetSteps
      }
      return {
        schema: targetSchema,
        splitSchema: { reference: targetSchema.name, steps: targetSteps },
      }
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

    if (schemaMigration) {
      const res = await putSchemaMigration(schemaMigration.id, {
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
  }

  if (isSchemaMigrationLoading || isSourceSchemaLoading || isTargetSchemaLoading) {
    return <Loading />
  }

  if (isSchemaMigrationError) {
    return <ErrorWrapper message={isSchemaMigrationError.info.message} />
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
                aria-label={'Return to migration list select button'}
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
