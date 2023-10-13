import ArrowBack from '@mui/icons-material/ArrowBack'
import { Box, Button, Card, Stack, Typography } from '@mui/material'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'

import { postAccessRequest } from '../../../../../actions/access'
import { useGetModel } from '../../../../../actions/model'
import { useGetSchema } from '../../../../../actions/schema'
import Loading from '../../../../../src/common/Loading'
import ModelCardForm from '../../../../../src/Form/beta/ModelCardForm'
import MessageAlert from '../../../../../src/MessageAlert'
import Wrapper from '../../../../../src/Wrapper.beta'
import { SplitSchemaNoRender } from '../../../../../types/interfaces'
import { getStepsData, getStepsFromSchema, setStepValidate, validateForm } from '../../../../../utils/beta/formUtils'

export default function NewAccessRequest() {
  const router = useRouter()
  const { modelId, schemaId }: { modelId?: string; schemaId?: string } = router.query
  const { model, isModelLoading, isModelError } = useGetModel(modelId)
  const { schema, isSchemaLoading, isSchemaError } = useGetSchema(schemaId || '')

  const [splitSchema, setSplitSchema] = useState<SplitSchemaNoRender>({ reference: '', steps: [] })

  useEffect(() => {
    if (!model || !schema) return
    const steps = getStepsFromSchema(schema, {}, [], {})

    for (const step of steps) {
      step.steps = steps
    }

    setSplitSchema({ reference: schema.id, steps })
  }, [schema, model])

  async function onSubmit() {
    for (const step of splitSchema.steps) {
      const isValid = validateForm(step)
      setStepValidate(splitSchema, setSplitSchema, step, true)
      if (!isValid) {
        return <MessageAlert message='Error' severity='error' />
      }
      if (!modelId) {
        return <MessageAlert message='Unknown model ID' severity='error' />
      }
      if (!schemaId) {
        return <MessageAlert message='Unknown schema ID' severity='error' />
      }
      const data = getStepsData(splitSchema, true)
      const res = await postAccessRequest(modelId, schemaId, data)
      if (res.status && res.status < 400) {
        router.push(`/beta/model/${modelId}`)
      }
    }
  }

  if (isSchemaError) {
    return <MessageAlert message={isSchemaError.info.message} severity='error' />
  }

  if (isModelError) {
    return <MessageAlert message={isModelError.info.message} severity='error' />
  }

  return (
    <Wrapper title='Access Request' page='Model'>
      {(isSchemaLoading || isModelLoading) && <Loading />}
      {!isSchemaLoading && !isModelLoading && (
        <Card sx={{ mx: 'auto', my: 4, p: 4 }}>
          {(!model || !model.card) && (
            <Typography>Access requests can not be requested if a schema is not set for this model.</Typography>
          )}
          {model && model.card && (
            <Stack spacing={4}>
              <Button
                sx={{ width: 'fit-content' }}
                startIcon={<ArrowBack />}
                onClick={() => router.push(`/beta/model/${modelId}`)}
              >
                Back to model
              </Button>
              <ModelCardForm splitSchema={splitSchema} setSplitSchema={setSplitSchema} canEdit displayLabelValidation />
              <Box sx={{ textAlign: 'right' }}>
                <Button sx={{ width: 'fit-content' }} variant='contained' onClick={onSubmit}>
                  Submit
                </Button>
              </Box>
            </Stack>
          )}
        </Card>
      )}
    </Wrapper>
  )
}
