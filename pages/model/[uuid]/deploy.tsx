import Wrapper from '../../../src/Wrapper'
import { useRouter } from 'next/router'
import { useGetModel } from '../../../data/model'
import { useGetDefaultSchema, useGetSchemas } from '../../../data/schema'
import React, { useState, useEffect } from 'react'
import Paper from '@mui/material/Paper'
import MultipleErrorWrapper from '../../../src/errors/MultipleErrorWrapper'
import { postEndpoint } from '../../../data/api'
import { Schema, Step } from '../../../types/interfaces'
import { getStepsData, getStepsFromSchema } from '../../../utils/formUtils'
import Grid from '@mui/material/Grid'
import Box from '@mui/material/Box'
import SchemaSelector from '../../../src/Form/SchemaSelector'
import SubmissionError from '../../../src/Form/SubmissionError'
import Form from '../../../src/Form/Form'

const uiSchema = {
  contacts: {
    requester: { 'ui:widget': 'userSelector' },
    secondPOC: { 'ui:widget': 'userSelector' },
  },
}

export default function Deploy() {
  const router = useRouter()
  const { uuid: modelUuid }: { uuid?: string } = router.query

  const { model, isModelLoading, isModelError } = useGetModel(modelUuid)
  const { defaultSchema, isDefaultSchemaError, isDefaultSchemaLoading } = useGetDefaultSchema('DEPLOYMENT')
  const { schemas, isSchemasLoading, isSchemasError } = useGetSchemas('DEPLOYMENT')

  const [currentSchema, setCurrentSchema] = useState<Schema | undefined>(undefined)
  const [steps, setSteps] = useState<Array<Step>>([])
  const [error, setError] = useState<string | undefined>(undefined)

  useEffect(() => {
    setCurrentSchema(defaultSchema)
  }, [defaultSchema])

  useEffect(() => {
    if (!currentSchema) return

    const { schema } = currentSchema
    const newSteps = getStepsFromSchema(schema, uiSchema, [
      'properties.highLevelDetails.properties.modelID',
      'properties.highLevelDetails.properties.initialVersionRequested',
    ])

    setSteps(newSteps)
  }, [currentSchema])

  const errorWrapper = MultipleErrorWrapper(`Unable to load deploy page`, {
    isModelError,
    isDefaultSchemaError,
    isSchemasError,
  })
  if (errorWrapper) return errorWrapper

  if (isDefaultSchemaLoading || isSchemasLoading || isModelLoading) {
    return <Wrapper title='Loading...' page='upload' />
  }

  const onSubmit = async () => {
    setError(undefined)

    const data = getStepsData(steps)

    data.highLevelDetails.modelID = modelUuid
    data.highLevelDetails.initialVersionRequested = model!.currentMetadata.highLevelDetails.modelCardVersion
    data.schemaRef = currentSchema?.reference

    const deploy = await postEndpoint(`/api/v1/deployment`, data)

    if (deploy.status >= 400) {
      let errorMessage = deploy.statusText
      try {
        errorMessage = `${deploy.statusText}: ${(await deploy.json()).message}`
      } catch (e) {}

      return setError(errorMessage)
    }

    const { uuid } = await deploy.json()
    router.push(`/deployment/${uuid}`)
  }

  return (
    <Wrapper title={'Deploy: ' + model!.currentMetadata.highLevelDetails.name} page={'model'}>
      <Paper variant='outlined' sx={{ my: { xs: 3, md: 6 }, p: { xs: 2, md: 3 } }}>
        <Grid container justifyContent='space-between' alignItems='center'>
          <Box />
          <SchemaSelector
            currentSchema={currentSchema ?? defaultSchema!}
            setCurrentSchema={setCurrentSchema}
            schemas={schemas!}
          />
        </Grid>

        <SubmissionError error={error} />
        <Form steps={steps} setSteps={setSteps} onSubmit={onSubmit} />
      </Paper>
    </Wrapper>
  )
}
