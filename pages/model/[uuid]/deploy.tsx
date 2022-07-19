import { useRouter } from 'next/router'
import React, { useState, useEffect } from 'react'
import Paper from '@mui/material/Paper'
import Grid from '@mui/material/Grid'
import Box from '@mui/material/Box'
import Wrapper from '../../../src/Wrapper'
import { useGetModel } from '../../../data/model'
import { useGetDefaultSchema, useGetSchemas } from '../../../data/schema'
import MultipleErrorWrapper from '../../../src/errors/MultipleErrorWrapper'
import { postEndpoint } from '../../../data/api'
import { Schema, SplitSchema, Step } from '../../../types/interfaces'
import { createStep, getStepsData, getStepsFromSchema } from '../../../utils/formUtils'
import SchemaSelector from '../../../src/Form/SchemaSelector'
import SubmissionError from '../../../src/Form/SubmissionError'
import Form from '../../../src/Form/Form'
import DeploymentSubmission from '../../../src/Form/DeploymentSubmission'

function renderSubmissionTab(
  _currentStep: Step,
  _splitSchema: SplitSchema,
  _setSplitSchema: (reference: string, steps: Array<Step>) => void,
  activeStep: number,
  setActiveStep: (step: number) => void,
  onSubmit: () => void,
  _openValidateError: boolean,
  _setOpenValidateError: (validatorError: boolean) => void,
  _modelUploading: boolean
) {
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
    const newSteps = getStepsFromSchema(currentSchema, {}, [
      'properties.highLevelDetails.properties.modelID',
      'properties.highLevelDetails.properties.initialVersionRequested',
    ])

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
    data.highLevelDetails.initialVersionRequested = model.currentMetadata.highLevelDetails.modelCardVersion
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

  return (
    <Wrapper title={`Deploy: ${model.currentMetadata.highLevelDetails.name}`} page='model'>
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
