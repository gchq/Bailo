import Paper from '@mui/material/Paper'
import axios from 'axios'
import { useRouter } from 'next/router'
import React, { useEffect, useState } from 'react'

import { useGetModel, useGetModelVersions } from '../../../data/model'
import { useGetSchema } from '../../../data/schema'
import LoadingBar from '../../../src/common/LoadingBar'
import MultipleErrorWrapper from '../../../src/errors/MultipleErrorWrapper'
import Form from '../../../src/Form/Form'
import ModelExportAndSubmission from '../../../src/Form/ModelExportAndSubmission'
import { RenderButtonsInterface } from '../../../src/Form/RenderButtons'
import RenderFileTab, { fileTabComplete, RenderBasicFileTab } from '../../../src/Form/RenderFileTab'
import SubmissionError from '../../../src/Form/SubmissionError'
import Wrapper from '../../../src/Wrapper'
import { SplitSchema } from '../../../types/interfaces'
import { Version } from '../../../types/types'
import { createStep, getStepsData, getStepsFromSchema } from '../../../utils/formUtils'
import useCacheVariable from '../../../utils/hooks/useCacheVariable'

function renderSubmissionTab({
  splitSchema,
  activeStep,
  setActiveStep,
  onSubmit,
  modelUploading,
}: RenderButtonsInterface) {
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

  const { model, isModelLoading, isModelError, mutateModel } = useGetModel(modelUuid)
  const { schema, isSchemaLoading, isSchemaError } = useGetSchema(model?.schemaRef)
  const { versions } = useGetModelVersions(modelUuid)

  const cModel = useCacheVariable(model)
  const cSchema = useCacheVariable(schema)

  const [splitSchema, setSplitSchema] = useState<SplitSchema>({ reference: '', steps: [] })
  const [error, setError] = useState<string | undefined>(undefined)
  const [modelUploading, setModelUploading] = useState<boolean>(false)
  const [loadingPercentage, setUploadPercentage] = useState<number>(0)

  useEffect(() => {
    if (!cSchema || !cModel) return
    const latestVersion = cModel.latestVersion as Version
    const steps = getStepsFromSchema(
      cSchema,
      {
        buildOptions: {
          seldonVersion: { 'ui:widget': 'seldonVersionSelector' },
        },
      },
      [],
      latestVersion.metadata
    )

    steps.push(
      createStep({
        schema: {
          title: 'Files',
        },
        state: {
          binary: undefined,
          code: undefined,
          steps,
        },
        schemaRef: cModel.schemaRef,

        type: 'Data',
        index: steps.length,
        section: 'files',

        render: RenderFileTab,
        renderBasic: RenderBasicFileTab,
        isComplete: fileTabComplete,
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

    for (const step of steps) {
      step.steps = steps
    }

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
      return setError('Ensure that all steps are complete before submitting')
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
    form.append('docker', data.files.docker)
    delete data.files

    form.append('metadata', JSON.stringify(data))
    setModelUploading(true)

    await axios({
      method: 'post',
      url: `/api/v1/model?mode=newVersion&modelUuid=${model.uuid}`,
      headers: { 'Content-Type': 'multipart/form-data' },
      data: form,
      onUploadProgress: (progressEvent) => {
        setUploadPercentage(progressEvent.total ? (progressEvent.loaded * 100) / progressEvent.total : 0)
      },
    })
      .then((res) => {
        mutateModel()
        router.push(`/model/${res.data.uuid}`)
      })
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
