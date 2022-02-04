import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'

import Paper from '@mui/material/Paper'
import { useGetModel } from '../../../../data/model'

import Wrapper from '../../../../src/Wrapper'
import { useGetDefaultSchema, useGetSchema, useGetSchemas } from '../../../../data/schema'
import MultipleErrorWrapper from '../../../../src/errors/MultipleErrorWrapper'
import { Schema, Step } from '../../../../types/interfaces'
import { createStep, getStepsData, getStepsFromSchema, setStepState } from '../../../../utils/formUtils'
import FileInput from '../../../../src/common/FileInput'

import SchemaSelector from '../../../../src/Form/SchemaSelector'
import SubmissionError from '../../../../src/Form/SubmissionError'
import Form from '../../../../src/Form/Form'
import FormExport from '../../../../src/common/FormExport'
import { useGetModelVersion } from 'data/model'
import { putEndpoint } from 'data/api'

const uiSchema = {
  contacts: {
    uploader: { 'ui:widget': 'userSelector' },
    reviewer: { 'ui:widget': 'userSelector' },
    manager: { 'ui:widget': 'userSelector' },
  },
}

function Upload() {
  const router = useRouter()
  const { uuid: modelUuid, version: versionString }: { uuid?: string, version?: string } = router.query

  const { model, isModelLoading, isModelError } = useGetModel(modelUuid)
  const { version, isVersionLoading, isVersionError } = useGetModelVersion(modelUuid, versionString)
  const { schema, isSchemaLoading, isSchemaError } = useGetSchema(model?.schemaRef)

  const [steps, setSteps] = useState<Array<Step>>([])
  const [error, setError] = useState<string | undefined>(undefined)

  useEffect(() => {
    if (!schema || !version) return
    const steps = getStepsFromSchema(schema.schema, uiSchema, [
      'properties.highLevelDetails.properties.modelCardVersion'
    ], version.metadata)

    setSteps(steps)
  }, [schema])

  const errorWrapper = MultipleErrorWrapper(`Unable to load edit page`, {
    isModelError,
    isVersionError,
    isSchemaError
  })
  if (errorWrapper) return errorWrapper

  if (isModelLoading || isVersionLoading || isSchemaLoading) {
    return <></>
  }

  if (!version || !model || !schema) {
    return <></>
  }

  const onSubmit = async () => {
    setError(undefined)

    const data = getStepsData(steps)
    data.schemaRef = schema?.reference

    const edit = await putEndpoint(`/api/v1/version/${version._id}`, data)

    if (edit.status >= 400) {
      let error = edit.statusText
      try {
        error = `${edit.statusText}: ${(await edit.json()).message}`
      } catch (e) {}

      return setError(error)
    }

    const response = await edit.json()
    router.push(`/model/${response.model.uuid}`)
  }

  return (
    <Paper variant='outlined' sx={{ my: { xs: 3, md: 6 }, p: { xs: 2, md: 3 } }}>
      <SubmissionError error={error} />
      <Form steps={steps} setSteps={setSteps} onSubmit={onSubmit} />
    </Paper>
  )
}

export default function Outer() {
  return (
    <Wrapper title={'Upload Model'} page={'upload'}>
      <Upload />
    </Wrapper>
  )
}
