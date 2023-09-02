import { Switch, Typography } from '@mui/material'
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import Paper from '@mui/material/Paper'
import axios from 'axios'
import { useGetUiConfig } from 'data/uiConfig'
import { useRouter } from 'next/router'
import React, { useEffect, useState } from 'react'

import { useGetDefaultSchema, useGetSchemas } from '../../../../data/schema'
import { useGetCurrentUser } from '../../../../data/user'
import LoadingBar from '../../../../src/common/LoadingBar'
import { MinimalErrorWrapper } from '../../../../src/errors/ErrorWrapper'
import MultipleErrorWrapper from '../../../../src/errors/MultipleErrorWrapper'
import Form from '../../../../src/Form/FormBeta'
import RenderFileTab, { fileTabComplete, RenderBasicFileTab } from '../../../../src/Form/RenderFileTab'
import SubmissionError from '../../../../src/Form/SubmissionError'
import Wrapper from '../../../../src/Wrapper'
import { SplitSchema } from '../../../../types/interfaces'
import { EntityKind, Schema, User } from '../../../../types/types'
import { createStep, getStepsData, getStepsFromSchema } from '../../../../utils/formUtilsBeta'

function Upload() {
  const { defaultSchema, isDefaultSchemaError, isDefaultSchemaLoading } = useGetDefaultSchema('UPLOAD')
  const { schemas, isSchemasLoading, isSchemasError } = useGetSchemas('UPLOAD')
  const { currentUser, isCurrentUserLoading, isCurrentUserError } = useGetCurrentUser()
  const { uiConfig, isUiConfigError, isUiConfigLoading } = useGetUiConfig()

  const router = useRouter()

  const [currentSchema, setCurrentSchema] = useState<Schema | undefined>(undefined)
  const [isEdit, setIsEdit] = useState(true)
  const [user, setUser] = useState<User | undefined>(undefined)
  const [splitSchema, setSplitSchema] = useState<SplitSchema>({ reference: '', steps: [] })
  const [error, setError] = useState<string | undefined>(undefined)
  const [modelUploading, setModelUploading] = useState(false)
  const [loadingPercentage, setUploadPercentage] = useState(0)

  useEffect(() => {
    if (currentSchema) return
    setCurrentSchema(defaultSchema)
  }, [defaultSchema, currentSchema])

  useEffect(() => {
    if (user) return

    setUser(currentUser)
  }, [user, currentUser])

  useEffect(() => {
    if (!currentSchema || !user) return

    const { reference } = currentSchema
    const defaultState = {
      contacts: { uploader: [{ kind: EntityKind.USER, id: user.id }] },
    }

    const steps = getStepsFromSchema(
      currentSchema,
      {
        buildOptions: {
          seldonVersion: { 'ui:widget': 'seldonVersionSelector' },
        },
      },
      [],
      defaultState,
    )

    steps.push(
      createStep({
        schema: {
          title: 'Files',
        },
        state: {
          binary: undefined,
          code: undefined,
        },
        schemaRef: reference,

        type: 'Data',
        index: steps.length,
        section: 'files',

        render: RenderFileTab,
        renderBasic: RenderBasicFileTab,
        isComplete: (step) => fileTabComplete(step, uiConfig ? uiConfig.maxModelSizeGB : 0),
      }),
    )

    for (const step of steps) {
      step.steps = steps
    }

    setSplitSchema({ reference, steps })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSchema, user])

  const errorWrapper = MultipleErrorWrapper(
    `Unable to load upload page`,
    {
      isDefaultSchemaError,
      isSchemasError,
      isCurrentUserError,
      isUiConfigError,
    },
    MinimalErrorWrapper,
  )
  if (errorWrapper) return errorWrapper

  if (isDefaultSchemaLoading || isSchemasLoading || isCurrentUserLoading) {
    return null
  }
  const Loading = <Wrapper title='Loading...' page='deployment' />

  if (isDefaultSchemaLoading || !defaultSchema) return Loading
  if (isSchemasLoading || !schemas) return Loading
  if (isCurrentUserLoading || !currentUser) return Loading
  if (isUiConfigLoading || !uiConfig) return Loading

  const onSubmit = async () => {
    setError(undefined)

    if (!splitSchema.steps.every((e) => e.isComplete(e))) {
      return setError('Ensure all steps are complete before submitting')
    }

    const data = getStepsData(splitSchema, true)
    const form = new FormData()

    data.schemaRef = currentSchema?.reference

    form.append('code', data.files.code)
    form.append('binary', data.files.binary)
    form.append('docker', data.files.docker)
    delete data.files

    form.append('metadata', JSON.stringify(data))
    setModelUploading(true)

    await axios({
      method: 'post',
      url: '/api/v1/model',
      headers: { 'Content-Type': 'multipart/form-data' },
      data: form,
      onUploadProgress: (progressEvent) => {
        setUploadPercentage(progressEvent.total ? (progressEvent.loaded * 100) / progressEvent.total : 0)
      },
    })
      .then((res) => router.push(`/model/${res.data.uuid}`))
      .catch((e) => {
        setModelUploading(false)
        setError(e.response.data.error.message)
        return null
      })
    return null
  }

  return (
    <Paper variant='outlined' sx={{ my: { xs: 3, md: 6 }, p: { xs: 2, md: 3 } }}>
      <Grid container justifyContent='space-between' alignItems='center'>
        <Box />
        <Typography>{isEdit ? 'Edit Mode' : 'Read-only Mode'}</Typography>
        <Switch checked={isEdit} onChange={(e) => setIsEdit(e.target.checked)} />
      </Grid>

      <SubmissionError error={error} />
      <Form
        splitSchema={splitSchema}
        setSplitSchema={setSplitSchema}
        onSubmit={onSubmit}
        modelUploading={modelUploading}
        canEdit={isEdit}
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
