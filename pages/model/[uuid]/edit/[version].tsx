import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'

import Paper from '@mui/material/Paper'
import { useGetModel } from '../../../../data/model'

import Wrapper from '../../../../src/Wrapper'
import { useGetSchema } from '../../../../data/schema'
import MultipleErrorWrapper from '../../../../src/errors/MultipleErrorWrapper'
import { SplitSchema, Step } from '../../../../types/interfaces'
import { getStepsData, getStepsFromSchema } from '../../../../utils/formUtils'

import SubmissionError from '../../../../src/Form/SubmissionError'
import Form from '../../../../src/Form/Form'
import { useGetModelVersion } from 'data/model'
import { putEndpoint } from 'data/api'
import useCacheVariable from 'utils/useCacheVariable'

const uiSchema = {
  highLevelDetails: {
    modelCardVersion: { 'ui:widget': 'nothing' },
  },
  contacts: {
    uploader: { 'ui:widget': 'userSelector' },
    reviewer: { 'ui:widget': 'userSelector' },
    manager: { 'ui:widget': 'userSelector' },
  },
}

function Upload() {
  const router = useRouter()
  const { uuid: modelUuid, version: versionString }: { uuid?: string; version?: string } = router.query

  const { model, isModelLoading, isModelError } = useGetModel(modelUuid)
  const { version, isVersionLoading, isVersionError } = useGetModelVersion(modelUuid, versionString)
  const { schema, isSchemaLoading, isSchemaError } = useGetSchema(model?.schemaRef)

  const [splitSchema, setSplitSchema] = useState<SplitSchema>({ reference: '', steps: [] })
  const [error, setError] = useState<string | undefined>(undefined)

  const cVersion = useCacheVariable(version)
  const cSchema = useCacheVariable(schema)

  useEffect(() => {
    if (!cSchema || !cVersion || splitSchema.steps.length) return

    const schemaSteps = getStepsFromSchema(cSchema.schema, uiSchema, [], cVersion.metadata)
    setSplitSchema({ reference: cSchema.reference, steps: schemaSteps })
  }, [cSchema, cVersion, splitSchema.steps.length])

  const errorWrapper = MultipleErrorWrapper(`Unable to load edit page`, {
    isModelError,
    isVersionError,
    isSchemaError,
  })
  if (errorWrapper) return errorWrapper

  if (isModelLoading || isVersionLoading || isSchemaLoading) {
    return <>Loading</>
  }

  if (!version || !model || !schema) {
    return <>Not Found</>
  }

  const onSubmit = async () => {
    setError(undefined)

    const data = getStepsData(splitSchema)
    data.schemaRef = schema?.reference

    const edit = await putEndpoint(`/api/v1/version/${version._id}`, data)

    if (edit.status >= 400) {
      let errorMessage = edit.statusText
      try {
        errorMessage = `${edit.statusText}: ${(await edit.json()).message}`
      } catch (e) {}

      return setError(errorMessage)
    }

    const response = await edit.json()
    router.push(`/model/${response.model.uuid}`)
  }

  return (
    <Paper variant='outlined' sx={{ my: { xs: 3, md: 6 }, p: { xs: 2, md: 3 } }}>
      <SubmissionError error={error} />
      <Form splitSchema={splitSchema} setSplitSchema={setSplitSchema} onSubmit={onSubmit} />
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
