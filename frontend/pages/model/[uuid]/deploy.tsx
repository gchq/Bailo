import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import Paper from '@mui/material/Paper'
import { useRouter } from 'next/router'
import React, { useEffect, useState } from 'react'

import { postEndpoint } from '../../../data/api'
import { useGetModel } from '../../../data/model'
import { useGetDefaultSchema, useGetSchemas } from '../../../data/schema'
import MultipleErrorWrapper from '../../../src/errors/MultipleErrorWrapper'
import DeploymentSubmission from '../../../src/Form/DeploymentSubmission'
import Form from '../../../src/Form/Form'
import { RenderButtonsInterface } from '../../../src/Form/RenderButtons'
import SchemaSelector from '../../../src/Form/SchemaSelector'
import SubmissionError from '../../../src/Form/SubmissionError'
import Wrapper from '../../../src/Wrapper'
import { SplitSchema } from '../../../types/interfaces'
import { Schema, Version } from '../../../types/types'
import { createStep, getStepsData, getStepsFromSchema } from '../../../utils/formUtils'

function renderSubmissionTab({ activeStep, setActiveStep, onSubmit }: RenderButtonsInterface) {
  return <DeploymentSubmission onSubmit={onSubmit} setActiveStep={setActiveStep} activeStep={activeStep} />
}

export default function Deploy() {
  const router = useRouter()
  const { uuid: modelUuid }: { uuid?: string } = router.query

  const { model, isModelLoading, isModelError } = useGetModel(modelUuid)
  const { defaultSchema, isDefaultSchemaError, isDefaultSchemaLoading } = useGetDefaultSchema('DEPLOYMENT')
  const { schemas, isSchemasLoading, isSchemasError } = useGetSchemas('DEPLOYMENT')

  const [currentSchema, setCurrentSchema] = useState<Schema | undefined>(undefined)
  const [splitSchema, setSplitSchema] = useState<SplitSchema>({ reference: '', steps: [] })
  const [error, setError] = useState<string | undefined>(undefined)

  useEffect(() => {
    setCurrentSchema(defaultSchema)
  }, [defaultSchema])

  useEffect(() => {
    if (!currentSchema) return

    const { reference } = currentSchema
    const newSteps = getStepsFromSchema(currentSchema, {}, ['properties.highLevelDetails.properties.modelID'])

    newSteps.push(
      createStep({
        schema: {
          title: 'Submission',
        },
        state: {},
        schemaRef: reference,

        type: 'Message',
        index: newSteps.length,
        section: 'submission',

        render: () => null,
        renderButtons: renderSubmissionTab,
        isComplete: () => true,
      })
    )

    for (const step of newSteps) {
      step.steps = newSteps
    }

    setSplitSchema({ reference, steps: newSteps })
  }, [currentSchema])

  const errorWrapper = MultipleErrorWrapper(`Unable to load deploy page`, {
    isModelError,
    isDefaultSchemaError,
    isSchemasError,
  })
  if (errorWrapper) return errorWrapper

  const Loading = <Wrapper title='Loading...' page='model' />

  if (isSchemasLoading || !schemas) return Loading
  if (isModelLoading || !model) return Loading
  if (isDefaultSchemaLoading || !defaultSchema) return Loading

  const onSubmit = async () => {
    setError(undefined)

    const data = getStepsData(splitSchema)

    data.highLevelDetails.modelID = modelUuid
    data.schemaRef = currentSchema?.reference

    const deploy = await postEndpoint(`/api/v1/deployment`, data)

    if (deploy.status >= 400) {
      let errorMessage = deploy.statusText
      try {
        errorMessage = `${deploy.statusText}: ${(await deploy.json()).message}`
      } catch (e) {
        // failed to get json from server
      }

      setError(errorMessage)
      return
    }

    const { uuid } = await deploy.json()
    router.push(`/deployment/${uuid}`)
  }

  const latestVersion = model.latestVersion as Version

  return (
    <Wrapper title={`Deploy: ${latestVersion.metadata.highLevelDetails.name}`} page='model'>
      <Paper variant='outlined' sx={{ my: { xs: 3, md: 6 }, p: { xs: 2, md: 3 } }}>
        <Grid container justifyContent='space-between' alignItems='center'>
          <Box />
          <SchemaSelector
            currentSchema={currentSchema ?? defaultSchema}
            setCurrentSchema={setCurrentSchema}
            schemas={schemas}
          />
        </Grid>

        <SubmissionError error={error} />
        <Form splitSchema={splitSchema} setSplitSchema={setSplitSchema} onSubmit={onSubmit} />
      </Paper>
    </Wrapper>
  )
}
