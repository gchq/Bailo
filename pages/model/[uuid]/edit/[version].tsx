import Paper from '@mui/material/Paper'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { putEndpoint } from '../../../../data/api.js'
import { useGetModel, useGetModelVersion } from '../../../../data/model.js'
import { useGetSchema } from '../../../../data/schema.js'
import MultipleErrorWrapper from '../../../../src/errors/MultipleErrorWrapper.js'
import Form from '../../../../src/Form/Form.js'
import ModelEditSubmission from '../../../../src/Form/ModelEditSubmission.js'
import { RenderButtonsInterface } from '../../../../src/Form/RenderButtons.js'
import SubmissionError from '../../../../src/Form/SubmissionError.js'
import Wrapper from '../../../../src/Wrapper.js'
import { SplitSchema } from '../../../../types/interfaces.js'
import { createStep, getStepsData, getStepsFromSchema } from '../../../../utils/formUtils.js'
import useCacheVariable from '../../../../utils/hooks/useCacheVariable.js'

function renderSubmissionTab({ activeStep, setActiveStep, onSubmit, modelUploading }: RenderButtonsInterface) {
  return (
    <ModelEditSubmission
      onSubmit={onSubmit}
      setActiveStep={setActiveStep}
      activeStep={activeStep}
      modelUploading={modelUploading}
    />
  )
}

function Upload() {
  const router = useRouter()
  const { uuid: modelUuid, version: versionString }: { uuid?: string; version?: string } = router.query

  const { model, isModelLoading, isModelError } = useGetModel(modelUuid)
  const { version, isVersionLoading, isVersionError, mutateVersion } = useGetModelVersion(modelUuid, versionString)
  const { schema, isSchemaLoading, isSchemaError } = useGetSchema(model?.schemaRef)

  const [splitSchema, setSplitSchema] = useState<SplitSchema>({ reference: '', steps: [] })
  const [error, setError] = useState<string | undefined>(undefined)

  const cVersion = useCacheVariable(version)
  const cSchema = useCacheVariable(schema)

  useEffect(() => {
    if (!cSchema || !cVersion || splitSchema.steps.length) return

    const schemaSteps = getStepsFromSchema(
      cSchema,
      {
        highLevelDetails: {
          modelCardVersion: { 'ui:widget': 'nothing' },
        },
      },
      [],
      cVersion.metadata
    )

    schemaSteps.push(
      createStep({
        schema: {
          title: 'Submission',
        },
        state: {},
        schemaRef: cSchema.reference,

        type: 'Message',
        index: schemaSteps.length,
        section: 'submission',

        render: () => null,
        renderButtons: renderSubmissionTab,
        isComplete: () => true,
      })
    )

    for (const step of schemaSteps) {
      step.steps = schemaSteps
    }

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
      } catch (e) {
        errorMessage = 'There was a problem making the request.'
      }

      setError(errorMessage)
      return
    }

    mutateVersion()
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
    <Wrapper title='Upload Model' page='upload'>
      <Upload />
    </Wrapper>
  )
}
