import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'

import Paper from '@mui/material/Paper'
import { useGetModelVersion, useGetModel } from '../../../../data/model'
import { putEndpoint } from '../../../../data/api'
import useCacheVariable from '../../../../utils/useCacheVariable'

import Wrapper from '../../../../src/Wrapper'
import { useGetSchema } from '../../../../data/schema'
import MultipleErrorWrapper from '../../../../src/errors/MultipleErrorWrapper'
import { SplitSchema, Step } from '../../../../types/interfaces'
import { createStep, getStepsData, getStepsFromSchema } from '../../../../utils/formUtils'

import SubmissionError from '../../../../src/Form/SubmissionError'
import Form from '../../../../src/Form/Form'
import ModelEditSubmission from '../../../../src/Form/ModelEditSubmission'

function renderSubmissionTab(
  _currentStep: Step,
  _splitSchema: SplitSchema,
  _setSplitSchema: (reference: string, steps: Array<Step>) => void,
  activeStep: number,
  setActiveStep: (step: number) => void,
  onSubmit: () => void,
  _openValidateError: boolean,
  _setOpenValidateError: (validatorError: boolean) => void,
  modelUploading: boolean
) {
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
  const { version, isVersionLoading, isVersionError } = useGetModelVersion(modelUuid, versionString)
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
