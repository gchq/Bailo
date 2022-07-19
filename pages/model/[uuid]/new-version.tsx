import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import axios from 'axios'

import Paper from '@mui/material/Paper'
import { useGetModel } from '../../../data/model'

import Wrapper from '../../../src/Wrapper'
import { useGetSchema } from '../../../data/schema'
import MultipleErrorWrapper from '../../../src/errors/MultipleErrorWrapper'
import { SplitSchema, Step } from '../../../types/interfaces'
import { createStep, getStepsData, getStepsFromSchema } from '../../../utils/formUtils'
import { useGetModelVersions } from '../../../data/model'

import SubmissionError from '../../../src/Form/SubmissionError'
import Form from '../../../src/Form/Form'
import RenderFileTab, { FileTabComplete } from '../../../src/Form/RenderFileTab'
import useCacheVariable from '../../../utils/useCacheVariable'
import LoadingBar from '../../../src/common/LoadingBar'
import ModelExportAndSubmission from '../../../src/Form/ModelExportAndSubmission'

function renderSubmissionTab(
  _currentStep: Step,
  splitSchema: SplitSchema,
  _setSplitSchema: (reference: string, steps: Array<Step>) => void,
  activeStep: number,
  setActiveStep: (step: number) => void,
  onSubmit: () => void,
  _openValidateError: boolean,
  _setOpenValidateError: (validatorError: boolean) => void,
  modelUploading: boolean
) {
  const data = getStepsData(splitSchema)

  return (
    <ModelExportAndSubmission
      formData={data}
      splitSchema={splitSchema}
      schemaRef={splitSchema.reference}
      onSubmit={onSubmit}
      setActiveStep={setActiveStep}
      activeStep={activeStep}
      modelUploading={modelUploading}
    />
  )
}

function Upload() {
  const router = useRouter()
  const { uuid: modelUuid }: { uuid?: string } = router.query

  const { model, isModelLoading, isModelError } = useGetModel(modelUuid)
  const { schema, isSchemaLoading, isSchemaError } = useGetSchema(model?.schemaRef)
  const { versions, isVersionsLoading, isVersionsError } = useGetModelVersions(modelUuid)

  const cModel = useCacheVariable(model)
  const cSchema = useCacheVariable(schema)

  const [splitSchema, setSplitSchema] = useState<SplitSchema>({ reference: '', steps: [] })
  const [error, setError] = useState<string | undefined>(undefined)
  const [modelUploading, setModelUploading] = useState<boolean>(false)
  const [loadingPercentage, setUploadPercentage] = useState<number>(0)

  useEffect(() => {
    if (!cSchema || !cModel) return
    const steps = getStepsFromSchema(cSchema, {}, [], cModel.currentMetadata)

    steps.push(
      createStep({
        schema: {
          title: 'Files',
        },
        state: {
          binary: undefined,
          code: undefined,
        },
        schemaRef: cModel.schemaRef,

        type: 'Data',
        index: steps.length,
        section: 'files',

        render: RenderFileTab,
        isComplete: FileTabComplete,
      })
    )

    steps.push(
      createStep({
        schema: {
          title: 'Submission',
        },
        state: {},
        schemaRef: cModel.schemaRef,

        type: 'Message',
        index: steps.length,
        section: 'submission',

        render: () => null,
        renderButtons: renderSubmissionTab,
        isComplete: () => true,
      })
    )

    setSplitSchema({ reference: cSchema.reference, steps })
  }, [cModel, cSchema])

  const errorWrapper = MultipleErrorWrapper(`Unable to load edit page`, {
    isModelError,
    isSchemaError,
  })
  if (errorWrapper) return errorWrapper

  if (isModelLoading || isSchemaLoading) {
    return null
  }

  if (!model || !schema) {
    return null
  }

  const onSubmit = async () => {
    setError(undefined)

    if (!splitSchema.steps.every((e) => e.isComplete(e))) {
      return setError('Ensure all steps are complete before submitting')
    }

    const data = getStepsData(splitSchema, true)
    const form = new FormData()

    if (!versions) {
      return setError('Problem loading versions')
    }

    // This might need revisiting when models have lots of versions
    if (versions.filter((version) => version.version === data.highLevelDetails.modelCardVersion).length > 0) {
      return setError('This model already has a version with the same name')
    }

    data.schemaRef = model?.schemaRef

    form.append('code', data.files.code)
    form.append('binary', data.files.binary)

    delete data.files

    form.append('metadata', JSON.stringify(data))
    setModelUploading(true)

    await axios({
      method: 'post',
      url: `/api/v1/model?mode=newVersion&modelUuid=${model.uuid}`,
      headers: { 'Content-Type': 'multipart/form-data' },
      data: form,
      onUploadProgress: (progressEvent) => {
        setUploadPercentage((progressEvent.loaded * 100) / progressEvent.total)
      },
    })
      .then((res) => router.push(`/model/${res.data.uuid}`))
      .catch((e) => {
        setModelUploading(false)
        setError(e.response.data.message)
        return null
      })
    return null
  }

  return (
    <Paper variant='outlined' sx={{ my: { xs: 3, md: 6 }, p: { xs: 2, md: 3 } }}>
      <SubmissionError error={error} />
      <Form
        splitSchema={splitSchema}
        setSplitSchema={setSplitSchema}
        onSubmit={onSubmit}
        modelUploading={modelUploading}
      />
      <LoadingBar showLoadingBar={modelUploading} loadingPercentage={loadingPercentage} />
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
