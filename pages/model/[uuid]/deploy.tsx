import Wrapper from 'src/Wrapper'
import { useRouter } from 'next/router'
import { useGetModel } from '../../../data/model'
import { useGetDefaultSchema, useGetSchemas } from '../../../data/schema'
import React, { useState } from 'react'
import Paper from '@mui/material/Paper'
import Alert from '@mui/material/Alert'
import FormTabs from '../../../src/common/FormTabs'
import UploadDeployment from '../../../src/UploadDeployment'
import MultipleErrorWrapper from '../../../src/errors/MultipleErrorWrapper'
import { postEndpoint } from '../../../data/api'

export default function Deploy() {
  const router = useRouter()
  const { uuid }: { uuid?: string } = router.query

  const { model, isModelLoading, isModelError } = useGetModel(uuid)
  const { defaultSchema, isDefaultSchemaError, isDefaultSchemaLoading } = useGetDefaultSchema('DEPLOYMENT')
  const { schemas, isSchemasLoading, isSchemasError } = useGetSchemas('DEPLOYMENT')

  const [submissionAlertText, setSubmissionAlertText] = useState('')
  const [showSubmissionAlert, setShowSubmissionAlert] = useState(false)

  const error = MultipleErrorWrapper(`Unable to load deploy page`, {
    isModelError,
    isDefaultSchemaError,
    isSchemasError,
  })
  if (error) return error

  if (isDefaultSchemaLoading || isSchemasLoading || isModelLoading) {
    return <Wrapper title='Loading...' page='upload' />
  }

  const onSubmit = async (data: any, schema: any) => {
    for (const meta of ['required', '$schema', 'definitions', 'type', 'properties']) {
      delete data[meta]
    }

    data.highLevelDetails.modelID = uuid
    data.highLevelDetails.initialVersionRequested = model!.currentMetadata.highLevelDetails.modelCardVersion
    data.schemaRef = schema.reference

    const deployment = await postEndpoint('/api/v1/deployment', data).then((res) => {
      setShowSubmissionAlert(false)
      if (res.status >= 400) {
        setShowSubmissionAlert(true)
        setSubmissionAlertText(res.statusText)
      }
      return res.json()
    })

    const { uuid: deploymentUuid } = deployment

    if (deploymentUuid) {
      router.push(`/deployment/${deploymentUuid}`)
    }
  }

  return (
    <Wrapper title={'Deploy: ' + model!.currentMetadata.highLevelDetails.name} page={'model'}>
      <Paper variant='outlined' sx={{ my: { xs: 3, md: 6 }, p: { xs: 2, md: 3 } }}>
        {showSubmissionAlert && (
          <Alert sx={{ mb: 2 }} severity='error'>
            {submissionAlertText}
          </Alert>
        )}
        <FormTabs
          defaultSchema={defaultSchema}
          schemas={schemas}
          onSubmit={onSubmit}
          name={'Deployment'}
          omitFields={[
            'properties.highLevelDetails.properties.modelID',
            'properties.highLevelDetails.properties.initialVersionRequested',
          ]}
          UploadForm={UploadDeployment}
        />
      </Paper>
    </Wrapper>
  )
}
