import ArrowBack from '@mui/icons-material/ArrowBack'
import { Box, Button, Card, Stack } from '@mui/material'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'

import { useGetModel } from '../../../../../actions/model'
import { useGetSchema } from '../../../../../actions/schema'
import Loading from '../../../../../src/common/Loading'
import ModelCardForm from '../../../../../src/Form/beta/ModelCardForm'
import MessageAlert from '../../../../../src/MessageAlert'
import Wrapper from '../../../../../src/Wrapper.beta'
import { Styling } from '../../../../../types/enums'
import { SplitSchemaNoRender } from '../../../../../types/interfaces'
import { getStepsFromSchema } from '../../../../../utils/beta/formUtils'

export default function NewAccessRequest() {
  const router = useRouter()
  const { modelId }: { modelId?: string } = router.query
  const { model, isModelLoading, isModelError } = useGetModel(modelId)
  // TODO - populate the accessRequestSettings property
  const { schema, isSchemaLoading, isSchemaError } = useGetSchema(
    model?.accessRequestSettings?.schemaId || 'minimal-access-request-general-v10-beta'
  )

  const [splitSchema, setSplitSchema] = useState<SplitSchemaNoRender>({ reference: '', steps: [] })

  useEffect(() => {
    if (!model || !schema) return
    const metadata = model.card.metadata
    const steps = getStepsFromSchema(schema, {}, ['properties.contacts'], metadata)

    for (const step of steps) {
      step.steps = steps
    }

    setSplitSchema({ reference: schema.id, steps })
  }, [schema, model])

  function onSubmit() {
    console.log()
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
      <Card sx={{ maxWidth: Styling.NARROW_WIDTH, mx: 'auto', my: 4, p: 4 }}>
        <Stack spacing={4}>
          <Button
            sx={{ width: 'fit-content' }}
            startIcon={<ArrowBack />}
            onClick={() => router.push(`/beta/model/${modelId}`)}
          >
            Back to model
          </Button>
          <ModelCardForm splitSchema={splitSchema} setSplitSchema={setSplitSchema} canEdit />
          <Box sx={{ textAlign: 'right' }}>
            <Button sx={{ width: 'fit-content' }} variant='contained' onClick={onSubmit}>
              Submit
            </Button>
          </Box>
        </Stack>
      </Card>
    </Wrapper>
  )
}
